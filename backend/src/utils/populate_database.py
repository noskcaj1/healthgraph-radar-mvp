"""
Script para popular o banco de dados com dados fictícios
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from flask import Flask
from datetime import datetime
from src.database import db
from src.utils.data_generator import HealthDataGenerator

# Definir modelos aqui para evitar conflitos de importação
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

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    record_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    doctor_name = db.Column(db.String(100))
    department = db.Column(db.String(50))
    system_source = db.Column(db.String(50), nullable=False)
    record_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class HealthSystem(db.Model):
    __tablename__ = 'health_systems'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    system_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='online')
    last_sync = db.Column(db.DateTime)
    sync_frequency = db.Column(db.Integer, default=60)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DataQualityIssue(db.Model):
    __tablename__ = 'data_quality_issues'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)
    system_id = db.Column(db.Integer, db.ForeignKey('health_systems.id'), nullable=False)
    issue_type = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), default='medium')
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    resolution_time = db.Column(db.Integer)

class DashboardMetrics(db.Model):
    __tablename__ = 'dashboard_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)
    metric_value = db.Column(db.Float, nullable=False)
    metric_unit = db.Column(db.String(20))
    department = db.Column(db.String(50))
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(50), default='user')
    department = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

def populate_database(app):
    """Popular o banco de dados com dados fictícios"""

    
    with app.app_context():
        print("Criando tabelas...")
        db.create_all()
        
        # Verificar se já existem dados
        if Patient.query.count() > 0:
            print("Banco de dados já contém dados. Limpando...")
            # Limpar dados existentes
            DataQualityIssue.query.delete()
            MedicalRecord.query.delete()
            Patient.query.delete()
            HealthSystem.query.delete()
            DashboardMetrics.query.delete()
            User.query.delete()
            db.session.commit()
        
        print("Gerando dados fictícios...")
        generator = HealthDataGenerator()
        dataset = generator.generate_complete_dataset(num_patients=500, num_records_per_patient=5)
        
        print("Inserindo usuários...")
        for user_data in dataset['users']:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                department=user_data['department']
            )
            user.set_password(user_data['password'])
            db.session.add(user)
        
        db.session.commit()
        print(f"✓ {len(dataset['users'])} usuários inseridos")
        
        print("Inserindo sistemas de saúde...")
        for system_data in dataset['health_systems']:
            system = HealthSystem(
                name=system_data['name'],
                system_type=system_data['system_type'],
                status=system_data['status'],
                last_sync=system_data['last_sync'],
                sync_frequency=system_data['sync_frequency'],
                description=system_data['description']
            )
            db.session.add(system)
        
        db.session.commit()
        print(f"✓ {len(dataset['health_systems'])} sistemas de saúde inseridos")
        
        print("Inserindo pacientes...")
        patient_id_map = {}
        for i, patient_data in enumerate(dataset['patients']):
            patient = Patient(
                patient_id=patient_data['patient_id'],
                name=patient_data['name'],
                cpf=patient_data['cpf'],
                birth_date=patient_data['birth_date'],
                gender=patient_data['gender'],
                phone=patient_data['phone'],
                email=patient_data['email'],
                address=patient_data['address']
            )
            db.session.add(patient)
            db.session.flush()  # Para obter o ID
            patient_id_map[i + 1] = patient.id
        
        db.session.commit()
        print(f"✓ {len(dataset['patients'])} pacientes inseridos")
        
        print("Inserindo registros médicos...")
        for record_data in dataset['medical_records']:
            # Mapear patient_id do dataset para o ID real do banco
            real_patient_id = patient_id_map.get(record_data['patient_id'])
            if real_patient_id:
                record = MedicalRecord(
                    patient_id=real_patient_id,
                    record_type=record_data['record_type'],
                    description=record_data['description'],
                    doctor_name=record_data['doctor_name'],
                    department=record_data['department'],
                    system_source=record_data['system_source'],
                    record_date=record_data['record_date']
                )
                db.session.add(record)
        
        db.session.commit()
        print(f"✓ {len(dataset['medical_records'])} registros médicos inseridos")
        
        print("Inserindo problemas de qualidade...")
        for issue_data in dataset['data_quality_issues']:
            # Mapear patient_id se existir
            real_patient_id = None
            if issue_data['patient_id']:
                real_patient_id = patient_id_map.get(issue_data['patient_id'])
            
            issue = DataQualityIssue(
                patient_id=real_patient_id,
                system_id=issue_data['system_id'],
                issue_type=issue_data['issue_type'],
                priority=issue_data['priority'],
                title=issue_data['title'],
                description=issue_data['description'],
                status=issue_data['status'],
                detected_at=issue_data['detected_at'],
                resolved_at=issue_data.get('resolved_at'),
                resolution_time=issue_data.get('resolution_time')
            )
            db.session.add(issue)
        
        db.session.commit()
        print(f"✓ {len(dataset['data_quality_issues'])} problemas de qualidade inseridos")
        
        print("Inserindo métricas do dashboard...")
        for metric_data in dataset['dashboard_metrics']:
            metric = DashboardMetrics(
                metric_name=metric_data['metric_name'],
                metric_value=metric_data['metric_value'],
                metric_unit=metric_data['metric_unit'],
                department=metric_data['department'],
                calculated_at=metric_data['calculated_at']
            )
            db.session.add(metric)
        
        db.session.commit()
        print(f"✓ {len(dataset['dashboard_metrics'])} métricas inseridas")
        
        print("\n🎉 Banco de dados populado com sucesso!")
        print("\nResumo dos dados inseridos:")
        print(f"- Usuários: {User.query.count()}")
        print(f"- Pacientes: {Patient.query.count()}")
        print(f"- Registros médicos: {MedicalRecord.query.count()}")
        print(f"- Sistemas de saúde: {HealthSystem.query.count()}")
        print(f"- Problemas de qualidade: {DataQualityIssue.query.count()}")
        print(f"- Métricas: {DashboardMetrics.query.count()}")
        
        print("\nCredenciais de acesso:")
        print("- Admin: admin / senha123")
        print("- Usuários: [nome].[sobrenome] / senha123")

if __name__ == "__main__":
    app = Flask(__name__)
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "healthgraph.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    populate_database(app)

