from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.patient import HealthSystem, db
from sqlalchemy import desc
from datetime import datetime, timedelta
import random

integrations_bp = Blueprint('integrations', __name__)

@integrations_bp.route('/systems', methods=['GET'])
@jwt_required()
def get_systems():
    """Endpoint para listar todos os sistemas de saúde"""
    try:
        systems = HealthSystem.query.order_by(HealthSystem.name).all()
        
        systems_data = []
        for system in systems:
            # Calcular tempo desde última sincronização
            time_since_sync = None
            sync_status = 'success'
            
            if system.last_sync:
                delta = datetime.utcnow() - system.last_sync
                minutes = int(delta.total_seconds() / 60)
                
                if minutes < 60:
                    time_since_sync = f"{minutes} min atrás"
                elif minutes < 1440:  # 24 horas
                    hours = int(minutes / 60)
                    time_since_sync = f"{hours} hora{'s' if hours != 1 else ''} atrás"
                else:
                    days = int(minutes / 1440)
                    time_since_sync = f"{days} dia{'s' if days != 1 else ''} atrás"
                
                # Determinar status baseado no tempo
                if minutes > system.sync_frequency * 2:
                    sync_status = 'warning'
                if minutes > system.sync_frequency * 4:
                    sync_status = 'error'
            else:
                time_since_sync = "Nunca sincronizado"
                sync_status = 'error'
            
            system_data = system.to_dict()
            system_data.update({
                'time_since_sync': time_since_sync,
                'sync_status': sync_status,
                'next_sync_in': f"{system.sync_frequency} min" if system.status == 'online' else 'N/A'
            })
            systems_data.append(system_data)
        
        return jsonify({'systems': systems_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/systems/<int:system_id>', methods=['GET'])
@jwt_required()
def get_system_details(system_id):
    """Endpoint para obter detalhes de um sistema específico"""
    try:
        system = HealthSystem.query.get_or_404(system_id)
        
        # Simular logs de sincronização das últimas 24h
        logs = []
        current_time = datetime.utcnow()
        
        for i in range(10):  # Últimos 10 logs
            log_time = current_time - timedelta(hours=i*2.5)
            status = random.choice(['success', 'success', 'success', 'warning', 'error'])
            
            if status == 'success':
                message = f"{system.name} - Sincronização completa"
                details = f"{random.randint(10, 100)} registros sincronizados"
            elif status == 'warning':
                message = f"{system.name} - Timeout na conexão (recuperado)"
                details = "Conexão reestabelecida automaticamente"
            else:
                message = f"{system.name} - Falha na autenticação"
                details = "Credenciais precisam ser verificadas"
            
            log = {
                'id': i + 1,
                'timestamp': log_time.isoformat(),
                'status': status,
                'message': message,
                'details': details
            }
            logs.append(log)
        
        # Métricas do sistema
        metrics = {
            'uptime_percentage': random.uniform(95, 99.9),
            'average_response_time': random.uniform(100, 500),  # ms
            'total_records': random.randint(1000, 50000),
            'last_24h_syncs': random.randint(20, 48),
            'failed_syncs_24h': random.randint(0, 3)
        }
        
        return jsonify({
            'system': system.to_dict(),
            'logs': logs,
            'metrics': metrics
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/systems/<int:system_id>/test', methods=['POST'])
@jwt_required()
def test_system_connection(system_id):
    """Endpoint para testar conectividade de um sistema"""
    try:
        system = HealthSystem.query.get_or_404(system_id)
        
        # Simular teste de conectividade
        test_results = {
            'connection_test': random.choice([True, True, True, False]),  # 75% sucesso
            'authentication_test': random.choice([True, True, False]),    # 66% sucesso
            'data_access_test': random.choice([True, True, True, False]), # 75% sucesso
            'response_time_ms': random.randint(50, 1000)
        }
        
        overall_success = all([
            test_results['connection_test'],
            test_results['authentication_test'],
            test_results['data_access_test']
        ])
        
        # Atualizar status do sistema baseado no teste
        if overall_success:
            system.status = 'online'
            system.last_sync = datetime.utcnow()
        else:
            system.status = 'warning' if any(test_results.values()) else 'offline'
        
        db.session.commit()
        
        return jsonify({
            'system_id': system_id,
            'test_results': test_results,
            'overall_success': overall_success,
            'message': 'Teste de conectividade concluído com sucesso' if overall_success else 'Problemas detectados na conectividade'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/systems/<int:system_id>/sync', methods=['POST'])
@jwt_required()
def force_system_sync(system_id):
    """Endpoint para forçar sincronização de um sistema"""
    try:
        system = HealthSystem.query.get_or_404(system_id)
        
        if system.status == 'offline':
            return jsonify({'error': 'Sistema offline - não é possível sincronizar'}), 400
        
        # Simular sincronização
        sync_success = random.choice([True, True, True, False])  # 75% sucesso
        
        if sync_success:
            system.last_sync = datetime.utcnow()
            system.status = 'online'
            records_synced = random.randint(10, 200)
            message = f"Sincronização concluída com sucesso. {records_synced} registros processados."
        else:
            system.status = 'warning'
            message = "Falha na sincronização. Verifique a conectividade do sistema."
            records_synced = 0
        
        db.session.commit()
        
        return jsonify({
            'system_id': system_id,
            'sync_success': sync_success,
            'records_synced': records_synced,
            'message': message,
            'last_sync': system.last_sync.isoformat() if system.last_sync else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_integrations_overview():
    """Endpoint para obter visão geral das integrações"""
    try:
        total_systems = HealthSystem.query.count()
        online_systems = HealthSystem.query.filter_by(status='online').count()
        warning_systems = HealthSystem.query.filter_by(status='warning').count()
        offline_systems = HealthSystem.query.filter_by(status='offline').count()
        
        # Calcular taxa de sucesso geral
        success_rate = (online_systems / total_systems * 100) if total_systems > 0 else 0
        
        # Sistemas com alertas (warning + offline)
        systems_with_alerts = warning_systems + offline_systems
        
        # Últimas sincronizações
        recent_syncs = HealthSystem.query.filter(
            HealthSystem.last_sync.isnot(None)
        ).order_by(desc(HealthSystem.last_sync)).limit(5).all()
        
        recent_syncs_data = []
        for system in recent_syncs:
            sync_data = {
                'system_name': system.name,
                'system_type': system.system_type,
                'last_sync': system.last_sync.isoformat() if system.last_sync else None,
                'status': system.status
            }
            recent_syncs_data.append(sync_data)
        
        return jsonify({
            'overview': {
                'total_systems': total_systems,
                'online_systems': online_systems,
                'systems_with_alerts': systems_with_alerts,
                'offline_systems': offline_systems,
                'success_rate_percentage': round(success_rate, 1)
            },
            'recent_syncs': recent_syncs_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_sync_logs():
    """Endpoint para obter logs de sincronização das últimas 24h"""
    try:
        hours = request.args.get('hours', 24, type=int)
        system_id = request.args.get('system_id', type=int)
        
        # Simular logs de sincronização
        logs = []
        current_time = datetime.utcnow()
        
        systems = HealthSystem.query.all()
        if system_id:
            systems = [HealthSystem.query.get(system_id)] if HealthSystem.query.get(system_id) else []
        
        log_id = 1
        for system in systems:
            # Gerar logs para cada sistema
            syncs_in_period = hours // (system.sync_frequency / 60) if system.sync_frequency else 1
            
            for i in range(int(syncs_in_period)):
                log_time = current_time - timedelta(minutes=i * system.sync_frequency)
                status = random.choice(['success', 'success', 'success', 'warning', 'error'])
                
                if status == 'success':
                    message = f"{system.name} - Sincronização completa"
                    details = f"{random.randint(5, 150)} registros sincronizados"
                elif status == 'warning':
                    message = f"{system.name} - Latência alta detectada"
                    details = f"Tempo de resposta: {random.randint(1000, 3000)}ms"
                else:
                    message = f"{system.name} - Falha na sincronização"
                    details = "Timeout na conexão"
                
                log = {
                    'id': log_id,
                    'timestamp': log_time.isoformat(),
                    'system_name': system.name,
                    'system_type': system.system_type,
                    'status': status,
                    'message': message,
                    'details': details
                }
                logs.append(log)
                log_id += 1
        
        # Ordenar por timestamp (mais recente primeiro)
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'logs': logs[:50],  # Limitar a 50 logs
            'total_logs': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@integrations_bp.route('/mapping', methods=['GET'])
@jwt_required()
def get_field_mappings():
    """Endpoint para obter configurações de mapeamento de campos"""
    try:
        # Simular configurações de mapeamento
        mappings = [
            {
                'id': 1,
                'source_system': 'HIS Principal',
                'target_system': 'Sistema Laboratorial',
                'field_mappings': [
                    {'source_field': 'patient_id', 'target_field': 'paciente_codigo'},
                    {'source_field': 'patient_name', 'target_field': 'nome_paciente'},
                    {'source_field': 'birth_date', 'target_field': 'data_nascimento'}
                ],
                'status': 'active',
                'last_updated': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'source_system': 'PACS',
                'target_system': 'HIS Principal',
                'field_mappings': [
                    {'source_field': 'study_id', 'target_field': 'exame_id'},
                    {'source_field': 'patient_id', 'target_field': 'paciente_id'},
                    {'source_field': 'modality', 'target_field': 'modalidade'}
                ],
                'status': 'active',
                'last_updated': datetime.utcnow().isoformat()
            }
        ]
        
        return jsonify({'mappings': mappings}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

