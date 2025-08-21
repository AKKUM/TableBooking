import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: '/api/v1/auth/token',
  register: '/api/v1/auth/register',
  me: '/api/v1/auth/me',
  
  // Bookings
  tableAvailability: '/api/v1/bookings/tables',
  timeSlotsPublic: '/api/v1/bookings/time-slots',
  createBooking: '/api/v1/bookings/',
  allBookings: '/api/v1/bookings/all',
  myBookings: '/api/v1/bookings/my-bookings',
  getBooking: (id: number) => `/api/v1/bookings/${id}`,
  updateBooking: (id: number) => `/api/v1/bookings/${id}`,
  cancelBooking: (id: number) => `/api/v1/bookings/${id}`,
  deleteYesterdayBookings: '/api/v1/bookings/yesterday',
  
  // Admin
  adminTables: '/api/v1/admin/tables',
  adminTable: (id: number) => `/api/v1/admin/tables/${id}`,
  adminLayouts: '/api/v1/admin/layouts',
  adminLayout: (id: number) => `/api/v1/admin/layouts/${id}`,
  adminTimeSlots: '/api/v1/admin/time-slots',
  adminOperatingHours: '/api/v1/admin/operating-hours',
  adminOperatingHour: (day: number) => `/api/v1/admin/operating-hours/${day}`,
  adminDashboardStats: '/api/v1/admin/dashboard/stats',
  adminBookingReport: '/api/v1/admin/reports/bookings',
  adminUserStats: '/api/v1/admin/users/stats',
};

// API functions
export const authAPI = {
  login: (username: string, password: string) => {
    // Send as URL-encoded form data (not FormData)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post(endpoints.login, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  register: (userData: any) => api.post(endpoints.register, userData),
  
  getMe: () => api.get(endpoints.me),
};

// Real API service for bookings
export const bookingAPI = {
  getAllBookings: () => api.get(endpoints.allBookings),
  getTableAvailability: async (date: string, timeSlot: string) => {
    return api.get(endpoints.tableAvailability, {
      params: { target_date: date, time_slot: timeSlot }
    });
  },
  getPublicTimeSlots: () => api.get(endpoints.timeSlotsPublic),
  
  createBooking: async (bookingData: any) => {
    return api.post(endpoints.createBooking, bookingData);
  },

  getMyBookings: () => api.get(endpoints.myBookings),
  
  getBooking: (id: number) => api.get(endpoints.getBooking(id)),
  
  updateBooking: (id: number, bookingData: any) => 
    api.put(endpoints.updateBooking(id), bookingData),
  
  cancelBooking: (id: number) => api.delete(endpoints.cancelBooking(id)),


};

// Admin API
export const adminAPI = {
  // Table Management
  createTable: async (tableData: any) => {
    const response = await api.post('/api/v1/admin/tables', tableData);
    return response.data;
  },
  
  getTables: async () => {
    const response = await api.get('/api/v1/admin/tables');
    return response.data;
  },
  
  updateTable: async (tableId: number, tableData: any) => {
    const response = await api.put(`/api/v1/admin/tables/${tableId}`, tableData);
    return response.data;
  },
  
  deleteTable: async (tableId: number) => {
    const response = await api.delete(`/api/v1/admin/tables/${tableId}`);
    return response.data;
  },
  // delete all the booking before today
  deleteYesterdayBookings: async () => {
    const response = await api.delete(endpoints.deleteYesterdayBookings);
    return response.data;
  },
  //delete all tables
  deleteAllTables: async () => {
    const response = await api.delete('/api/v1/admin/tables/all');
    return response.data;
  },
  // delete layout
  deleteLayout: async (layoutId: number) => {
    const response = await api.delete(`/api/v1/admin/layouts/${layoutId}`);
    return response.data;
  },
  // update layout
  updateLayout: async (layoutId: number, layoutData: any) => {
    const response = await api.put(`/api/v1/admin/layouts/${layoutId}`, layoutData);
    return response.data;
  },

  // Room Layout Management
  createLayout: async (layoutData: any) => {
    const response = await api.post('/api/v1/admin/layouts', layoutData);
    return response.data;
  },
  
  getLayouts: async () => {
    const response = await api.get('/api/v1/admin/layouts');
    return response.data;
  },
  
  getActiveLayout: async () => {
    const response = await api.get('/api/v1/admin/layouts/active');
    return response.data;
  },

  // Time Slot Management
  getTimeSlots: async () => {
    const response = await api.get('/api/v1/admin/time-slots');
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/api/v1/admin/dashboard/stats');
    return response.data;
  },

  // Restaurant Settings
  getRestaurantSettings: async () => {
    const response = await api.get('/api/v1/admin/restaurant-settings');
    return response.data;
  },
  
  updateRestaurantSettings: async (settingsData: any) => {
    const response = await api.put('/api/v1/admin/restaurant-settings', settingsData);
    return response.data;
  },

  // User Management
  getUsers: async () => {
    const response = await api.get('/api/v1/admin/users');
    return response.data;
  },
  
  createUser: async (userData: any) => {
    const response = await api.post('/api/v1/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/api/v1/admin/users/${userId}`, userData);
    return response.data;
  },
  
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/v1/admin/users/${userId}`);
    return response.data;
  },
  
  toggleUserStatus: async (userId: number) => {
    const response = await api.put(`/api/v1/admin/users/${userId}/toggle-status`);
    return response.data;
  }
};
