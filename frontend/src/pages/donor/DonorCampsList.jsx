import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  MapPin,
  Calendar,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Heart,
  Search,
  Users,
  Building2,
  ListPlus,
} from "lucide-react";

// Route requests directly to backend in dev/prod (without relying on Vite proxy).
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const STATUS_OPTIONS = [
  { value: "all", label: "All Camps" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const CampCard = ({ camp, onBook, onCancel, actionLoading }) => {
  const isCompleted = camp.status === 'Completed';
  const isCancelled = camp.status === 'Cancelled';
  const isUpcoming = camp.status === 'Upcoming';
  // const isOngoing = camp.status === 'Ongoing';

  const statusColor = isCancelled
    ? "bg-red-100 text-red-600 border-red-200"
    : isCompleted
    ? "bg-gray-100 text-gray-600 border-gray-200"
    : "bg-green-100 text-green-600 border-green-200";

  // --- Using schema fields: date and time {start, end} ---
  const campDate = new Date(camp.date);
  const dateStr = campDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const timeStr = `${camp.time?.start || 'N/A'} - ${camp.time?.end || 'N/A'}`;
  
  // --- Using schema fields: expectedDonors and actualDonors ---
  const expectedDonors = camp.expectedDonors || 0;
  const actualDonors = camp.actualDonors || 0; 
  
  const slotsAvailable = expectedDonors > 0 ? expectedDonors - actualDonors : 0;
  const isFull = slotsAvailable <= 0 && expectedDonors > 0 && !isCompleted && !isCancelled;
  const isBooked = Boolean(camp.isBooked);

  // 1. Full Address including Pincode
  const { venue, city, state, pincode } = camp.location || {};
  const locationStr = `${venue}, ${city}, ${state} - ${pincode}`;
  
  // Assuming the populated hospital object has a 'name' field from the Facility model
  const hospitalName = camp.hospital?.name || 'Associated Facility Missing';

  // Donor Capacity Logic
  const renderDonorCapacity = () => {
    if (isUpcoming) {
      return (
        <span className="font-medium text-gray-600">
          {expectedDonors} Expected Donors (Capacity)
        </span>
      );
    } 
    
    // For Ongoing, Completed, or Cancelled (where data might be relevant)
    return (
      <span className="font-medium text-gray-600">
        {actualDonors} Achieved / {expectedDonors} Expected
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl p-6 border-2 overflow-hidden ${
      isCancelled ? 'border-red-200 opacity-70' : 'border-red-100'
    }`}>
      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <h4 className={`text-xl font-bold leading-tight ${
          isCancelled ? 'text-gray-500' : 'text-gray-800'
        }`}>
          {camp.title}
        </h4>
        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${statusColor} self-start sm:self-auto`}>
          {camp.status}
        </span>
      </div>
      
      {/* Hospital/Facility Name */}
      <div className="flex items-center gap-3 text-sm text-gray-700 mb-3 font-semibold">
        <Building2 className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="truncate">{hospitalName}</span>
      </div>

      {/* Primary Camp details */}
      <div className="space-y-3 text-sm text-gray-600 mb-4">
        {/* Full Address Display */}
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{locationStr}</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Donor Metrics Summary */}
      <div className="pt-4 border-t border-gray-100 flex flex-col justify-between items-start gap-3">
        {/* Donor Capacity Display (Updated logic) */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-700">Capacity:</span>
          {renderDonorCapacity()}
        </div>
        
        {/* Remaining Need - Only visible if not Completed or Cancelled */}
        {!isCompleted && !isCancelled && (
            <div className="flex items-center gap-2 text-sm">
                <ListPlus className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-gray-700">Remaining Need:</span>
                <span className={`font-bold ${
                    isFull ? 'text-red-600' : 'text-green-600'
                }`}>
                    {isFull ? 'Full (Capacity Reached)' : `${slotsAvailable} slots remaining`}
                </span>
            </div>
        )}
        
        {/* Description Section (Always visible) */}
        <div className="pt-4 border-t border-gray-100 w-full mt-3">
          {/* Description */}
          <div>
            <h5 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Droplet className="w-4 h-4" /> Description</h5>
            <p className="text-gray-600 text-sm italic whitespace-pre-wrap">{camp.description || 'No detailed description provided for this camp.'}</p>
          </div>

          <div className="mt-4">
            {isBooked ? (
              <button
                type="button"
                onClick={() => onCancel(camp._id)}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? "Updating..." : "Cancel Booking"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onBook(camp._id)}
                disabled={isFull || isCompleted || isCancelled || actionLoading}
                className="w-full px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading
                  ? "Booking..."
                  : isFull
                    ? "Camp Full"
                    : "Book Slot"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DonorCampsList = () => {
  const [filter, setFilter] = useState("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionCampId, setActionCampId] = useState("");
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const fetchCamps = useCallback(async () => {
    // NOTE: Using localStorage token as per original code. This should be replaced with a proper auth flow (e.g., Firebase auth) in a production environment.
    const token = localStorage.getItem("token"); 
    if (!token) {
      setError("Authentication required. Please log in to view camps.");
      toast.error("Authentication token missing.");
      setCamps([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const statusParam = filter === 'all' ? '' : filter;
      // NOTE: In your backend, ensure the API handler is using Mongoose .populate('hospital', 'name')
      // to include the facility name in the response data.
      const params = new URLSearchParams({
        ...(statusParam && { status: statusParam }),
        page: pagination.page,
        limit: pagination.limit,
        // Added search term param, assuming backend supports 'q' for search
        ...(searchTerm && { q: searchTerm }),
      }).toString();
      
      const apiUrl = `${API_BASE_URL}/donor/camps?${params}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data?.data || response.data;
      
      if (responseData && Array.isArray(responseData.camps)) {
        setCamps(responseData.camps);
        // Assuming pagination data is available in response.data.pagination
        setPagination(prev => ({ 
          ...prev, 
          total: responseData.pagination?.total || responseData.camps.length,
          totalPages: responseData.pagination?.totalPages || 1,
          currentPage: responseData.pagination?.currentPage || 1
        }));
      } else {
        console.error("API response missing expected data:", response.data);
        throw new Error("Invalid response structure received from server.");
      }
      
    } catch (err) {
      console.error("❌ Fetch Camps Error:", err);
      let message = err.response?.data?.message || err.message || "Failed to fetch camps.";
      
      if (err.response?.status === 401 || err.response?.status === 403) {
          message = "Authentication failed or unauthorized. Please log in again.";
      }
      
      toast.error(message);
      setError(message);
      setCamps([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 1, currentPage: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.limit, searchTerm]); // Include searchTerm in dependencies

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  // Filtering is now handled on the backend via the 'q' parameter in fetchCamps
  // We use the full 'camps' list here which should be the filtered result from the API
  const displayedCamps = camps;

  const updateCampBookingState = (campId, isBooked) => {
    setCamps((prev) =>
      prev.map((camp) => {
        if (camp._id !== campId) return camp;
        return {
          ...camp,
          isBooked,
        };
      })
    );
  };

  const handleBookCamp = async (campId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first.");
      return;
    }

    try {
      setActionCampId(campId);
      const response = await axios.post(
        `${API_BASE_URL}/donor/camps/${campId}/book`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response?.data?.message || "Donation slot booked successfully.");
      updateCampBookingState(campId, true);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to book this camp.";
      toast.error(message);
    } finally {
      setActionCampId("");
    }
  };

  const handleCancelBooking = async (campId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first.");
      return;
    }

    try {
      setActionCampId(campId);
      const response = await axios.delete(`${API_BASE_URL}/donor/camps/${campId}/book`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response?.data?.message || "Booking cancelled successfully.");
      updateCampBookingState(campId, false);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to cancel this booking.";
      toast.error(message);
    } finally {
      setActionCampId("");
    }
  };


  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const totalPages = useMemo(() => pagination.totalPages, [pagination.totalPages]);
  const currentPage = useMemo(() => pagination.currentPage, [pagination.currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 sm:p-6 font-sans">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Heart className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Blood Donation Camps
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Find local opportunities to donate blood and save lives.
              </p>
            </div>
          </div>
        </div>
        
        {/* Controls and Filtering */}
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search camps, locations, hospital name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2 min-w-[180px]">
                <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchCamps()}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl transition-all duration-200 border border-red-200 font-medium min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && camps.length > 0 && (
          <div className="mb-4 px-2">
            <p className="text-sm text-gray-600">
              Showing {displayedCamps.length} camps
              {searchTerm && (
                <span> matching "<span className="font-semibold">{searchTerm}</span>"</span>
              )}
              . Total found: {pagination.total}.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-red-100">
            <Loader2 className="w-8 h-8 text-red-500 mx-auto animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading camps...</p>
            <p className="text-sm text-gray-500 mt-1">Finding the best donation opportunities for you</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && camps.length === 0 && (
          <div className="text-center p-8 sm:p-12 bg-red-50 rounded-2xl shadow-lg border border-red-300">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-700 font-semibold mb-2">Unable to Load Camps</p>
            <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchCamps()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camp List */}
        {!loading && displayedCamps.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {displayedCamps.map((camp) => (
                <CampCard
                  key={camp._id}
                  camp={camp}
                  onBook={handleBookCamp}
                  onCancel={handleCancelBooking}
                  actionLoading={actionCampId === camp._id}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 bg-white p-4 rounded-2xl shadow-md border border-red-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="p-2.5 border border-red-300 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-gray-700 text-sm font-medium min-w-[100px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="p-2.5 border border-red-300 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" /> 
                </button>
              </div>
              
              <span className="text-sm text-gray-500 text-center sm:text-left">
                {pagination.total} Total Camps • {pagination.limit} per page
              </span>
            </div>
          </>
        )}

        {/* No Search/Filter Results State */}
        {!loading && displayedCamps.length === 0 && !error && (
          <div className="text-center p-8 sm:p-12 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm ? 'No Matching Camps Found' : 'No Camps Available'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? `No camps found matching "${searchTerm}" with the current filter.`
                : "There are no camps matching the current filter. Try adjusting your filter."
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium"
              >
                Show All Camps
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorCampsList;