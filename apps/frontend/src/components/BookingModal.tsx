import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { bookingAPI } from '../services/api';

interface Table {
  table_number: string;
  name: string;
  seats: number;
  table_type: string;
}

interface BookingModalProps {
  table: Table;
  date: string;
  timeSlot: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BookingFormData {
  guest_name: string;
  guest_phone: string;
  number_of_people: number;
  special_occasion: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  table,
  date,
  timeSlot,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    defaultValues: {
      guest_name: '',
      guest_phone: '',
      number_of_people: 1,
      special_occasion: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    if (data.number_of_people > table.seats) {
      toast.error(`This table only seats ${table.seats} people`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse time slot to get start and end time
      const [startTime, endTime] = timeSlot.split('-');
      
      // Create booking data
      const bookingData = {
        table_number: table.table_number, // Fixed: changed from table_id to table_number
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        guest_name: data.guest_name,
        guest_phone: data.guest_phone,
        number_of_people: data.number_of_people,
        special_occasion: data.special_occasion || undefined,
      };

      // Call the real API
      const response = await bookingAPI.createBooking(bookingData);
      
      if (response.data) {
        toast.success('Booking created successfully!');
        reset();
        onSuccess();
      } else {
        toast.error('Failed to create booking. Please try again.');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Improved error handling to prevent React from rendering error objects
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = error.response.data.detail
            .map((err: any) => err.msg || 'Validation error')
            .join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <h3 className="text-lg font-semibold text-gray-900">Book Table</h3>
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
              <h4 className="font-medium text-gray-900 mb-2">Table Details</h4>
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
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2 font-medium">{formatDate(date)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-2 font-medium">{timeSlot}</span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  id="guest_name"
                  {...register('guest_name', { required: 'Guest name is required' })}
                  className="input"
                  placeholder="Enter guest name"
                />
                {errors.guest_name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.guest_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="guest_phone"
                  {...register('guest_phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Please enter a valid phone number'
                    }
                  })}
                  className="input"
                  placeholder="Enter phone number"
                />
                {errors.guest_phone && (
                  <p className="mt-1 text-sm text-danger-600">{errors.guest_phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="number_of_people" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of People *
                </label>
                <select
                  id="number_of_people"
                  {...register('number_of_people', { 
                    required: 'Number of people is required',
                    min: { value: 1, message: 'Minimum 1 person' },
                    max: { value: table.seats, message: `Maximum ${table.seats} people` }
                  })}
                  className="input"
                >
                  {Array.from({ length: table.seats }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
                {errors.number_of_people && (
                  <p className="mt-1 text-sm text-danger-600">{errors.number_of_people.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="special_occasion" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Occasion (Optional)
                </label>
                <textarea
                  id="special_occasion"
                  {...register('special_occasion')}
                  className="input"
                  rows={3}
                  placeholder="Any special requests or occasion details..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </div>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
