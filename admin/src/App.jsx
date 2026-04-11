import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginScreen from './screens/LoginScreen';
import AdminLayout from './components/AdminLayout';
import DashboardScreen from './screens/DashboardScreen';
import UsersScreen from './screens/UsersScreen';
import MessesScreen from './screens/MessesScreen';
import MessDetailScreen from './screens/MessDetailScreen';
import OrdersScreen from './screens/OrdersScreen';
import ConfigScreen from './screens/ConfigScreen';
import SubscriptionsScreen from './screens/SubscriptionsScreen';
import FAQsScreen from './screens/FAQsScreen';
import ChargesScreen from './screens/ChargesScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardScreen />} />
          <Route path="users" element={<UsersScreen />} />
          <Route path="orders" element={<OrdersScreen />} />
          <Route path="subscriptions" element={<SubscriptionsScreen />} />
          <Route path="messes" element={<MessesScreen />} />
          <Route path="messes/:id" element={<MessDetailScreen />} />
          <Route path="faqs" element={<FAQsScreen />} />
          <Route path="charges" element={<ChargesScreen />} />
          <Route path="config" element={<ConfigScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
