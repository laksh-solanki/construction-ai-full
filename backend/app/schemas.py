from pydantic import BaseModel, Field, model_validator
from datetime import date, datetime
from typing import Optional, Literal, List, Any

# Strict Enums with Industry Extension
RoleType = Literal[
    'ADMIN',
    'PROJECT_MANAGER',
    'SITE_ENGINEER',
    'VIEWER',
    'QUALITY_ENGINEER',
    'SAFETY_OFFICER'
]
ActivityStatusType = Literal['On Track', 'Delayed', 'Ahead', 'Completed', 'Critical', 'In Progress', 'Not Started']
WeatherType = Literal[
    'Sunny',
    'Cloudy',
    'Rainy',
    'Windy',
    'Foggy',
    'Clear / Sunny',
    'Overcast',
    'Monsoon Rain',
    'High Wind / Dust',
    'Clear'
]
AlertSeverityType = Literal['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
MaterialStatusType = Literal['Delivered', 'Inspected', 'Testing', 'Approved', 'Rejected', 'ACCEPTED', 'QUARANTINE', 'REJECTED']

# Auth Schemas
class LoginIn(BaseModel):
    email: str = Field(
        ...,
        min_length=5,
        max_length=150,
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        description="Valid email address"
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User password"
    )
    role: RoleType = Field(
        default='PROJECT_MANAGER',
        description="Target user role"
    )

class SignupIn(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full Name")
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full Name alias")
    email: str = Field(
        ...,
        min_length=5,
        max_length=150,
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        description="Email address"
    )
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")
    role: RoleType = Field(default='SITE_ENGINEER', description="Initial role assignment")

    @model_validator(mode='after')
    def sync_name(self):
        if not self.name and self.full_name:
            self.name = self.full_name
        elif not self.name:
            self.name = self.email.split('@')[0].capitalize()
        return self

class PasswordResetIn(BaseModel):
    email: str = Field(
        ...,
        min_length=5,
        max_length=150,
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        description="Registered email address"
    )
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)

# Project Schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Project title")
    code: Optional[str] = Field('CPWD-PRJ', max_length=60, description="Project code")
    client: str = Field('', max_length=150, description="Client or owner organisation")
    location: str = Field('', max_length=250, description="Site location / city")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_date: Optional[date] = None
    status: Optional[str] = Field('Active', max_length=40)
    budget: float = Field(0.0, ge=0.0, le=100_000_000_000.0, description="Project budget in INR")

    @model_validator(mode='after')
    def validate_dates(self):
        if not self.end_date and self.target_date:
            self.end_date = self.target_date
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    code: Optional[str] = Field(None, max_length=60)
    client: Optional[str] = Field(None, max_length=150)
    location: Optional[str] = Field(None, max_length=250)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=40)
    budget: Optional[float] = Field(None, ge=0.0)

    @model_validator(mode='after')
    def sync_target_date(self):
        if not self.end_date and self.target_date:
            self.end_date = self.target_date
        return self

# Activity Schemas
class ActivityCreate(BaseModel):
    project_id: int = Field(..., gt=0, description="Associated project ID")
    name: str = Field(..., min_length=2, max_length=150, description="Activity name")
    code: Optional[str] = Field('CPWD-01', max_length=50)
    boq_item: Optional[str] = Field('Item 1', max_length=50)
    planned_progress: float = Field(0.0, ge=0.0, le=100.0, description="Planned completion %")
    actual_progress: float = Field(0.0, ge=0.0, le=100.0, description="Actual completion %")
    planned_quantity: float = Field(0.0, ge=0.0, description="Total planned quantity")
    completed_quantity: float = Field(0.0, ge=0.0, description="Completed quantity to date")
    planned_qty: Optional[float] = Field(None, ge=0.0)
    actual_qty: Optional[float] = Field(None, ge=0.0)
    unit: str = Field('%', min_length=1, max_length=30, description="Measurement unit (e.g. m³, m², %)")
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    weightage: Optional[float] = Field(10.0, ge=0.0, le=100.0)
    is_critical: Optional[bool] = Field(False)
    status: Optional[ActivityStatusType] = Field(default='On Track', description="Progress status")

    @model_validator(mode='after')
    def validate_activity_dates_and_aliases(self):
        if self.planned_qty is not None and self.planned_quantity == 0.0:
            self.planned_quantity = self.planned_qty
        if self.actual_qty is not None and self.completed_quantity == 0.0:
            self.completed_quantity = self.actual_qty

        if not self.planned_start and self.start_date:
            self.planned_start = self.start_date
        if not self.planned_end and self.end_date:
            self.planned_end = self.end_date

        if self.planned_start and self.planned_end and self.planned_end < self.planned_start:
            raise ValueError("planned_end must be on or after planned_start")
        return self

class ActivityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    code: Optional[str] = Field(None, max_length=50)
    boq_item: Optional[str] = Field(None, max_length=50)
    planned_progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    actual_progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    planned_quantity: Optional[float] = Field(None, ge=0.0)
    completed_quantity: Optional[float] = Field(None, ge=0.0)
    actual_quantity: Optional[float] = Field(None, ge=0.0)
    actual_qty: Optional[float] = Field(None, ge=0.0)
    unit: Optional[str] = Field(None, min_length=1, max_length=30)
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    weightage: Optional[float] = Field(None, ge=0.0, le=100.0)
    is_critical: Optional[bool] = None
    status: Optional[ActivityStatusType] = None

    @model_validator(mode='after')
    def sync_update_aliases(self):
        if self.actual_quantity is not None and self.completed_quantity is None:
            self.completed_quantity = self.actual_quantity
        elif self.actual_qty is not None and self.completed_quantity is None:
            self.completed_quantity = self.actual_qty
        return self

# Alert Schemas
class AlertCreate(BaseModel):
    project_id: int = Field(..., gt=0)
    severity: AlertSeverityType = Field(default='HIGH')
    title: str = Field(..., min_length=3, max_length=250)
    message: Optional[str] = Field('', max_length=2000)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field('Quality', max_length=50)

    @model_validator(mode='after')
    def sync_message(self):
        if not self.message and self.description:
            self.message = self.description
        return self

# Daily Report Update Schema
class DailyReportUpdate(BaseModel):
    notes: Optional[str] = Field(None, max_length=2000)
    weather: Optional[WeatherType] = None
    actual_progress: Optional[float] = Field(None, ge=0.0, le=100.0)

# Material Log Schemas
class MaterialCreate(BaseModel):
    project_id: int = Field(..., gt=0)
    daily_report_id: Optional[int] = Field(None, gt=0)
    material_name: Optional[str] = Field(None, min_length=2, max_length=150)
    item_name: Optional[str] = Field(None, min_length=2, max_length=150)
    quantity: Optional[float] = Field(None, gt=0)
    quantity_received: Optional[float] = Field(None, gt=0)
    unit: str = Field(default='MT', min_length=1, max_length=30)
    supplier: Optional[str] = Field('', max_length=150)
    vendor: Optional[str] = Field('', max_length=150)
    challan_no: Optional[str] = Field('', max_length=100)
    delivery_challan_no: Optional[str] = Field('', max_length=100)
    category: Optional[str] = Field('General', max_length=100)
    qc_status: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field('Approved', max_length=50)
    received_date: Optional[date] = None
    notes: Optional[str] = Field('', max_length=500)

    @model_validator(mode='after')
    def sync_material_fields(self):
        if not self.material_name and self.item_name:
            self.material_name = self.item_name
        elif not self.material_name:
            self.material_name = 'Standard Civil Material'

        if self.quantity is None and self.quantity_received is not None:
            self.quantity = self.quantity_received
        elif self.quantity is None:
            self.quantity = 1.0

        if not self.supplier and self.vendor:
            self.supplier = self.vendor
        if not self.challan_no and self.delivery_challan_no:
            self.challan_no = self.delivery_challan_no
        if not self.status and self.qc_status:
            self.status = self.qc_status
        return self

class MaterialOut(BaseModel):
    id: int
    project_id: int
    daily_report_id: Optional[int]
    material_name: str
    quantity: float
    unit: str
    supplier: str
    challan_no: str
    status: str
    logged_at: datetime

    class Config:
        from_attributes = True

# Labor Log Schemas
class LaborCreate(BaseModel):
    project_id: int = Field(..., gt=0)
    daily_report_id: Optional[int] = Field(None, gt=0)
    trade_category: str = Field(..., min_length=2, max_length=100)
    headcount: Optional[int] = Field(None, gt=0, le=1000)
    skilled_workers: Optional[int] = Field(None, ge=0)
    unskilled_workers: Optional[int] = Field(None, ge=0)
    shift_hours: float = Field(default=8.0, ge=1.0, le=24.0)
    contractor_name: Optional[str] = Field('', max_length=150)
    supervisor_name: Optional[str] = Field('', max_length=150)
    shift: Optional[str] = Field('Day Shift (08:00 - 17:00)', max_length=50)
    work_performed: Optional[str] = Field('', max_length=300)
    log_date: Optional[date] = None

    @model_validator(mode='after')
    def sync_labor_fields(self):
        if self.headcount is None:
            s = self.skilled_workers or 0
            u = self.unskilled_workers or 0
            self.headcount = max(1, s + u)
        if not self.contractor_name and self.supervisor_name:
            self.contractor_name = self.supervisor_name
        return self

class LaborOut(BaseModel):
    id: int
    project_id: int
    daily_report_id: Optional[int]
    trade_category: str
    headcount: int
    shift_hours: float
    contractor_name: str
    logged_at: datetime

    class Config:
        from_attributes = True
