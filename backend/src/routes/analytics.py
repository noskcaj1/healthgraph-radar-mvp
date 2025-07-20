from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.patient import Patient, DataQualityIssue, HealthSystem, DashboardMetrics, db
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import random

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Endpoint para obter tendências temporais"""
    try:
        days = request.args.get('days', 30, type=int)
        
        # Simular dados de tendências dos últimos N dias
        trends_data = {
            'quality_evolution': [],
            'issues_resolved': [],
            'system_availability': [],
            'data_completeness': []
        }
        
        current_date = datetime.utcnow().date()
        
        for i in range(days):
            date = current_date - timedelta(days=i)
            
            # Simular evolução da qualidade (com tendência de melhoria)
            base_quality = 70 + (i * 0.2) + random.uniform(-3, 3)
            quality_score = min(100, max(0, base_quality))
            
            # Simular problemas resolvidos (variação realística)
            resolved_count = random.randint(15, 35)
            
            # Simular disponibilidade do sistema
            availability = random.uniform(97, 99.9)
            
            # Simular completude de dados
            completeness = random.uniform(75, 85)
            
            trends_data['quality_evolution'].append({
                'date': date.isoformat(),
                'quality_score': round(quality_score, 1)
            })
            
            trends_data['issues_resolved'].append({
                'date': date.isoformat(),
                'count': resolved_count
            })
            
            trends_data['system_availability'].append({
                'date': date.isoformat(),
                'availability': round(availability, 1)
            })
            
            trends_data['data_completeness'].append({
                'date': date.isoformat(),
                'completeness': round(completeness, 1)
            })
        
        # Reverter para ordem cronológica
        for key in trends_data:
            trends_data[key].reverse()
        
        return jsonify({'trends': trends_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_department_analysis():
    """Endpoint para análise comparativa por departamento"""
    try:
        # Simular dados por departamento
        departments = [
            {
                'name': 'Cardiologia',
                'total_records': 1567,
                'completeness_percentage': 98,
                'quality_score': 'Excelente',
                'open_issues': 2,
                'avg_resolution_time': 1.5,  # horas
                'last_update': datetime.utcnow().isoformat()
            },
            {
                'name': 'Laboratório',
                'total_records': 2341,
                'completeness_percentage': 94,
                'quality_score': 'Excelente',
                'open_issues': 5,
                'avg_resolution_time': 2.1,
                'last_update': datetime.utcnow().isoformat()
            },
            {
                'name': 'Emergência',
                'total_records': 789,
                'completeness_percentage': 82,
                'quality_score': 'Bom',
                'open_issues': 12,
                'avg_resolution_time': 3.2,
                'last_update': datetime.utcnow().isoformat()
            },
            {
                'name': 'Ambulatório',
                'total_records': 1234,
                'completeness_percentage': 76,
                'quality_score': 'Precisa Melhorar',
                'open_issues': 18,
                'avg_resolution_time': 4.1,
                'last_update': datetime.utcnow().isoformat()
            },
            {
                'name': 'Internação',
                'total_records': 567,
                'completeness_percentage': 91,
                'quality_score': 'Excelente',
                'open_issues': 3,
                'avg_resolution_time': 1.8,
                'last_update': datetime.utcnow().isoformat()
            },
            {
                'name': 'Radiologia',
                'total_records': 892,
                'completeness_percentage': 88,
                'quality_score': 'Bom',
                'open_issues': 7,
                'avg_resolution_time': 2.5,
                'last_update': datetime.utcnow().isoformat()
            }
        ]
        
        return jsonify({'departments': departments}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/roi', methods=['GET'])
@jwt_required()
def get_roi_analysis():
    """Endpoint para análise de ROI (Return on Investment)"""
    try:
        # Simular cálculos de ROI
        roi_data = {
            'annual_savings': 2400000,  # R$ 2.4M
            'roi_percentage': 340,
            'payback_months': 8,
            'hours_saved_monthly': 1250,
            'cost_per_error_avoided': 1500,
            'errors_prevented_monthly': 45,
            
            'breakdown': {
                'reduced_medical_errors': {
                    'savings': 1200000,
                    'description': 'Redução de erros médicos por informação incompleta'
                },
                'process_optimization': {
                    'savings': 800000,
                    'description': 'Otimização de processos e redução de retrabalho'
                },
                'improved_decision_making': {
                    'savings': 300000,
                    'description': 'Melhoria na tomada de decisões clínicas'
                },
                'regulatory_compliance': {
                    'savings': 100000,
                    'description': 'Conformidade regulatória automática'
                }
            },
            
            'monthly_metrics': [
                {'month': 'Jan', 'savings': 180000, 'investment': 50000},
                {'month': 'Fev', 'savings': 195000, 'investment': 45000},
                {'month': 'Mar', 'savings': 210000, 'investment': 40000},
                {'month': 'Abr', 'savings': 225000, 'investment': 35000},
                {'month': 'Mai', 'savings': 240000, 'investment': 30000},
                {'month': 'Jun', 'savings': 250000, 'investment': 25000}
            ]
        }
        
        return jsonify({'roi': roi_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_available_reports():
    """Endpoint para obter relatórios disponíveis"""
    try:
        reports = [
            {
                'id': 'quality_report',
                'title': 'Relatório de Qualidade',
                'description': 'Análise completa da qualidade dos dados',
                'type': 'quality',
                'last_generated': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                'frequency': 'daily',
                'format': ['PDF', 'Excel'],
                'estimated_time': '5 minutos'
            },
            {
                'id': 'integration_report',
                'title': 'Relatório de Integrações',
                'description': 'Status e performance das integrações',
                'type': 'integration',
                'last_generated': (datetime.utcnow() - timedelta(days=1)).isoformat(),
                'frequency': 'weekly',
                'format': ['PDF', 'Excel'],
                'estimated_time': '3 minutos'
            },
            {
                'id': 'roi_report',
                'title': 'Relatório de ROI',
                'description': 'Análise de retorno sobre investimento',
                'type': 'financial',
                'last_generated': (datetime.utcnow() - timedelta(days=3)).isoformat(),
                'frequency': 'monthly',
                'format': ['PDF', 'PowerPoint'],
                'estimated_time': '8 minutos'
            },
            {
                'id': 'executive_report',
                'title': 'Relatório Executivo',
                'description': 'Resumo executivo para gestores',
                'type': 'executive',
                'last_generated': datetime.utcnow().isoformat(),
                'frequency': 'weekly',
                'format': ['PDF', 'PowerPoint'],
                'estimated_time': '10 minutos'
            }
        ]
        
        return jsonify({'reports': reports}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/reports/<report_id>/generate', methods=['POST'])
@jwt_required()
def generate_report(report_id):
    """Endpoint para gerar um relatório específico"""
    try:
        data = request.get_json()
        format_type = data.get('format', 'PDF')
        date_range = data.get('date_range', '30_days')
        
        # Simular geração de relatório
        report_data = {
            'report_id': report_id,
            'format': format_type,
            'date_range': date_range,
            'generated_at': datetime.utcnow().isoformat(),
            'status': 'completed',
            'download_url': f'/api/analytics/reports/{report_id}/download',
            'file_size': f"{random.randint(500, 2000)} KB",
            'pages': random.randint(5, 25)
        }
        
        # Simular conteúdo baseado no tipo de relatório
        if report_id == 'quality_report':
            report_data['summary'] = {
                'overall_quality_score': 87.5,
                'total_issues_found': 234,
                'issues_resolved': 189,
                'critical_issues': 12
            }
        elif report_id == 'integration_report':
            report_data['summary'] = {
                'systems_monitored': 8,
                'uptime_percentage': 99.2,
                'failed_syncs': 5,
                'data_volume_gb': 45.7
            }
        elif report_id == 'roi_report':
            report_data['summary'] = {
                'annual_savings': 2400000,
                'roi_percentage': 340,
                'payback_months': 8,
                'efficiency_gain': 35
            }
        
        return jsonify({
            'message': 'Relatório gerado com sucesso',
            'report': report_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/kpis', methods=['GET'])
@jwt_required()
def get_key_performance_indicators():
    """Endpoint para obter KPIs principais"""
    try:
        # Calcular KPIs baseados nos dados reais e simulados
        current_month = datetime.utcnow().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        # KPIs principais
        kpis = {
            'data_quality_score': {
                'current': 87.3,
                'previous': 84.1,
                'trend': 'up',
                'unit': '%'
            },
            'issues_resolution_rate': {
                'current': 94.2,
                'previous': 91.8,
                'trend': 'up',
                'unit': '%'
            },
            'average_resolution_time': {
                'current': 2.1,
                'previous': 2.8,
                'trend': 'down',
                'unit': 'hours'
            },
            'system_availability': {
                'current': 99.2,
                'previous': 98.7,
                'trend': 'up',
                'unit': '%'
            },
            'data_completeness': {
                'current': 76.5,
                'previous': 73.2,
                'trend': 'up',
                'unit': '%'
            },
            'cost_savings_monthly': {
                'current': 200000,
                'previous': 185000,
                'trend': 'up',
                'unit': 'BRL'
            }
        }
        
        return jsonify({'kpis': kpis}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analytics_bp.route('/charts/data-quality', methods=['GET'])
@jwt_required()
def get_data_quality_charts():
    """Endpoint para obter dados dos gráficos de qualidade"""
    try:
        chart_type = request.args.get('type', 'completeness')
        
        if chart_type == 'completeness':
            # Gráfico de barras - Completude por sistema
            data = [
                {'system': 'HIS Principal', 'completeness': 92},
                {'system': 'LIS', 'completeness': 88},
                {'system': 'PACS', 'completeness': 85},
                {'system': 'Faturamento', 'completeness': 76},
                {'system': 'Farmácia', 'completeness': 91},
                {'system': 'Ambulatório', 'completeness': 82}
            ]
        elif chart_type == 'issues_evolution':
            # Gráfico de linha - Evolução de problemas
            data = []
            for i in range(30):
                date = datetime.utcnow().date() - timedelta(days=29-i)
                issues = random.randint(15, 45)
                data.append({
                    'date': date.isoformat(),
                    'open_issues': issues,
                    'resolved_issues': random.randint(10, 35)
                })
        elif chart_type == 'criticality':
            # Gráfico de pizza - Distribuição por criticidade
            data = [
                {'priority': 'Alta', 'count': 23, 'percentage': 18.5},
                {'priority': 'Média', 'count': 67, 'percentage': 53.6},
                {'priority': 'Baixa', 'count': 35, 'percentage': 28.0}
            ]
        else:
            data = []
        
        return jsonify({
            'chart_type': chart_type,
            'data': data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

