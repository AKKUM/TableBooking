import React from 'react';
import { X, Users, Phone, Calendar, User, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bookingAPI } from '../services/api';

interface BookingSlot {
  booking_id: number;
  start_time: string;
  end_time: string;
  guest_name: string;
  guest_phone?: string;
  number_of_people?: number;
  special_occasion?: string;
}

interface Table {
  table_number: string;
  name: string;
  seats: number;
  table_type: string;
}

interface BookingDetailsModalProps {
  table: Table;
  date: string;
  timeSlot: string;
  bookingSlot: BookingSlot;
  onClose: () => void;
  onCancelled: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  table,
  date,
  timeSlot,
  bookingSlot,
  onClose,
  onCancelled,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelBooking = async () => {
    if (!window.confirm(`Are you sure you want to cancel the booking for Table ${table.table_number} on ${formatDate(date)} at ${timeSlot}?`)) {
      return;
    }

    try {
      await bookingAPI.cancelBooking(bookingSlot.booking_id);
      toast.success('Booking cancelled successfully!');
      onCancelled();
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Table Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Table Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Table:</span>
                  <span className="ml-2 font-medium">{table.table_number}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium capitalize">{table.table_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Seats:</span>
                  <span className="ml-2 font-medium">{table.seats}</span>
                </div>
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{table.name}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-3">Reservation Details</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-red-600" />
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatDate(date)}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-red-600" />
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-medium text-gray-900">{timeSlot}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-3 text-red-600" />
                  <div>
                    <span className="text-gray-600">Guest:</span>
                    <span className="ml-2 font-medium text-gray-900">{bookingSlot.guest_name}</span>
                  </div>
                </div>
                {bookingSlot.guest_phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-red-600" />
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium text-gray-900">{bookingSlot.guest_phone}</span>
                    </div>
                  </div>
                )}
                {bookingSlot.number_of_people && (
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-3 text-red-600" />
                    <div>
                      <span className="text-gray-600">People:</span>
                      <span className="ml-2 font-medium text-gray-900">{bookingSlot.number_of_people}</span>
                    </div>
                  </div>
                )}
                {bookingSlot.special_occasion && (
                  <div className="flex items-center text-sm">
                    <Gift className="h-4 w-4 mr-3 text-red-600" />
                    <div>
                      <span className="text-gray-600">Occasion:</span>
                      <span className="ml-2 font-medium text-gray-900">{bookingSlot.special_occasion}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={handleCancelBooking}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
