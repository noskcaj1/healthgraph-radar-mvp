from src.database import db
from datetime import datetime
import json

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy=True)
    data_quality_issues = db.relationship('DataQualityIssue', backref='patient', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'name': self.name,
            'cpf': self.cpf,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'gender': self.gender,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    record_type = db.Column(db.String(50), nullable=False)  # consultation, exam, procedure
    description = db.Column(db.Text, nullable=False)
    doctor_name = db.Column(db.String(100))
    department = db.Column(db.String(50))
    system_source = db.Column(db.String(50), nullable=False)
    record_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'record_type': self.record_type,
            'description': self.description,
            'doctor_name': self.doctor_name,
            'department': self.department,
            'system_source': self.system_source,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class HealthSystem(db.Model):
    __tablename__ = 'health_systems'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    system_type = db.Column(db.String(50), nullable=False)  # HIS, LIS, PACS, etc.
    status = db.Column(db.String(20), default='online')  # online, offline, warning
    last_sync = db.Column(db.DateTime)
    sync_frequency = db.Column(db.Integer, default=60)  # minutes
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    data_quality_issues = db.relationship('DataQualityIssue', backref='system', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'system_type': self.system_type,
            'status': self.status,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'sync_frequency': self.sync_frequency,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DataQualityIssue(db.Model):
    __tablename__ = 'data_quality_issues'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)
    system_id = db.Column(db.Integer, db.ForeignKey('health_systems.id'), nullable=False)
    issue_type = db.Column(db.String(50), nullable=False)  # duplicate, missing, conflict, format
    priority = db.Column(db.String(20), default='medium')  # high, medium, low
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')  # open, in_progress, resolved
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    resolution_time = db.Column(db.Integer)  # minutes
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'system_id': self.system_id,
            'issue_type': self.issue_type,
            'priority': self.priority,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_time': self.resolution_time
        }

class DashboardMetrics(db.Model):
    __tablename__ = 'dashboard_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)
    metric_value = db.Column(db.Float, nullable=False)
    metric_unit = db.Column(db.String(20))  # %, count, hours, etc.
    department = db.Column(db.String(50))
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'metric_unit': self.metric_unit,
            'department': self.department,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None
        }

