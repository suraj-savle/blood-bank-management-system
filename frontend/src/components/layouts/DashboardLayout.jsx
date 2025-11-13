// src/pages/dashboard/DashboardLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Briefcase,
  Users,
  BarChart3,
  CheckCircle,
  Award,
  Droplet,
  HeartPulse,
  ClipboardList,
  Activity,
  History,
  Building,
  Megaphone,
  Shield,
  Calendar,
  AlertTriangle,
  ClipboardPlus,
  Ambulance,
  TestTube,
  Stethoscope,
} from "lucide-react";

const DashboardLayout = ({ userRole = "donor" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Blood Bank Theme Colors
  const theme = {
    primary: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444", // Main red
      600: "#dc2626", // Dark red
      700: "#b91c1c", // Darker red
      800: "#991b1b",
      900: "#7f1d1d",
    },
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    accent: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const user = data.user;

          // Check if the role matches current layout
          if (user.role.toLowerCase() !== userRole.toLowerCase()) {
            console.error(
              `Role mismatch: expected ${userRole}, got ${user.role}`
            );
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }else

          setUserData(user);
          // Fetch notifications
          fetchNotifications(token);
        } else {
          console.error("Failed to fetch profile");
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [userRole, navigate]);

  const fetchNotifications = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Enhanced Sidebar menus for BBMS with blood bank icons
  const menuConfig = {
    donor: {
      title: "Blood Donor Portal",
      subtitle: "Be a Hero, Save Lives",
      items: [
        { path: "/donor", label: "Dashboard", icon: BarChart3 },
        { path: "/donor/profile", label: "My Profile", icon: User },
        { path: "/donor/donate", label: "Donate Blood", icon: Droplet },
        { path: "/donor/history", label: "Donation History", icon: History },
        { path: "/donor/camps", label: "Blood Donation Camps", icon: Calendar },
        { path: "/donor/achievements", label: "My Achievements", icon: Award },
      ],
    },
    hospital: {
      title: "Hospital Management",
      subtitle: "Blood Request & Inventory",
      items: [
        { path: "/hospital", label: "Dashboard", icon: BarChart3 },
        {
          path: "/hospital/requests",
          label: "Blood Requests",
          icon: ClipboardList,
        },
        {
          path: "/hospital/inventory",
          label: "Blood Inventory",
          icon: Droplet,
        },
        { path: "/hospital/donors", label: "Donor Management", icon: Users },
        {
          path: "/hospital/camps",
          label: "Organize Blood Camp",
          icon: Calendar,
        },
        {
          path: "/hospital/emergency",
          label: "Emergency Requests",
          icon: Ambulance,
        },
        {
          path: "/hospital/reports",
          label: "Reports & Analytics",
          icon: Activity,
        },
      ],
    },
    blood_lab: {
      title: "Blood Lab Center",
      subtitle: "Testing & Quality Control",
      items: [
        { path: "/lab", label: "Dashboard", icon: BarChart3 },
        { path: "/lab/inventory", label: "Blood Inventory", icon: Droplet },
        { path: "/lab/testing", label: "Blood Testing", icon: TestTube },
        {
          path: "/lab/requests",
          label: "Hospital Requests",
          icon: ClipboardList,
        },
        { path: "/lab/profile", label: "profile", icon: CheckCircle },
        { path: "/lab/camps", label: "Blood Donation Camps", icon: Calendar },
        { path: "/lab/supply", label: "Blood Supply Chain", icon: Activity },
      ],
    },
    admin: {
      title: "BBMS Admin Panel",
      subtitle: "System Administration",
      items: [
        { path: "/admin", label: "Overview", icon: BarChart3 },
        {
          path: "/admin/verification",
          label: "Facility Verification",
          icon: Shield,
        },
        {
          path: "/admin/facilities",
          label: "Hospitals & Labs",
          icon: Building,
        },
        { path: "/admin/donors", label: "Donor Management", icon: Users },
        { path: "/admin/inventory", label: "Blood Inventory", icon: Droplet },
        {
          path: "/admin/requests",
          label: "Blood Requests",
          icon: ClipboardList,
        },
        { path: "/admin/camps", label: "Blood Donation Camps", icon: Calendar },
        {
          path: "/admin/emergency",
          label: "Emergency Alerts",
          icon: AlertTriangle,
        },
        { path: "/admin/analytics", label: "System Analytics", icon: Activity },
        {
          path: "/admin/settings",
          label: "System Settings",
          icon: Stethoscope,
        },
      ],
    },
  };
const normalizedRole = userRole?.toLowerCase().replace("-", "_");
const config =
  menuConfig[normalizedRole] || {
    title: "Dashboard",
    subtitle: "Welcome to the Blood Bank System",
    items: [],
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "emergency":
        return AlertTriangle;
      case "request":
        return ClipboardList;
      case "approval":
        return CheckCircle;
      case "camp":
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "emergency":
        return "text-red-600 bg-red-50";
      case "request":
        return "text-blue-600 bg-blue-50";
      case "approval":
        return "text-green-600 bg-green-50";
      case "camp":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* HEADER */}
      <header
        className="flex justify-between items-center bg-white/95 backdrop-blur-md shadow-lg border-b border-red-200 px-6 py-4 sticky top-0 z-50"
        style={{
          background: `linear-gradient(135deg, ${theme.primary[50]} 0%, white 50%, ${theme.primary[50]} 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-red-100 transition-all duration-200"
            style={{ color: theme.primary[600] }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <ClipboardPlus size={24} className="text-red-600" />
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: theme.primary[700] }}
              >
                {config?.title || "Dashboard"}
              </h1>
              <p className="text-sm" style={{ color: theme.secondary[500] }}>
                {config?.subtitle || "Welcome Back!"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div className="relative group">
            <button
              className="p-2 rounded-lg hover:bg-red-100 transition-all duration-200 relative"
              style={{ color: theme.primary[600] }}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-red-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-4 border-b border-red-100">
                <h3
                  className="font-semibold"
                  style={{ color: theme.primary[700] }}
                >
                  Notifications ({notifications.length})
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={index}
                        className={`p-4 border-b border-red-50 last:border-b-0 hover:bg-red-50 cursor-pointer transition-colors ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon size={18} className="mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs opacity-75 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs opacity-60 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.primary[500]}, ${theme.primary[600]})`,
              }}
            >
              {userData?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-right">
              <span
                className="font-medium block"
                style={{ color: theme.primary[700] }}
              >
                {userData?.name || "User"}
              </span>
              <span
                className="text-xs capitalize"
                style={{ color: theme.secondary[500] }}
              >
                {userRole.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-100 transition-all duration-200"
            style={{ color: theme.primary[600] }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-white shadow-xl border-r border-red-100 transition-all duration-300 flex flex-col`}
          style={{
            background: `linear-gradient(to bottom, ${theme.primary[50]}, white)`,
          }}
        >
          {/* Collapse Toggle */}
          <div className="hidden lg:flex justify-end p-4 border-b border-red-100">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-red-100 transition-colors"
              style={{ color: theme.primary[600] }}
            >
              <Menu
                size={16}
                className={`transition-transform duration-300 ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="flex flex-col gap-1">
              {config.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 relative group ${
                      isActive
                        ? "shadow-md font-semibold transform scale-[1.02]"
                        : "hover:shadow-md hover:transform hover:scale-[1.02]"
                    } ${
                      isActive ? "text-white" : "text-gray-700 hover:text-white"
                    }`}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${theme.primary[500]}, ${theme.primary[600]})`
                        : "transparent",
                    }}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <Icon
                      size={20}
                      className="flex-shrink-0"
                      style={{
                        color: isActive ? "white" : theme.primary[600],
                      }}
                    />
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                    {sidebarCollapsed && (
                      <div
                        className="absolute left-full ml-2 px-3 py-2 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary[600]}, ${theme.primary[700]})`,
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer Section */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-red-100">
              <div
                className="p-3 rounded-lg text-center text-xs"
                style={{
                  background: theme.primary[100],
                  color: theme.primary[700],
                }}
              >
                <p className="font-semibold">Blood Bank Management</p>
                <p className="mt-1 opacity-75">Save Lives, Donate Blood</p>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-0" : ""
          }`}
        >
          <div className="h-full overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
