import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginScreen from './screens/LoginScreen';
import AdminLayout from './components/AdminLayout';
import DashboardScreen from './screens/DashboardScreen';
import UsersScreen from './screens/UsersScreen';
import MessesScreen from './screens/MessesScreen';
import MessDetailScreen from './screens/MessDetailScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardScreen />} />
          <Route path="users" element={<UsersScreen />} />
          <Route path="messes" element={<MessesScreen />} />
          <Route path="messes/:id" element={<MessDetailScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
