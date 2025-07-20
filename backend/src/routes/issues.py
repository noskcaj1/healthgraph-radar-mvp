from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.patient import DataQualityIssue, HealthSystem, Patient, db
from sqlalchemy import desc, func
from datetime import datetime, timedelta

issues_bp = Blueprint('issues', __name__)

@issues_bp.route('/', methods=['GET'])
@jwt_required()
def get_issues():
    """Endpoint para listar problemas de qualidade com filtros"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', 'open')
        priority = request.args.get('priority', '')
        issue_type = request.args.get('type', '')
        
        query = DataQualityIssue.query
        
        if status:
            query = query.filter(DataQualityIssue.status == status)
        
        if priority:
            query = query.filter(DataQualityIssue.priority == priority)
        
        if issue_type:
            query = query.filter(DataQualityIssue.issue_type == issue_type)
        
        # Ordenar por prioridade e data de detecção
        priority_order = func.case(
            (DataQualityIssue.priority == 'high', 1),
            (DataQualityIssue.priority == 'medium', 2),
            (DataQualityIssue.priority == 'low', 3),
            else_=4
        )
        
        issues = query.order_by(
            priority_order,
            desc(DataQualityIssue.detected_at)
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        issues_data = []
        for issue in issues.items:
            # Calcular tempo desde detecção
            time_since_detection = None
            if issue.detected_at:
                delta = datetime.utcnow() - issue.detected_at
                hours = int(delta.total_seconds() / 3600)
                if hours < 24:
                    time_since_detection = f"{hours} hora{'s' if hours != 1 else ''}"
                else:
                    days = int(hours / 24)
                    time_since_detection = f"{days} dia{'s' if days != 1 else ''}"
            
            # Estimar tempo de resolução baseado no tipo
            estimated_resolution = {
                'duplicate': '4 horas',
                'missing': '6 horas',
                'conflict': '2 horas',
                'format': '1 hora'
            }.get(issue.issue_type, '3 horas')
            
            issue_data = issue.to_dict()
            issue_data.update({
                'system_name': issue.system.name if issue.system else 'Sistema Desconhecido',
                'patient_name': issue.patient.name if issue.patient else None,
                'time_since_detection': time_since_detection,
                'estimated_resolution': estimated_resolution
            })
            issues_data.append(issue_data)
        
        return jsonify({
            'issues': issues_data,
            'pagination': {
                'page': issues.page,
                'pages': issues.pages,
                'per_page': issues.per_page,
                'total': issues.total,
                'has_next': issues.has_next,
                'has_prev': issues.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@issues_bp.route('/<int:issue_id>', methods=['GET'])
@jwt_required()
def get_issue_details(issue_id):
    """Endpoint para obter detalhes de um problema específico"""
    try:
        issue = DataQualityIssue.query.get_or_404(issue_id)
        
        issue_data = issue.to_dict()
        issue_data.update({
            'system_name': issue.system.name if issue.system else 'Sistema Desconhecido',
            'system_type': issue.system.system_type if issue.system else None,
            'patient_name': issue.patient.name if issue.patient else None,
            'patient_id_display': issue.patient.patient_id if issue.patient else None
        })
        
        # Buscar problemas similares
        similar_issues = DataQualityIssue.query.filter(
            DataQualityIssue.issue_type == issue.issue_type,
            DataQualityIssue.id != issue.id,
            DataQualityIssue.status == 'open'
        ).limit(5).all()
        
        similar_data = [similar.to_dict() for similar in similar_issues]
        
        return jsonify({
            'issue': issue_data,
            'similar_issues': similar_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@issues_bp.route('/<int:issue_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_issue(issue_id):
    """Endpoint para marcar um problema como resolvido"""
    try:
        issue = DataQualityIssue.query.get_or_404(issue_id)
        
        if issue.status == 'resolved':
            return jsonify({'error': 'Problema já foi resolvido'}), 400
        
        data = request.get_json()
        resolution_notes = data.get('resolution_notes', '')
        
        # Calcular tempo de resolução
        if issue.detected_at:
            resolution_time = int((datetime.utcnow() - issue.detected_at).total_seconds() / 60)
        else:
            resolution_time = 0
        
        # Atualizar problema
        issue.status = 'resolved'
        issue.resolved_at = datetime.utcnow()
        issue.resolution_time = resolution_time
        
        db.session.commit()
        
        return jsonify({
            'message': 'Problema resolvido com sucesso',
            'issue': issue.to_dict(),
            'resolution_time_minutes': resolution_time
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@issues_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_issues_metrics():
    """Endpoint para obter métricas do centro de resolução"""
    try:
        # Métricas gerais
        total_open = DataQualityIssue.query.filter_by(status='open').count()
        total_resolved_month = DataQualityIssue.query.filter(
            DataQualityIssue.status == 'resolved',
            DataQualityIssue.resolved_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        # Tempo médio de resolução
        avg_resolution_time = db.session.query(
            func.avg(DataQualityIssue.resolution_time)
        ).filter(
            DataQualityIssue.status == 'resolved',
            DataQualityIssue.resolution_time.isnot(None)
        ).scalar()
        
        avg_resolution_hours = round(avg_resolution_time / 60, 1) if avg_resolution_time else 0
        
        # Taxa de resolução
        total_issues_month = DataQualityIssue.query.filter(
            DataQualityIssue.detected_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        resolution_rate = round((total_resolved_month / total_issues_month * 100), 1) if total_issues_month > 0 else 0
        
        # Distribuição por prioridade
        priority_distribution = db.session.query(
            DataQualityIssue.priority,
            func.count(DataQualityIssue.id)
        ).filter(
            DataQualityIssue.status == 'open'
        ).group_by(DataQualityIssue.priority).all()
        
        priority_data = {priority: count for priority, count in priority_distribution}
        
        # Distribuição por tipo
        type_distribution = db.session.query(
            DataQualityIssue.issue_type,
            func.count(DataQualityIssue.id)
        ).filter(
            DataQualityIssue.status == 'open'
        ).group_by(DataQualityIssue.issue_type).all()
        
        type_data = {issue_type: count for issue_type, count in type_distribution}
        
        return jsonify({
            'metrics': {
                'total_open_issues': total_open,
                'resolved_this_month': total_resolved_month,
                'average_resolution_time_hours': avg_resolution_hours,
                'resolution_rate_percentage': resolution_rate,
                'priority_distribution': priority_data,
                'type_distribution': type_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@issues_bp.route('/wizards', methods=['GET'])
@jwt_required()
def get_resolution_wizards():
    """Endpoint para obter wizards de resolução disponíveis"""
    try:
        wizards = [
            {
                'id': 'duplicate_patients',
                'title': 'Resolver Duplicações de Pacientes',
                'description': 'Guia passo-a-passo para identificar e mesclar registros duplicados',
                'icon': '🔧',
                'estimated_time': '30-60 minutos',
                'difficulty': 'medium',
                'applicable_types': ['duplicate']
            },
            {
                'id': 'sync_systems',
                'title': 'Restaurar Sincronização de Sistemas',
                'description': 'Procedimento automatizado para reestabelecer conexões entre sistemas',
                'icon': '🔄',
                'estimated_time': '15-30 minutos',
                'difficulty': 'easy',
                'applicable_types': ['sync_error']
            },
            {
                'id': 'complete_fields',
                'title': 'Completar Campos Obrigatórios',
                'description': 'Assistente para preenchimento de dados críticos ausentes',
                'icon': '📝',
                'estimated_time': '20-45 minutos',
                'difficulty': 'easy',
                'applicable_types': ['missing']
            },
            {
                'id': 'validate_consistency',
                'title': 'Validação de Consistência',
                'description': 'Ferramenta para verificar e corrigir inconsistências de dados',
                'icon': '🔍',
                'estimated_time': '45-90 minutos',
                'difficulty': 'hard',
                'applicable_types': ['conflict', 'format']
            }
        ]
        
        return jsonify({'wizards': wizards}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@issues_bp.route('/history', methods=['GET'])
@jwt_required()
def get_resolution_history():
    """Endpoint para obter histórico de resoluções"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        resolved_issues = DataQualityIssue.query.filter_by(
            status='resolved'
        ).order_by(
            desc(DataQualityIssue.resolved_at)
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        history_data = []
        for issue in resolved_issues.items:
            resolution_time_display = f"{issue.resolution_time // 60}h {issue.resolution_time % 60}min" if issue.resolution_time else "N/A"
            
            history_item = {
                'id': issue.id,
                'title': issue.title,
                'description': issue.description,
                'issue_type': issue.issue_type,
                'priority': issue.priority,
                'resolved_at': issue.resolved_at.isoformat() if issue.resolved_at else None,
                'resolution_time_display': resolution_time_display,
                'resolution_time_minutes': issue.resolution_time,
                'system_name': issue.system.name if issue.system else 'Sistema Desconhecido'
            }
            history_data.append(history_item)
        
        return jsonify({
            'history': history_data,
            'pagination': {
                'page': resolved_issues.page,
                'pages': resolved_issues.pages,
                'per_page': resolved_issues.per_page,
                'total': resolved_issues.total,
                'has_next': resolved_issues.has_next,
                'has_prev': resolved_issues.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

