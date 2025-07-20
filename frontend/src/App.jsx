import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Issues from './components/Issues';
import Integrations from './components/Integrations';
import Analytics from './components/Analytics';
import Login from './components/Login';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há um token no localStorage ao carregar a aplicação
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Redirecionar para o dashboard após o login
    window.location.hash = 'dashboard';
  };

  const renderCurrentPage = () => {
    if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'issues':
        return <Issues />;
      case 'integrations':
        return <Integrations />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  // Interceptar cliques nos links de navegação
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentPage(hash);
      }
    };

    // Escutar mudanças no hash
    window.addEventListener('hashchange', handleHashChange);
    
    // Verificar hash inicial
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <Layout currentPage={currentPage}>
          {renderCurrentPage()}
        </Layout>
      ) : (
        renderCurrentPage()
      )}
    </>
  );
}

export default App;
