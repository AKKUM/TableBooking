import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Loader2, XCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Booking {
  id: number;
  user_id: number;
  table_number: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guest_name: string;
  guest_phone: string;
  number_of_people: number;
  special_occasion?: string;
  status: string;
  source: string;
  created_at: string;
}

const AllBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getAllBookings();
      console.log('Bookings response:', response);
      
      // Ensure we have an array of bookings
      if (response.data && Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        console.warn('Unexpected response format:', response);
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      
      // Improved error handling to prevent React from rendering objects
      let errorMessage = 'Failed to load bookings';
      
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = err.response.data.detail
            .map((error: any) => error.msg || 'Validation error')
            .join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setCancellingId(id);
      await bookingAPI.cancelBooking(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      
      // Improved error handling to prevent React from rendering objects
      let errorMessage = 'Failed to cancel booking';
      
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = err.response.data.detail
            .map((error: any) => error.msg || 'Validation error')
            .join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const filteredBookings = bookings.filter(b => {
      // Safety check: ensure all fields are strings or numbers
      if (!b || typeof b !== 'object') return false;
      
      return (
        (b.guest_name && typeof b.guest_name === 'string' && b.guest_name.toLowerCase().includes(q)) ||
        (b.guest_phone && typeof b.guest_phone === 'string' && b.guest_phone.toLowerCase().includes(q)) ||
        (b.table_number && typeof b.table_number === 'string' && b.table_number.toLowerCase().includes(q)) ||
        (b.start_time && typeof b.start_time === 'string' && b.start_time.toLowerCase().includes(q)) ||
        (b.end_time && typeof b.end_time === 'string' && b.end_time.toLowerCase().includes(q)) ||
        (b.special_occasion && typeof b.special_occasion === 'string' && b.special_occasion.toLowerCase().includes(q))
      );
    });
    
    console.log('Filtered bookings:', filteredBookings);
    return filteredBookings;
  }, [bookings, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Title and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">All Bookings</h1>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="Search guest, phone, table, time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm"
            onClick={fetchBookings}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 inline-block mr-2 animate-spin" /> Loading bookings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No bookings found</div>
        ) : (
          filtered.map((b) => {
            if (!b || typeof b !== 'object') return null;
            if (!b.id || !b.guest_name || !b.table_number || !b.booking_date || !b.start_time || !b.end_time) return null;
            
            const dateStr = new Date(b.booking_date).toLocaleDateString();
            return (
              <div key={b.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{String(b.guest_name)}</h3>
                    <p className="text-xs text-gray-500">{String(b.guest_phone || '')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {String(b.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Date:</span> {dateStr}
                  </div>
                  <div>
                    <span className="font-medium">Table:</span> {String(b.table_number)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {String(b.start_time)} - {String(b.end_time)}
                  </div>
                  <div>
                    <span className="font-medium">People:</span> {Number(b.number_of_people)}
                  </div>
                </div>
                
                {b.status === 'confirmed' && (
                  <button
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm disabled:opacity-50"
                    onClick={() => cancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? (
                      <>
                        <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" /> Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 inline-block mr-2" /> Cancel
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          }).filter(Boolean)
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">People</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 inline-block mr-2 animate-spin" /> Loading bookings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">No bookings found</td>
                </tr>
              ) : (
                filtered.map((b) => {
                  if (!b || typeof b !== 'object') return null;
                  if (!b.id || !b.guest_name || !b.table_number || !b.booking_date || !b.start_time || !b.end_time) return null;
                  
                  const dateStr = new Date(b.booking_date).toLocaleDateString();
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{dateStr}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{String(b.table_number)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{String(b.start_time)} - {String(b.end_time)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{String(b.guest_name)} <span className="text-gray-500">({String(b.guest_phone || '')})</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{Number(b.number_of_people)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{String(b.status)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {b.status === 'confirmed' && (
                          <button
                            className="px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm inline-flex items-center"
                            onClick={() => cancelBooking(b.id)}
                            disabled={cancellingId === b.id}
                          >
                            {cancellingId === b.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" /> Cancel
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }).filter(Boolean)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllBookings;

