"""
Gerador de dados fictícios para o HealthGraph Radar MVP
"""

from faker import Faker
from datetime import datetime, timedelta
import random
import json

fake = Faker('pt_BR')

class HealthDataGenerator:
    def __init__(self):
        self.fake = fake
        self.departments = [
            'Cardiologia', 'Laboratório', 'Emergência', 'Ambulatório', 
            'Internação', 'Radiologia', 'Farmácia', 'UTI', 'Pediatria', 'Neurologia'
        ]
        
        self.health_systems = [
            {'name': 'HIS Principal', 'type': 'HIS', 'description': 'Sistema de Informação Hospitalar principal'},
            {'name': 'Sistema Laboratorial', 'type': 'LIS', 'description': 'Sistema de Informação Laboratorial'},
            {'name': 'PACS Imagens', 'type': 'PACS', 'description': 'Sistema de Arquivamento de Imagens'},
            {'name': 'Sistema de Faturamento', 'type': 'Billing', 'description': 'Sistema de Faturamento e Cobrança'},
            {'name': 'Farmácia Hospitalar', 'type': 'Pharmacy', 'description': 'Sistema de Gestão Farmacêutica'},
            {'name': 'Sistema Ambulatorial', 'type': 'Ambulatory', 'description': 'Sistema de Gestão Ambulatorial'},
            {'name': 'Sistema de Emergência', 'type': 'Emergency', 'description': 'Sistema de Pronto Socorro'},
            {'name': 'Sistema de UTI', 'type': 'ICU', 'description': 'Sistema de Unidade de Terapia Intensiva'}
        ]
        
        self.record_types = ['consultation', 'exam', 'procedure', 'prescription', 'diagnosis']
        self.issue_types = ['duplicate', 'missing', 'conflict', 'format', 'sync_error']
        self.priorities = ['high', 'medium', 'low']
        
        self.doctor_names = [
            'Dr. Ana Silva', 'Dr. Carlos Santos', 'Dra. Maria Oliveira', 'Dr. João Pereira',
            'Dra. Fernanda Costa', 'Dr. Ricardo Lima', 'Dra. Patricia Alves', 'Dr. Eduardo Rocha',
            'Dra. Juliana Martins', 'Dr. Roberto Ferreira', 'Dra. Camila Souza', 'Dr. Bruno Dias'
        ]

    def generate_patient(self, patient_index=None):
        """Gera dados de um paciente fictício"""
        gender = random.choice(['M', 'F'])
        
        if gender == 'M':
            first_name = self.fake.first_name_male()
        else:
            first_name = self.fake.first_name_female()
        
        last_name = self.fake.last_name()
        
        # Usar índice para garantir IDs únicos
        if patient_index is not None:
            patient_id = f"PAC{patient_index:05d}"
        else:
            patient_id = f"PAC{random.randint(10000, 99999)}"
        
        return {
            'patient_id': patient_id,
            'name': f"{first_name} {last_name}",
            'cpf': self.fake.cpf(),
            'birth_date': self.fake.date_of_birth(minimum_age=18, maximum_age=90),
            'gender': gender,
            'phone': self.fake.phone_number(),
            'email': self.fake.email(),
            'address': self.fake.address()
        }

    def generate_medical_record(self, patient_id):
        """Gera um registro médico fictício"""
        record_date = self.fake.date_time_between(start_date='-2y', end_date='now')
        record_type = random.choice(self.record_types)
        department = random.choice(self.departments)
        system_source = random.choice([sys['name'] for sys in self.health_systems])
        doctor = random.choice(self.doctor_names)
        
        # Gerar descrição baseada no tipo de registro
        descriptions = {
            'consultation': f"Consulta {department.lower()} - {doctor}",
            'exam': f"Exame {random.choice(['sangue', 'urina', 'raio-x', 'tomografia', 'ressonância'])}",
            'procedure': f"Procedimento {random.choice(['cirúrgico', 'diagnóstico', 'terapêutico'])}",
            'prescription': f"Prescrição médica - {random.choice(['antibiótico', 'analgésico', 'anti-inflamatório'])}",
            'diagnosis': f"Diagnóstico: {random.choice(['hipertensão', 'diabetes', 'pneumonia', 'gastrite'])}"
        }
        
        return {
            'patient_id': patient_id,
            'record_type': record_type,
            'description': descriptions[record_type],
            'doctor_name': doctor,
            'department': department,
            'system_source': system_source,
            'record_date': record_date
        }

    def generate_health_system(self, system_data):
        """Gera dados de um sistema de saúde"""
        status_options = ['online', 'warning', 'offline']
        weights = [0.7, 0.2, 0.1]  # 70% online, 20% warning, 10% offline
        
        status = random.choices(status_options, weights=weights)[0]
        
        # Gerar última sincronização baseada no status
        if status == 'online':
            last_sync = datetime.utcnow() - timedelta(minutes=random.randint(1, 60))
        elif status == 'warning':
            last_sync = datetime.utcnow() - timedelta(hours=random.randint(1, 6))
        else:
            last_sync = datetime.utcnow() - timedelta(days=random.randint(1, 3))
        
        return {
            'name': system_data['name'],
            'system_type': system_data['type'],
            'status': status,
            'last_sync': last_sync,
            'sync_frequency': random.choice([15, 30, 60, 120]),  # minutos
            'description': system_data['description']
        }

    def generate_data_quality_issue(self, patient_id=None, system_id=None):
        """Gera um problema de qualidade de dados"""
        issue_type = random.choice(self.issue_types)
        priority = random.choice(self.priorities)
        
        # Gerar título e descrição baseados no tipo
        issue_templates = {
            'duplicate': {
                'titles': [
                    'Duplicação de Pacientes - Sistema HIS',
                    'Registros duplicados detectados',
                    'Paciente com múltiplos IDs'
                ],
                'descriptions': [
                    'Paciente possui registros duplicados em diferentes sistemas',
                    'Múltiplos IDs encontrados para o mesmo CPF',
                    'Inconsistência entre registros do mesmo paciente'
                ]
            },
            'missing': {
                'titles': [
                    'Campos Obrigatórios Ausentes',
                    'Dados críticos não preenchidos',
                    'Informações incompletas'
                ],
                'descriptions': [
                    'Campos obrigatórios não foram preenchidos no sistema',
                    'Dados críticos ausentes para tomada de decisão',
                    'Informações de contato não disponíveis'
                ]
            },
            'conflict': {
                'titles': [
                    'Conflito de dados entre sistemas',
                    'Inconsistência detectada',
                    'Dados conflitantes'
                ],
                'descriptions': [
                    'Peso registrado com valores diferentes entre sistemas',
                    'Data de nascimento inconsistente',
                    'Informações médicas conflitantes'
                ]
            },
            'format': {
                'titles': [
                    'Inconsistência de Formato',
                    'Formato de dados inválido',
                    'Padronização necessária'
                ],
                'descriptions': [
                    'Diferentes formatos de telefone entre sistemas',
                    'CPF em formato inválido',
                    'Datas em formatos incompatíveis'
                ]
            },
            'sync_error': {
                'titles': [
                    'Falha de Sincronização',
                    'Erro de conectividade',
                    'Sistema não sincronizado'
                ],
                'descriptions': [
                    'Sistema não sincroniza há várias horas',
                    'Falha na conexão com sistema externo',
                    'Timeout na sincronização de dados'
                ]
            }
        }
        
        template = issue_templates[issue_type]
        title = random.choice(template['titles'])
        description = random.choice(template['descriptions'])
        
        # Determinar status (90% aberto, 10% resolvido)
        status = random.choices(['open', 'resolved'], weights=[0.9, 0.1])[0]
        
        detected_at = self.fake.date_time_between(start_date='-30d', end_date='now')
        
        issue_data = {
            'patient_id': patient_id,
            'system_id': system_id or random.randint(1, len(self.health_systems)),
            'issue_type': issue_type,
            'priority': priority,
            'title': title,
            'description': description,
            'status': status,
            'detected_at': detected_at
        }
        
        # Se resolvido, adicionar dados de resolução
        if status == 'resolved':
            resolution_time = random.randint(30, 480)  # 30 min a 8 horas
            issue_data['resolved_at'] = detected_at + timedelta(minutes=resolution_time)
            issue_data['resolution_time'] = resolution_time
        
        return issue_data

    def generate_user(self, role='user'):
        """Gera dados de um usuário do sistema"""
        first_name = self.fake.first_name()
        last_name = self.fake.last_name()
        username = f"{first_name.lower()}.{last_name.lower()}"
        
        return {
            'username': username,
            'email': f"{username}@hospital.com.br",
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'department': random.choice(self.departments),
            'password': 'senha123'  # Senha padrão para o MVP
        }

    def generate_dashboard_metric(self, metric_name, department=None):
        """Gera uma métrica para o dashboard"""
        metric_values = {
            'completeness_rate': random.uniform(70, 95),
            'data_quality_score': random.uniform(75, 90),
            'resolution_time': random.uniform(1, 6),  # horas
            'system_availability': random.uniform(95, 99.9),
            'issues_count': random.randint(5, 50)
        }
        
        return {
            'metric_name': metric_name,
            'metric_value': metric_values.get(metric_name, random.uniform(0, 100)),
            'metric_unit': '%' if 'rate' in metric_name or 'availability' in metric_name else 'count',
            'department': department,
            'calculated_at': datetime.utcnow()
        }

    def generate_complete_dataset(self, num_patients=500, num_records_per_patient=5):
        """Gera um dataset completo para o MVP"""
        print("Gerando dataset completo...")
        
        dataset = {
            'patients': [],
            'medical_records': [],
            'health_systems': [],
            'data_quality_issues': [],
            'users': [],
            'dashboard_metrics': []
        }
        
        # Gerar sistemas de saúde
        print("Gerando sistemas de saúde...")
        for system_data in self.health_systems:
            dataset['health_systems'].append(self.generate_health_system(system_data))
        
        # Gerar usuários
        print("Gerando usuários...")
        # Admin
        admin_user = self.generate_user('admin')
        admin_user['username'] = 'admin'
        admin_user['email'] = 'admin@healthgraph.com'
        dataset['users'].append(admin_user)
        
        # Usuários normais
        for _ in range(10):
            dataset['users'].append(self.generate_user())
        
        # Gerar pacientes e registros médicos
        print(f"Gerando {num_patients} pacientes...")
        for i in range(num_patients):
            if i % 100 == 0:
                print(f"Progresso: {i}/{num_patients} pacientes")
            
            patient = self.generate_patient(patient_index=i+1)  # Usar índice único
            dataset['patients'].append(patient)
            patient_id = i + 1  # ID será auto-incrementado no banco
            
            # Gerar registros médicos para este paciente
            num_records = random.randint(1, num_records_per_patient)
            for _ in range(num_records):
                record = self.generate_medical_record(patient_id)
                dataset['medical_records'].append(record)
            
            # Chance de 30% de ter problemas de qualidade
            if random.random() < 0.3:
                num_issues = random.randint(1, 3)
                for _ in range(num_issues):
                    issue = self.generate_data_quality_issue(
                        patient_id=patient_id,
                        system_id=random.randint(1, len(self.health_systems))
                    )
                    dataset['data_quality_issues'].append(issue)
        
        # Gerar problemas de qualidade não relacionados a pacientes específicos
        print("Gerando problemas de qualidade do sistema...")
        for _ in range(50):
            issue = self.generate_data_quality_issue(
                patient_id=None,
                system_id=random.randint(1, len(self.health_systems))
            )
            dataset['data_quality_issues'].append(issue)
        
        # Gerar métricas do dashboard
        print("Gerando métricas do dashboard...")
        metrics = ['completeness_rate', 'data_quality_score', 'resolution_time', 'system_availability']
        for metric in metrics:
            for dept in self.departments:
                dataset['dashboard_metrics'].append(
                    self.generate_dashboard_metric(metric, dept)
                )
        
        print("Dataset completo gerado!")
        return dataset

if __name__ == "__main__":
    generator = HealthDataGenerator()
    dataset = generator.generate_complete_dataset()
    
    # Salvar em arquivo JSON para inspeção
    with open('/tmp/sample_dataset.json', 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, default=str, ensure_ascii=False)
    
    print("Dataset salvo em /tmp/sample_dataset.json")

