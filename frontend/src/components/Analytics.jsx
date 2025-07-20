import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Users,
  Activity,
  Target,
  PieChart,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api, formatters } from '../lib/api';

const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [departmentAnalysis, setDepartmentAnalysis] = useState([]);
  const [roiAnalysis, setROIAnalysis] = useState(null);
  const [kpis, setKPIs] = useState(null);
  const [availableReports, setAvailableReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [trendsData, departmentData, roiData, kpisData, reportsData] = await Promise.all([
        api.getTrends(parseInt(selectedPeriod)),
        api.getDepartmentAnalysis(),
        api.getROIAnalysis(),
        api.getKPIs(),
        api.getAvailableReports()
      ]);

      setTrends(trendsData.trends);
      setDepartmentAnalysis(departmentData.departments);
      setROIAnalysis(roiData.roi);
      setKPIs(kpisData.kpis);
      setAvailableReports(reportsData.reports);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportId) => {
    try {
      await api.generateReport(reportId, 'PDF', `${selectedPeriod}_days`);
      // Implementar download do relatório
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend) => {
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics e Relatórios</h1>
          <p className="text-gray-600 mt-1">Insights profundos sobre qualidade e eficiência dos dados</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Geral de Qualidade</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(kpis.overall_quality_score)}`}>
                {kpis.overall_quality_score}%
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(kpis.quality_trend)}
                <span className={`text-xs ml-1 ${getTrendColor(kpis.quality_trend)}`}>
                  {Math.abs(kpis.quality_trend)}% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Gerada</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatters.currency(kpis.cost_savings)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Economia em processos manuais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas Resolvidos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatters.number(kpis.issues_resolved)}
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(kpis.resolution_trend)}
                <span className={`text-xs ml-1 ${getTrendColor(kpis.resolution_trend)}`}>
                  {Math.abs(kpis.resolution_trend)}% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência Operacional</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {kpis.operational_efficiency}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Melhoria na produtividade
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Tendências Temporais</TabsTrigger>
          <TabsTrigger value="departments">Análise Departamental</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Gráfico de Tendências - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2" />
                Evolução da Qualidade dos Dados
              </CardTitle>
              <CardDescription>
                Tendências de completude, consistência e atualidade ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium text-gray-700">Gráfico de Tendências</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Visualização temporal da evolução dos indicadores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Tendência */}
          {trends && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completude de Dados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {trends.completeness.current}%
                      </span>
                      <div className="flex items-center">
                        {getTrendIcon(trends.completeness.trend)}
                        <span className={`text-sm ml-1 ${getTrendColor(trends.completeness.trend)}`}>
                          {Math.abs(trends.completeness.trend)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={trends.completeness.current} />
                    <p className="text-sm text-gray-600">
                      Meta: {trends.completeness.target}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consistência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {trends.consistency.current}%
                      </span>
                      <div className="flex items-center">
                        {getTrendIcon(trends.consistency.trend)}
                        <span className={`text-sm ml-1 ${getTrendColor(trends.consistency.trend)}`}>
                          {Math.abs(trends.consistency.trend)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={trends.consistency.current} />
                    <p className="text-sm text-gray-600">
                      Meta: {trends.consistency.target}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atualidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">
                        {trends.timeliness.current}%
                      </span>
                      <div className="flex items-center">
                        {getTrendIcon(trends.timeliness.trend)}
                        <span className={`text-sm ml-1 ${getTrendColor(trends.timeliness.trend)}`}>
                          {Math.abs(trends.timeliness.trend)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={trends.timeliness.current} />
                    <p className="text-sm text-gray-600">
                      Meta: {trends.timeliness.target}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Análise Comparativa por Departamento
              </CardTitle>
              <CardDescription>
                Benchmarking de qualidade de dados entre departamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {departmentAnalysis.map((dept, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{dept.name}</h3>
                        <p className="text-sm text-gray-500">{dept.total_records} registros</p>
                      </div>
                      <Badge variant={getScoreBadge(dept.overall_score)}>
                        Score: {dept.overall_score}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completude</span>
                          <span className={getScoreColor(dept.completeness)}>
                            {dept.completeness}%
                          </span>
                        </div>
                        <Progress value={dept.completeness} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Consistência</span>
                          <span className={getScoreColor(dept.consistency)}>
                            {dept.consistency}%
                          </span>
                        </div>
                        <Progress value={dept.consistency} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Atualidade</span>
                          <span className={getScoreColor(dept.timeliness)}>
                            {dept.timeliness}%
                          </span>
                        </div>
                        <Progress value={dept.timeliness} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Problemas abertos: {dept.open_issues}</span>
                        <span>Sistemas integrados: {dept.integrated_systems}</span>
                      </div>
                      <div className="flex items-center">
                        {getTrendIcon(dept.trend)}
                        <span className={`text-sm ml-1 ${getTrendColor(dept.trend)}`}>
                          {Math.abs(dept.trend)}% vs mês anterior
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          {roiAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Retorno sobre Investimento
                  </CardTitle>
                  <CardDescription>
                    Análise financeira do impacto da solução
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {roiAnalysis.roi_percentage}%
                      </div>
                      <p className="text-gray-600">ROI em {selectedPeriod} dias</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Investimento Total</span>
                        <span className="font-medium">
                          {formatters.currency(roiAnalysis.total_investment)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Economia Gerada</span>
                        <span className="font-medium text-green-600">
                          {formatters.currency(roiAnalysis.total_savings)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lucro Líquido</span>
                        <span className="font-medium text-green-600">
                          {formatters.currency(roiAnalysis.net_profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fontes de Economia</CardTitle>
                  <CardDescription>
                    Detalhamento das economias por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roiAnalysis.savings_breakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            {formatters.currency(item.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.percentage}% do total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Relatórios Customizáveis
              </CardTitle>
              <CardDescription>
                Gere relatórios detalhados para diferentes necessidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{report.icon}</span>
                        <div>
                          <h3 className="font-medium">{report.title}</h3>
                          <p className="text-sm text-gray-600">{report.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Última geração: {formatters.date(report.last_generated)}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport(report.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Gerar
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

export default Analytics;

