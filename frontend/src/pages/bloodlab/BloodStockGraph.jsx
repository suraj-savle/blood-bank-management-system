import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { Droplets, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import toast from "react-hot-toast";

const BloodStockGraph = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const token = localStorage.getItem("token");
  const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/blood-lab`;

  // Blood group order for consistent display
  const BLOOD_GROUP_ORDER = useMemo(() => ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], []);
  
  // Thresholds
  const THRESHOLDS = useMemo(() => ({
    CRITICAL: 5,
    LOW: 10,
    OPTIMAL: 20
  }), []);

  // Define getStatus BEFORE it's used
  const getStatus = useCallback((units) => {
    if (units <= THRESHOLDS.CRITICAL) return { text: "Critical", icon: TrendingDown, color: "text-red-600" };
    if (units <= THRESHOLDS.LOW) return { text: "Low", icon: TrendingDown, color: "text-orange-500" };
    if (units >= THRESHOLDS.OPTIMAL) return { text: "Optimal", icon: TrendingUp, color: "text-green-600" };
    return { text: "Moderate", icon: Minus, color: "text-blue-500" };
  }, [THRESHOLDS]);

  // Get color based on units - define BEFORE useMemo that uses it
  const getColor = useCallback((units) => {
    if (units <= THRESHOLDS.CRITICAL) return "#ef4444"; // Red - Critical
    if (units <= THRESHOLDS.LOW) return "#f59e0b"; // Amber - Low
    if (units >= THRESHOLDS.OPTIMAL) return "#22c55e"; // Green - Optimal
    return "#3b82f6"; // Blue - Moderate
  }, [THRESHOLDS]);

  // Transform and sort data - now getStatus and getColor are defined
  const chartData = useMemo(() => {
    if (!Array.isArray(stock) || stock.length === 0) return [];
    
    // Create a map for quick lookup
    const stockMap = new Map();
    stock.forEach(item => {
      if (item.bloodGroup && typeof item.quantity === 'number') {
        stockMap.set(item.bloodGroup, item.quantity);
      }
    });
    
    // Sort according to predefined order
    return BLOOD_GROUP_ORDER
      .filter(bloodGroup => stockMap.has(bloodGroup))
      .map(bloodGroup => ({
        blood: bloodGroup,
        units: stockMap.get(bloodGroup),
        status: getStatus(stockMap.get(bloodGroup))
      }));
  }, [stock, BLOOD_GROUP_ORDER, getStatus]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!chartData.length) return null;
    
    const totalUnits = chartData.reduce((sum, item) => sum + item.units, 0);
    const averageUnits = totalUnits / chartData.length;
    const criticalBloodGroups = chartData.filter(item => item.units <= THRESHOLDS.CRITICAL);
    const lowBloodGroups = chartData.filter(item => item.units > THRESHOLDS.CRITICAL && item.units <= THRESHOLDS.LOW);
    
    return {
      totalUnits,
      averageUnits: averageUnits.toFixed(1),
      criticalCount: criticalBloodGroups.length,
      lowCount: lowBloodGroups.length,
      healthyCount: chartData.length - criticalBloodGroups.length - lowBloodGroups.length
    };
  }, [chartData, THRESHOLDS]);

  // Fetch stock data
  const fetchStock = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      const { data } = await axios.get(`${API_URL}/blood/stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (data.success && Array.isArray(data.data)) {
        setStock(data.data);
        setLastUpdated(new Date());
        if (showToast) {
          toast.success("Blood stock updated successfully");
        }
      } else {
        throw new Error(data.message || "Invalid data format received");
      }
    } catch (err) {
      console.error("Graph Fetch Error:", err);
      
      let errorMessage = "Failed to load blood stock data";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh && !loading) {
      intervalId = setInterval(() => {
        fetchStock(false);
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchStock, loading]);

  // Initial fetch
  useEffect(() => {
    fetchStock(true);
  }, [fetchStock]);

  // Format last updated time
  const getLastUpdatedText = useCallback(() => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    return lastUpdated.toLocaleTimeString();
  }, [lastUpdated]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchStock(true);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast.success(autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled");
  };

  // Custom Tooltip - defined after getStatus and getColor
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = getStatus(data.units);
      const StatusIcon = status.icon;
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-2xl font-bold" style={{ color: getColor(data.units) }}>
            {data.units} units
          </p>
          <p className={`text-sm flex items-center gap-1 mt-1 ${status.color}`}>
            <StatusIcon size={14} />
            {status.text}
          </p>
          {data.units <= THRESHOLDS.CRITICAL && (
            <p className="text-xs text-red-600 mt-1">⚠️ Immediate attention needed</p>
          )}
        </div>
      );
    }
    return null;
  }, [getStatus, getColor, THRESHOLDS]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Droplets className="text-red-500 w-6 h-6" />
            Blood Stock Overview
          </h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {getLastUpdatedText()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={toggleAutoRefresh}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              autoRefresh 
                ? "bg-green-50 text-green-600 hover:bg-green-100" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            title={autoRefresh ? "Auto-refresh is on" : "Auto-refresh is off"}
          >
            <RefreshCw size={14} className={autoRefresh ? "animate-spin-slow" : ""} />
            Auto
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Updating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && !error && statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium">Total Units</p>
            <p className="text-2xl font-bold text-blue-700">{statistics.totalUnits}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium">Average</p>
            <p className="text-2xl font-bold text-green-700">{statistics.averageUnits}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3">
            <p className="text-xs text-red-600 font-medium">Critical</p>
            <p className="text-2xl font-bold text-red-700">{statistics.criticalCount}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
            <p className="text-xs text-orange-600 font-medium">Low Stock</p>
            <p className="text-2xl font-bold text-orange-700">{statistics.lowCount}</p>
          </div>
        </div>
      )}

      {/* Chart or Error/Loading State */}
      {loading ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
          <p className="text-gray-500">Loading blood stock data...</p>
        </div>
      ) : error ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-red-600 text-center mb-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <Droplets className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No blood stock data available</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="blood" 
                tick={{ fill: "#666", fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'Units (mL)', angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                tick={{ fill: "#666" }}
              />
              <Tooltip content={CustomTooltip} />
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
              
              <Bar 
                dataKey="units" 
                name="Blood Units" 
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.units)}
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend and Notes */}
      {!loading && !error && chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Critical (&le;{THRESHOLDS.CRITICAL} units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">Low ({THRESHOLDS.CRITICAL + 1}-{THRESHOLDS.LOW} units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Moderate ({THRESHOLDS.LOW + 1}-{THRESHOLDS.OPTIMAL - 1} units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Optimal (&ge;{THRESHOLDS.OPTIMAL} units)</span>
            </div>
          </div>
          
          {statistics?.criticalCount > 0 && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-700 text-center flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                ⚠️ {statistics.criticalCount} blood group{statistics.criticalCount > 1 ? 's are' : ' is'} critically low. Immediate restocking recommended!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BloodStockGraph;

// Add this to your global CSS or tailwind.config.js
const style = document.createElement('style');
style.textContent = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
`;
document.head.appendChild(style);