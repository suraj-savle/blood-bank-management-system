import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Droplet,
  Calendar,
  Users,
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Award,
  Heart,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Download,
  Share2,
  Filter,
  Search,
  Bell,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/donor`;

const DonorDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [donor, setDonor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const [profileRes, historyRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios
          .get(`${API_URL}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: {} })), // Fallback if stats endpoint doesn't exist
      ]);

      const donorData = profileRes.data.donor || profileRes.data;
      setDonor(donorData);

      // Handle different response structures for history
      let historyData = [];
      if (historyRes.data.history) {
        historyData = historyRes.data.history;
      } else if (historyRes.data.donations) {
        historyData = historyRes.data.donations;
      } else if (Array.isArray(historyRes.data)) {
        historyData = historyRes.data;
      }

      setHistory(historyData);

      // Calculate dashboard stats
      const totalDonations = historyData.length;
      const livesImpacted = totalDonations * 3; // Each donation can save up to 3 lives
      const achievementLevel =
        totalDonations >= 10
          ? "Gold"
          : totalDonations >= 5
            ? "Silver"
            : "Bronze";
      const nextMilestone =
        totalDonations < 5 ? 5 : totalDonations < 10 ? 10 : 15;
      const completionRate = Math.min(
        100,
        (totalDonations / nextMilestone) * 100,
      );

      setDashboard({
        stats: {
          totalDonations,
          livesImpacted,
          achievementLevel,
          nextMilestone,
          completionRate,
          ...statsRes.data,
        },
        recentActivity: historyData.slice(0, 5),
      });
    } catch (error) {
      console.error("🚨 Donor Dashboard Error:", error);
      const message =
        error.response?.data?.message || "Failed to load donor dashboard data";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard updated");
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, []);

  // Debug current state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Heart className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Donor Dashboard
          </h2>
          <p className="text-gray-500">Preparing your donation journey...</p>
        </div>
      </div>
    );
  }

  const isEligible = donor?.eligibleToDonate || false;
  const nextDonationDate = donor?.nextEligibleDate
    ? new Date(donor.nextEligibleDate)
    : null;
  const daysUntilEligible = nextDonationDate
    ? Math.ceil((nextDonationDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            Donor Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track your donation journey and impact
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

      {/* Eligibility Banner */}
      {!isEligible && nextDonationDate && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">
              Next Donation Available
            </p>
            <p className="text-yellow-600 text-sm">
              You can donate again in {daysUntilEligible} day
              {daysUntilEligible !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {isEligible && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">Ready to Donate!</p>
            <p className="text-green-600 text-sm">
              You are eligible to donate blood now
            </p>
          </div>
        </div>
      )}

      {/* Donor Profile Card */}
      {donor && (
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              Donor Profile
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isEligible
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isEligible ? "Eligible" : "Not Eligible"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LabInfo
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={donor.email}
            />
            <LabInfo
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={donor.phone}
            />
            <LabInfo
              icon={<Droplet className="w-4 h-4" />}
              label="Blood Type"
              value={donor.bloodGroup}
            />
            <LabInfo
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={`${donor.address?.city || "N/A"}, ${donor.address?.state || "N/A"}`}
              truncate
            />
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<Droplet className="w-6 h-6" />}
          label="Total Donations"
          value={dashboard?.stats?.totalDonations || 0}
          subtitle={`${dashboard?.stats?.nextMilestone || 0} to next milestone`}
          color="red"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Lives Impacted"
          value={dashboard?.stats?.livesImpacted || 0}
          subtitle="3 lives per donation"
          color="green"
        />
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          label="Achievement Level"
          value={dashboard?.stats?.achievementLevel || "Bronze"}
          subtitle="Keep donating to level up"
          color="purple"
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          label="Next Eligible"
          value={
            donor?.nextEligibleDate
              ? new Date(donor.nextEligibleDate).toLocaleDateString()
              : "Now"
          }
          subtitle={
            isEligible ? "Ready to donate" : `${daysUntilEligible} days left`
          }
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation History Section */}
        <Section
          title="Donation History"
          icon={<Activity className="w-5 h-5" />}
          subtitle="Your blood donation journey"
        >
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((donation, index) => (
                <DonationHistoryItem
                  key={donation._id || index}
                  donation={donation}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Droplet className="w-8 h-8" />}
              message="No donation history yet"
              actionText="Make your first donation"
              onAction={() => navigate("/donor/camps")}
            />
          )}
        </Section>

        {/* Recent Activity Section */}
        <Section
          title="Recent Activity"
          icon={<Clock className="w-5 h-5" />}
          subtitle="Latest updates and achievements"
        >
          {dashboard?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentActivity.map((activity, index) => (
                <ActivityCard key={activity._id || index} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="w-8 h-8" />}
              message="No recent activity"
            />
          )}
        </Section>
      </div>

      {/* Quick Actions Section */}
      <Section
        title="Quick Actions"
        icon={<Shield className="w-5 h-5" />}
        subtitle="Manage your donor profile"
        className="mt-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<Download className="w-5 h-5" />}
            title="Download Certificate"
            description="Get your donation certificate"
            onClick={() => toast.success("Certificate download started!")}
            color="blue"
          />
          <ActionCard
            icon={<Share2 className="w-5 h-5" />}
            title="Share Achievement"
            description="Share your impact with others"
            onClick={() => toast.success("Share your life-saving journey!")}
            color="green"
          />
          <ActionCard
            icon={<Calendar className="w-5 h-5" />}
            title="Schedule Donation"
            description="Book your next donation"
            onClick={() => navigate("/donor/camps")}
            color="red"
          />
          <ActionCard
            icon={<Users className="w-5 h-5" />}
            title="Invite Friends"
            description="Grow the donor community"
            onClick={() => toast.success("Invite friends to become donors!")}
            color="purple"
          />
        </div>
      </Section>

      {/* Health Stats Section */}
      {donor && (
        <Section
          title="Health Overview"
          icon={<Heart className="w-5 h-5" />}
          subtitle="Your health metrics"
          className="mt-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HealthStat
              label="Age"
              value={donor.age || "N/A"}
              icon={<User className="w-4 h-4" />}
            />
            <HealthStat
              label="Weight"
              value={donor.weight ? `${donor.weight} kg` : "N/A"}
              icon={<Activity className="w-4 h-4" />}
            />
            <HealthStat
              label="Last Donation"
              value={
                donor.lastDonationDate
                  ? new Date(donor.lastDonationDate).toLocaleDateString()
                  : "Never"
              }
              icon={<Calendar className="w-4 h-4" />}
            />
            <HealthStat
              label="Donor Since"
              value={
                donor.createdAt
                  ? new Date(donor.createdAt).getFullYear()
                  : new Date().getFullYear()
              }
              icon={<Award className="w-4 h-4" />}
            />
          </div>
        </Section>
      )}
    </div>
  );
};

