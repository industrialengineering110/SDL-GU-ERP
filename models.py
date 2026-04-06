
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base
import datetime

class SyncBase:
    # Critical for fast synchronization and conflict resolution
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, index=True)
    is_deleted = Column(Boolean, default=False, index=True)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, index=True) 
    role = Column(String, index=True)
    status = Column(String, default="PENDING", index=True) 
    hashed_password = Column(String, nullable=False)
    permissions = Column(JSON, default={})

class ProductionRecord(Base, SyncBase):
    __tablename__ = "production_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(String, index=True) 
    department = Column(String, index=True)
    line_id = Column(String, index=True)
    style_code = Column(String, index=True)
    so_number = Column(String, index=True)
    color = Column(String, index=True)
    size = Column(String, index=True)
    actual = Column(Integer, default=0)
    target = Column(Integer, default=0)
    hour = Column(Integer, index=True) 
    reporter_id = Column(String, index=True)
    is_rectification = Column(Boolean, default=False)

    __table_args__ = (
        Index('idx_prod_sync', 'updated_at', 'id'),
        Index('idx_prod_report', 'date', 'line_id', 'hour'),
    )

class WIPRecord(Base, SyncBase):
    __tablename__ = "wip_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(String, index=True)
    department = Column(String, index=True)
    line_id = Column(String, index=True)
    style_number = Column(String, index=True)
    so_number = Column(String, index=True)
    buyer = Column(String, index=True)
    color = Column(String)
    input_qty = Column(Integer, default=0)
    output_qty = Column(Integer, default=0)
    reporter_role = Column(String)

class StylePlan(Base, SyncBase):
    __tablename__ = "style_plans"
    id = Column(String, primary_key=True)
    so_number = Column(String, index=True)
    buyer = Column(String, index=True)
    style_number = Column(String, index=True)
    plan_quantity = Column(Integer)
    order_quantity = Column(Integer)
    line_id = Column(String, index=True)
    shipment_date = Column(String)
    status = Column(String, index=True)
    is_complete = Column(Boolean, default=False)
    sections_data = Column(JSON) # Detailed milestones

class ManpowerRecord(Base, SyncBase):
    __tablename__ = "manpower_logs"
    id = Column(String, primary_key=True)
    date = Column(String, index=True)
    line_id = Column(String, index=True)
    department = Column(String, index=True)
    present_op = Column(Integer, default=0)
    present_ir = Column(Integer, default=0)
    present_hp = Column(Integer, default=0)
    headcount = Column(Integer, default=0)
    reporter_id = Column(String)

class SystemConfig(Base):
    __tablename__ = "system_configurations"
    id = Column(Integer, primary_key=True, default=1)
    config_data = Column(JSON) # Stores global settings, lines, departments etc.
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class NPTRecord(Base, SyncBase):
    __tablename__ = "npt_logs"
    id = Column(String, primary_key=True)
    date = Column(String, index=True)
    department = Column(String, index=True)
    line_id = Column(String, index=True)
    issue_category = Column(String)
    reason = Column(String)
    duration_minutes = Column(Integer)
    status = Column(String, index=True)

class DefectRecord(Base, SyncBase):
    __tablename__ = "defect_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(String, index=True)
    department = Column(String, index=True)
    line_id = Column(String, index=True)
    so_number = Column(String, index=True)
    buyer = Column(String, index=True)
    style_code = Column(String, index=True)
    color = Column(String, index=True)
    size = Column(String, index=True)
    defect_type = Column(String)
    count = Column(Integer, default=0)
    is_reject = Column(Boolean, default=False)
    reporter_id = Column(String)
