from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.patient import Patient, MedicalRecord, HealthSystem, DataQualityIssue, DashboardMetrics, db
from sqlalchemy import func, desc
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """Endpoint para obter métricas do dashboard principal"""
    try:
        # Métricas principais
        total_patients = Patient.query.count()
        total_systems = HealthSystem.query.count()
        
        # Problemas de qualidade
        open_issues = DataQualityIssue.query.filter_by(status='open').count()
        high_priority_issues = DataQualityIssue.query.filter_by(
            status='open', 
            priority='high'
        ).count()
        
        # Sistemas offline
        offline_systems = HealthSystem.query.filter_by(status='offline').count()
        
        # Taxa de completude (simulada)
        completeness_rate = 76.5
        
        # Duplicidades detectadas
        duplicate_issues = DataQualityIssue.query.filter_by(
            issue_type='duplicate',
            status='open'
        ).count()
        
        # Campos críticos ausentes
        missing_fields = DataQualityIssue.query.filter_by(
            issue_type='missing',
            status='open'
        ).count()
        
        return jsonify({
            'metrics': {
                'completeness_rate': completeness_rate,
                'duplicates_detected': duplicate_issues,
                'missing_critical_fields': missing_fields,
                'unsynchronized_systems': offline_systems,
                'total_patients': total_patients,
                'total_systems': total_systems,
                'open_issues': open_issues,
                'high_priority_issues': high_priority_issues
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_priority_alerts():
    """Endpoint para obter alertas prioritários"""
    try:
        # Buscar problemas de alta prioridade
        high_priority_issues = DataQualityIssue.query.filter_by(
            status='open',
            priority='high'
        ).order_by(desc(DataQualityIssue.detected_at)).limit(10).all()
        
        alerts = []
        for issue in high_priority_issues:
            alert = {
                'id': issue.id,
                'type': 'critical' if issue.priority == 'high' else 'warning',
                'title': issue.title,
                'description': issue.description,
                'detected_at': issue.detected_at.isoformat() if issue.detected_at else None,
                'system_name': issue.system.name if issue.system else 'Sistema Desconhecido',
                'patient_name': issue.patient.name if issue.patient else None
            }
            alerts.append(alert)
        
        return jsonify({'alerts': alerts}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/systems-status', methods=['GET'])
@jwt_required()
def get_systems_status():
    """Endpoint para obter status dos sistemas"""
    try:
        systems = HealthSystem.query.all()
        
        systems_data = []
        for system in systems:
            # Calcular tempo desde última sincronização
            time_since_sync = None
            if system.last_sync:
                delta = datetime.utcnow() - system.last_sync
                time_since_sync = int(delta.total_seconds() / 60)  # em minutos
            
            system_data = {
                'id': system.id,
                'name': system.name,
                'type': system.system_type,
                'status': system.status,
                'last_sync': system.last_sync.isoformat() if system.last_sync else None,
                'time_since_sync_minutes': time_since_sync,
                'sync_frequency': system.sync_frequency,
                'description': system.description
            }
            systems_data.append(system_data)
        
        return jsonify({'systems': systems_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/quick-actions', methods=['GET'])
@jwt_required()
def get_quick_actions():
    """Endpoint para obter ações rápidas disponíveis"""
    try:
        # Contar problemas por tipo para sugerir ações
        duplicate_count = DataQualityIssue.query.filter_by(
            issue_type='duplicate',
            status='open'
        ).count()
        
        missing_count = DataQualityIssue.query.filter_by(
            issue_type='missing',
            status='open'
        ).count()
        
        offline_systems = HealthSystem.query.filter_by(status='offline').count()
        
        actions = []
        
        if duplicate_count > 0:
            actions.append({
                'id': 'resolve_duplicates',
                'title': 'Resolver duplicidades automaticamente',
                'description': f'{duplicate_count} duplicidades detectadas',
                'icon': '🔧',
                'priority': 'high' if duplicate_count > 10 else 'medium'
            })
        
        if offline_systems > 0:
            actions.append({
                'id': 'sync_systems',
                'title': f'Sincronizar sistema{"s" if offline_systems > 1 else ""}',
                'description': f'{offline_systems} sistema{"s" if offline_systems > 1 else ""} offline',
                'icon': '🔄',
                'priority': 'high'
            })
        
        if missing_count > 0:
            actions.append({
                'id': 'complete_fields',
                'title': 'Completar campos obrigatórios',
                'description': f'{missing_count} campos críticos ausentes',
                'icon': '📋',
                'priority': 'medium'
            })
        
        return jsonify({'actions': actions}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/heatmap-data', methods=['GET'])
@jwt_required()
def get_heatmap_data():
    """Endpoint para obter dados do mapa de calor institucional"""
    try:
        # Simular dados do mapa de calor
        # Em uma implementação real, isso viria de análise dos sistemas
        heatmap_data = {
            'nodes': [
                {'id': 'his_principal', 'name': 'HIS Principal', 'type': 'HIS', 'health': 85, 'x': 100, 'y': 100},
                {'id': 'lis_lab', 'name': 'Sistema Laboratorial', 'type': 'LIS', 'health': 92, 'x': 200, 'y': 150},
                {'id': 'pacs_images', 'name': 'PACS Imagens', 'type': 'PACS', 'health': 78, 'x': 300, 'y': 100},
                {'id': 'billing', 'name': 'Faturamento', 'type': 'Billing', 'health': 65, 'x': 150, 'y': 250},
                {'id': 'pharmacy', 'name': 'Farmácia', 'type': 'Pharmacy', 'health': 88, 'x': 250, 'y': 200},
                {'id': 'ambulatory', 'name': 'Ambulatório', 'type': 'Ambulatory', 'health': 91, 'x': 350, 'y': 180}
            ],
            'connections': [
                {'source': 'his_principal', 'target': 'lis_lab', 'strength': 0.9},
                {'source': 'his_principal', 'target': 'pacs_images', 'strength': 0.7},
                {'source': 'his_principal', 'target': 'billing', 'strength': 0.6},
                {'source': 'his_principal', 'target': 'pharmacy', 'strength': 0.8},
                {'source': 'his_principal', 'target': 'ambulatory', 'strength': 0.85},
                {'source': 'lis_lab', 'target': 'pharmacy', 'strength': 0.75}
            ]
        }
        
        return jsonify({'heatmap': heatmap_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends_data():
    """Endpoint para obter dados de tendências temporais"""
    try:
        # Simular dados de tendências dos últimos 30 dias
        trends_data = {
            'quality_evolution': [
                {'date': '2024-11-20', 'quality_score': 72},
                {'date': '2024-11-25', 'quality_score': 74},
                {'date': '2024-11-30', 'quality_score': 76},
                {'date': '2024-12-05', 'quality_score': 78},
                {'date': '2024-12-10', 'quality_score': 75},
                {'date': '2024-12-15', 'quality_score': 77},
                {'date': '2024-12-20', 'quality_score': 76}
            ],
            'issues_resolved': [
                {'date': '2024-11-20', 'count': 15},
                {'date': '2024-11-25', 'count': 18},
                {'date': '2024-11-30', 'count': 22},
                {'date': '2024-12-05', 'count': 19},
                {'date': '2024-12-10', 'count': 25},
                {'date': '2024-12-15', 'count': 21},
                {'date': '2024-12-20', 'count': 23}
            ],
            'system_availability': [
                {'date': '2024-11-20', 'availability': 98.5},
                {'date': '2024-11-25', 'availability': 99.1},
                {'date': '2024-11-30', 'availability': 97.8},
                {'date': '2024-12-05', 'availability': 99.3},
                {'date': '2024-12-10', 'availability': 98.9},
                {'date': '2024-12-15', 'availability': 99.2},
                {'date': '2024-12-20', 'availability': 99.2}
            ]
        }
        
        return jsonify({'trends': trends_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

