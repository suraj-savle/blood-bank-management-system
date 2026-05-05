import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Clock, MapPin, Calendar } from "lucide-react";

const HospitalRequestHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/hospital/blood/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRequests(res.data.data || []);
      } catch (err) {
        console.error("Load history error:", err);
        toast.error("Failed to load request history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const getStatusConfig = (status) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" }
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading history...</span>
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
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Request History</h1>
          </div>
          <p className="text-gray-600">Track your blood request status and history</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-400">
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
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No request history</h3>
              <p className="text-gray-600">Your blood requests will appear here once you make them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 text-left font-semibold text-gray-700">Blood Lab</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Blood Type</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Units</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Request Date</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Processed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const statusConfig = getStatusConfig(request.status);
                    const IconComponent = statusConfig.icon;

                    return (
                      <tr key={request._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-red-600">
                                {request.labId?.name?.charAt(0) || "L"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{request.labId?.name || "Unknown Lab"}</div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin size={12} />
                                {request.labId?.address?.city || "Unknown City"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            {request.bloodType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-lg font-semibold text-gray-800">{request.units}</span>
                          <span className="text-sm text-gray-500 ml-1">units</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
                            <IconComponent size={14} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-400">
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {request.processedAt ? (
                            <>
                              {new Date(request.processedAt).toLocaleDateString()}
                              <br />
                              <span className="text-xs text-gray-400">
                                {new Date(request.processedAt).toLocaleTimeString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">Not processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalRequestHistory;