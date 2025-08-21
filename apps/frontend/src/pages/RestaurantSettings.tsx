import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Building, MapPin, Phone, Mail, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface RestaurantSettingsForm {
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
}

const RestaurantSettings: React.FC = () => {
  const { user } = useAuth();
  const { settings, refreshSettings } = useRestaurant();
  const [formData, setFormData] = useState<RestaurantSettingsForm>({
    restaurant_name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        restaurant_name: settings.restaurant_name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || ''
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurant_name || !formData.address) {
      toast.error('Restaurant name and address are required');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.updateRestaurantSettings(formData);
      await refreshSettings();
      toast.success('Restaurant settings updated successfully');
    } catch (error: any) {
      console.error('Error updating restaurant settings:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update restaurant settings';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RestaurantSettingsForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading restaurant settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Restaurant Settings</h1>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline h-4 w-4 mr-2" />
              Restaurant Name *
            </label>
            <input
              type="text"
              id="restaurant_name"
              value={formData.restaurant_name}
              onChange={(e) => handleInputChange('restaurant_name', e.target.value)}
              className="input w-full"
              placeholder="Enter restaurant name"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Address *
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Enter full address"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input w-full"
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-2" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="input w-full"
              placeholder="Enter email address"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-primary-600 mb-2">
              {formData.restaurant_name || 'Restaurant Name'}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {formData.address || '123 Main Street, City, State 12345'}
            </p>
            {formData.phone && (
              <p className="text-sm text-gray-600 mb-2">
                Phone: {formData.phone}
              </p>
            )}
            {formData.email && (
              <p className="text-sm text-gray-600">
                Email: {formData.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
