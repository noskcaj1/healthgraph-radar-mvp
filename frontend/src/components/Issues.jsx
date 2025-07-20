import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Search,
  Zap,
  TrendingUp,
  BarChart3,
  History,
  Play,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, formatters } from '../lib/api';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [wizards, setWizards] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'open',
    priority: '',
    type: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadIssuesData();
  }, [filters, currentPage]);

  const loadIssuesData = async () => {
    try {
      setLoading(true);
      const [issuesData, metricsData, wizardsData, historyData] = await Promise.all([
        api.getIssues(currentPage, 20, filters.status, filters.priority, filters.type),
        api.getIssuesMetrics(),
        api.getResolutionWizards(),
        api.getResolutionHistory(1, 10)
      ]);

      setIssues(issuesData.issues);
      setPagination(issuesData.pagination);
      setMetrics(metricsData.metrics);
      setWizards(wizardsData.wizards);
      setHistory(historyData.history);
    } catch (error) {
      console.error('Erro ao carregar dados dos problemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      await api.resolveIssue(issueId, 'Resolvido via interface');
      loadIssuesData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao resolver problema:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'duplicate': return '🔧';
      case 'missing': return '📝';
      case 'conflict': return '⚠️';
      case 'format': return '🔍';
      case 'sync_error': return '🔄';
      default: return '❓';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'duplicate': return 'Duplicação';
      case 'missing': return 'Dados Ausentes';
      case 'conflict': return 'Conflito';
      case 'format': return 'Formato';
      case 'sync_error': return 'Sincronização';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'default';
      case 'medium': return 'secondary';
      case 'hard': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-pulse" />
          <p className="text-lg text-gray-600">Carregando centro de resolução...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Resolução de Problemas</h1>
          <p className="text-gray-600 mt-1">Gestão inteligente de problemas de qualidade de dados</p>
        </div>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas Abertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatters.number(metrics.total_open_issues)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Requer atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos Este Mês</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatters.number(metrics.resolved_this_month)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <TrendingUp className="inline w-3 h-3 mr-1 text-green-600" />
                +15% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.average_resolution_time_hours}h
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Melhorou 20% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.resolution_rate_percentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Meta: 95%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="issues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="issues">Fila de Problemas</TabsTrigger>
          <TabsTrigger value="wizards">Wizards de Resolução</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar problemas..."
                    className="w-full"
                  />
                </div>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abertos</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="duplicate">Duplicação</SelectItem>
                    <SelectItem value="missing">Dados Ausentes</SelectItem>
                    <SelectItem value="conflict">Conflito</SelectItem>
                    <SelectItem value="format">Formato</SelectItem>
                    <SelectItem value="sync_error">Sincronização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Problemas */}
          <Card>
            <CardHeader>
              <CardTitle>Problemas Priorizados</CardTitle>
              <CardDescription>
                Ordenados por impacto e urgência
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg">{getTypeIcon(issue.issue_type)}</span>
                          <Badge variant={getPriorityColor(issue.priority)}>
                            {issue.priority === 'high' ? 'Alta' : 
                             issue.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(issue.issue_type)}
                          </Badge>
                          {issue.time_since_detection && (
                            <span className="text-xs text-gray-500">
                              {issue.time_since_detection}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {issue.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{issue.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Sistema: {issue.system_name}</span>
                          {issue.patient_name && (
                            <span>Paciente: {issue.patient_name}</span>
                          )}
                          <span>Tempo estimado: {issue.estimated_resolution}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleResolveIssue(issue.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {pagination && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {pagination.total} problemas encontrados
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
        </TabsContent>

        <TabsContent value="wizards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Wizards de Resolução
              </CardTitle>
              <CardDescription>
                Guias passo-a-passo para resolver problemas comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wizards.map((wizard) => (
                  <div key={wizard.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <span className="text-3xl">{wizard.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {wizard.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{wizard.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Badge variant={getDifficultyColor(wizard.difficulty)}>
                              {wizard.difficulty === 'easy' ? 'Fácil' : 
                               wizard.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </Badge>
                            <span className="text-sm text-gray-500">{wizard.estimated_time}</span>
                          </div>
                          <Button size="sm">
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Histórico de Resoluções
              </CardTitle>
              <CardDescription>
                Base de conhecimento de problemas resolvidos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {history.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <Badge variant="outline">
                            {getTypeLabel(item.issue_type)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatters.datetime(item.resolved_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Sistema: {item.system_name}</span>
                          <span>Tempo de resolução: {item.resolution_time_display}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Issues;

