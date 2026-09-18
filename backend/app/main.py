from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Request, status, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path as FilePath
from datetime import date, timedelta, datetime
from typing import Optional
import statistics
import uuid
import logging
import io
from PIL import Image

from .db import Base, engine, get_db, settings
from .models import (
    User, Project, Activity, DailyReport, Evidence, AIDetection, Alert,
    MaterialLog, LaborLog
)
from .schemas import (
    LoginIn, SignupIn, PasswordResetIn,
    ProjectCreate, ProjectUpdate,
    ActivityCreate, ActivityUpdate,
    AlertCreate, DailyReportUpdate,
    MaterialCreate, LaborCreate,
    WeatherType
)
from .security import (
    limiter,
    rate_limit_public,
    rate_limit_authenticated,
    check_auth_rate_limit,
    hash_password
)
from .supabase_client import (
    is_supabase_configured,
    supabase_signup,
    supabase_login,
    supabase_reset_password
)
from .ai import analyze_image
from .report import make_pdf

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("buildsight.api")

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title='BuildSight AI Enterprise Construction Platform',
    description='Automated Daily Progress Monitoring, Computer Vision & BOQ Schedule System',
    version='2.0.0'
)

# CORS Setup
cors_list = [x.strip() for x in settings.CORS_ORIGINS.split(',')]
if '*' in cors_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r'.*',
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_list,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

# Security Response Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(self), geolocation=(self)"
    return response

# Centralized Error Handlers (Prevents stack trace / database leakage)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = uuid.uuid4().hex[:8]
    logger.exception(f"Unhandled server error [{correlation_id}] on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please contact support if the issue persists.",
            "correlation_id": correlation_id
        }
    )

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    correlation_id = uuid.uuid4().hex[:8]
    logger.error(f"Database error [{correlation_id}] on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database Error",
            "message": "A database operation could not be completed.",
            "correlation_id": correlation_id
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        errors.append({"field": field, "message": err.get("msg", "Invalid value")})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Input validation failed. Please check the provided fields.",
            "details": errors
        }
    )

ROOT = FilePath(__file__).resolve().parent.parent
UPLOAD_DIR = ROOT / 'uploads'
REPORT_DIR = ROOT / 'generated_reports'
UPLOAD_DIR.mkdir(exist_ok=True)
REPORT_DIR.mkdir(exist_ok=True)

# Safe file serving endpoint for uploads (only serves verified images with nosniff)
@app.get('/uploads/{filename}')
def serve_upload(filename: str):
    safe_name = FilePath(filename).name
    allowed_exts = tuple(settings.ALLOWED_IMAGE_EXTENSIONS.split(','))
    if not any(safe_name.lower().endswith(ext.strip()) for ext in allowed_exts):
        raise HTTPException(status_code=403, detail="File type not permitted for viewing.")

    target = UPLOAD_DIR / safe_name
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found.")

    ext = target.suffix.lower()
    media_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    media_type = media_map.get(ext, "application/octet-stream")
    return FileResponse(
        target,
        media_type=media_type,
        headers={"X-Content-Type-Options": "nosniff", "Content-Disposition": "inline"}
    )

