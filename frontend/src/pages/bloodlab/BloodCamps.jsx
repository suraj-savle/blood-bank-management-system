import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Edit3,
  Search,
  ChevronDown,
  ChevronUp,
  Droplet,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import { toast } from "react-hot-toast";

const BloodCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCamps: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    city: "",
    state: "",
    pincode: "",
    expectedDonors: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/blood-lab";

  console.log("🔧 BloodCamps Component State:", {
    campsCount: camps.length,
    loading,
    showForm,
    editingCamp: editingCamp?._id,
    filters,
    pagination,
    stats,
    token: token ? "Present" : "Missing"
  });

  // Calculate stats from camps data
  const calculateStats = (campsData) => {
    console.log("📊 Calculating stats from camps:", campsData);
    const stats = {
      upcoming: campsData.filter(camp => camp.status === 'Upcoming').length,
      ongoing: campsData.filter(camp => camp.status === 'Ongoing').length,
      completed: campsData.filter(camp => camp.status === 'Completed').length,
      cancelled: campsData.filter(camp => camp.status === 'Cancelled').length,
      total: campsData.length
    };
    console.log("📈 Calculated stats:", stats);
    return stats;
  };

  // Validation function
  const validateForm = (data) => {
    console.log("📋 Validating form data:", data);
    const newErrors = {};

    if (!data.title?.trim()) newErrors.title = "Title is required";
    if (!data.date) newErrors.date = "Date is required";
    if (!data.startTime) newErrors.startTime = "Start time is required";
    if (!data.endTime) newErrors.endTime = "End time is required";
    if (!data.venue?.trim()) newErrors.venue = "Venue is required";
    if (!data.city?.trim()) newErrors.city = "City is required";
    if (!data.state?.trim()) newErrors.state = "State is required";
    if (!data.pincode?.match(/^[1-9][0-9]{5}$/)) newErrors.pincode = "Valid 6-digit pincode required";
    if (!data.expectedDonors || data.expectedDonors < 1) newErrors.expectedDonors = "Expected donors must be at least 1";

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data.date);
    if (selectedDate < today) {
      newErrors.date = "Date cannot be in the past";
    }

    // Time validation
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      newErrors.endTime = "End time must be after start time";
    }

    console.log("❌ Validation errors:", newErrors);
    return newErrors;
  };

  // Fetch blood camps with filters
  const fetchCamps = async (page = 1) => {
    try {
      setLoading(true);
      console.log("🔄 Fetching camps with filters:", { ...filters, page });
      
      const queryParams = new URLSearchParams({
        status: filters.status,
        page: page.toString(),
        limit: '8',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search })
      });

      const url = `${API_URL}/camps?${queryParams}`;
      console.log("📡 API URL:", url);

      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("📨 Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`Failed to fetch camps: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ API Response data:", data);
      
      if (data.success) {
        const campsData = data.data.camps || [];
        const calculatedStats = calculateStats(campsData);
        
        console.log("📊 Setting camps data:", {
          campsCount: campsData.length,
          pagination: data.data.pagination,
          stats: calculatedStats
        });
        
        setCamps(campsData);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCamps: 0,
          hasNext: false,
          hasPrev: false
        });
        setStats(calculatedStats);
      } else {
        console.error("❌ API returned success: false", data);
        throw new Error(data.message || "Failed to fetch camps");
      }
    } catch (err) {
      console.error("🚨 Fetch camps error:", err);
      toast.error(err.message || "Failed to load blood camps");
      // Set empty state on error
      setCamps([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCamps: 0,
        hasNext: false,
        hasPrev: false
      });
      setStats({
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Update camp status
  const updateCampStatus = async (campId, newStatus) => {
    try {
      console.log("🔄 Updating camp status:", { campId, newStatus });
      
      const url = `${API_URL}/camps/${campId}/status`;
      const payload = { status: newStatus };

      console.log("📦 Sending status update:", { url, payload });

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📨 Status update response:", { status: res.status, data });

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update camp status");
      }

      toast.success(`Camp marked as ${newStatus.toLowerCase()}!`);
      setActionMenu(null);
      fetchCamps(); // Refresh the list
    } catch (err) {
      console.error("🚨 Status update error:", err);
      toast.error(err.message || "Error updating camp status");
    }
  };

  useEffect(() => {
    console.log("🎯 BloodCamps component mounted");
    fetchCamps();
  }, [filters]);

  // Reset form
  const resetForm = () => {
    console.log("🔄 Resetting form");
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      venue: "",
      city: "",
      state: "",
      pincode: "",
      expectedDonors: "",
    });
    setErrors({});
    setEditingCamp(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    console.log("📤 Form submission started:", { formData, editingCamp: editingCamp?._id });

    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    try {
      const url = editingCamp 
        ? `${API_URL}/camps/${editingCamp._id}`
        : `${API_URL}/camps`;
      
      const method = editingCamp ? "PUT" : "POST";

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: {
          start: formData.startTime,
          end: formData.endTime,
        },
        location: {
          venue: formData.venue.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode,
        },
        expectedDonors: Number(formData.expectedDonors),
      };

      console.log("📦 Sending payload:", payload);
      console.log("🔗 Making request to:", url, "Method:", method);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📨 Form submission response:", { status: res.status, data });

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${editingCamp ? 'update' : 'add'} blood camp`);
      }

      toast.success(`Blood Camp ${editingCamp ? 'Updated' : 'Added'} Successfully!`);
      resetForm();
      setShowForm(false);
      fetchCamps(); // Refresh the list
    } catch (err) {
      console.error("🚨 Form submission error:", err);
      toast.error(err.message || `Error ${editingCamp ? 'updating' : 'adding'} camp`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (camp) => {
    console.log("✏️ Editing camp:", camp);
    setEditingCamp(camp);
    setFormData({
      title: camp.title,
      description: camp.description || "",
      date: new Date(camp.date).toISOString().split('T')[0],
      startTime: camp.time.start,
      endTime: camp.time.end,
      venue: camp.location.venue,
      city: camp.location.city,
      state: camp.location.state,
      pincode: camp.location.pincode,
      expectedDonors: camp.expectedDonors.toString(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDeleteCamp = async (id) => {
    console.log("🗑️ Deleting camp:", id);
    if (!window.confirm("Are you sure you want to delete this camp? This action cannot be undone.")) return;
    
    try {
      const url = `${API_URL}/camps/${id}`;
      console.log("🔗 DELETE request to:", url);

      const res = await fetch(url, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await res.json();
      console.log("📨 Delete response:", { status: res.status, data });

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete camp");
      }

      toast.success("Camp deleted successfully!");
      fetchCamps(); // Refresh the list
    } catch (err) {
      console.error("🚨 Delete camp error:", err);
      toast.error(err.message || "Error deleting camp");
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    console.log("⌨️ Input change:", field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Upcoming: { color: "bg-blue-100 text-blue-800", label: "Upcoming", icon: Calendar },
      Ongoing: { color: "bg-green-100 text-green-800", label: "Ongoing", icon: Clock },
      Completed: { color: "bg-gray-100 text-gray-800", label: "Completed", icon: CheckCircle },
      Cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled", icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.Upcoming;
    const IconComponent = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <IconComponent size={12} />
        {config.label}
      </span>
    );
  };

  // Get available status actions for a camp
  const getAvailableActions = (camp) => {
    const baseActions = [];
    
    switch (camp.status) {
      case 'Upcoming':
        baseActions.push(
          { label: 'Mark as Ongoing', value: 'Ongoing', color: 'text-green-600' },
          { label: 'Cancel Camp', value: 'Cancelled', color: 'text-red-600' }
        );
        break;
      case 'Ongoing':
        baseActions.push(
          { label: 'Mark as Completed', value: 'Completed', color: 'text-gray-600' },
          { label: 'Cancel Camp', value: 'Cancelled', color: 'text-red-600' }
        );
        break;
      case 'Completed':
        baseActions.push(
          { label: 'Re-open as Ongoing', value: 'Ongoing', color: 'text-green-600' }
        );
        break;
      case 'Cancelled':
        baseActions.push(
          { label: 'Re-schedule as Upcoming', value: 'Upcoming', color: 'text-blue-600' }
        );
        break;
    }

    return baseActions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Debug Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Camps Loaded: {camps.length}</div>
            <div>Current Page: {pagination.currentPage}</div>
            <div>Total Pages: {pagination.totalPages}</div>
            <div>Filters: {JSON.stringify(filters)}</div>
            <div>Stats: {JSON.stringify(stats)}</div>
            <div>Token: {token ? "Present" : "Missing"}</div>
          </div>
        </div>

        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
                Blood Donation Camps
              </h1>
              <p className="text-gray-600 mt-1">Manage and organize blood donation camps</p>
            </div>
            <button
              onClick={() => {
                console.log("➕ Add camp button clicked");
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <Plus size={18} className="mr-2" /> 
              {showForm ? 'Cancel' : 'Add Camp'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Camps</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-blue-400">
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-400">
              <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
              <div className="text-sm text-gray-600">Ongoing</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-gray-400">
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search camps..."
                  value={filters.search}
                  onChange={(e) => {
                    console.log("🔍 Search filter:", e.target.value);
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) => {
                console.log("📊 Status filter:", e.target.value);
                setFilters(prev => ({ ...prev, status: e.target.value }))
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                console.log("📈 Sort by:", e.target.value);
                setFilters(prev => ({ ...prev, sortBy: e.target.value }))
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="expectedDonors">Sort by Donors</option>
            </select>
            <button
              onClick={() => {
                console.log("🔄 Toggling sort order");
                setFilters(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' 
                }))
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {filters.sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-600" />
              {editingCamp ? 'Edit Blood Camp' : 'Add New Blood Camp'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camp Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.title ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter camp title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.date ? 'border-red-500' : ''
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.startTime ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.endTime ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
                </div>
              </div>

              {/* Location Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.venue ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter venue name"
                />
                {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.city ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.state ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter state"
                />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.pincode ? 'border-red-500' : ''
                  }`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
              </div>

              {/* Expected Donors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Donors *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.expectedDonors}
                  onChange={(e) => handleInputChange('expectedDonors', e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.expectedDonors ? 'border-red-500' : ''
                  }`}
                  placeholder="Expected number of donors"
                />
                {errors.expectedDonors && <p className="text-red-500 text-sm mt-1">{errors.expectedDonors}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter camp description (optional)"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : (editingCamp ? 'Update Camp' : 'Create Camp')}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("❌ Form cancelled");
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Blood Camps List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading camps...</span>
          </div>
        ) : camps.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="text-gray-400 mb-4">
              <Droplet size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No blood camps found</h3>
            <p className="text-gray-600 mb-4">
              {filters.status !== 'all' || filters.search ? 'Try changing your filters' : 'Get started by creating your first blood camp'}
            </p>
            {!filters.search && filters.status === 'all' && (
              <button
                onClick={() => {
                  console.log("➕ Create first camp clicked");
                  setShowForm(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Create Your First Camp
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {camps.map((camp) => {
                console.log("🎪 Rendering camp card:", camp._id, camp.title);
                const availableActions = getAvailableActions(camp);
                
                return (
                  <div
                    key={camp._id}
                    className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {camp.title}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(camp)}
                          className="text-red-600 hover:text-red-700 p-1 transition-colors"
                          title="Edit camp"
                        >
                          <Edit3 size={16} />
                        </button>
                        {availableActions.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === camp._id ? null : camp._id)}
                              className="text-gray-600 hover:text-gray-700 p-1 transition-colors"
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {actionMenu === camp._id && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-40">
                                {availableActions.map((action) => (
                                  <button
                                    key={action.value}
                                    onClick={() => updateCampStatus(camp._id, action.value)}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${action.color}`}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteCamp(camp._id)}
                          className="text-red-500 hover:text-red-600 p-1 transition-colors"
                          title="Delete camp"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <StatusBadge status={camp.status} />
                      <span className="text-sm text-gray-500">
                        {new Date(camp.date).toLocaleDateString()}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {camp.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-red-500 flex-shrink-0" />
                        <span>{camp.time.start} - {camp.time.end}</span>
                      </div>
                      <div className="flex items-start">
                        <MapPin size={16} className="mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {camp.location.venue}, {camp.location.city}, {camp.location.state} - {camp.location.pincode}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-red-500 flex-shrink-0" />
                        <span>Expected: {camp.expectedDonors} donors</span>
                      </div>
                      {camp.actualDonors > 0 && (
                        <div className="flex items-center text-green-600">
                          <Users size={16} className="mr-2 flex-shrink-0" />
                          <span>Actual: {camp.actualDonors} donors</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => {
                    console.log("⬅️ Previous page");
                    fetchCamps(pagination.currentPage - 1);
                  }}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => {
                    console.log("➡️ Next page");
                    fetchCamps(pagination.currentPage + 1);
                  }}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BloodCamps;