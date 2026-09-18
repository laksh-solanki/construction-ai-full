from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    supabase_uid = Column(String(100), unique=True, nullable=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False)
    role = Column(String(40), default='SITE_ENGINEER')
    hashed_password = Column(String(255), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    code = Column(String(60), default='CPWD-PRJ')
    client = Column(String(200), default='')
    location = Column(String(300), default='')
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(40), default='Active')
    budget = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    activities = relationship('Activity', back_populates='project', cascade='all, delete-orphan')
    reports = relationship('DailyReport', back_populates='project', cascade='all, delete-orphan')
    alerts = relationship('Alert', back_populates='project', cascade='all, delete-orphan')
    materials = relationship('MaterialLog', back_populates='project', cascade='all, delete-orphan')
    labor = relationship('LaborLog', back_populates='project', cascade='all, delete-orphan')

class Activity(Base):
    __tablename__ = 'activities'
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(50), default='CPWD-01')
    boq_item = Column(String(50), default='Item 1')
    planned_progress = Column(Float, default=0.0)
    actual_progress = Column(Float, default=0.0)
    planned_quantity = Column(Float, default=0.0)
    completed_quantity = Column(Float, default=0.0)
    unit = Column(String(30), default='%')
    planned_start = Column(Date, nullable=True)
    planned_end = Column(Date, nullable=True)
    weightage = Column(Float, default=10.0)
    is_critical = Column(Boolean, default=False)
    status = Column(String(30), default='On Track')

    project = relationship('Project', back_populates='activities')

class DailyReport(Base):
    __tablename__ = 'daily_reports'
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    activity_id = Column(Integer, ForeignKey('activities.id'), nullable=True)
    report_date = Column(Date, nullable=False)
    notes = Column(Text, default='')
    weather = Column(String(50), default='Sunny')
    ai_progress = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    planned_progress = Column(Float, default=0.0)
    variance = Column(Float, default=0.0)
    risk = Column(String(20), default='LOW')
    ai_mode = Column(String(40), default='DEMO_FALLBACK')
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='reports')
    evidence = relationship('Evidence', back_populates='report', cascade='all, delete-orphan')
    detections = relationship('AIDetection', back_populates='report', cascade='all, delete-orphan')
    materials = relationship('MaterialLog', back_populates='report')
    labor = relationship('LaborLog', back_populates='report')

class Evidence(Base):
    __tablename__ = 'evidence'
    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('daily_reports.id'), nullable=False)
    filename = Column(String(300), nullable=False)
    stored_path = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)

    report = relationship('DailyReport', back_populates='evidence')

class AIDetection(Base):
    __tablename__ = 'ai_detections'
    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('daily_reports.id'), nullable=False)
    label = Column(String(120), nullable=False)
    confidence = Column(Float, default=0.0)

    report = relationship('DailyReport', back_populates='detections')

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    severity = Column(String(20), nullable=False)  # HIGH, MEDIUM, LOW, CRITICAL
    category = Column(String(50), default='Quality')  # Safety, Quality, Schedule, Material
    title = Column(String(300), nullable=False)
    message = Column(Text, default='')
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='alerts')

class MaterialLog(Base):
    __tablename__ = 'material_logs'
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    daily_report_id = Column(Integer, ForeignKey('daily_reports.id'), nullable=True)
    material_name = Column(String(150), nullable=False)
    category = Column(String(100), default='General')
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(30), nullable=False, default='Bags')
    supplier = Column(String(150), default='')
    challan_no = Column(String(100), default='')
    qc_status = Column(String(50), default='ACCEPTED')
    status = Column(String(30), default='Delivered')
    received_date = Column(Date, nullable=True)
    notes = Column(Text, default='')
    logged_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='materials')
    report = relationship('DailyReport', back_populates='materials')

class LaborLog(Base):
    __tablename__ = 'labor_logs'
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    daily_report_id = Column(Integer, ForeignKey('daily_reports.id'), nullable=True)
    trade_category = Column(String(100), nullable=False)
    headcount = Column(Integer, nullable=False, default=1)
    skilled_workers = Column(Integer, default=0)
    unskilled_workers = Column(Integer, default=0)
    shift_hours = Column(Float, default=8.0)
    contractor_name = Column(String(150), default='')
    supervisor_name = Column(String(150), default='')
    shift = Column(String(50), default='Day Shift (08:00 - 17:00)')
    work_performed = Column(String(300), default='')
    log_date = Column(Date, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='labor')
    report = relationship('DailyReport', back_populates='labor')
