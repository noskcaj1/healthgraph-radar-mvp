import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { api, formatters } from '../lib/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadPatients();
  }, [currentPage, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients(currentPage, 20, searchTerm);
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    try {
      const [details, timelineData, recommendationsData] = await Promise.all([
        api.getPatientDetails(patientId),
        api.getPatientTimeline(patientId),
        api.getPatientRecommendations(patientId)
      ]);

      setPatientDetails(details);
      setTimeline(timelineData.timeline);
      setRecommendations(recommendationsData.recommendations);
      setSelectedPatient(patientId);
    } catch (error) {
      console.error('Erro ao carregar detalhes do paciente:', error);
    }
  };

  const getQualityColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (percentage) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    return 'destructive';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'medical_record': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'quality_issue': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading && !patients.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg text-gray-600">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Pacientes</h1>
          <p className="text-gray-600 mt-1">Visão 360° unificada dos dados dos pacientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Pacientes
              </CardTitle>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPatient === patient.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => loadPatientDetails(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant={getQualityBadge(patient.completeness_percentage)}>
                            {patient.completeness_percentage}% completo
                          </Badge>
                          {patient.quality_issues > 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              {patient.quality_issues} problemas
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Paginação */}
              {pagination && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {pagination.total} pacientes encontrados
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.has_prev}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.has_next}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Paciente */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500">Selecione um paciente para ver os detalhes</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Informações do Paciente */}
              {patientDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{patientDetails.patient.name}</span>
                      <Badge variant="outline">ID: {patientDetails.patient.patient_id}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {patientDetails.patient.gender === 'M' ? 'Masculino' : 'Feminino'} • 
                      Nascimento: {formatters.date(patientDetails.patient.birth_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Indicadores de Qualidade */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Qualidade dos Dados</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Completude</span>
                              <span className={getQualityColor(patientDetails.quality_indicators.completeness)}>
                                {patientDetails.quality_indicators.completeness}%
                              </span>
                            </div>
                            <Progress value={patientDetails.quality_indicators.completeness} />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Consistência</span>
                              <span className={getQualityColor(patientDetails.quality_indicators.consistency)}>
                                {patientDetails.quality_indicators.consistency}%
                              </span>
                            </div>
                            <Progress value={patientDetails.quality_indicators.consistency} />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Atualidade</span>
                              <span className={getQualityColor(patientDetails.quality_indicators.data_freshness)}>
                                {patientDetails.quality_indicators.data_freshness}%
                              </span>
                            </div>
                            <Progress value={patientDetails.quality_indicators.data_freshness} />
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Estatísticas</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total de registros</span>
                            <span className="text-sm font-medium">{patientDetails.quality_indicators.total_records}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Problemas abertos</span>
                            <span className="text-sm font-medium text-red-600">{patientDetails.quality_indicators.open_issues}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sistemas com dados</span>
                            <span className="text-sm font-medium">{patientDetails.data_fragments.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fragmentação de Dados */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Fragmentação</h4>
                        <div className="space-y-2">
                          {patientDetails.data_fragments.map((system, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-sm text-gray-600">{system}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Timeline do Paciente
                  </CardTitle>
                  <CardDescription>
                    Histórico completo de registros e eventos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-4">
                      {timeline.slice(0, 10).map((event, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.description}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatters.datetime(event.date)}
                              </span>
                              {event.system_source && (
                                <Badge variant="outline" className="text-xs">
                                  {event.system_source}
                                </Badge>
                              )}
                              {event.priority && (
                                <Badge variant={getPriorityColor(event.priority)} className="text-xs">
                                  {event.priority === 'high' ? 'Alta' : 
                                   event.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Ações Recomendadas
                    </CardTitle>
                    <CardDescription>
                      Sugestões para melhorar a qualidade dos dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant={getPriorityColor(rec.priority)}>
                                  {rec.priority === 'high' ? 'Alta Prioridade' : 
                                   rec.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                                </Badge>
                                <span className="text-xs text-gray-500">{rec.estimated_time}</span>
                              </div>
                              <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Sistema: {rec.system_involved}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;

