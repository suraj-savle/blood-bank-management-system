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
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BloodCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCamps: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
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
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState(null);

  const token = localStorage.getItem("token");
  // Fixed API URL - removed /blood-lab if it doesn't exist
  const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/blood-lab`;

  // Calculate stats from camps data
  const calculateStats = (campsData) => {
    const stats = {
      upcoming: campsData.filter((camp) => camp.status === "Upcoming").length,
      ongoing: campsData.filter((camp) => camp.status === "Ongoing").length,
      completed: campsData.filter((camp) => camp.status === "Completed").length,
      cancelled: campsData.filter((camp) => camp.status === "Cancelled").length,
      total: campsData.length,
    };
    return stats;
  };

  // Validation function
  const validateForm = (data) => {
    const newErrors = {};

    if (!data.title?.trim()) newErrors.title = "Title is required";
    if (!data.date) newErrors.date = "Date is required";
    if (!data.startTime) newErrors.startTime = "Start time is required";
    if (!data.endTime) newErrors.endTime = "End time is required";
    if (!data.venue?.trim()) newErrors.venue = "Venue is required";
    if (!data.city?.trim()) newErrors.city = "City is required";
    if (!data.state?.trim()) newErrors.state = "State is required";
    if (!data.pincode?.match(/^[1-9][0-9]{5}$/))
      newErrors.pincode = "Valid 6-digit pincode required";
    if (!data.expectedDonors || data.expectedDonors < 1)
      newErrors.expectedDonors = "Expected donors must be at least 1";

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

    return newErrors;
  };

  // Fetch blood camps with filters
  const fetchCamps = async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        status: filters.status,
        page: page.toString(),
        limit: "8",
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
      });

      // Try different endpoint variations
      const url = `${API_URL}/camps?${queryParams}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error(
          "❌ Server returned non-JSON response:",
          text.substring(0, 200),
        );
        throw new Error(
          "Server returned HTML instead of JSON. Check API endpoint.",
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ API Error Response:", errorData);
        throw new Error(
          errorData.message || `Failed to fetch camps: ${res.status}`,
        );
      }

      const data = await res.json();

      if (data.success) {
        const campsData = data.data?.camps || data.camps || [];
        const calculatedStats = calculateStats(campsData);

        setCamps(campsData);
        setPagination(
          data.data?.pagination ||
            data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalCamps: 0,
              hasNext: false,
              hasPrev: false,
            },
        );
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
        hasPrev: false,
      });
      setStats({
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch registrations for a camp (facility view)
  const fetchRegistrations = async (campId) => {
    try {
      setRegsLoading(true);
      setSelectedCampId(campId);
      setShowRegistrationsModal(true);
      const res = await fetch(`${API_URL}/camps/${campId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON registrations response:', text.substring(0,200));
        toast.error('Server returned non-JSON for registrations');
        setRegistrations([]);
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrations(data.registrations || []);
      } else {
        toast.error(data.message || "Failed to load registrations");
        setRegistrations([]);
      }
    } catch (err) {
      console.error('Fetch registrations error', err);
      toast.error('Failed to load registrations');
      setRegistrations([]);
    } finally {
      setRegsLoading(false);
    }
  };

  const verifyDonation = async (campId, donorId) => {
    try {
      const res = await fetch(`${API_URL}/camps/${campId}/registrations/${donorId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1, remarks: 'Verified at camp' }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON verify response:', text.substring(0, 200));
        toast.error('Server error during verification');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Donation verified ✓');
        // Re-fetch registrations to sync with backend
        fetchRegistrations(campId);
        // Re-fetch camps to update actualDonors count
        fetchCamps();
      } else {
        toast.error(data.message || 'Failed to verify donation');
      }
    } catch (err) {
      console.error('🚨 Verify donation error', err);
      toast.error('Error verifying donation');
    }
  };

  // Update camp status - FIXED VERSION
  const updateCampStatus = async (campId, newStatus) => {
    try {
      // Try different endpoint variations
      const endpoints = [
        `${API_URL}/camps/${campId}/status`,
        `${API_URL}/camps/${campId}`,
        `${API_URL}/camps/${campId}/status`,
      ];

      let lastError = null;

      for (const url of endpoints) {
        try {
          const payload = { status: newStatus };
          const res = await fetch(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          // Check content type before parsing
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.warn(
              "⚠️ Non-JSON response from",
              url,
              text.substring(0, 100),
            );
            continue; // Try next endpoint
          }

          const data = await res.json();
          if (res.ok && data.success) {
            toast.success(`Camp marked as ${newStatus.toLowerCase()}!`);
            setActionMenu(null);
            fetchCamps(); // Refresh the list
            return; // Success, exit function
          } else {
            lastError = new Error(
              data.message || "Failed to update camp status",
            );
          }
        } catch (err) {
          console.warn("⚠️ Endpoint failed:", url, err.message);
          lastError = err;
        }
      }

      // If all endpoints failed
      if (lastError) {
        throw lastError;
      } else {
        throw new Error("No valid endpoint found for status update");
      }
    } catch (err) {
      console.error("🚨 Status update error:", err);
      toast.error(err.message || "Error updating camp status");
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [filters]);

  // Reset form
  const resetForm = () => {
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

    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    try {
      // Try different endpoint variations
      const baseUrls = [`${API_URL}/camps`, `${API_URL}/camps`];

      let lastError = null;

      for (const baseUrl of baseUrls) {
        const url = editingCamp ? `${baseUrl}/${editingCamp._id}` : baseUrl;
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

        try {
          const res = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          // Check content type
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.warn(
              "⚠️ Non-JSON response from",
              url,
              text.substring(0, 100),
            );
            continue;
          }

          const data = await res.json();
          if (res.ok && data.success) {
            toast.success(
              `Blood Camp ${editingCamp ? "Updated" : "Added"} Successfully!`,
            );
            resetForm();
            setShowForm(false);
            fetchCamps();
            return; // Success, exit function
          } else {
            lastError = new Error(
              data.message ||
                `Failed to ${editingCamp ? "update" : "add"} blood camp`,
            );
          }
        } catch (err) {
          console.warn("⚠️ Endpoint failed:", url, err.message);
          lastError = err;
        }
      }

      // If all endpoints failed
      if (lastError) {
        throw lastError;
      } else {
        throw new Error("No valid endpoint found for camp operation");
      }
    } catch (err) {
      console.error("🚨 Form submission error:", err);
      toast.error(
        err.message || `Error ${editingCamp ? "updating" : "adding"} camp`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (camp) => {
    setEditingCamp(camp);
    setFormData({
      title: camp.title,
      description: camp.description || "",
      date: new Date(camp.date).toISOString().split("T")[0],
      startTime: camp.time.start,
      endTime: camp.time.end,
      venue: camp.location.venue,
      city: camp.location.city,
      state: camp.location.state,
      pincode: camp.location.pincode,
      expectedDonors: camp.expectedDonors.toString(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete
  const handleDeleteCamp = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this camp? This action cannot be undone.",
      )
    )
      return;

    try {
      // Try different endpoint variations
      const endpoints = [`${API_URL}/camps/${id}`, `${API_URL}/camps/${id}`];

      let lastError = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // Check content type
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.warn(
              "⚠️ Non-JSON response from",
              url,
              text.substring(0, 100),
            );
            continue;
          }

          const data = await res.json();
          if (res.ok && data.success) {
            toast.success("Camp deleted successfully!");
            fetchCamps();
            return; // Success, exit function
          } else {
            lastError = new Error(data.message || "Failed to delete camp");
          }
        } catch (err) {
          console.warn("⚠️ Endpoint failed:", url, err.message);
          lastError = err;
        }
      }

      // If all endpoints failed
      if (lastError) {
        throw lastError;
      } else {
        throw new Error("No valid endpoint found for delete operation");
      }
    } catch (err) {
      console.error("🚨 Delete camp error:", err);
      toast.error(err.message || "Error deleting camp");
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Upcoming: {
        color: "bg-blue-100 text-blue-800",
        label: "Upcoming",
        icon: Calendar,
      },
      Ongoing: {
        color: "bg-green-100 text-green-800",
        label: "Ongoing",
        icon: Clock,
      },
      Completed: {
        color: "bg-gray-100 text-gray-800",
        label: "Completed",
        icon: CheckCircle,
      },
      Cancelled: {
        color: "bg-red-100 text-red-800",
        label: "Cancelled",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.Upcoming;
    const IconComponent = config.icon;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}
      >
        <IconComponent size={12} />
        {config.label}
      </span>
    );
  };

  // Get available status actions for a camp - FIXED to include Completed
  const getAvailableActions = (camp) => {
    const baseActions = [];

    switch (camp.status) {
      case "Upcoming":
        baseActions.push(
          {
            label: "Mark as Ongoing",
            value: "Ongoing",
            color: "text-green-600",
          },
          { label: "Cancel Camp", value: "Cancelled", color: "text-red-600" },
        );
        break;
      case "Ongoing":
        baseActions.push(
          {
            label: "Mark as Completed",
            value: "Completed",
            color: "text-gray-600",
          },
          { label: "Cancel Camp", value: "Cancelled", color: "text-red-600" },
        );
        break;
      case "Completed":
        baseActions.push(
          {
            label: "Re-open as Ongoing",
            value: "Ongoing",
            color: "text-green-600",
          },
          {
            label: "Mark as Upcoming",
            value: "Upcoming",
            color: "text-blue-600",
          },
        );
        break;
      case "Cancelled":
        baseActions.push(
          {
            label: "Re-schedule as Upcoming",
            value: "Upcoming",
            color: "text-blue-600",
          },
          {
            label: "Mark as Ongoing",
            value: "Ongoing",
            color: "text-green-600",
          },
        );
        break;
      default:
        // Default actions for any status
        baseActions.push(
          {
            label: "Mark as Upcoming",
            value: "Upcoming",
            color: "text-blue-600",
          },
          {
            label: "Mark as Ongoing",
            value: "Ongoing",
            color: "text-green-600",
          },
          {
            label: "Mark as Completed",
            value: "Completed",
            color: "text-gray-600",
          },
          { label: "Cancel Camp", value: "Cancelled", color: "text-red-600" },
        );
    }

    return baseActions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
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
              <p className="text-gray-600 mt-1">
                Manage and organize blood donation camps
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <Plus size={18} className="mr-2" />
              {showForm ? "Cancel" : "Add Camp"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-gray-800">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Camps</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-blue-400">
              <div className="text-2xl font-bold text-blue-600">
                {stats.upcoming}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-400">
              <div className="text-2xl font-bold text-green-600">
                {stats.ongoing}
              </div>
              <div className="text-sm text-gray-600">Ongoing</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-gray-400">
              <div className="text-2xl font-bold text-gray-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelled}
              </div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search camps..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
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
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="expectedDonors">Sort by Donors</option>
            </select>
            <button
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {filters.sortOrder === "desc" ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
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
              {editingCamp ? "Edit Blood Camp" : "Add New Blood Camp"}
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
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.title ? "border-red-500" : ""
                  }`}
                  placeholder="Enter camp title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.date ? "border-red-500" : ""
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
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
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.startTime ? "border-red-500" : ""
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange("endTime", e.target.value)
                    }
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.endTime ? "border-red-500" : ""
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.endTime}
                    </p>
                  )}
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
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.venue ? "border-red-500" : ""
                  }`}
                  placeholder="Enter venue name"
                />
                {errors.venue && (
                  <p className="text-red-500 text-sm mt-1">{errors.venue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.city ? "border-red-500" : ""
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.state ? "border-red-500" : ""
                  }`}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.pincode ? "border-red-500" : ""
                  }`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                )}
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
                  onChange={(e) =>
                    handleInputChange("expectedDonors", e.target.value)
                  }
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.expectedDonors ? "border-red-500" : ""
                  }`}
                  placeholder="Expected number of donors"
                />
                {errors.expectedDonors && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expectedDonors}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
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
                {submitting
                  ? "Saving..."
                  : editingCamp
                    ? "Update Camp"
                    : "Create Camp"}
              </button>
              <button
                type="button"
                onClick={() => {
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No blood camps found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.status !== "all" || filters.search
                ? "Try changing your filters"
                : "Get started by creating your first blood camp"}
            </p>
            {!filters.search && filters.status === "all" && (
              <button
                onClick={() => {
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
                              onClick={() =>
                                setActionMenu(
                                  actionMenu === camp._id ? null : camp._id,
                                )
                              }
                              className="text-gray-600 hover:text-gray-700 p-1 transition-colors"
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {actionMenu === camp._id && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-48">
                                {availableActions.map((action) => (
                                  <button
                                    key={action.value}
                                    onClick={() =>
                                      updateCampStatus(camp._id, action.value)
                                    }
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${action.color}`}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Registrations Modal */}
                            {showRegistrationsModal && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                <div className="bg-white w-full max-w-2xl mx-4 rounded-xl p-6 shadow-lg">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Camp Registrations</h3>
                                    <button onClick={() => setShowRegistrationsModal(false)} className="text-gray-600 hover:text-gray-800">Close</button>
                                  </div>
                                  {regsLoading ? (
                                    <div>Loading...</div>
                                  ) : (
                                    <div className="space-y-3 max-h-96 overflow-auto">
                                      {registrations.length === 0 && <div className="text-sm text-gray-600">No registrations yet.</div>}
                                      {registrations.map((r, idx) => {
                                        const donorId = r.donor?._id || r.donorId;
                                        return (
                                          <div key={idx} className="border rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                              <div className="font-medium">{r.donor?.fullName || 'Unknown Donor'}</div>
                                              <div className="text-sm text-gray-600">{r.donor?.email || 'N/A'} • {r.donor?.phone || 'N/A'}</div>
                                              <div className="text-sm text-gray-500">Blood: {r.donor?.bloodGroup || 'N/A'} • Age: {r.donor?.age || 'N/A'}</div>
                                              <div className="text-sm text-gray-400">Booked: {r.bookedAt ? new Date(r.bookedAt).toLocaleString() : 'N/A'}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                              {r.donationDone ? (
                                                <div className="text-green-600 font-medium">✓ Donated</div>
                                              ) : donorId ? (
                                                <button onClick={() => verifyDonation(selectedCampId, donorId)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Mark Donated</button>
                                              ) : (
                                                <div className="text-gray-400">No donor ID</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
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
                        <Clock
                          size={16}
                          className="mr-2 text-red-500 flex-shrink-0"
                        />
                        <span>
                          {camp.time.start} - {camp.time.end}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <MapPin
                          size={16}
                          className="mr-2 text-red-500 flex-shrink-0 mt-0.5"
                        />
                        <span className="line-clamp-2">
                          {camp.location.venue}, {camp.location.city},{" "}
                          {camp.location.state} - {camp.location.pincode}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users
                          size={16}
                          className="mr-2 text-red-500 flex-shrink-0"
                        />
                        <span>Expected: {camp.expectedDonors} donors</span>
                      </div>
                      {camp.actualDonors > 0 && (
                        <div className="flex items-center text-green-600">
                          <Users size={16} className="mr-2 flex-shrink-0" />
                          <span>Actual: {camp.actualDonors} donors</span>
                        </div>
                      )}
                        <div className="mt-3">
                          <button
                            onClick={() => fetchRegistrations(camp._id)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Registrations
                          </button>
                        </div>
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
