import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Clock, MapPin, Phone } from "lucide-react";

const LabManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/blood-lab/blood/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Load requests error:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id, action) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/blood-lab/blood/requests/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Request ${action}ed successfully`);
      loadRequests(); // Refresh the list
    } catch (err) {
      console.error("Update status error:", err);
      toast.error(err.response?.data?.message || "Failed to update request");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      accepted: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${config.color}`}>
        <IconComponent size={14} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Blood Requests</h1>
          </div>
          <p className="text-gray-600">Manage blood requests from hospitals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
            <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-yellow-400">
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-400">
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === "accepted").length}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === "rejected").length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No blood requests</h3>
              <p className="text-gray-600">When hospitals request blood, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 text-left font-semibold text-gray-700">Hospital</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Blood Type</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Units</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Date</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-red-600">
                              {req.hospitalId?.name?.charAt(0) || "H"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{req.hospitalId?.name || "Unknown Hospital"}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin size={12} />
                              {req.hospitalId?.address?.city || "Unknown City"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          {req.bloodType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-semibold text-gray-800">{req.units}</span>
                        <span className="text-sm text-gray-500 ml-1">units</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4">
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(req._id, "accept")}
                              className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                              <CheckCircle size={16} />
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(req._id, "reject")}
                              className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status !== "pending" && (
                          <span className="text-gray-500 text-sm">
                            Processed on {new Date(req.processedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabManageRequests;