import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RoomLayout from './pages/RoomLayout';
import TableManagement from './pages/TableManagement';
import UserManagement from './pages/UserManagement';
import RestaurantSettings from './pages/RestaurantSettings';
import AllBookings from './pages/AllBookings';

function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              {/* Redirect /dashboard to /admin for administrators */}
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              {/* Redirect /my-bookings to / for normal users */}
              <Route path="/my-bookings" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/bookings" element={<Layout><AllBookings /></Layout>} />
              <Route path="/admin/layout" element={<Layout><RoomLayout /></Layout>} />
              <Route path="/admin/tables" element={<Layout><TableManagement /></Layout>} />
              <Route path="/admin/users" element={<Layout><UserManagement /></Layout>} />
              <Route path="/admin/settings" element={<Layout><RestaurantSettings /></Layout>} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App;
