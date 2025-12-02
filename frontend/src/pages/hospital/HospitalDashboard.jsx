import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  CalendarDays,
  Activity,
  Droplet,
  Clock,
  History,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import axios from "axios";

const HospitalDashboard = () => {
  const [hospital, setHospital] = useState(null);
  const [bloodStock, setBloodStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    lowStock: 0,
    expiringSoon: 0,
    pendingRequests: 0,
    totalRequests: 0
  });

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token being sent:", token);

        if (!token) {
          window.location.href = "/login";
          return;
        }

        // Fetch hospital profile
        const profileRes = await fetch("http://localhost:5000/api/facility/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Facility getProfile route hit!");

        if (!profileRes.ok) {
          throw new Error("Failed to fetch hospital data");
        }

        const profileData = await profileRes.json();
        console.log("Hospital API response:", profileData);

        const h = profileData.hospital || profileData.facility || profileData;

        if (!h) {
          throw new Error("No hospital data found in response");
        }

        // Fetch blood stock
        const stockRes = await axios.get("http://localhost:5000/api/hospital/blood/stock", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch blood requests
        const requestsRes = await axios.get("http://localhost:5000/api/hospital/blood/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const stockData = stockRes.data.data || [];
        const requestsData = requestsRes.data.data || [];

        // Calculate stats
        const totalUnits = stockData.reduce((sum, item) => sum + item.quantity, 0);
        const lowStock = stockData.filter(item => item.quantity < 5).length;
        
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const expiringSoon = stockData.filter(item => {
          const expiryDate = new Date(item.expiryDate);
          return expiryDate <= nextWeek && expiryDate > today;
        }).length;

        const pendingRequests = requestsData.filter(req => req.status === "pending").length;

        setHospital({
          name: h.name,
          email: h.email,
          phone: h.phone,
          type: h.facilityType,
          category: h.facilityCategory,
          address: `${h.address?.street}, ${h.address?.city}, ${h.address?.state} - ${h.address?.pincode}`,
          status: h.status,
          operatingHours: h.operatingHours,
          history: h.history || [],
          lastLogin: h.lastLogin
        });

        setBloodStock(stockData);
        setRequests(requestsData);
        setStats({
          totalUnits,
          lowStock,
          expiringSoon,
          pendingRequests,
          totalRequests: requestsData.length
        });

      } catch (err) {
        console.error("Error fetching hospital data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  const getLoginHistory = () => {
    if (!hospital?.history) return [];
    return hospital.history
      .filter(event => event.eventType === "Login")
      .slice(0, 5) // Last 5 logins
      .map(login => ({
        date: login.date,
        description: login.description || "System login",
        ip: login.description?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || "Facilities Login"
      }));
  };

  const getRecentActivity = () => {
    if (!hospital?.history) return [];
    return hospital.history
      .filter(event => event.eventType !== "Login")
      .slice(0, 10) // Last 10 activities
      .map(activity => ({
        date: activity.date,
        eventType: activity.eventType,
        description: activity.description,
        referenceId: activity.referenceId
      }));
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      "A+": "bg-red-100 text-red-800 border-red-300",
      "A-": "bg-red-50 text-red-700 border-red-200",
      "B+": "bg-blue-100 text-blue-800 border-blue-300",
      "B-": "bg-blue-50 text-blue-700 border-blue-200",
      "O+": "bg-green-100 text-green-800 border-green-300",
      "O-": "bg-green-50 text-green-700 border-green-200",
      "AB+": "bg-purple-100 text-purple-800 border-purple-300",
      "AB-": "bg-purple-50 text-purple-700 border-purple-200"
    };
    return colors[bloodType] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStockStatus = (quantity, expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry <= today) {
      return { status: "expired", color: "bg-red-100 text-red-800", icon: AlertTriangle };
    }
    
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3) {
      return { status: "critical", color: "bg-red-100 text-red-800", icon: AlertTriangle };
    } else if (daysUntilExpiry <= 7) {
      return { status: "warning", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle };
    } else if (quantity < 5) {
      return { status: "low", color: "bg-orange-100 text-orange-800", icon: AlertTriangle };
    } else {
      return { status: "good", color: "bg-green-100 text-green-800", icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading hospital dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to load hospital data</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page or contact support.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const loginHistory = getLoginHistory();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your hospital overview.</p>
        </div>

        {/* Hospital Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="bg-red-100 p-4 rounded-xl">
              <Building2 className="text-red-600 w-8 h-8" />
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{hospital.name}</h2>
                  <p className="text-gray-500">{hospital.email}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3">
                    <p className="text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {hospital.address}
                    </p>
                    
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-red-500" />
                      {hospital.phone}
                    </p>

                    <p className="text-gray-600">
                      Category: <span className="font-medium">{hospital.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle size={14} />
                    {hospital.status?.toUpperCase() || "ACTIVE"}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Last Login: {hospital.lastLogin ? new Date(hospital.lastLogin).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-400">
            <div className="flex items-center gap-3">
              <Droplet className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalUnits}</div>
                <div className="text-sm text-gray-600">Total Blood Units</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-green-400">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{bloodStock.length}</div>
                <div className="text-sm text-gray-600">Blood Types</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-yellow-400">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-400">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-purple-400">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Blood Inventory Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-600" />
              Blood Inventory
            </h3>
            
            {bloodStock.length === 0 ? (
              <div className="text-center py-8">
                <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No blood inventory available</p>
                <button
                  onClick={() => window.location.href = '/hospital/request-blood'}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Request Blood
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bloodStock.slice(0, 6).map((item) => {
                  const status = getStockStatus(item.quantity, item.expiryDate);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBloodTypeColor(item.bloodGroup)}`}>
                          {item.bloodGroup}
                        </span>
                        <span className="text-lg font-semibold">{item.quantity} units</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon size={16} className={status.color.replace('bg-', 'text-').split(' ')[0]} />
                        <span className="text-sm text-gray-600 capitalize">{status.status}</span>
                      </div>
                    </div>
                  );
                })}
                
                {bloodStock.length > 6 && (
                  <button
                    onClick={() => window.location.href = '/hospital/blood-stock'}
                    className="w-full text-center text-red-600 hover:text-red-700 py-2 border border-dashed border-gray-300 rounded-lg"
                  >
                    View All {bloodStock.length} Blood Types
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              Recent Blood Requests
            </h3>
            
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No blood requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{request.bloodType}</div>
                      <div className="text-sm text-gray-600">
                        {request.units} units • {request.labId?.name || 'Unknown Lab'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
                
                {requests.length > 5 && (
                  <button
                    onClick={() => window.location.href = '/hospital/request-history'}
                    className="w-full text-center text-red-600 hover:text-red-700 py-2 border border-dashed border-gray-300 rounded-lg"
                  >
                    View All {requests.length} Requests
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login History */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Recent Logins
            </h3>
            
            {loginHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No login history available</p>
            ) : (
              <div className="space-y-3">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{login.ip}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(login.date).toLocaleString()}
                      </div>
                    </div>
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-red-600" />
              Recent Activity
            </h3>
            
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 capitalize">
                        {activity.eventType?.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;