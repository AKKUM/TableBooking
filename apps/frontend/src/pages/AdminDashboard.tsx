import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Layout, Settings, MapPin, BarChart3 } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface DashboardStats {
  total_bookings: number;
  today_bookings: number;
  confirmed_bookings: number;
  total_tables: number;
  today_confirmed_bookings: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useRestaurant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'All Bookings',
      description: 'View and manage all bookings',
      icon: Calendar,
      href: '/bookings',
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      title: 'Table Availability',
      description: 'Book restaurant tables for your customers',
      icon: Layout,
      href: '/',
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Room Layout',
      description: 'Design and manage the restaurant floor plan',
      icon: MapPin,
      href: '/admin/layout',
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'User Management',
      description: 'Manage system users and their permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Restaurant Settings',
      description: 'Update restaurant information and contact details',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.today_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Layout className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tables</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_tables}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                  <card.icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
