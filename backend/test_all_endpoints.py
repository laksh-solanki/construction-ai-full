import sys
from pathlib import Path
import io
import uuid
from PIL import Image

backend_dir = Path.cwd()
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app, startup

startup()
client = TestClient(app)

tests_passed = 0
tests_failed = 0
test_results = []

def run_test(name, func):
    global tests_passed, tests_failed
    try:
        func()
        tests_passed += 1
        test_results.append((name, "PASS", ""))
        print(f"[PASS] {name}")
    except Exception as e:
        tests_failed += 1
        test_results.append((name, "FAIL", str(e)))
        print(f"[FAIL] {name}: {e}")

# -------------------------------------------------------------
# 1. Health & Security Headers
# -------------------------------------------------------------
def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert data.get("status") == "ok"
    assert "service" in data
run_test("Health Endpoint (GET /api/health)", test_health)

def test_security_headers():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "strict-origin-when-cross-origin" in res.headers.get("referrer-policy", "")
run_test("Security Headers (X-Content-Type-Options, X-Frame-Options)", test_security_headers)

# -------------------------------------------------------------
# 2. Authentication & User Management (Local & Supabase Fallback)
# -------------------------------------------------------------
def test_login_existing():
    res = client.post("/api/auth/login", json={"email": "admin@buildsight.ai", "password": "any", "role": "ADMIN"})
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "admin@buildsight.ai"
    assert data["user"]["role"] == "ADMIN"
run_test("Auth Login Existing User (POST /api/auth/login)", test_login_existing)

def test_login_new_user():
    res = client.post("/api/auth/login", json={"email": "field_eng@buildsight.ai", "password": "pass", "role": "SITE_ENGINEER"})
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert data["user"]["email"] == "field_eng@buildsight.ai"
    assert data["user"]["role"] == "SITE_ENGINEER"
run_test("Auth Login New User Creation (POST /api/auth/login)", test_login_new_user)

def test_signup_endpoint():
    unique_email = f"quality_head_{uuid.uuid4().hex[:6]}@buildsight.ai"
    payload = {
        "email": unique_email,
        "password": "StrongPassword2026!",
        "full_name": "Er. Amitabh Verma (Chief QA)",
        "role": "QUALITY_ENGINEER"
    }
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "QUALITY_ENGINEER"
run_test("Auth Signup Endpoint (POST /api/auth/signup)", test_signup_endpoint)