def seed(db: Session):
    if not db.query(User).count():
        db.add_all([
            User(name='Er. Rajesh Sharma', email='admin@buildsight.ai', role='ADMIN'),
            User(name='Site Engineer', email='engineer@buildsight.ai', role='SITE_ENGINEER'),
            User(name='Project Manager', email='manager@buildsight.ai', role='PROJECT_MANAGER')
        ])
        db.commit()

    p = db.query(Project).first()
    if not p:
        p = Project(
            name='Sunrise Residency Phase 1',
            code='CPWD-SR-01',
            client='Gujarat Urban Development Authority',
            location='SG Highway, Ahmedabad, Gujarat',
            start_date=date(2026, 8, 1),
            end_date=date(2027, 7, 31),
            budget=125000000.0,
            status='Active'
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        acts = [
            ('Earthwork Excavation in Hard Strata (Raft Foundation)', 'CPWD-02.01', 'Item 2.1', 72, 70, 450, 315, 'Cum', '2026-08-01', '2026-09-20', 'On Track'),
            ('R.C.C. Raft Foundation & Footings (M30 Grade Concrete)', 'CPWD-04.01', 'Item 4.1', 80, 76, 100, 76, 'Cum', '2026-08-20', '2026-10-05', 'On Track'),
            ('Column Reinforcement & Shuttering (Fe500D TMT Rebar)', 'CPWD-04.02', 'Item 4.2', 60, 52, 120, 62.4, 'Cum', '2026-09-01', '2026-10-25', 'Delayed'),
            ('Plywood Formwork with Steel Props for Suspended Slab', 'CPWD-05.01', 'Item 5.1', 45, 43, 800, 344, 'Sqm', '2026-09-05', '2026-11-01', 'On Track'),
            ('M25 Grade R.C.C. Deck Slab Casting & Curing', 'CPWD-04.03', 'Item 4.3', 30, 28, 500, 140, 'Sqm', '2026-09-15', '2026-12-01', 'On Track')
        ]
        from datetime import datetime as dt
        for n, c, bi, pp, ap, pq, cq, u, ps, pe, status_val in acts:
            db.add(Activity(
                project_id=p.id,
                name=n,
                code=c,
                boq_item=bi,
                planned_progress=pp,
                actual_progress=ap,
                planned_quantity=pq,
                completed_quantity=cq,
                unit=u,
                planned_start=dt.fromisoformat(ps).date(),
                planned_end=dt.fromisoformat(pe).date(),
                status=status_val
            ))

        db.add_all([
            Alert(project_id=p.id, severity='HIGH', category='Schedule', title='Column rebar progress 8% behind baseline schedule', message='Bar bending workforce insufficient on Grid C-4. Actual progress is 52% against planned 60%.'),
            Alert(project_id=p.id, severity='MEDIUM', category='Quality', title='Mandatory Curing & Testing Compliance Check', message='Perform 7-day cube compressive strength test for Raft Footing pour batch #04.'),
        ])
        db.commit()

    if p and not db.query(MaterialLog).filter(MaterialLog.project_id == p.id).count():
        db.add_all([
            MaterialLog(project_id=p.id, material_name='UltraTech Ready-Mix Concrete (M30 Grade)', category='Cement', quantity=45.0, unit='Cum', supplier='UltraTech Concrete Ltd', challan_no='CH-2026-9182', qc_status='ACCEPTED', status='Approved'),
            MaterialLog(project_id=p.id, material_name='Tata Tiscon TMT Rebar Fe500D (16mm & 20mm)', category='Steel', quantity=14.2, unit='MT', supplier='Tata Steel Stockyard', challan_no='CH-2026-9204', qc_status='ACCEPTED', status='Approved'),
            MaterialLog(project_id=p.id, material_name='River Sand / Manufactured Sand (Zone II)', category='Aggregates', quantity=80.0, unit='MT', supplier='Gujarat Aggregates', challan_no='CH-2026-9210', qc_status='ACCEPTED', status='Approved'),
            MaterialLog(project_id=p.id, material_name='Fly-Ash Autoclaved Aerated Blocks (600x200x150mm)', category='Masonry', quantity=1500.0, unit='Nos', supplier='EcoBricks Infra', challan_no='CH-2026-9233', qc_status='ACCEPTED', status='Delivered')
        ])
        db.commit()

    if p and not db.query(LaborLog).filter(LaborLog.project_id == p.id).count():
        db.add_all([
            LaborLog(project_id=p.id, trade_category='Reinforcement Steel Fixing (Bar Benders)', headcount=14, skilled_workers=9, unskilled_workers=5, shift_hours=8.0, contractor_name='Shree Ram Steel Erectors', supervisor_name='Manoj Patil', shift='Day Shift (08:00 - 17:00)', work_performed='Raft rebar tying'),
            LaborLog(project_id=p.id, trade_category='Structural Formwork & Shuttering Carpenters', headcount=18, skilled_workers=10, unskilled_workers=8, shift_hours=8.0, contractor_name='Apex Shuttering Works', supervisor_name='Rajeev Singh', shift='Day Shift (08:00 - 17:00)', work_performed='Column shuttering'),
            LaborLog(project_id=p.id, trade_category='R.C.C. Concrete Pouring Gang', headcount=12, skilled_workers=6, unskilled_workers=6, shift_hours=8.0, contractor_name='Jay Hind Concreting Co.', supervisor_name='Kailash Nath', shift='Day Shift (08:00 - 17:00)', work_performed='Concrete placement'),
            LaborLog(project_id=p.id, trade_category='Excavation Machine Operators & Helpers', headcount=6, skilled_workers=3, unskilled_workers=3, shift_hours=8.0, contractor_name='Earthmoving Infra', supervisor_name='Harish Bhai', shift='Day Shift (08:00 - 17:00)', work_performed='Foundation pit clearance')
        ])
        db.commit()

def ensure_schema():
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        inspector = inspect(conn)
        tables = inspector.get_table_names()

        if 'projects' in tables:
            cols = [c['name'] for c in inspector.get_columns('projects')]
            if 'created_at' not in cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN created_at DATETIME"))
                conn.commit()
            if 'code' not in cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN code VARCHAR(60) DEFAULT 'CPWD-PRJ'"))
                conn.commit()

        if 'users' in tables:
            cols = [c['name'] for c in inspector.get_columns('users')]
            if 'supabase_uid' not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN supabase_uid VARCHAR(100)"))
                conn.commit()
            if 'hashed_password' not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
                conn.commit()
            if 'active' not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 1"))
                conn.commit()
            if 'created_at' not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                conn.commit()

        if 'daily_reports' in tables:
            cols = [c['name'] for c in inspector.get_columns('daily_reports')]
            if 'weather' not in cols:
                conn.execute(text("ALTER TABLE daily_reports ADD COLUMN weather VARCHAR(50) DEFAULT 'Sunny'"))
                conn.commit()
            if 'created_at' not in cols:
                conn.execute(text("ALTER TABLE daily_reports ADD COLUMN created_at DATETIME"))
                conn.commit()

        if 'alerts' in tables:
            cols = [c['name'] for c in inspector.get_columns('alerts')]
            if 'category' not in cols:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN category VARCHAR(50) DEFAULT 'Quality'"))
                conn.commit()

        if 'activities' in tables:
            cols = [c['name'] for c in inspector.get_columns('activities')]
            if 'is_critical' not in cols:
                conn.execute(text("ALTER TABLE activities ADD COLUMN is_critical BOOLEAN DEFAULT 0"))
                conn.commit()
            if 'weightage' not in cols:
                conn.execute(text("ALTER TABLE activities ADD COLUMN weightage FLOAT DEFAULT 10.0"))
                conn.commit()
            if 'code' not in cols:
                conn.execute(text("ALTER TABLE activities ADD COLUMN code VARCHAR(50) DEFAULT 'CPWD-01'"))
                conn.commit()
            if 'boq_item' not in cols:
                conn.execute(text("ALTER TABLE activities ADD COLUMN boq_item VARCHAR(50) DEFAULT 'Item 1'"))
                conn.commit()

        if 'material_logs' in tables:
            cols = [c['name'] for c in inspector.get_columns('material_logs')]
            if 'category' not in cols:
                conn.execute(text("ALTER TABLE material_logs ADD COLUMN category VARCHAR(100) DEFAULT 'General'"))
                conn.commit()
            if 'qc_status' not in cols:
                conn.execute(text("ALTER TABLE material_logs ADD COLUMN qc_status VARCHAR(50) DEFAULT 'ACCEPTED'"))
                conn.commit()
            if 'received_date' not in cols:
                conn.execute(text("ALTER TABLE material_logs ADD COLUMN received_date DATE"))
                conn.commit()
            if 'notes' not in cols:
                conn.execute(text("ALTER TABLE material_logs ADD COLUMN notes TEXT DEFAULT ''"))
                conn.commit()

        if 'labor_logs' in tables:
            cols = [c['name'] for c in inspector.get_columns('labor_logs')]
            if 'skilled_workers' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN skilled_workers INTEGER DEFAULT 0"))
                conn.commit()
            if 'unskilled_workers' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN unskilled_workers INTEGER DEFAULT 0"))
                conn.commit()
            if 'supervisor_name' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN supervisor_name VARCHAR(150) DEFAULT ''"))
                conn.commit()
            if 'shift' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN shift VARCHAR(50) DEFAULT 'Day Shift'"))
                conn.commit()
            if 'work_performed' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN work_performed VARCHAR(300) DEFAULT ''"))
                conn.commit()
            if 'log_date' not in cols:
                conn.execute(text("ALTER TABLE labor_logs ADD COLUMN log_date DATE"))
                conn.commit()

@app.on_event('startup')
def startup():
    ensure_schema()
    db = next(get_db())
    try:
        seed(db)
    finally:
        db.close()

# -------------------------------------------------------------
# 1. System Health & Diagnostics
# -------------------------------------------------------------
@app.get('/api/health', dependencies=[Depends(rate_limit_public)])
def health():
    return {
        'status': 'ok',
        'service': 'BuildSight AI Enterprise Platform',
        'version': '2.0.0',
        'supabase_configured': is_supabase_configured(),
        'timestamp': datetime.utcnow().isoformat()
    }

# -------------------------------------------------------------
# 2. Authentication & Supabase Auth Integration
# -------------------------------------------------------------
@app.post('/api/auth/signup')
def signup(payload: SignupIn, request: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(request, payload.email)

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    # Supabase registration attempt
    supabase_res = supabase_signup(payload.email, payload.password, payload.name, payload.role)
    supabase_uid = None
    if supabase_res.get("success") and supabase_res.get("user"):
        supabase_uid = str(supabase_res["user"].get("id", ""))

    new_user = User(
        supabase_uid=supabase_uid,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        'success': True,
        'message': 'User registered successfully.',
        'user': {'id': new_user.id, 'name': new_user.name, 'email': new_user.email, 'role': new_user.role},
        'token': f'demo-{new_user.id}-{new_user.role}'
    }

@app.post('/api/auth/login')
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(request, payload.email)

    # Supabase Auth check if configured
    if is_supabase_configured():
        supa_res = supabase_login(payload.email, payload.password)
        if supa_res.get("success"):
            user = db.query(User).filter(User.email == payload.email).first()
            if not user:
                user = User(
                    name=payload.email.split('@')[0].title(),
                    email=payload.email,
                    role=payload.role
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            limiter.record_auth_success(f"acct:{payload.email.lower()}")
            return {
                'token': supa_res["access_token"],
                'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}
            }

    # Standard database fallback authentication
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(
            name=payload.email.split('@')[0].title(),
            email=payload.email,
            role=payload.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif payload.role and user.role != payload.role:
        user.role = payload.role
        db.commit()
        db.refresh(user)

    limiter.record_auth_success(f"acct:{payload.email.lower()}")
    return {
        'token': f'demo-{user.id}-{user.role}',
        'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}
    }

@app.post('/api/auth/reset-password')
def reset_password(payload: PasswordResetIn, request: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(request, payload.email)
    supabase_reset_password(payload.email)
    if payload.new_password:
        u = db.query(User).filter(User.email == payload.email).first()
        if u:
            u.hashed_password = hash_password(payload.new_password)
            db.commit()
    return {'status': 'success', 'message': 'Password reset processed successfully.'}

@app.get('/api/users', dependencies=[Depends(rate_limit_authenticated)])
def users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.name).all()

# -------------------------------------------------------------
# 3. Construction Project Management (Full CRUD)
# -------------------------------------------------------------
@app.get('/api/projects', dependencies=[Depends(rate_limit_authenticated)])
def projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.id).all()

@app.post('/api/projects', dependencies=[Depends(rate_limit_authenticated)])
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={'target_date'})
    p = Project(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@app.get('/api/projects/{project_id}', dependencies=[Depends(rate_limit_authenticated)])
def project(project_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    return {
        'id': p.id,
        'name': p.name,
        'client': p.client,
        'location': p.location,
        'start_date': p.start_date,
        'end_date': p.end_date,
        'budget': p.budget,
        'status': p.status,
        'activities': [
            {
                'id': a.id,
                'name': a.name,
                'planned_progress': a.planned_progress,
                'actual_progress': a.actual_progress,
                'planned_quantity': a.planned_quantity,
                'completed_quantity': a.completed_quantity,
                'unit': a.unit,
                'planned_start': a.planned_start,
                'planned_end': a.planned_end,
                'status': a.status
            }
            for a in p.activities
        ]
    }

@app.put('/api/projects/{project_id}', dependencies=[Depends(rate_limit_authenticated)])
def update_project(project_id: int = Path(..., gt=0), payload: ProjectUpdate = None, db: Session = Depends(get_db)):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    update_data = payload.model_dump(exclude_unset=True) if payload else {}
    for key, value in update_data.items():
        setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return p

@app.delete('/api/projects/{project_id}', dependencies=[Depends(rate_limit_authenticated)])
def delete_project(project_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    db.delete(p)
    db.commit()
    return {'success': True, 'status': 'deleted', 'message': f'Project {project_id} deleted successfully.'}

# -------------------------------------------------------------
# 4. Activities & BOQ Management (Full CRUD)
# -------------------------------------------------------------
@app.get('/api/activities', dependencies=[Depends(rate_limit_authenticated)])
def get_activities(project_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Activity)
    if project_id:
        q = q.filter(Activity.project_id == project_id)
    return q.all()

@app.post('/api/activities', dependencies=[Depends(rate_limit_authenticated)])
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    if not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail='Project not found')
    d = payload.model_dump(exclude={'planned_qty', 'actual_qty', 'start_date', 'end_date'})
    a = Activity(**d)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@app.get('/api/activities/{activity_id}', dependencies=[Depends(rate_limit_authenticated)])
def get_activity(activity_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a:
        raise HTTPException(status_code=404, detail='Activity not found')
    return a

@app.put('/api/activities/{activity_id}', dependencies=[Depends(rate_limit_authenticated)])
def update_activity(activity_id: int = Path(..., gt=0), payload: ActivityUpdate = None, db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a:
        raise HTTPException(status_code=404, detail='Activity not found')
    update_data = payload.model_dump(exclude_unset=True) if payload else {}
    for key, value in update_data.items():
        setattr(a, key, value)
    db.commit()
    db.refresh(a)
    return a

@app.delete('/api/activities/{activity_id}', dependencies=[Depends(rate_limit_authenticated)])
def delete_activity(activity_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a:
        raise HTTPException(status_code=404, detail='Activity not found')
    db.delete(a)
    db.commit()
    return {'success': True, 'status': 'deleted', 'message': f'Activity {activity_id} deleted successfully.'}

# -------------------------------------------------------------
# 5. Dashboard, Metrics & Analytics
# -------------------------------------------------------------
@app.get('/api/dashboard', dependencies=[Depends(rate_limit_authenticated)])
def dashboard(project_id: int = 1, db: Session = Depends(get_db)):
    if project_id <= 0:
        raise HTTPException(status_code=422, detail='project_id must be greater than 0')
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    vals = [a.actual_progress for a in p.activities]
    planned = [a.planned_progress for a in p.activities]
    return {
        'overall_actual': round(statistics.mean(vals), 1) if vals else 0,
        'overall_planned': round(statistics.mean(planned), 1) if planned else 0,
        'activities': len(p.activities),
        'open_alerts': db.query(Alert).filter(Alert.project_id == project_id, Alert.acknowledged == False).count(),
        'reports': db.query(DailyReport).filter(DailyReport.project_id == project_id).count()
    }

# -------------------------------------------------------------
# 6. Site Alerts & Hazard Observations (Full CRUD)
# -------------------------------------------------------------
@app.get('/api/alerts', dependencies=[Depends(rate_limit_authenticated)])
def alerts(project_id: int = 1, db: Session = Depends(get_db)):
    if project_id <= 0:
        raise HTTPException(status_code=422, detail='project_id must be greater than 0')
    return db.query(Alert).filter(Alert.project_id == project_id).order_by(Alert.created_at.desc()).all()

@app.post('/api/alerts', dependencies=[Depends(rate_limit_authenticated)])
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    if not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail='Project not found')
    new_alert = Alert(
        project_id=payload.project_id,
        severity=payload.severity,
        title=payload.title,
        message=payload.message,
        acknowledged=False
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@app.post('/api/alerts/{alert_id}/ack', dependencies=[Depends(rate_limit_authenticated)])
def acknowledge(alert_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail='Alert not found')
    a.acknowledged = True
    db.commit()
    db.refresh(a)
    return a

@app.delete('/api/alerts/{alert_id}', dependencies=[Depends(rate_limit_authenticated)])
def delete_alert(alert_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail='Alert not found')
    db.delete(a)
    db.commit()
    return {'success': True, 'status': 'deleted', 'message': f'Alert {alert_id} deleted successfully.'}

# -------------------------------------------------------------
# 7. Material Logs & Labor Force Attendance
# -------------------------------------------------------------
@app.get('/api/materials', dependencies=[Depends(rate_limit_authenticated)])
def get_materials(project_id: int = Query(..., gt=0), db: Session = Depends(get_db)):
    return db.query(MaterialLog).filter(MaterialLog.project_id == project_id).order_by(MaterialLog.logged_at.desc()).all()

@app.post('/api/materials', dependencies=[Depends(rate_limit_authenticated)])
def create_material(payload: MaterialCreate, db: Session = Depends(get_db)):
    if not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail='Project not found')
    d = payload.model_dump(exclude={'item_name', 'quantity_received', 'vendor', 'delivery_challan_no', 'qc_status', 'received_date', 'notes'})
    d['qc_status'] = payload.qc_status or payload.status or 'ACCEPTED'
    d['received_date'] = payload.received_date or date.today()
    d['notes'] = payload.notes or ''
    mat = MaterialLog(**d)
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat

@app.get('/api/labor', dependencies=[Depends(rate_limit_authenticated)])
def get_labor(project_id: int = Query(..., gt=0), db: Session = Depends(get_db)):
    return db.query(LaborLog).filter(LaborLog.project_id == project_id).order_by(LaborLog.logged_at.desc()).all()

@app.post('/api/labor', dependencies=[Depends(rate_limit_authenticated)])
def create_labor(payload: LaborCreate, db: Session = Depends(get_db)):
    if not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail='Project not found')
    d = payload.model_dump(exclude={'supervisor_name', 'skilled_workers', 'unskilled_workers', 'shift', 'work_performed', 'log_date'})
    d['supervisor_name'] = payload.supervisor_name or payload.contractor_name or ''
    d['skilled_workers'] = payload.skilled_workers or 0
    d['unskilled_workers'] = payload.unskilled_workers or 0
    d['shift'] = payload.shift or 'Day Shift'
    d['work_performed'] = payload.work_performed or ''
    d['log_date'] = payload.log_date or date.today()
    lab = LaborLog(**d)
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab

# -------------------------------------------------------------
# 8. Daily Reports & AI Evidence Analysis
# -------------------------------------------------------------
@app.get('/api/reports', dependencies=[Depends(rate_limit_authenticated)])
def reports(project_id: int = 1, db: Session = Depends(get_db)):
    if project_id <= 0:
        raise HTTPException(status_code=422, detail='project_id must be greater than 0')
    res = []
    for r in db.query(DailyReport).filter(DailyReport.project_id == project_id).order_by(DailyReport.report_date.desc()).all():
        ev = [
            {'id': e.id, 'filename': e.filename, 'image_url': f'/uploads/{FilePath(e.stored_path).name}', 'latitude': e.latitude, 'longitude': e.longitude}
            for e in r.evidence
        ]
        res.append({
            'id': r.id,
            'report_date': r.report_date,
            'activity_id': r.activity_id,
            'weather': getattr(r, 'weather', 'Sunny') or 'Sunny',
            'notes': r.notes,
            'ai_progress': r.ai_progress,
            'planned_progress': r.planned_progress,
            'variance': r.variance,
            'confidence': r.confidence,
            'risk': r.risk,
            'ai_mode': r.ai_mode,
            'evidence': ev
        })
    return res

@app.get('/api/reports/{report_id}', dependencies=[Depends(rate_limit_authenticated)])
def report_detail(report_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    r = db.get(DailyReport, report_id)
    if not r:
        raise HTTPException(status_code=404, detail='Report not found')
    act = db.get(Activity, r.activity_id) if r.activity_id else None
    return {
        'id': r.id,
        'report_date': r.report_date,
        'notes': r.notes,
        'weather': getattr(r, 'weather', 'Sunny') or 'Sunny',
        'ai_progress': r.ai_progress,
        'planned_progress': r.planned_progress,
        'variance': r.variance,
        'confidence': r.confidence,
        'risk': r.risk,
        'ai_mode': r.ai_mode,
        'project': r.project.name,
        'activity': act.name if act else None,
        'evidence': [
            {'id': e.id, 'filename': e.filename, 'image_url': f'/uploads/{FilePath(e.stored_path).name}', 'latitude': e.latitude, 'longitude': e.longitude}
            for e in r.evidence
        ],
        'detections': [{'label': d.label, 'confidence': d.confidence} for d in r.detections]
    }

@app.put('/api/reports/{report_id}', dependencies=[Depends(rate_limit_authenticated)])
def update_report(report_id: int = Path(..., gt=0), payload: DailyReportUpdate = None, db: Session = Depends(get_db)):
    r = db.get(DailyReport, report_id)
    if not r:
        raise HTTPException(status_code=404, detail='Report not found')
    if payload:
        if payload.notes is not None:
            r.notes = payload.notes
        if payload.weather is not None:
            r.weather = payload.weather
        if payload.actual_progress is not None:
            r.ai_progress = payload.actual_progress
            r.variance = round(r.ai_progress - r.planned_progress, 1)
            r.risk = 'HIGH' if r.variance <= -8 else 'MEDIUM' if r.variance < 0 else 'LOW'
    db.commit()
    db.refresh(r)
    return r

@app.delete('/api/reports/{report_id}', dependencies=[Depends(rate_limit_authenticated)])
def delete_report(report_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    r = db.get(DailyReport, report_id)
    if not r:
        raise HTTPException(status_code=404, detail='Report not found')
    db.delete(r)
    db.commit()
    return {'success': True, 'message': f'Report {report_id} deleted successfully.'}

# -------------------------------------------------------------
# 9. Secure File Upload & AI Vision Inference
# -------------------------------------------------------------
@app.post('/api/analyze', dependencies=[Depends(rate_limit_authenticated)])
async def analyze(
    project_id: int = Form(..., gt=0),
    activity_id: int = Form(None),
    report_date: str = Form(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    notes: str = Form('', max_length=2000),
    weather: WeatherType = Form('Sunny'),
    latitude: float = Form(None, ge=-90.0, le=90.0),
    longitude: float = Form(None, ge=-180.0, le=180.0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    if activity_id and activity_id <= 0:
        raise HTTPException(status_code=422, detail='activity_id must be greater than 0')
    activity = db.get(Activity, activity_id) if activity_id else None

    # Extension verification
    raw_filename = file.filename or "evidence.jpg"
    orig_ext = FilePath(raw_filename).suffix.lower()
    allowed_exts = tuple(x.strip() for x in settings.ALLOWED_IMAGE_EXTENSIONS.split(','))
    if not orig_ext or orig_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{orig_ext}'. Allowed extensions: {settings.ALLOWED_IMAGE_EXTENSIONS}"
        )

    # Size limit validation
    contents = bytearray()
    chunk_size = 1024 * 64
    total_read = 0
    max_size = settings.MAX_UPLOAD_SIZE_BYTES

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {max_size // (1024 * 1024)} MB."
            )
        contents.extend(chunk)

    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    # Binary magic byte & Image integrity verification
    try:
        image_stream = io.BytesIO(contents)
        with Image.open(image_stream) as img:
            img.verify()
            img_format = img.format.lower() if img.format else ""
            if img_format not in ("jpeg", "png", "webp"):
                raise ValueError("Image format not supported")
    except Exception as img_err:
        logger.warning(f"File upload failed image validation: {img_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or supported image format (JPEG, PNG, WEBP)."
        )

    # Isolated random UUID filename
    safe_uuid = uuid.uuid4().hex[:12]
    timestamp_prefix = datetime.now().strftime("%Y%m%d%H%M%S")
    stored_filename = f"{timestamp_prefix}_{safe_uuid}{orig_ext}"
    stored_path = UPLOAD_DIR / stored_filename

    with stored_path.open('wb') as f_out:
        f_out.write(contents)

    # Computer Vision Analysis
    result = analyze_image(str(stored_path))
    ai = float(result['progress'])
    planned = float(activity.planned_progress) if activity else 0.0
    variance = round(ai - planned, 1)
    risk = 'HIGH' if variance <= -8 else 'MEDIUM' if variance < 0 else 'LOW'

    try:
        report_d = date.fromisoformat(report_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format, expected YYYY-MM-DD")

    r = DailyReport(
        project_id=project_id,
        activity_id=activity_id,
        report_date=report_d,
        notes=notes or result['observation'],
        weather=weather,
        ai_progress=ai,
        confidence=float(result['confidence']),
        planned_progress=planned,
        variance=variance,
        risk=risk,
        ai_mode=result['mode']
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    safe_original_name = FilePath(raw_filename).name[:100]
    db.add(Evidence(
        report_id=r.id,
        filename=safe_original_name,
        stored_path=str(stored_path),
        latitude=latitude,
        longitude=longitude
    ))

    for d in result['detections']:
        db.add(AIDetection(report_id=r.id, label=d['label'], confidence=d['confidence']))

    if activity and variance <= -8:
        db.add(Alert(
            project_id=project_id,
            severity='HIGH',
            title=f'{activity.name} progress deviation',
            message=f'AI visible progress {ai:.1f}% vs planned {planned:.1f}%.'
        ))
    elif activity and variance < 0:
        db.add(Alert(
            project_id=project_id,
            severity='MEDIUM',
            title=f'{activity.name} below plan',
            message=f'AI visible progress {ai:.1f}% vs planned {planned:.1f}%.'
        ))
    db.commit()

    return {
        'report_id': r.id,
        'project': project.name,
        'activity': activity.name if activity else None,
        'planned_progress': planned,
        'variance': variance,
        'risk': risk,
        'file': safe_original_name,
        'image_url': f'/uploads/{stored_filename}',
        'weather': weather,
        'latitude': latitude,
        'longitude': longitude,
        **result
    }

# -------------------------------------------------------------
# 10. PDF Report Export & Completion Forecasting
# -------------------------------------------------------------
@app.get('/api/reports/{report_id}/pdf', dependencies=[Depends(rate_limit_authenticated)])
def pdf(report_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    r = db.get(DailyReport, report_id)
    if not r:
        raise HTTPException(status_code=404, detail='Report not found')
    p = db.get(Project, r.project_id)
    a = db.get(Activity, r.activity_id) if r.activity_id else None
    path = make_pdf(r, p, a, r.evidence, r.detections, REPORT_DIR)
    return FileResponse(path, media_type='application/pdf', filename=path.name)

@app.get('/api/forecast', dependencies=[Depends(rate_limit_authenticated)])
def forecast(project_id: int = 1, db: Session = Depends(get_db)):
    if project_id <= 0:
        raise HTTPException(status_code=422, detail='project_id must be greater than 0')
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    reports = db.query(DailyReport).filter(DailyReport.project_id == project_id).order_by(DailyReport.report_date).all()
    current = statistics.mean([a.actual_progress for a in p.activities]) if p.activities else 0
    if len(reports) >= 2:
        per_day = max(0.1, (reports[-1].ai_progress - reports[0].ai_progress) / max(1, (reports[-1].report_date - reports[0].report_date).days))
    else:
        per_day = 0.6
    days = max(1, round((100 - current) / per_day))
    estimated = date.today() + timedelta(days=days)
    return {
        'current_progress': round(current, 1),
        'daily_trend': round(per_day, 2),
        'estimated_completion': estimated,
        'baseline_end': p.end_date,
        'delay_days': max(0, (estimated - p.end_date).days) if p.end_date else 0
    }
