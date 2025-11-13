import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplet,
  Calendar,
  Users,
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building2,
  Shield,
  Timer,
  LogIn,
  AlertCircle,
  RefreshCw,
  Beaker,
  Stethoscope,
  Heart,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api/blood-lab";

const BloodLabDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stock, setStock] = useState([]);
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔄 Starting dashboard data fetch...");
      console.log("🔑 Token present:", !!token);

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      console.log("📡 Making API requests...");

      const [dashboardRes, stockRes, profileRes] = await Promise.all([
        axios
          .get(`${API_URL}/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.error(
              "❌ Dashboard API Error:",
              err.response?.status,
              err.message
            );
            throw err;
          }),
        axios
          .get(`${API_URL}/blood/stock`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.error(
              "❌ Stock API Error:",
              err.response?.status,
              err.message
            );
            throw err;
          }),
        // Use the history endpoint instead of dashboard for history data
        axios
          .get(`${API_URL}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.error(
              "❌ History API Error:",
              err.response?.status,
              err.message
            );
            // Fallback to dashboard if history endpoint doesn't exist
            return axios.get(`${API_URL}/dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }),
      ]);

      console.log("✅ API Responses received:");
      console.log("📊 Dashboard Response:", dashboardRes.data);
      console.log("🩸 Stock Response:", stockRes.data);
      console.log("📜 History/Profile Response:", profileRes.data);

      setDashboard(dashboardRes.data);

      // Fix: Handle different response structures for stock
      let stockData = [];
      if (stockRes.data.data) {
        stockData = stockRes.data.data; // { success: true, data: [...] }
      } else if (stockRes.data.stock) {
        stockData = stockRes.data.stock; // { stock: [...] }
      } else if (Array.isArray(stockRes.data)) {
        stockData = stockRes.data; // [...]
      }
      console.log("📦 Setting stock data:", stockData);
      setStock(stockData);

      // Fix: Handle different response structures for lab/history
      const facilityProfile = dashboardRes.data.facility || {};

      let historyData = [];
      if (profileRes.data.activity) {
        historyData = profileRes.data.activity; // From /history endpoint
      } else {
        // Fallback if /history failed and we used /dashboard instead
        historyData = facilityProfile.history || [];
      }

      console.log("🏢 Setting lab data (from dashboard):", facilityProfile);
      console.log(
        "📚 Setting history data (from history endpoint/fallback):",
        historyData
      );

      setLab({
        ...facilityProfile,
        history: historyData,
      });
    } catch (error) {
      console.error("🚨 Dashboard Error:", error);
      console.log("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      const message =
        error.response?.data?.message || "Failed to load dashboard data";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard updated");
  };

  useEffect(() => {
    console.log("🎯 Dashboard component mounted");
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
      console.log("🏁 Dashboard data loading completed");
    };
    loadData();
  }, []);

  // Debug current state
  console.log("📊 Current State:", {
    dashboard: dashboard,
    stock: stock,
    lab: lab,
    loading: loading,
    stockLength: stock?.length,
    labHistoryLength: lab?.history?.length,
    dashboardCampsLength: dashboard?.recentCamps?.length,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Beaker className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Blood Lab Dashboard
          </h2>
          <p className="text-gray-500">Preparing your medical insights...</p>
        </div>
      </div>
    );
  }

  const totalUnits = stock.reduce(
    (sum, blood) => sum + (blood.quantity || 0),
    0
  );
  const criticalStock = stock.filter(
    (blood) => (blood.quantity || 0) < 10
  ).length;

  console.log("🧮 Calculated metrics:", {
    totalUnits,
    criticalStock,
    stockItems: stock.map((s) => ({
      type: s.bloodGroup || s.bloodType,
      quantity: s.quantity,
      id: s._id,
    })),
  });

  // Get login history - filter for login events
  const loginHistory =
    lab?.history?.filter((h) => h.eventType === "Login") || [];
  console.log("🔐 Login History:", loginHistory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      {/* Debug Panel - Remove in production */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Stock Data: {stock.length} items</div>
          <div>Lab Data: {lab ? "Loaded" : "Missing"}</div>
          <div>Dashboard Data: {dashboard ? "Loaded" : "Missing"}</div>
          <div>Total History: {lab?.history?.length || 0} entries</div>
          <div>Login History: {loginHistory.length} entries</div>
          <div>Recent Camps: {dashboard?.recentCamps?.length || 0} camps</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Beaker className="w-6 h-6 text-red-600" />
            </div>
            Blood Lab Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive overview of your blood laboratory operations
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 lg:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Alert Banner for Critical Stock */}
      {criticalStock > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Low Stock Alert</p>
            <p className="text-red-600 text-sm">
              {criticalStock} blood type{criticalStock > 1 ? "s" : ""} have
              critically low inventory
            </p>
          </div>
        </div>
      )}

      {/* Lab Profile Card */}
      {lab && (
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              Laboratory Overview
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                lab.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {lab.status?.charAt(0).toUpperCase() + lab.status?.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LabInfo
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={lab.email}
            />
            <LabInfo
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={lab.phone}
            />
            <LabInfo
              icon={<Clock className="w-4 h-4" />}
              label="Operating Hours"
              value={`${lab.operatingHours?.open || "--"} - ${
                lab.operatingHours?.close || "--"
              }`}
            />
            <LabInfo
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={`${lab.address?.city}, ${lab.address?.state}`}
              truncate
            />
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          label="Total Camps"
          value={dashboard?.stats?.totalCamps || 0}
          trend={dashboard?.stats?.campsTrend}
          color="blue"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Total Donors"
          value={dashboard?.stats?.totalDonors || 0}
          trend={dashboard?.stats?.donorsTrend}
          color="green"
        />
        <MetricCard
          icon={<Droplet className="w-6 h-6" />}
          label="Blood Units"
          value={totalUnits}
          subtitle={`${criticalStock} critical`}
          color="red"
          alert={criticalStock > 0}
        />
        <MetricCard
          icon={<Activity className="w-6 h-6" />}
          label="Active Camps"
          value={dashboard?.stats?.upcomingCamps || 0}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blood Stock Section */}
        <Section
          title="Blood Inventory"
          icon={<Droplet className="w-5 h-5" />}
          subtitle="Current blood stock levels"
        >
          {stock.length > 0 ? (
            <div className="space-y-3">
              {stock.map((blood) => {
                console.log("🩸 Rendering blood item:", blood);
                const bloodType = blood.bloodGroup || blood.bloodType;
                const quantity = blood.quantity || 0;
                return (
                  <BloodStockItem
                    key={blood._id}
                    bloodType={bloodType}
                    quantity={quantity}
                    critical={quantity < 10}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Droplet className="w-8 h-8" />}
              message="No blood stock data available"
            />
          )}
        </Section>

        {/* Recent Camps Section */}
        <Section
          title="Recent Blood Donation Camps"
          icon={<Calendar className="w-5 h-5" />}
          subtitle="Latest organized camps"
        >
          {dashboard?.recentCamps?.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentCamps.slice(0, 4).map((camp) => {
                console.log("🏕️ Rendering camp:", camp);
                return <CampCard key={camp._id} camp={camp} />;
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              message="No recent camps organized"
            />
          )}
        </Section>
      </div>

      {/* Access History Section - FIXED */}
      <Section
        title="Access History"
        icon={<Shield className="w-5 h-5" />}
        subtitle="Recent login activity"
        className="mt-8"
      >
        {loginHistory.length > 0 ? (
          <div className="space-y-3">
            {loginHistory
              .slice(-5) // Get last 5 items
              .reverse() // Show latest first
              .map((h, idx) => (
                <LoginHistoryItem key={h._id || idx} history={h} />
              ))}
          </div>
        ) : (
          <EmptyState
            icon={<LogIn className="w-8 h-8" />}
            message="No login history available"
          />
        )}
      </Section>

      {/* Activity History Section - NEW: Show all activity */}
      {lab?.history?.length > 0 && (
        <Section
          title="Recent Activity"
          icon={<Activity className="w-5 h-5" />}
          subtitle="All laboratory activities"
          className="mt-8"
        >
          <div className="space-y-3">
            {lab.history
              .slice(-5)
              .reverse()
              .map((h, idx) => (
                <ActivityHistoryItem key={h._id || idx} history={h} />
              ))}
          </div>
        </Section>
      )}
    </div>
  );
};

// Reusable Components
const MetricCard = ({
  icon,
  label,
  value,
  subtitle,
  trend,
  color,
  alert = false,
}) => {
  // Fixed color classes - Tailwind needs full class names
  const colorClasses = {
    blue: {
      border: "border-l-blue-400",
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    green: {
      border: "border-l-green-400",
      bg: "bg-green-100",
      text: "text-green-600",
    },
    red: { border: "border-l-red-400", bg: "bg-red-100", text: "text-red-600" },
    purple: {
      border: "border-l-purple-400",
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-l-4 ${
        alert ? "border-l-red-400" : colors.border
      } p-5 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p
              className={`text-xs ${
                alert ? "text-red-600" : "text-gray-500"
              } mt-1`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${
            alert ? "bg-red-100 text-red-600" : `${colors.bg} ${colors.text}`
          }`}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-green-600 font-medium">{trend}%</span>
          <span className="text-gray-500">from last month</span>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, icon, subtitle, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-lg border border-red-50 p-6 ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {icon} {title}
        </h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const LabInfo = ({ icon, label, value, truncate = false }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-red-100 rounded-lg text-red-600 mt-1">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`font-medium text-gray-800 ${truncate ? "truncate" : ""}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const BloodStockItem = ({ bloodType, quantity, critical = false }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-lg ${
          critical ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
        }`}
      >
        <Droplet className="w-4 h-4" />
      </div>
      <span className="font-medium text-gray-800">{bloodType}</span>
    </div>
    <div className="text-right">
      <span
        className={`font-bold ${critical ? "text-red-600" : "text-gray-800"}`}
      >
        {quantity} units
      </span>
      {critical && <p className="text-xs text-red-500 mt-1">Low stock</p>}
    </div>
  </div>
);

const CampCard = ({ camp }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <h4 className="font-medium text-gray-800 mb-1">{camp.title}</h4>
      <p className="text-sm text-gray-600">
        {new Date(camp.date).toLocaleDateString()}
      </p>
    </div>
    <div className="text-right">
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          camp.status === "Upcoming"
            ? "bg-yellow-100 text-yellow-700"
            : camp.status === "Completed"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {camp.status}
      </span>
      {camp.expectedDonors && (
        <p className="text-xs text-gray-500 mt-1">
          {camp.expectedDonors} donors
        </p>
      )}
    </div>
  </div>
);

const LoginHistoryItem = ({ history }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        <LogIn className="w-3 h-3" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">System Access</p>
        <p className="text-xs text-gray-500">
          {history.description || "Successful login"}
        </p>
      </div>
    </div>
    <span className="text-xs text-gray-500">
      {new Date(history.date).toLocaleString()}
    </span>
  </div>
);

// New component for all activity items
const ActivityHistoryItem = ({ history }) => {
  const getIcon = (eventType) => {
    switch (eventType) {
      case "Login":
        return <LogIn className="w-3 h-3" />;
      case "Stock Update":
        return <Droplet className="w-3 h-3" />;
      case "Blood Camp":
        return <Calendar className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getColor = (eventType) => {
    switch (eventType) {
      case "Login":
        return "bg-blue-100 text-blue-600";
      case "Stock Update":
        return "bg-green-100 text-green-600";
      case "Blood Camp":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${getColor(history.eventType)}`}>
          {getIcon(history.eventType)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {history.eventType}
          </p>
          <p className="text-xs text-gray-500">
            {history.description || "Activity recorded"}
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-500">
        {new Date(history.date).toLocaleString()}
      </span>
    </div>
  );
};

const EmptyState = ({ icon, message }) => (
  <div className="text-center py-8 text-gray-500">
    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

export default BloodLabDashboard;
