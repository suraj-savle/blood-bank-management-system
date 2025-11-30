import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
  CheckCircle,
  Droplet,
  ClipboardList,
  Activity,
  History,
  Building,
  Shield,
  Calendar,
  AlertTriangle,
  ClipboardPlus,
  Ambulance,
  TestTube,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Loader2,
} from "lucide-react";

const DashboardLayout = ({ userRole = "donor" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

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

  // Enhanced Sidebar menus for BBMS with blood bank icons
  const menuConfig = {
    donor: {
      title: "Blood Donor Portal",
      subtitle: "Be a Hero, Save Lives",
      shortTitle: "Donor",
      icon: User,
      items: [
        { path: "/donor", label: "Dashboard", icon: BarChart3, badge: null },
        { path: "/donor/profile", label: "My Profile", icon: User, badge: null },
        { path: "/donor/history", label: "Donation History", icon: History, badge: null },
        { path: "/donor/camps", label: "Blood Camps", icon: Calendar, badge: null },
      ],
    },
    hospital: {
      title: "Hospital Management",
      subtitle: "Blood Request & Inventory",
      shortTitle: "Hospital",
      icon: Building,
      items: [
        { path: "/hospital", label: "Dashboard", icon: BarChart3, badge: null },
        { path: "/hospital/blood-request-create", label: "Blood Requests", icon: ClipboardList, badge: null },
        { path: "/hospital/inventory", label: "Inventory", icon: Droplet, badge: null },
        { path: "/hospital/donors", label: "Donors", icon: User, badge: null },
        { path: "/hospital/blood-request-history", label: "History", icon: Ambulance, badge: null },
      ],
    },
    blood_lab: {
      title: "Blood Lab Center",
      subtitle: "Testing & Quality Control",
      shortTitle: "Lab",
      icon: TestTube,
      items: [
        { path: "/lab", label: "Dashboard", icon: BarChart3, badge: null },
        { path: "/lab/inventory", label: "Inventory", icon: Droplet, badge: null },
        { path: "/lab/Donor", label: "Donors", icon: User, badge: null },
        { path: "/lab/camps", label: "Camps", icon: Calendar, badge: null },
        { path: "/lab/requests", label: "Requests", icon: ClipboardList, badge: null },
        { path: "/lab/profile", label: "Profile", icon: CheckCircle, badge: null },
      ],
    },
    admin: {
      title: "BBMS Admin Panel",
      subtitle: "System Administration",
      shortTitle: "Admin",
      icon: Shield,
      items: [
        { path: "/admin", label: "Overview", icon: BarChart3, badge: null },
        { path: "/admin/verification", label: "Verification", icon: Shield, badge: null },
        { path: "/admin/facilities", label: "Facilities", icon: Building, badge: null },
        { path: "/admin/donors", label: "Donors", icon: User, badge: null },
      ],
    },
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true); // Start loading
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Simple implementation of retries for robustness
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          const res = await fetch("http://localhost:5000/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            const user = data.user;

            if (!user) {
                throw new Error("User data structure invalid.");
            }

            if (user.role.toLowerCase() !== userRole.toLowerCase()) {
              console.error(`Role mismatch: expected ${userRole}, got ${user.role}`);
              localStorage.removeItem("token");
              navigate("/login");
              return;
            }

            setUserData(user);
            setIsLoading(false); // Success
            return;

          } else if (res.status === 401 || res.status === 403) {
            // Unauthorized/Forbidden
            console.error("Authentication failed or token expired.");
            localStorage.removeItem("token");
            navigate("/login");
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1}: Failed to fetch user data.`, error);
        }

        // Prepare for retry with exponential backoff (e.g., 1s, 2s, 4s)
        attempt++;
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      // If all attempts fail
      console.error("All attempts to fetch user data failed.");
      localStorage.removeItem("token");
      navigate("/login");
      setIsLoading(false);
    };

    fetchUserData();
  }, [userRole, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const normalizedRole = userRole?.toLowerCase().replace("-", "_");
  const config = menuConfig[normalizedRole] || {
    title: "Dashboard",
    subtitle: "Welcome to the Blood Bank System",
    shortTitle: "App",
    icon: BarChart3,
    items: [],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  


  const getBadgeColor = (badge) => {
    if (badge === "New") return "bg-green-500 text-white";
    if (badge === "Low") return "bg-red-500 text-white";
    if (badge === "High") return "bg-orange-500 text-white";
    return "bg-blue-500 text-white";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="mt-4 text-gray-600 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 to-white">
      {/* HEADER */}
      <header
        className={`flex justify-between items-center bg-white/95 backdrop-blur-md shadow-sm border-b border-red-100 px-4 sm:px-6 py-3 sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : 'shadow-sm'
        }`}
        style={{
          background: `linear-gradient(135deg, ${theme.primary[50]} 0%, white 50%, ${theme.primary[50]} 100%)`,
        }}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-red-100 transition-all duration-200"
            style={{ color: theme.primary[600] }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 shadow-sm">
              <ClipboardPlus size={20} className="text-red-600" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold" style={{ color: theme.primary[700] }}>
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: theme.secondary[500] }}>
                {config.subtitle}
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold" style={{ color: theme.primary[700] }}>
                {config.shortTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
         
          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white"
              style={{
                background: `linear-gradient(135deg, ${theme.primary[500]}, ${theme.primary[600]})`,
              }}
            >
              {userData?.name?.charAt(0)?.toUpperCase() || userData?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-right">
              <span className="font-medium block text-sm" style={{ color: theme.primary[700] }}>
                {userData?.name || userData.fullName || "User"}
              </span>
              <span className="text-xs capitalize" style={{ color: theme.secondary[500] }}>
                {userRole.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-100 transition-all duration-200 hidden sm:block"
            style={{ color: theme.primary[600] }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR (omitted for brevity) */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-white shadow-xl border-r border-red-100 transition-all duration-300 flex flex-col transform lg:transform-none`}
          style={{
            background: `linear-gradient(to bottom, ${theme.primary[50]}, white)`,
          }}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-100">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <config.icon size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: theme.primary[700] }}>
                    {config.shortTitle}
                  </h2>
                  <p className="text-xs" style={{ color: theme.secondary[500] }}>
                    Portal
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-red-100 transition-colors"
              style={{ color: theme.primary[600] }}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
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
                        : "hover:shadow-md hover:transform hover:scale-[1.02] hover:bg-red-50"
                    } ${
                      isActive ? "text-white" : "text-gray-700 hover:text-red-700"
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
                      <>
                        <span className="flex-1 text-left whitespace-nowrap text-sm">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getBadgeColor(item.badge)}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && item.badge && (
                      <span
                        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getBadgeColor(item.badge).replace('text-white', '')}`}
                      />
                    )}
                    {sidebarCollapsed && (
                      <div
                        className="absolute left-full ml-2 px-3 py-2 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary[600]}, ${theme.primary[700]})`,
                        }}
                      >
                        {item.label}
                        {item.badge && ` (${item.badge})`}
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
                className="p-3 rounded-lg text-center"
                style={{
                  background: theme.primary[100],
                  color: theme.primary[700],
                }}
              >
                <p className="text-sm font-semibold">Blood Bank MS</p>
                <p className="text-xs mt-1 opacity-75">Save Lives, Donate Blood</p>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main
          className={`flex-1 transition-all duration-300 min-h-[calc(100vh-80px)] ${
            sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
          }`}
        >
          <div className="h-full overflow-auto p-4 sm:p-6">
            {/* PASSING DATA TO OUTLET HERE */}
            <Outlet context={{ userData, theme }} />
          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY (omitted for brevity) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Footer Navigation (omitted for brevity) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-red-100 shadow-lg z-40">
        <div className="flex justify-around items-center p-2">
          {config.items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 flex-1 mx-1 ${
                  isActive ? 'bg-red-50 text-red-600' : 'text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;