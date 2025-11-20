import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { _interviewService, CreateInterviewData } from '@/api/interviewService';
import { toast } from 'react-toastify';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onSuccess: () => void;
}

interface FormData {
  scheduledAt: string;
  duration: number;
  type: 'ONLINE' | 'OFFLINE' | 'PHONE';
  location: string;
  meetingLink: string;
  notes: string;
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    scheduledAt: '',
    duration: 60,
    type: 'ONLINE',
    location: '',
    meetingLink: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) return;
    setSelectedDate(date);
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const newDateTime = new Date(date);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      setFormData(prev => ({ ...prev, scheduledAt: newDateTime.toISOString().slice(0, 16) }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      setFormData(prev => ({ ...prev, scheduledAt: newDateTime.toISOString().slice(0, 16) }));
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots.filter(time => {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [hours, minutes] = time.split(':');
      const slotTime = new Date(selectedDate || today);
      slotTime.setHours(parseInt(hours), parseInt(minutes));

      if (selectedDate && isToday(selectedDate)) {
        return slotTime > now;
      }
      return true;
    });
  };

  const validateForm = (): boolean => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and time for the interview');
      return false;
    }

    if (!formData.scheduledAt) {
      setError('Please select a date and time');
      return false;
    }

    if (formData.type === 'OFFLINE' && !formData.location.trim()) {
      setError('Location is required for offline interviews');
      return false;
    }

    if (formData.type === 'ONLINE' && !formData.meetingLink.trim()) {
      setError('Meeting link is required for online interviews');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');

      const interviewData: CreateInterviewData = {
        applicationId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: formData.duration,
        type: formData.type,
        location: formData.type === 'OFFLINE' ? formData.location : undefined,
        meetingLink: formData.type === 'ONLINE' ? formData.meetingLink : undefined,
        notes: formData.notes || undefined
      };

      await _interviewService.scheduleInterview(interviewData);
      
      toast.success('Interview scheduled successfully!');
      onSuccess();
      onClose();
      
      setFormData({
        scheduledAt: '',
        duration: 60,
        type: 'ONLINE',
        location: '',
        meetingLink: '',
        notes: ''
      });
      setSelectedDate(null);
      setSelectedTime('');
      setCurrentMonth(new Date());
    } catch (err: any) {
      console.error('Failed to schedule interview:', err);
      setError(err.response?.data?.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setFormData({
        scheduledAt: '',
        duration: 60,
        type: 'ONLINE',
        location: '',
        meetingLink: '',
        notes: ''
      });
      setSelectedDate(null);
      setSelectedTime('');
      setCurrentMonth(new Date());
      setError('');
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); 
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-gray-600 mt-1">
              {candidateName} - {jobTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex h-[calc(95vh-120px)]">
          {/* Left Side - Calendar */}
          <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Select Date
              </h3>
              
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isPast = isPastDate(day);
                  const isSelectedDay = isSelected(day);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast}
                      className={`
                        p-2 text-sm rounded-lg transition-all duration-200
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-50'}
                        ${isSelectedDay ? 'bg-blue-600 text-white shadow-lg' : ''}
                        ${isTodayDate && !isSelectedDay ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                        ${isCurrentMonth && !isPast && !isSelectedDay ? 'text-gray-700 hover:text-blue-700' : ''}
                      `}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Select Time
                </h3>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {generateTimeSlots().map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      className={`p-3 text-sm rounded-lg border transition-all duration-200 ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Form Details */}
          <div className="w-96 p-6 overflow-y-auto space-y-6 bg-gray-50">
            {/* Selected Date & Time Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Schedule</h4>
                <div className="text-blue-800">
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 30, label: '30 min' },
                  { value: 60, label: '1 hour' },
                  { value: 90, label: '1.5 hours' },
                  { value: 120, label: '2 hours' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('duration', value)}
                    className={`p-3 text-sm rounded-lg border transition-all duration-200 ${
                      formData.duration === value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Interview Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'ONLINE', label: 'Online Meeting', icon: Video, desc: 'Video call' },
                  { value: 'OFFLINE', label: 'In-Person', icon: MapPin, desc: 'Office visit' },
                  { value: 'PHONE', label: 'Phone Call', icon: Phone, desc: 'Audio only' }
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('type', value)}
                    className={`w-full p-4 border rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      formData.type === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location (for offline interviews) */}
            {formData.type === 'OFFLINE' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter office address or meeting room"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            )}

            {/* Meeting Link (for online interviews) */}
            {formData.type === 'ONLINE' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Link *
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special instructions or preparation needed..."
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
              />
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <button
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{submitting ? 'Scheduling...' : 'Schedule Interview'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="w-full px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
