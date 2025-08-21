import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '../services/api';

interface RestaurantSettings {
  id: number;
  restaurant_name: string;
  address: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface RestaurantContextType {
  settings: RestaurantSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getRestaurantSettings();
      setSettings(response);
    } catch (err: any) {
      console.error('Error fetching restaurant settings:', err);
      setError(err.response?.data?.detail || 'Failed to load restaurant settings');
      // Set default values if API fails
      setSettings({
        id: 0,
        restaurant_name: 'Restaurant Name',
        address: '123 Main Street, City, State 12345',
        phone: '(555) 123-4567',
        email: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value: RestaurantContextType = {
    settings,
    loading,
    error,
    refreshSettings
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
