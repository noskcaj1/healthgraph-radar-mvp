import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  Database,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, formatters } from '../lib/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [systemsStatus, setSystemsStatus] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, alertsData, systemsData, actionsData] = await Promise.all([
        api.getDashboardMetrics(),
        api.getPriorityAlerts(),
        api.getSystemsStatus(),
        api.getQuickActions()
      ]);

      setMetrics(metricsData.metrics);
      setAlerts(alertsData.alerts);
      setSystemsStatus(systemsData.systems);
      setQuickActions(actionsData.actions);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Radar de Saúde</h1>
          <p className="text-gray-600 mt-1">Visão geral da qualidade dos dados em tempo real</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Completude</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.completeness_rate?.toFixed(1)}%
            </div>
            <Progress value={metrics?.completeness_rate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.completeness_rate > 75 ? '+2.1% desde ontem' : 'Precisa melhorar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicidades Detectadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatters.number(metrics?.duplicates_detected || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingDown className="inline w-3 h-3 mr-1 text-green-600" />
              -12% desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campos Críticos Ausentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatters.number(metrics?.missing_critical_fields || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="inline w-3 h-3 mr-1 text-red-600" />
              +5% desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistemas Não Sincronizados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatters.number(metrics?.unsynchronized_systems || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.unsynchronized_systems === 0 ? (
                <span className="text-green-600">Todos sincronizados</span>
              ) : (
                'Requer atenção'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertas Prioritários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Alertas Prioritários
            </CardTitle>
            <CardDescription>
              Problemas críticos que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhum alerta crítico no momento</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Badge variant={getAlertColor(alert.type)} className="mt-1">
                      {alert.type === 'critical' ? 'Crítico' : 'Aviso'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500 truncate">{alert.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.system_name} • {formatters.timeAgo(alert.detected_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Sistemas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Status dos Sistemas
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real das integrações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemsStatus.slice(0, 6).map((system, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{system.name}</p>
                      <p className="text-xs text-gray-500">{system.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {system.time_since_sync_minutes ? 
                        `${system.time_since_sync_minutes} min atrás` : 
                        'Nunca sincronizado'
                      }
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {system.status === 'online' ? 'Online' : 
                       system.status === 'warning' ? 'Aviso' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Resolva problemas comuns com um clique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                      <Badge 
                        variant={getPriorityColor(action.priority)} 
                        className="mt-2"
                      >
                        {action.priority === 'high' ? 'Alta Prioridade' : 
                         action.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapa de Calor Institucional - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            Mapa de Calor Institucional
          </CardTitle>
          <CardDescription>
            Visualização dos sistemas e suas interconexões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-700">Mapa de Calor Interativo</p>
              <p className="text-sm text-gray-500 mt-2">
                Visualização em tempo real da saúde dos sistemas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