def test_reset_password_endpoint():
    payload = {
        "email": "field_eng@buildsight.ai",
        "new_password": "UpdatedSecurePassword2026!"
    }
    res = client.post("/api/auth/reset-password", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
run_test("Auth Password Reset Endpoint (POST /api/auth/reset-password)", test_reset_password_endpoint)

def test_get_users():
    res = client.get("/api/users")
    assert res.status_code == 200, f"Status {res.status_code}"
    users = res.json()
    assert len(users) >= 3
run_test("Get Users (GET /api/users)", test_get_users)

# -------------------------------------------------------------
# 3. Project CRUD Operations
# -------------------------------------------------------------
created_proj_id = None

def test_get_projects():
    res = client.get("/api/projects")
    assert res.status_code == 200, f"Status {res.status_code}"
    projs = res.json()
    assert len(projs) >= 1
    assert any("Sunrise" in p["name"] or "Metro" in p["name"] for p in projs)
run_test("Get Projects List (GET /api/projects)", test_get_projects)

def test_create_project():
    global created_proj_id
    payload = {
        "name": "Elevated Expressway Corridor Phase 2",
        "code": "NHAI-EXP-02",
        "client": "National Highways Authority of India",
        "location": "Noida to Greater Noida, UP",
        "start_date": "2026-09-01",
        "target_date": "2027-12-31",
        "budget": 450000000.0,
        "status": "In Progress"
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["name"] == payload["name"]
    assert "id" in data
    created_proj_id = data["id"]
run_test("Create Project (POST /api/projects)", test_create_project)

def test_get_project_detail():
    global created_proj_id
    res = client.get(f"/api/projects/{created_proj_id or 1}")
    assert res.status_code == 200
    data = res.json()
    assert "name" in data
    assert client.get("/api/projects/999999").status_code == 404
run_test("Get Project Details & 404 (GET /api/projects/{id})", test_get_project_detail)

def test_update_project():
    global created_proj_id
    assert created_proj_id is not None
    update_payload = {
        "name": "Elevated Expressway Corridor Phase 2 (Amended)",
        "budget": 480000000.0,
        "status": "In Progress"
    }
    res = client.put(f"/api/projects/{created_proj_id}", json=update_payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["name"] == "Elevated Expressway Corridor Phase 2 (Amended)"
    assert data["budget"] == 480000000.0
run_test("Update Project (PUT /api/projects/{id})", test_update_project)

# -------------------------------------------------------------
# 4. Activities (BOQ) CRUD Operations
# -------------------------------------------------------------
created_act_id = None

def test_get_activities_list():
    res = client.get("/api/activities?project_id=1")
    assert res.status_code == 200
    acts = res.json()
    assert isinstance(acts, list)
    assert len(acts) >= 1
run_test("Get Activities List (GET /api/activities)", test_get_activities_list)

def test_create_activity():
    global created_act_id, created_proj_id
    payload = {
        "project_id": created_proj_id or 1,
        "name": "RCC M30 Grade Pier Caps - IS 456",
        "code": "CPWD-04.05",
        "boq_item": "Item 4.5",
        "unit": "Cum",
        "planned_qty": 350.0,
        "actual_qty": 70.0,
        "weightage": 20.0,
        "is_critical": True,
        "start_date": "2026-09-01",
        "end_date": "2026-11-30"
    }
    res = client.post("/api/activities", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["name"] == payload["name"]
    assert data["unit"] == "Cum"
    created_act_id = data["id"]
run_test("Create BOQ Activity (POST /api/activities)", test_create_activity)

def test_get_single_activity():
    global created_act_id
    assert created_act_id is not None
    res = client.get(f"/api/activities/{created_act_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == created_act_id
    assert client.get("/api/activities/999999").status_code == 404
run_test("Get Single Activity by ID (GET /api/activities/{id})", test_get_single_activity)

def test_update_activity():
    global created_act_id
    assert created_act_id is not None
    update_payload = {
        "actual_quantity": 140.0,
        "actual_progress": 40.0,
        "status": "In Progress"
    }
    res = client.put(f"/api/activities/{created_act_id}", json=update_payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["actual_progress"] == 40.0
    assert data["completed_quantity"] == 140.0
run_test("Update Activity Measurement (PUT /api/activities/{id})", test_update_activity)

# -------------------------------------------------------------
# 5. Dashboard & Forecasting
# -------------------------------------------------------------
def test_dashboard():
    res = client.get("/api/dashboard?project_id=1")
    assert res.status_code == 200
    data = res.json()
    for key in ["overall_actual", "overall_planned", "activities", "open_alerts", "reports"]:
        assert key in data, f"Missing key: {key}"
    assert client.get("/api/dashboard?project_id=999999").status_code == 404
run_test("Dashboard Metrics (GET /api/dashboard)", test_dashboard)

def test_forecast():
    res = client.get("/api/forecast?project_id=1")
    assert res.status_code == 200
    data = res.json()
    for k in ["current_progress", "daily_trend", "estimated_completion", "baseline_end", "delay_days"]:
        assert k in data, f"Forecast missing {k}"
    assert client.get("/api/forecast?project_id=999999").status_code == 404
run_test("Completion Forecast (GET /api/forecast)", test_forecast)

# -------------------------------------------------------------
# 6. Site Alerts & Non-Conformance Reports (NCR)
# -------------------------------------------------------------
created_alert_id = None

def test_get_alerts():
    res = client.get("/api/alerts?project_id=1")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
run_test("Get Alerts (GET /api/alerts)", test_get_alerts)

def test_create_custom_alert():
    global created_alert_id
    payload = {
        "project_id": 1,
        "title": "Missing Safety Harness on Pier 12 Formwork Gang",
        "category": "Safety",
        "severity": "HIGH",
        "description": "2 carpenters observed working at 8m elevation without anchoring lifeline harness."
    }
    res = client.post("/api/alerts", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["severity"] == "HIGH"
    created_alert_id = data["id"]
run_test("Create Custom Alert / NCR (POST /api/alerts)", test_create_custom_alert)

def test_ack_alert():
    global created_alert_id
    assert created_alert_id is not None
    res = client.post(f"/api/alerts/{created_alert_id}/ack")
    assert res.status_code == 200
    assert res.json()["acknowledged"] is True
run_test("Acknowledge Alert (POST /api/alerts/{id}/ack)", test_ack_alert)

def test_delete_alert():
    global created_alert_id
    assert created_alert_id is not None
    res = client.delete(f"/api/alerts/{created_alert_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
run_test("Delete Alert (DELETE /api/alerts/{id})", test_delete_alert)

# -------------------------------------------------------------
# 7. Materials Management (IS 1200 / CPWD)
# -------------------------------------------------------------
created_material_id = None

def test_get_materials():
    res = client.get("/api/materials?project_id=1")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
run_test("Get Materials Log (GET /api/materials)", test_get_materials)

def test_create_material_challan():
    global created_material_id
    payload = {
        "project_id": 1,
        "item_name": "Tata Tiscon Fe500D TMT Rebar 25mm",
        "category": "Steel",
        "unit": "MT",
        "quantity_received": 28.5,
        "vendor": "Tata Steel Distribution Yard",
        "delivery_challan_no": "DC-2026-TATA-881",
        "qc_status": "ACCEPTED",
        "received_date": "2026-09-18",
        "notes": "Mill Test Certificate (MTC) verified. Yield strength > 540 MPa."
    }
    res = client.post("/api/materials", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["material_name"] == payload["item_name"]
    assert data["quantity"] == 28.5
    created_material_id = data["id"]
run_test("Record Material Inward Challan (POST /api/materials)", test_create_material_challan)

# -------------------------------------------------------------
# 8. Labor Force Muster & Shift Attendance
# -------------------------------------------------------------
created_labor_id = None

def test_get_labor():
    res = client.get("/api/labor?project_id=1")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
run_test("Get Labor Attendance Logs (GET /api/labor)", test_get_labor)

def test_create_labor_log():
    global created_labor_id
    payload = {
        "project_id": 1,
        "trade_category": "Bar Bending & Rebar Fixing Gang",
        "skilled_workers": 16,
        "unskilled_workers": 10,
        "supervisor_name": "Er. Manoj Patil",
        "shift": "Day Shift (08:00 - 17:00)",
        "work_performed": "Pier Cap 14 Rebar Tying & Helical Spiral Binding",
        "log_date": "2026-09-18"
    }
    res = client.post("/api/labor", json=payload)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    data = res.json()
    assert data["trade_category"] == payload["trade_category"]
    assert data["headcount"] >= 26
    created_labor_id = data["id"]
run_test("Log Daily Shift Labor Muster (POST /api/labor)", test_create_labor_log)

# -------------------------------------------------------------
# 9. Computer Vision Inference & Daily Reports (DPR)
# -------------------------------------------------------------
created_report_id = None

def test_analyze_and_create_dpr():
    global created_report_id
    img = Image.new("RGB", (400, 300), color=(160, 130, 95))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    data = {
        "project_id": 1,
        "activity_id": 1,
        "report_date": "2026-09-18",
        "notes": "Pier 14 concrete pour inspected; cube samples casted.",
        "weather": "Clear / Sunny",
        "latitude": 28.5355,
        "longitude": 77.3910
    }
    files = {
        "file": ("pier14_inspection.jpg", img_byte_arr, "image/jpeg")
    }

    res = client.post("/api/analyze", data=data, files=files)
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    result = res.json()
    assert "report_id" in result
    assert "progress" in result
    assert "confidence" in result
    assert "detections" in result
    assert result["weather"] == "Clear / Sunny"
    assert result["latitude"] == 28.5355
    assert result["longitude"] == 77.3910
    assert result["image_url"].startswith("/uploads/")
    created_report_id = result["report_id"]
run_test("AI Computer Vision Inference & DPR Creation (POST /api/analyze)", test_analyze_and_create_dpr)

def test_reports_list():
    global created_report_id
    res = client.get("/api/reports?project_id=1")
    assert res.status_code == 200
    reps = res.json()
    assert isinstance(reps, list)
    assert len(reps) >= 1
    found = any(r["id"] == created_report_id for r in reps)
    assert found, "Created report not in reports list"
run_test("Reports List (GET /api/reports)", test_reports_list)

def test_report_detail():
    global created_report_id
    assert created_report_id is not None
    res = client.get(f"/api/reports/{created_report_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == created_report_id
    assert len(data["evidence"]) >= 1
    assert data["weather"] == "Clear / Sunny"
    assert data["evidence"][0]["latitude"] == 28.5355
    assert client.get("/api/reports/999999").status_code == 404
run_test("Report Detail & 404 (GET /api/reports/{id})", test_report_detail)

def test_update_report():
    global created_report_id
    assert created_report_id is not None
    update_data = {
        "notes": "Updated: Pier 14 slump test verified at 120mm. Approved for pour.",
        "weather": "Sunny"
    }
    res = client.put(f"/api/reports/{created_report_id}", json=update_data)
    assert res.status_code == 200
    data = res.json()
    assert data["notes"] == update_data["notes"]
run_test("Update Daily Report (PUT /api/reports/{id})", test_update_report)

def test_report_pdf():
    global created_report_id
    assert created_report_id is not None
    res = client.get(f"/api/reports/{created_report_id}/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 500, "PDF content too small"
    assert client.get("/api/reports/999999/pdf").status_code == 404
run_test("DPR PDF Generation & Download (GET /api/reports/{id}/pdf)", test_report_pdf)

def test_uploads_static():
    global created_report_id
    res = client.get(f"/api/reports/{created_report_id}")
    if res.status_code == 200:
        data = res.json()
        if data.get("evidence"):
            img_url = data["evidence"][0]["image_url"]
            img_res = client.get(img_url)
            assert img_res.status_code == 200, f"Failed to fetch uploaded image: {img_res.status_code}"
run_test("Static Image Serving (GET /uploads/...)", test_uploads_static)

# -------------------------------------------------------------
# 10. Clean-Up & Cascade Deletions
# -------------------------------------------------------------
def test_delete_activity():
    global created_act_id
    if created_act_id:
        res = client.delete(f"/api/activities/{created_act_id}")
        assert res.status_code == 200
        assert res.json()["status"] == "deleted"
run_test("Delete Activity (DELETE /api/activities/{id})", test_delete_activity)

def test_delete_project():
    global created_proj_id
    if created_proj_id:
        res = client.delete(f"/api/projects/{created_proj_id}")
        assert res.status_code == 200
        assert res.json()["status"] == "deleted"
run_test("Delete Project (DELETE /api/projects/{id})", test_delete_project)

# -------------------------------------------------------------
# 11. Security & Negative Validation Tests
# -------------------------------------------------------------
def test_input_validation_auth():
    res1 = client.post("/api/auth/login", json={"email": "invalid-email-format", "password": "demo", "role": "ADMIN"})
    assert res1.status_code == 422
    res2 = client.post("/api/auth/login", json={"email": "user@buildsight.ai", "password": "demo", "role": "INVALID_ROLE"})
    assert res2.status_code == 422
run_test("Input Validation on Auth (Email format, Role Enum)", test_input_validation_auth)

def test_input_validation_projects():
    res = client.post("/api/projects", json={"name": "Bad Project", "budget": -500})
    assert res.status_code == 422
    res_short = client.post("/api/projects", json={"name": "x", "budget": 1000})
    assert res_short.status_code == 422
run_test("Input Validation on Projects (Bounds, Length)", test_input_validation_projects)

def test_input_validation_activities():
    payload = {
        "project_id": 1,
        "name": "Invalid Activity",
        "planned_progress": 150.0,
        "actual_progress": 200.0,
        "planned_quantity": 50,
        "completed_quantity": 20,
        "unit": "m3",
        "status": "On Track"
    }
    res = client.post("/api/activities", json=payload)
    assert res.status_code == 422
run_test("Input Validation on Activities (0-100% bounds)", test_input_validation_activities)

def test_upload_safety_fake_image():
    fake_bytes = io.BytesIO(b"MALICIOUS_SCRIPT_OR_TEXT_DATA_NOT_IMAGE")
    files = {"file": ("exploit.jpg", fake_bytes, "image/jpeg")}
    data = {"project_id": 1, "report_date": "2026-09-18", "weather": "Sunny"}
    res = client.post("/api/analyze", data=data, files=files)
    assert res.status_code == 400
run_test("File Upload Security: Magic Byte & Image Integrity Check", test_upload_safety_fake_image)

def test_upload_safety_bad_extension():
    img = Image.new("RGB", (100, 100), color=(100, 100, 100))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)
    files = {"file": ("malware.exe", img_byte_arr, "application/x-msdownload")}
    data = {"project_id": 1, "report_date": "2026-09-18", "weather": "Sunny"}
    res = client.post("/api/analyze", data=data, files=files)
    assert res.status_code == 400
run_test("File Upload Security: Extension Whitelisting", test_upload_safety_bad_extension)

def test_rate_limiting_and_backoff():
    from app.security import limiter
    test_account = "test_backoff_user@buildsight.ai"
    for _ in range(6):
        limiter.record_auth_failure(f"acct:{test_account}")
    res = client.post("/api/auth/login", json={"email": test_account, "password": "demo", "role": "VIEWER"})
    assert res.status_code == 422 or res.status_code == 429
    limiter.record_auth_success(f"acct:{test_account}")
run_test("Rate Limiting: Auth Exponential Backoff & 429", test_rate_limiting_and_backoff)

def test_error_handling_sanitization():
    res = client.get("/api/projects/not_an_integer")
    assert res.status_code == 422
    body = res.json()
    assert "Traceback" not in str(body)
    assert "SELECT" not in str(body)
run_test("Error Handling: Information Leakage & Stack Trace Prevention", test_error_handling_sanitization)

print("\n" + "="*50)
print(f"TEST RESULTS: {tests_passed} PASSED, {tests_failed} FAILED (TOTAL {tests_passed + tests_failed})")
print("="*50)
if tests_failed > 0:
    sys.exit(1)
