import { useState, useEffect } from "react";
import { 
  Users, 
  Hospital, 
  Droplet, 
  Calendar, 
  Heart, 
  TrendingUp,
  Activity,
  Shield,
  Beaker,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      console.log("🔄 Fetching admin dashboard stats...");
      
      const res = await fetch("http://localhost:5000/api/admin/dashboard", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("📨 Dashboard response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Dashboard API Error:", errorText);
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      console.log("✅ Dashboard stats:", data);
      setStats(data);
      
      if (showToast) {
        toast.success("Dashboard updated successfully!");
      }
    } catch (err) {
      console.error("🚨 Dashboard error:", err);
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Shield className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-gray-500">Preparing system overview...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-red-100 p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to retrieve system statistics. Please try again.
          </p>
          <button
            onClick={() => fetchStats(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, label, value, subtitle, trend, color = "red" }) => {
    const colorClasses = {
      red: { border: 'border-l-red-400', bg: 'bg-red-100', text: 'text-red-600' },
      blue: { border: 'border-l-blue-400', bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { border: 'border-l-green-400', bg: 'bg-green-100', text: 'text-green-600' },
      purple: { border: 'border-l-purple-400', bg: 'bg-purple-100', text: 'text-purple-600' },
      amber: { border: 'border-l-amber-400', bg: 'bg-amber-100', text: 'text-amber-600' },
    };

    const colors = colorClasses[color] || colorClasses.red;

    return (
      <div className={`bg-white rounded-2xl shadow-lg border-l-4 ${colors.border} p-6 hover:shadow-xl transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{value?.toLocaleString()}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
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

  const QuickActionCard = ({ title, description, icon, href, buttonText = "Manage" }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {description}
      </p>
      
      <button
        onClick={() => (window.location.href = href)}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
      >
        {buttonText}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const AlertCard = ({ type, title, description, count, icon }) => {
    const alertConfig = {
      warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600'
      },
      critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
      }
    };

    const config = alertConfig[type] || alertConfig.info;

    return (
      <div className={`${config.bg} border ${config.border} rounded-2xl p-6`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${config.iconBg} ${config.iconColor}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${config.text}`}>{title}</h3>
            <p className={config.text}>
              {count} {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive overview of the blood bank management system
                </p>
              </div>
            </div>
            
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 text-center border border-red-100">
              <div className="text-2xl font-bold text-red-600">{stats.totalDonors}</div>
              <div className="text-sm text-gray-600">Donors</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-red-100">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFacilities}</div>
              <div className="text-sm text-gray-600">Facilities</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-red-100">
              <div className="text-2xl font-bold text-green-600">{stats.totalDonations}</div>
              <div className="text-sm text-gray-600">Donations</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-red-100">
              <div className="text-2xl font-bold text-purple-600">{stats.upcomingCamps}</div>
              <div className="text-sm text-gray-600">Camps</div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Total Donors"
              value={stats.totalDonors}
              subtitle="Registered blood donors"
              color="red"
            />
            
            <StatCard
              icon={<Hospital className="w-6 h-6" />}
              label="Facilities"
              value={stats.totalFacilities}
              subtitle="Hospitals & Labs"
              color="blue"
            />
            
            <StatCard
              icon={<Droplet className="w-6 h-6" />}
              label="Total Donations"
              value={stats.totalDonations}
              subtitle="Blood units collected"
              color="green"
            />
            
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              label="Upcoming Camps"
              value={stats.upcomingCamps}
              subtitle="Scheduled blood drives"
              color="purple"
            />
            
            <StatCard
              icon={<Heart className="w-6 h-6" />}
              label="Active Donors"
              value={stats.activeDonors}
              subtitle="Recently donated"
              color="amber"
            />
          </div>
        </div>

        {/* System Alerts Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            System Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(stats.pendingApprovals > 0) && (
              <AlertCard
                type="warning"
                title="Pending Approvals"
                description="facility registration(s) awaiting review"
                count={stats.pendingApprovals}
                icon={<Clock className="w-6 h-6" />}
              />
            )}
            
            {(stats.criticalStock > 0) && (
              <AlertCard
                type="critical"
                title="Critical Stock Alert"
                description="blood type(s) with low inventory"
                count={stats.criticalStock}
                icon={<Droplet className="w-6 h-6" />}
              />
            )}

            {/* Additional alert for pending facilities */}
            {(stats.pendingFacilities > 0) && (
              <AlertCard
                type="info"
                title="Facility Applications"
                description="new facility application(s) pending"
                count={stats.pendingFacilities}
                icon={<Hospital className="w-6 h-6" />}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-red-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              icon={<Users className="w-5 h-5" />}
              title="Manage Donors"
              description="View, edit, or remove donors from the blood bank system"
              href="/admin/donors"
            />
            
            <QuickActionCard
              icon={<Hospital className="w-5 h-5" />}
              title="Manage Facilities"
              description="Approve, edit, or manage hospitals and blood laboratories"
              href="/admin/facilities"
            />
            
            <QuickActionCard
              icon={<Droplet className="w-5 h-5" />}
              title="Donation History"
              description="View all donation records, analytics, and reports"
              href="/admin/donations"
            />
            
            <QuickActionCard
              icon={<Calendar className="w-5 h-5" />}
              title="Blood Camps"
              description="Monitor and manage upcoming blood donation camps"
              href="/admin/camps"
              buttonText="View Camps"
            />
          </div>
        </div>

        {/* Recent Activity Section */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-red-50 rounded-lg px-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <Activity className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-gray-700">{activity.description}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;