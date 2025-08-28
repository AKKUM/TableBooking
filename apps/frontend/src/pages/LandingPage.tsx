import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, LogIn, LogOut, ChevronDown, Settings, Clock, MapPin, Phone, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { bookingAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import BookingModal from '../components/BookingModal';
import BookingDetailsModal from '../components/BookingDetailsModal';

interface TableAvailability {
  table_number: string;
  name: string;
  seats: number;
  table_type: string;
  is_available: boolean;
  booked_slots: Array<{
    booking_id: number;
    start_time: string;
    end_time: string;
    guest_name: string;
    guest_phone: string;
    number_of_people: number;
    special_occasion: string;
  }>;
}

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useRestaurant();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00-19:00');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [tableAvailability, setTableAvailability] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTimeSlots = useCallback(async () => {
    try {
      setLoading(true);

      const response = await bookingAPI.getPublicTimeSlots();
      const fetchedSlots = response.data.map((slot: any) => `${slot.start_time}-${slot.end_time}`);
      setAvailableTimeSlots(fetchedSlots);

      // Auto-select current or next available time slot
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      let foundSlot = null;
      for (const slot of fetchedSlots) {
        const [start, end] = slot.split('-');
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        // Check if current time is within this slot
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          foundSlot = slot;
          break;
        }
      }

      if (!foundSlot) {
        // If no current slot, find the next upcoming slot
        for (const slot of fetchedSlots) {
          const [start] = slot.split('-');
          const [startHour, startMinute] = start.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          if (startTimeInMinutes > currentTimeInMinutes) {
            foundSlot = slot;
            break;
          }
        }
      }

      setSelectedTimeSlot(foundSlot || fetchedSlots[0] || '18:00-19:00'); // Fallback to first or default
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Failed to load time slots.');
      // Fallback to a default list if API fails
      const defaultTimeSlots = [
        '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
        '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
        '20:00-21:00', '21:00-22:00'
      ];
      setAvailableTimeSlots(defaultTimeSlots);
      // Apply auto-selection logic to default slots as well
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      let foundSlot = null;
      for (const slot of defaultTimeSlots) {
        const [start, end] = slot.split('-');
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          foundSlot = slot;
          break;
        }
      }
      if (!foundSlot) {
        for (const slot of defaultTimeSlots) {
          const [start] = slot.split('-');
          const [startHour, startMinute] = start.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          if (startTimeInMinutes > currentTimeInMinutes) {
            foundSlot = slot;
            break;
          }
        }
      }
      setSelectedTimeSlot(foundSlot || defaultTimeSlots[0] || '18:00-19:00');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTableAvailability = useCallback(async () => {
    try {
      setLoading(true);

      const response = await bookingAPI.getTableAvailability(selectedDate, selectedTimeSlot);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // The API returns {tables: [...]} structure
      const data = response.data;
      if (data && Array.isArray(data.tables)) {
        console.log('Setting tableAvailability from data.tables:', data.tables);
        setTableAvailability(data.tables);
      } else if (Array.isArray(data)) {
        // Fallback: if it's directly an array
        console.log('Setting tableAvailability from data (direct array):', data);
        setTableAvailability(data);
      } else {
        console.warn('Unexpected API response structure:', data);
        setTableAvailability([]);
      }
    } catch (error) {
      console.error('Error fetching table availability:', error);
      toast.error('Failed to load table availability');
      setTableAvailability([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedTimeSlot]);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);

  // Fetch time slots from database
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Fetch table availability when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      fetchTableAvailability();
    }
  }, [selectedDate, selectedTimeSlot, fetchTableAvailability]);

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    setShowBookingModal(true);
  };

  const handleBookedTableClick = (table: any, bookingSlot: any) => {
    setSelectedTable(table);
    setSelectedBookingSlot(bookingSlot);
    setShowBookingDetailsModal(true);
  };

  const handleBookingCancelled = () => {
    setShowBookingDetailsModal(false);
    fetchTableAvailability(); // Refresh availability
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading if user is not authenticated yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left - Logo */}
            <div className="flex items-center">
              <Link 
                to={user?.role === 'admin' ? '/admin' : '/'} 
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Calendar className="h-8 w-8" />
                <span className="text-xl font-bold">TableBook</span>
              </Link>
            </div>

            {/* Center - Restaurant Info */}
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                {settings ? (
                  <>
                    <h1 className="text-lg font-semibold text-primary-600">
                      {settings.restaurant_name}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {settings.address}
                      {settings.phone && ` • Phone: ${settings.phone}`}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-lg font-semibold text-primary-600">
                      Restaurant Name
                    </h1>
                    <p className="text-sm text-gray-600">
                      123 Main Street, City, State 12345 • Phone: (555) 123-4567
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right - User Menu */}
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600  rounded-md hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              )}
              {user?.role === 'system_user' && (
                <Link
                  to="/bookings"
                                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600  rounded-md hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  All Bookings
                </Link>
              )}
              {user ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-md hover:bg-gray-100"
                  >
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium">{user.full_name || user.username}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm">Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Table Availability</h1>
          <p className="text-base sm:text-lg text-gray-600">Check table availability and manage reservations</p>
        </div>

        {/* Date and Time Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full sm:w-auto border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              >
                {availableTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedDate && selectedTimeSlot && (
            <div className="text-center mt-4 text-gray-600 text-sm sm:text-base">
              Showing availability for {formatDate(selectedDate)} at {selectedTimeSlot}
            </div>
          )}
        </div>

        {/* Table Availability */}
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading table availability...</p>
          </div>
        ) : !Array.isArray(tableAvailability) || tableAvailability.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-600 text-sm sm:text-base">
              {!Array.isArray(tableAvailability) 
                ? 'Error loading table data. Please try again.' 
                : 'No tables available for the selected date and time.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {tableAvailability.map((tableAvailability) => (
              <div
                key={tableAvailability.table_number}
                className={`bg-white rounded-lg shadow-sm border-2 p-4 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  tableAvailability.is_available
                    ? 'border-green-200 hover:border-green-700'
                    : 'border-red-200 hover:border-red-700'
                }`}
                onClick={() => {
                  if (tableAvailability.is_available) {
                    handleTableSelect(tableAvailability);
                  } else if (tableAvailability.booked_slots.length > 0) {
                    handleBookedTableClick(tableAvailability, tableAvailability.booked_slots[0]);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Table {tableAvailability.table_number}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${
                      tableAvailability.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tableAvailability.is_available ? 'Available' : 'Booked'}
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2 text-gray-600 text-sm sm:text-base">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>{tableAvailability.seats} seats</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 text-sm sm:text-base">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="capitalize">{tableAvailability.table_type}</span>
                  </div>
                </div>

                {tableAvailability.is_available ? (
                  <button className="w-full bg-green-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base">
                    Book This Table
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">Click to view details</p>
                    <div className="text-xs text-gray-400">
                      {tableAvailability.booked_slots.length > 0 && (
                        <p>Booked by: {tableAvailability.booked_slots[0].guest_name}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedTable && (
        <BookingModal
          table={selectedTable}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchTableAvailability();
            toast.success('Booking created successfully!');
          }}
        />
      )}

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedTable && selectedBookingSlot && (
        <BookingDetailsModal
          table={selectedTable}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          bookingSlot={selectedBookingSlot}
          onClose={() => setShowBookingDetailsModal(false)}
          onCancelled={handleBookingCancelled}
        />
      )}
    </div>
  );
};

export default LandingPage;
