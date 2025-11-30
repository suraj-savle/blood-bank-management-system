import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplet,
  Calendar,
  Search,
  Filter,
  Download,
  MapPin,
  AlertCircle,
  Award,
  TrendingUp,
  Heart,
  Shield,
  Star,
  Share2,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api/donor";

const DonorDonationHistory = () => {
  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalUnits: 0,
    lifeImpact: 0,
    lastDonation: null,
    favoriteFacility: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Fetch History
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view your donation history");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data =
        res.data.history ||
        res.data.donations ||
        (Array.isArray(res.data) ? res.data : []);
      console.log("Fetched donation history:", data);

      // Sort by date descending initially
      data.sort(
        (a, b) =>
          new Date(b.donationDate || b.date) -
          new Date(a.donationDate || a.date)
      );

      setHistory(data);
      setFiltered(data);
      calculateStats(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load donation history");
      }
    }
    setLoading(false);
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const totalDonations = data.length;
    const totalUnits = data.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    const lifeImpact = totalUnits * 3; // Each unit can save up to 3 lives
    const lastDonation =
      data.length > 0 ? data[0].donationDate || data[0].date : null;

    // Find most frequent facility
    const facilityCount = data.reduce((acc, item) => {
      const facility = item.facility || item.city || "Unknown";
      acc[facility] = (acc[facility] || 0) + 1;
      return acc;
    }, {});

    const favoriteFacility = Object.keys(facilityCount).reduce(
      (a, b) => (facilityCount[a] > facilityCount[b] ? a : b),
      "None"
    );

    setStats({
      totalDonations,
      totalUnits,
      lifeImpact,
      lastDonation,
      favoriteFacility,
    });
  };

  // Get donor level based on donations
  const getDonorLevel = (count) => {
    if (count >= 10)
      return {
        level: "Hero",
        color: "from-purple-500 to-pink-500",
        icon: <Award className="w-5 h-5" />,
      };
    if (count >= 5)
      return {
        level: "Champion",
        color: "from-red-500 to-orange-500",
        icon: <Star className="w-5 h-5" />,
      };
    if (count >= 3)
      return {
        level: "Supporter",
        color: "from-green-500 to-teal-500",
        icon: <TrendingUp className="w-5 h-5" />,
      };
    return {
      level: "Starter",
      color: "from-blue-500 to-cyan-500",
      icon: <Heart className="w-5 h-5" />,
    };
  };

  // Filter and sort data
  const applyFilter = () => {
    let filteredData = [...history];

    // Time filter
    if (filterType !== "all") {
      const months = {
        last3: 3,
        last6: 6,
        last12: 12,
      }[filterType];

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      filteredData = filteredData.filter((item) => {
        const donationDate = new Date(item.donationDate || item.date);
        return donationDate >= cutoff;
      });
    }

    // Search filter
    if (searchTerm.trim()) {
      filteredData = filteredData.filter(
        (item) =>
          item.facility?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data
    filteredData.sort((a, b) => {
      const dateA = new Date(a.donationDate || a.date);
      const dateB = new Date(b.donationDate || b.date);

      switch (sortBy) {
        case "date-asc":
          return dateA - dateB;
        case "date-desc":
          return dateB - dateA;
        case "units-desc":
          return (b.quantity || 1) - (a.quantity || 1);
        default:
          return dateB - dateA;
      }
    });

    setFiltered(filteredData);
  };

  // Export data
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Facility",
      "City",
      "Blood Group",
      "Units",
      "Status",
    ];
    const csvData = filtered.map((item) =>
      [
        new Date(item.donationDate || item.date).toLocaleDateString(),
        item.facility || "Blood Donation Camp",
        item.city || "N/A",
        item.bloodGroup || "N/A",
        item.quantity || 1,
        "Completed",
      ].join(",")
    );

    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation-history.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully!");
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [searchTerm, filterType, sortBy, history]);

  const donorLevel = getDonorLevel(stats.totalDonations);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <div className="p-3 bg-red-100 rounded-2xl">
              <Droplet className="w-8 h-8 text-red-600" />
            </div>
            Your <span className="text-red-600">Donation Journey</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your life-saving contributions and see the impact you're
            making
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Donations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDonations}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Droplet className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Units Donated
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUnits}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Lives Impacted
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.lifeImpact}+
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Level</p>
                <p className="text-xl font-bold text-gray-900">
                  {donorLevel.level}
                </p>
              </div>
              <div
                className={`p-3 bg-gradient-to-r ${donorLevel.color} rounded-xl text-white`}
              >
                {donorLevel.icon}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by facility, city, or blood group..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 bg-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Time</option>
                  <option value="last3">Last 3 Months</option>
                  <option value="last6">Last 6 Months</option>
                  <option value="last12">Last 12 Months</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 bg-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="units-desc">Most Units</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">
              Loading your heroic journey...
            </p>
            <p className="text-gray-500">
              Fetching your life-saving contributions
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {history.length === 0
                  ? "No Donations Yet"
                  : "No Matching Records"}
              </h3>
              <p className="text-gray-600 mb-6">
                {history.length === 0
                  ? "Start your life-saving journey by making your first blood donation."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {history.length === 0 && (
                <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
                  Schedule Your First Donation
                </button>
              )}
            </div>
          </div>
        )}

        {/* Donation History Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filtered.length}</span>{" "}
                donation{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-4">
              {filtered.map((item, index) => {
                const date = new Date(item.donationDate || item.date);
                const isRecent = new Date() - date < 30 * 24 * 60 * 60 * 1000; // Within 30 days

                return (
                  <div
                    key={item._id || index}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-xl ${
                            isRecent
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <Droplet className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.bloodGroup || "Blood"} Donation
                            </h3>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Completed
                            </span>
                            {isRecent && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                Recent
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-red-500" />
                              <span>
                                {date.toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          {item.city && (
                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.city}
                              {item.state && `, ${item.state}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          +{item.quantity || 1}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Units</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDonationHistory;
