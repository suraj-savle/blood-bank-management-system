import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MapPin, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

const AdminCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL = `${import.meta.env.VITE_API_URL || ""}/api`;

  const fetchCamps = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view blood camps.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/blood-lab/camps`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload?.message ||
          "Failed to fetch blood camps from backend.";
        throw new Error(message);
      }

      const campsData = Array.isArray(payload?.camps) ? payload.camps : [];
      setCamps(campsData);
    } catch (err) {
      const message = err?.message || "Unable to load blood camps.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const stats = useMemo(() => {
    return {
      total: camps.length,
      upcoming: camps.filter((camp) => camp.status === "Upcoming").length,
      ongoing: camps.filter((camp) => camp.status === "Ongoing").length,
      completed: camps.filter((camp) => camp.status === "Completed").length,
    };
  }, [camps]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Blood Camps</h1>
          </div>

          <p className="text-gray-600 mb-6">
            This page fetches camp data from the backend blood camp API.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm text-red-700">Total Camps</p>
              <p className="text-2xl font-bold text-red-800">{stats.total}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-700">Upcoming</p>
              <p className="text-2xl font-bold text-blue-800">{stats.upcoming}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-700">Ongoing</p>
              <p className="text-2xl font-bold text-amber-800">{stats.ongoing}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchCamps}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/facilities"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Go to Facilities
            </Link>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
            Loading blood camps...
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to fetch camps</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && camps.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
            No blood camps available.
          </div>
        )}

        {!loading && !error && camps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {camps.map((camp) => {
              const campDate = camp?.date ? new Date(camp.date) : null;
              const location = camp?.location || {};
              return (
                <div
                  key={camp._id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">{camp.title}</h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {camp.status || "Unknown"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{camp.description || "No description"}</p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span>{campDate ? campDate.toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span>{camp?.time?.start || "N/A"} - {camp?.time?.end || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>
                        {[location.venue, location.city, location.state]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCamps;
