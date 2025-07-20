from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.patient import Patient, MedicalRecord, DataQualityIssue, db
from sqlalchemy import desc, func
from datetime import datetime, timedelta

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
def get_patients():
    """Endpoint para listar pacientes com paginação"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Patient.query
        
        if search:
            query = query.filter(
                Patient.name.contains(search) |
                Patient.cpf.contains(search) |
                Patient.patient_id.contains(search)
            )
        
        patients = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        patients_data = []
        for patient in patients.items:
            # Calcular métricas de qualidade para cada paciente
            total_records = MedicalRecord.query.filter_by(patient_id=patient.id).count()
            quality_issues = DataQualityIssue.query.filter_by(patient_id=patient.id, status='open').count()
            
            # Simular completude (em uma implementação real, seria calculada)
            completeness = max(0, 100 - (quality_issues * 10))
            
            patient_data = patient.to_dict()
            patient_data.update({
                'total_records': total_records,
                'quality_issues': quality_issues,
                'completeness_percentage': completeness,
                'last_update': patient.updated_at.isoformat() if patient.updated_at else None
            })
            patients_data.append(patient_data)
        
        return jsonify({
            'patients': patients_data,
            'pagination': {
                'page': patients.page,
                'pages': patients.pages,
                'per_page': patients.per_page,
                'total': patients.total,
                'has_next': patients.has_next,
                'has_prev': patients.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_details(patient_id):
    """Endpoint para obter detalhes completos de um paciente"""
    try:
        patient = Patient.query.get_or_404(patient_id)
        
        # Buscar registros médicos
        medical_records = MedicalRecord.query.filter_by(
            patient_id=patient_id
        ).order_by(desc(MedicalRecord.record_date)).all()
        
        # Buscar problemas de qualidade
        quality_issues = DataQualityIssue.query.filter_by(
            patient_id=patient_id
        ).order_by(desc(DataQualityIssue.detected_at)).all()
        
        # Calcular indicadores de qualidade
        total_records = len(medical_records)
        open_issues = len([issue for issue in quality_issues if issue.status == 'open'])
        
        # Simular métricas de qualidade
        completeness = max(0, 100 - (open_issues * 5))
        consistency = max(0, 100 - (open_issues * 8))
        
        # Calcular última atualização por sistema
        systems_last_update = {}
        for record in medical_records:
            system = record.system_source
            if system not in systems_last_update or record.created_at > systems_last_update[system]:
                systems_last_update[system] = record.created_at
        
        # Fragmentação de dados (onde estão os dados)
        data_fragments = list(set([record.system_source for record in medical_records]))
        
        return jsonify({
            'patient': patient.to_dict(),
            'medical_records': [record.to_dict() for record in medical_records],
            'quality_issues': [issue.to_dict() for issue in quality_issues],
            'quality_indicators': {
                'completeness': completeness,
                'consistency': consistency,
                'data_freshness': 92,  # Simulado
                'total_records': total_records,
                'open_issues': open_issues
            },
            'systems_last_update': {
                system: timestamp.isoformat() 
                for system, timestamp in systems_last_update.items()
            },
            'data_fragments': data_fragments
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@patients_bp.route('/<int:patient_id>/timeline', methods=['GET'])
@jwt_required()
def get_patient_timeline(patient_id):
    """Endpoint para obter timeline interativa do paciente"""
    try:
        patient = Patient.query.get_or_404(patient_id)
        
        # Buscar registros médicos ordenados por data
        medical_records = MedicalRecord.query.filter_by(
            patient_id=patient_id
        ).order_by(desc(MedicalRecord.record_date)).all()
        
        # Buscar problemas de qualidade relacionados
        quality_issues = DataQualityIssue.query.filter_by(
            patient_id=patient_id
        ).order_by(desc(DataQualityIssue.detected_at)).all()
        
        # Combinar eventos em uma timeline
        timeline_events = []
        
        # Adicionar registros médicos
        for record in medical_records:
            event = {
                'id': f'record_{record.id}',
                'type': 'medical_record',
                'date': record.record_date.isoformat(),
                'title': f'{record.record_type.title()} - {record.department or "Departamento não especificado"}',
                'description': record.description,
                'doctor': record.doctor_name,
                'system_source': record.system_source,
                'category': record.record_type
            }
            timeline_events.append(event)
        
        # Adicionar problemas de qualidade
        for issue in quality_issues:
            event = {
                'id': f'issue_{issue.id}',
                'type': 'quality_issue',
                'date': issue.detected_at.isoformat(),
                'title': issue.title,
                'description': issue.description,
                'priority': issue.priority,
                'status': issue.status,
                'issue_type': issue.issue_type
            }
            timeline_events.append(event)
        
        # Ordenar eventos por data (mais recente primeiro)
        timeline_events.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            'patient_id': patient_id,
            'patient_name': patient.name,
            'timeline': timeline_events
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@patients_bp.route('/<int:patient_id>/recommendations', methods=['GET'])
@jwt_required()
def get_patient_recommendations(patient_id):
    """Endpoint para obter recomendações de melhoria para um paciente"""
    try:
        patient = Patient.query.get_or_404(patient_id)
        
        # Buscar problemas de qualidade abertos
        open_issues = DataQualityIssue.query.filter_by(
            patient_id=patient_id,
            status='open'
        ).all()
        
        recommendations = []
        
        for issue in open_issues:
            recommendation = {
                'id': issue.id,
                'priority': issue.priority,
                'title': f'Resolver {issue.title}',
                'description': issue.description,
                'impact': 'Alto risco de erro médico' if issue.priority == 'high' else 
                         'Impacto moderado na qualidade' if issue.priority == 'medium' else 
                         'Informação complementar',
                'estimated_time': '30 minutos' if issue.issue_type == 'duplicate' else
                                '15 minutos' if issue.issue_type == 'format' else
                                '45 minutos',
                'action_type': issue.issue_type,
                'system_involved': issue.system.name if issue.system else 'Sistema não identificado'
            }
            recommendations.append(recommendation)
        
        # Ordenar por prioridade
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return jsonify({
            'patient_id': patient_id,
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@patients_bp.route('/search', methods=['GET'])
@jwt_required()
def search_patients():
    """Endpoint para busca avançada de pacientes"""
    try:
        query_text = request.args.get('q', '')
        department = request.args.get('department', '')
        has_issues = request.args.get('has_issues', type=bool)
        
        query = Patient.query
        
        if query_text:
            query = query.filter(
                Patient.name.contains(query_text) |
                Patient.cpf.contains(query_text) |
                Patient.patient_id.contains(query_text)
            )
        
        if has_issues:
            # Filtrar pacientes com problemas de qualidade abertos
            query = query.join(DataQualityIssue).filter(
                DataQualityIssue.status == 'open'
            )
        
        patients = query.limit(50).all()
        
        results = []
        for patient in patients:
            quality_issues = DataQualityIssue.query.filter_by(
                patient_id=patient.id,
                status='open'
            ).count()
            
            result = patient.to_dict()
            result['quality_issues_count'] = quality_issues
            results.append(result)
        
        return jsonify({
            'results': results,
            'total_found': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