// Reusable Components (same as your blood lab dashboard)
const MetricCard = ({ icon, label, value, subtitle, color, alert = false }) => {
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
      className={`bg-white rounded-xl shadow-lg border-l-4 ${alert ? "border-l-red-400" : colors.border} p-5 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && (
            <p
              className={`text-xs ${alert ? "text-red-600" : "text-gray-500"} mt-1`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${alert ? "bg-red-100 text-red-600" : `${colors.bg} ${colors.text}`}`}
        >
          {icon}
        </div>
      </div>
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

const DonationHistoryItem = ({ donation }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-red-100 rounded-lg text-red-600">
        <Droplet className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-gray-800">
          {donation.facility || "Blood Donation Camp"}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(
            donation.donationDate || donation.date,
          ).toLocaleDateString()}{" "}
          • {donation.bloodType || donation.bloodGroup}
        </p>
      </div>
    </div>
    <div className="text-right">
      <span className="font-bold text-gray-800">
        {donation.quantity || 1} unit
      </span>
      <p className="text-xs text-green-600 mt-1">Completed</p>
    </div>
  </div>
);

const ActivityCard = ({ activity }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <h4 className="font-medium text-gray-800 mb-1">
        {activity.eventType || "Donation"}
      </h4>
      <p className="text-sm text-gray-600">
        {activity.description || "Blood donation completed"}
      </p>
    </div>
    <div className="text-right">
      <span className="text-xs text-gray-500">
        {new Date(activity.date || activity.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const ActionCard = ({ icon, title, description, onClick, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
    green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
    red: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
    purple:
      "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-colors ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm opacity-75">{description}</p>
    </button>
  );
};

const HealthStat = ({ label, value, icon }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
    <div className="p-2 bg-red-100 rounded-lg text-red-600">{icon}</div>
  </div>
);

const EmptyState = ({ icon, message, actionText, onAction }) => (
  <div className="text-center py-8 text-gray-500">
    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="text-sm mb-3">{message}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
      >
        {actionText}
      </button>
    )}
  </div>
);

export default DonorDashboard;
