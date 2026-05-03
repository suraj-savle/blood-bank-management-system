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
  TrendingUp,
  Heart,
  User,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api`;

const AdminDonationHistory = () => {
  const [donations, setDonations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalDonors: 0,
    activeDonors: 0,
    totalUnitsCollected: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Fetch all donors and their donation history
  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view donation records");
        setLoading(false);
        return;
      }

      // Get all donors
      const donorsRes = await axios.get(`${API_URL}/admin/donors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Flatten all donations from all donors
      const allDonations = [];
      let totalUnits = 0;

      if (donorsRes.data.donors) {
        donorsRes.data.donors.forEach((donor) => {
          if (donor.donationHistory && Array.isArray(donor.donationHistory)) {
            donor.donationHistory.forEach((donation) => {
              allDonations.push({
                ...donation,
                donorId: donor._id,
                donorName: donor.name,
                donorEmail: donor.email,
                bloodType: donor.bloodType,
              });
              totalUnits += donation.unitsCollected || 1;
            });
          }
        });
      }

      setStats({
        totalDonations: allDonations.length,
        totalDonors: donorsRes.data.donors?.length || 0,
        activeDonors: donorsRes.data.donors?.filter((d) => d.isEligible)?.length || 0,
        totalUnitsCollected: totalUnits,
      });

      // Sort by date descending
      allDonations.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDonations(allDonations);
      setFiltered(allDonations);
    } catch (err) {
      console.error("Error fetching donations:", err);
      toast.error("Failed to fetch donation records");
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter
  useEffect(() => {
    let result = donations;

    // Search
    if (searchTerm) {
      result = result.filter(
        (d) =>
          d.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.donorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.bloodType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((d) => d.status === filterStatus);
    }

    // Sort
    if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "donor-name") {
      result.sort((a, b) => a.donorName?.localeCompare(b.donorName || ""));
    }

    setFiltered(result);
  }, [searchTerm, filterStatus, sortBy, donations]);

  useEffect(() => {
    fetchDonations();
  }, []);

  const downloadReport = () => {
    try {
      const csv = [
        ["Donor Name", "Email", "Blood Type", "Date", "Units", "Status", "Facility"],
        ...filtered.map((d) => [
          d.donorName,
          d.donorEmail,
          d.bloodType,
          new Date(d.date).toLocaleDateString(),
          d.unitsCollected || 1,
          d.status || "completed",
          d.facility || "N/A",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donation-history-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Droplet className="w-12 h-12 text-red-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading donation records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Droplet className="w-8 h-8 text-red-500" />
            All Donation Records
          </h1>
          <p className="text-gray-600 mt-2">View and manage all donations across the system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Donations</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalDonations}</p>
              </div>
              <Heart className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Donors</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalDonors}</p>
              </div>
              <User className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Donors</p>
                <p className="text-3xl font-bold text-gray-800">{stats.activeDonors}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Units Collected</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalUnitsCollected}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Search Donor
              </label>
              <input
                type="text"
                placeholder="By name, email, or blood type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="donor-name">Donor Name</option>
              </select>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {/* Donation Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Donor Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Blood Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Units
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Facility
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((donation, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{donation.donorName}</p>
                          <p className="text-sm text-gray-600">{donation.donorEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {donation.bloodType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(donation.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700 font-medium">
                        {donation.unitsCollected || 1}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            donation.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : donation.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {donation.status || "Completed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {donation.facility ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {donation.facility}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No donation records found</p>
            </div>
          )}
        </div>

        {/* Result Count */}
        {filtered.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-right">
            Showing {filtered.length} of {donations.length} donations
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDonationHistory;
