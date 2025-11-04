import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './components/logic/homepage';
import Dashboard from './components/logic/Dashboard';
import BusinessDashboard from './components/logic/BusinessDashboard';
import Login from './components/logic/Login';
import PredictForm from '../PredictForm'
import Recent from './components/logic/Recent'
const RouteTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const routeToTitle = {
      '/': 'IntelliSecure - Home',
      '/login': 'IntelliSecure - Login',
      '/dashboard': 'IntelliSecure - Dashboard',
      '/business-dashboard': 'IntelliSecure - Business Dashboard',
      '/send-money': 'IntelliSecure - Send Money',
      '/transactions': 'IntelliSecure - Transactions',
      '/statements': 'IntelliSecure - Statements',
      '/beneficiaries': 'IntelliSecure - Beneficiaries',
      '/predict': 'IntelliSecure - Predict',
      '/help-support': 'IntelliSecure - Help & Support',
    };

    const title = routeToTitle[location.pathname] || 'IntelliSecure';
    document.title = title;
  }, [location]);

  return null; // This component does not render anything
};

const App = () => {
  return (
    <Router>
      <RouteTitleUpdater />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/business-dashboard" element={<BusinessDashboard />} />
        <Route path="/send-money" element={<Homepage />} />
        <Route path="/transactions" element={<Recent />} />
        <Route path="/statements" element={<Dashboard />} />
        <Route path="/beneficiaries" element={<Dashboard />} />
        <Route path="/predict" element={<PredictForm />} />
        <Route path="/help-support" element={<Dashboard />} />
      </Routes>
    </Router>
    
  );
};

export default App;
