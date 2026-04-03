import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Hospital,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Briefcase,
  Shield,
  AlertTriangle,
  Building2,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/admin`;

function GetAllFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    facilityType: "all",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  const token = localStorage.getItem("token");

  // Facility status and types for filters
  const facilityTypes = ["hospital", "blood-lab"];
  const statuses = ["pending", "approved", "rejected"];

  // Fetch Facilities Function
  const fetchAllFacilities = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      console.log("🔄 Fetching facilities...");

      const res = await fetch(`${API_URL}/facilities`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📨 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Failed to fetch facilities: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Facilities data:", data);
      setFacilities(data.facilities || []);

      if (showToast) {
        toast.success(`Loaded ${data.facilities?.length || 0} facilities`);
      }
    } catch (error) {
      console.error("🚨 Fetch facilities error:", error);
      toast.error(error.message || "Failed to load facility data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllFacilities();
  }, []);

  // Filter and sort facilities
  const filteredFacilities = facilities
    .filter((facility) => {
      const matchesSearch =
        !filters.search ||
        facility.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        facility.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        facility.registrationNumber
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        facility.phone?.includes(filters.search);

      const matchesType =
        filters.facilityType === "all" ||
        facility.facilityType === filters.facilityType;

      const matchesStatus =
        filters.status === "all" || facility.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
          break;
        case "status":
          aValue = a.status?.toLowerCase();
          bValue = b.status?.toLowerCase();
          break;
        case "type":
          aValue = a.facilityType?.toLowerCase();
          bValue = b.facilityType?.toLowerCase();
          break;
        default:
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
      }

      if (filters.sortOrder === "desc") {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  // Helper to get the status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle size={12} />,
        label: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle size={12} />,
        label: "Rejected",
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock size={12} />,
        label: "Pending Review",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeDisplay = type
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    const isHospital = type === "hospital";

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
          isHospital
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-purple-50 text-purple-700 border-purple-200"
        }`}
      >
        <Building2 size={10} />
        {typeDisplay}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Hospital className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Facility Database
          </h2>
          <p className="text-gray-500">
            Fetching all registered medical facilities...
          </p>
        </div>
      </div>
    );
  }

  // Count for stats card
  const approvedCount = facilities.filter(
    (f) => f.status === "approved",
  ).length;
  const pendingCount = facilities.filter((f) => f.status === "pending").length;
  const rejectedCount = facilities.filter(
    (f) => f.status === "rejected",
  ).length;
  const hospitalCount = facilities.filter(
    (f) => f.facilityType === "hospital",
  ).length;
  const labCount = facilities.filter(
    (f) => f.facilityType === "blood-lab",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <Hospital className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Medical Facilities
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and view all registered hospitals and blood
                  laboratories
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchAllFacilities(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {facilities.length}
                </div>
                <div className="text-sm text-gray-600">Total Facilities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {approvedCount}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {rejectedCount}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {hospitalCount}H {labCount}L
                </div>
                <div className="text-sm text-gray-600">Hospitals & Labs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search facilities by name, email, or registration number..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <select
              value={filters.facilityType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  facilityType: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Types</option>
              {facilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type
                    .split("-")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="type">Sort by Type</option>
            </select>

            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {filters.sortOrder === "asc" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-semibold">{filteredFacilities.length}</span>{" "}
            of <span className="font-semibold">{facilities.length}</span>{" "}
            facilities
          </p>
          {filters.search && (
            <p className="text-sm text-red-600">
              Filtered by: "{filters.search}"
            </p>
          )}
        </div>

        {/* Alert for pending facilities */}
        {pendingCount > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  {pendingCount} Facility Approval
                  {pendingCount !== 1 ? "s" : ""} Pending
                </p>
                <p className="text-amber-700 text-sm">
                  {pendingCount} medical facility{pendingCount !== 1 ? "s" : ""}{" "}
                  awaiting administrative review and approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Facility Grid */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-red-100">
            <Hospital className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {facilities.length === 0
                ? "No Facilities Found"
                : "No Matching Facilities"}
            </h3>
            <p className="text-gray-600">
              {facilities.length === 0
                ? "The medical facility database is currently empty."
                : "No facilities match your current search criteria."}
            </p>
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                className="mt-4 text-red-600 hover:text-red-700 underline transition-colors"
              >
                Clear search filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFacilities.map((facility) => (
              <div
                key={facility._id}
                className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
              >
                {/* Header with Name and Badges */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {facility.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(facility.status)}
                    {getTypeBadge(facility.facilityType)}
                  </div>
                </div>

                {/* Facility Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">
                      Reg: {facility.registrationNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {facility.phone || "Not provided"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700 capitalize">
                      {facility.facilityCategory || "General"}
                    </span>
                  </div>

                  {/* Operational Status */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock
                      className={`w-4 h-4 flex-shrink-0 ${
                        facility.is24x7 ? "text-green-500" : "text-gray-500"
                      }`}
                    />
                    <span className="text-gray-700 font-medium">
                      {facility.is24x7
                        ? "24/7 Service Available"
                        : `Hours: ${facility.operatingHours?.open || "N/A"} - ${facility.operatingHours?.close || "N/A"}`}
                    </span>
                  </div>

                  {facility.emergencyServices && (
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-600 font-medium">
                        Emergency Services
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-3 text-sm pt-2 border-t border-gray-100">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-gray-700 line-clamp-2">
                      {facility.address?.street &&
                        `${facility.address.street}, `}
                      {facility.address?.city}, {facility.address?.state}
                      {facility.address?.pincode &&
                        ` - ${facility.address.pincode}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GetAllFacilities;
