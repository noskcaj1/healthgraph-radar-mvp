import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Zap,
  FileText,
  Clock,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, formatters } from '../lib/api';

const Integrations = () => {
  const [systems, setSystems] = useState([]);
  const [overview, setOverview] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [fieldMappings, setFieldMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingSystem, setTestingSystem] = useState(null);

  useEffect(() => {
    loadIntegrationsData();
  }, []);

  const loadIntegrationsData = async () => {
    try {
      setLoading(true);
      const [systemsData, overviewData, logsData, mappingsData] = await Promise.all([
        api.getSystems(),
        api.getIntegrationsOverview(),
        api.getSyncLogs(24),
        api.getFieldMappings()
      ]);

      setSystems(systemsData.systems);
      setOverview(overviewData.overview);
      setSyncLogs(logsData.logs);
      setFieldMappings(mappingsData.mappings);
    } catch (error) {
      console.error('Erro ao carregar dados das integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (systemId) => {
    try {
      setTestingSystem(systemId);
      await api.testSystemConnection(systemId);
      loadIntegrationsData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
    } finally {
      setTestingSystem(null);
    }
  };

  const handleForceSync = async (systemId) => {
    try {
      await api.forceSystemSync(systemId);
      loadIntegrationsData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao forçar sincronização:', error);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'offline': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online': return 'default';
      case 'warning': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'outline';
    }
  };

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg text-gray-600">Carregando integrações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de Integrações</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de conexões com sistemas externos</p>
        </div>
        <Button onClick={loadIntegrationsData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistemas Online</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overview.systems_online}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                de {overview.total_systems} sistemas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistemas com Aviso</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {overview.systems_warning}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Requer atenção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistemas Offline</CardTitle>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overview.systems_offline}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Sem conexão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overview.last_sync_minutes}min
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                atrás
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="systems">Status dos Sistemas</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
          <TabsTrigger value="mappings">Mapeamento de Campos</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systems.map((system) => (
              <Card key={system.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(system.status)}
                      <div>
                        <CardTitle className="text-lg">{system.name}</CardTitle>
                        <CardDescription>{system.type}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusBadge(system.status)}>
                      {system.status === 'online' ? 'Online' : 
                       system.status === 'warning' ? 'Aviso' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Informações do Sistema */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Última Sincronização:</span>
                        <p className="font-medium">
                          {system.last_sync ? 
                            formatters.timeAgo(system.last_sync) : 
                            'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Frequência:</span>
                        <p className="font-medium">A cada {system.sync_frequency} min</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registros Sincronizados:</span>
                        <p className="font-medium">{formatters.number(system.records_synced || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Última Atividade:</span>
                        <p className="font-medium">
                          {system.last_activity ? 
                            formatters.timeAgo(system.last_activity) : 
                            'Sem atividade'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Descrição */}
                    {system.description && (
                      <div>
                        <span className="text-sm text-gray-500">Descrição:</span>
                        <p className="text-sm mt-1">{system.description}</p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(system.id)}
                        disabled={testingSystem === system.id}
                      >
                        {testingSystem === system.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Testar Conexão
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleForceSync(system.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Forçar Sync
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Logs de Sincronização (Últimas 24h)
              </CardTitle>
              <CardDescription>
                Histórico detalhado de atividades de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y">
                  {syncLogs.map((log, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        {getLogTypeIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {log.system_name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatters.datetime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{log.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Operação: {log.operation}</span>
                            {log.records_processed && (
                              <span>Registros: {formatters.number(log.records_processed)}</span>
                            )}
                            {log.duration_seconds && (
                              <span>Duração: {log.duration_seconds}s</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Configurações de Mapeamento
              </CardTitle>
              <CardDescription>
                Mapeamento de campos entre sistemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{mapping.system_name}</h3>
                      <Badge variant="outline">{mapping.field_count} campos</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Campo Origem</h4>
                        <div className="space-y-2">
                          {mapping.field_mappings.slice(0, 3).map((field, fieldIndex) => (
                            <div key={fieldIndex} className="p-2 bg-gray-50 rounded text-sm">
                              {field.source_field}
                            </div>
                          ))}
                          {mapping.field_mappings.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{mapping.field_mappings.length - 3} campos adicionais
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Campo Destino</h4>
                        <div className="space-y-2">
                          {mapping.field_mappings.slice(0, 3).map((field, fieldIndex) => (
                            <div key={fieldIndex} className="p-2 bg-blue-50 rounded text-sm">
                              {field.target_field}
                            </div>
                          ))}
                          {mapping.field_mappings.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{mapping.field_mappings.length - 3} campos adicionais
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Última atualização: {formatters.datetime(mapping.last_updated)}
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Editar Mapeamento
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

export default Integrations;

