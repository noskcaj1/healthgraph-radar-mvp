/**
 * Biblioteca para comunicação com a API do HealthGraph Radar
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, limpar e redirecionar para login
          this.setToken(null);
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Métodos do Dashboard
  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  async getPriorityAlerts() {
    return this.request('/dashboard/alerts');
  }

  async getSystemsStatus() {
    return this.request('/dashboard/systems-status');
  }

  async getQuickActions() {
    return this.request('/dashboard/quick-actions');
  }

  async getHeatmapData() {
    return this.request('/dashboard/heatmap-data');
  }

  async getTrendsData() {
    return this.request('/dashboard/trends');
  }

  // Métodos de Pacientes
  async getPatients(page = 1, perPage = 20, search = '') {
    const params = new URLSearchParams({ page, per_page: perPage, search });
    return this.request(`/patients?${params}`);
  }

  async getPatientDetails(patientId) {
    return this.request(`/patients/${patientId}`);
  }

  async getPatientTimeline(patientId) {
    return this.request(`/patients/${patientId}/timeline`);
  }

  async getPatientRecommendations(patientId) {
    return this.request(`/patients/${patientId}/recommendations`);
  }

  async searchPatients(query, department = '', hasIssues = false) {
    const params = new URLSearchParams({ q: query, department, has_issues: hasIssues });
    return this.request(`/patients/search?${params}`);
  }

  // Métodos de Problemas de Qualidade
  async getIssues(page = 1, perPage = 20, status = 'open', priority = '', type = '') {
    const params = new URLSearchParams({ page, per_page: perPage, status, priority, type });
    return this.request(`/issues?${params}`);
  }

  async getIssueDetails(issueId) {
    return this.request(`/issues/${issueId}`);
  }

  async resolveIssue(issueId, resolutionNotes = '') {
    return this.request(`/issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: resolutionNotes }),
    });
  }

  async getIssuesMetrics() {
    return this.request('/issues/metrics');
  }

  async getResolutionWizards() {
    return this.request('/issues/wizards');
  }

  async getResolutionHistory(page = 1, perPage = 10) {
    const params = new URLSearchParams({ page, per_page: perPage });
    return this.request(`/issues/history?${params}`);
  }

  // Métodos de Integrações
  async getSystems() {
    return this.request('/integrations/systems');
  }

  async getSystemDetails(systemId) {
    return this.request(`/integrations/systems/${systemId}`);
  }

  async testSystemConnection(systemId) {
    return this.request(`/integrations/systems/${systemId}/test`, {
      method: 'POST',
    });
  }

  async forceSystemSync(systemId) {
    return this.request(`/integrations/systems/${systemId}/sync`, {
      method: 'POST',
    });
  }

  async getIntegrationsOverview() {
    return this.request('/integrations/overview');
  }

  async getSyncLogs(hours = 24, systemId = null) {
    const params = new URLSearchParams({ hours });
    if (systemId) params.append('system_id', systemId);
    return this.request(`/integrations/logs?${params}`);
  }

  async getFieldMappings() {
    return this.request('/integrations/mapping');
  }

  // Métodos de Analytics
  async getTrends(days = 30) {
    const params = new URLSearchParams({ days });
    return this.request(`/analytics/trends?${params}`);
  }

  async getDepartmentAnalysis() {
    return this.request('/analytics/departments');
  }

  async getROIAnalysis() {
    return this.request('/analytics/roi');
  }

  async getAvailableReports() {
    return this.request('/analytics/reports');
  }

  async generateReport(reportId, format = 'PDF', dateRange = '30_days') {
    return this.request(`/analytics/reports/${reportId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ format, date_range: dateRange }),
    });
  }

  async getKPIs() {
    return this.request('/analytics/kpis');
  }

  async getDataQualityCharts(type = 'completeness') {
    const params = new URLSearchParams({ type });
    return this.request(`/analytics/charts/data-quality?${params}`);
  }
}

// Instância singleton da API
export const api = new ApiClient();

// Utilitários para formatação
export const formatters = {
  currency: (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  percentage: (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  },

  number: (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  },

  date: (dateString) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  },

  datetime: (dateString) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  },

  timeAgo: (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  },
};

export default api;

