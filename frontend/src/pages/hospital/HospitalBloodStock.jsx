import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Droplet, Plus, Minus, AlertTriangle, CheckCircle, 
  Calendar, RefreshCw, TrendingUp, TrendingDown, 
  BarChart3, Package, Clock, AlertCircle, Filter,
  Download, Printer, Search, ChevronDown, ChevronUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const HospitalBloodStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("bloodGroup");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showGraph, setShowGraph] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState(null);

  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/hospital`;
  const token = localStorage.getItem("token");

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUnits = stock.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStock = stock.filter(item => (item.quantity || 0) < 10).length;
    const criticalStock = stock.filter(item => (item.quantity || 0) < 3).length;
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const expiringSoon = stock.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= nextWeek && expiryDate > today;
    }).length;

    const expired = stock.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) <= today;
    }).length;

    const bloodTypesCount = stock.length;

    return {
      totalUnits,
      lowStock,
      criticalStock,
      expiringSoon,
      expired,
      bloodTypesCount,
      averageUnits: bloodTypesCount > 0 ? (totalUnits / bloodTypesCount).toFixed(1) : 0
    };
  }, [stock]);

  // Load stock data
  const loadStock = useCallback(async (showToastMsg = false) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/blood/stock`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      const stockData = response.data?.data || [];
      setStock(stockData);
      
      if (showToastMsg) {
        toast.success(`Loaded ${stockData.length} blood types`);
      }
    } catch (err) {
      console.error("Load stock error:", err);
      
      let errorMessage = "Failed to load blood stock";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please check your connection.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  // Get color based on blood type for cards
  const getBloodTypeColor = useCallback((bloodType) => {
    const colors = {
      "A+": "from-red-500 to-red-600",
      "A-": "from-red-400 to-red-500",
      "B+": "from-blue-500 to-blue-600",
      "B-": "from-blue-400 to-blue-500",
      "O+": "from-green-500 to-green-600",
      "O-": "from-green-400 to-green-500",
      "AB+": "from-purple-500 to-purple-600",
      "AB-": "from-purple-400 to-purple-500"
    };
    return colors[bloodType] || "from-gray-500 to-gray-600";
  }, []);

  // Get stock status
  const getStockStatus = useCallback((quantity, expiryDate) => {
    if (!expiryDate) return { status: "unknown", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    if (expiry < today) {
      return { status: "expired", color: "bg-red-100 text-red-800", icon: AlertTriangle, priority: 1 };
    }
    
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3) {
      return { status: "critical", color: "bg-red-100 text-red-800", icon: AlertTriangle, priority: 2 };
    } else if (daysUntilExpiry <= 7) {
      return { status: "warning", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, priority: 3 };
    } else if (quantity < 5) {
      return { status: "low", color: "bg-orange-100 text-orange-800", icon: AlertTriangle, priority: 4 };
    } else if (quantity < 10) {
      return { status: "moderate", color: "bg-blue-100 text-blue-800", icon: CheckCircle, priority: 5 };
    } else {
      return { status: "good", color: "bg-green-100 text-green-800", icon: CheckCircle, priority: 6 };
    }
  }, []);

  // Get stock for a specific blood type
  const getStockForType = useCallback((bloodType) => {
    return stock.find(item => item.bloodGroup === bloodType) || {
      bloodGroup: bloodType,
      quantity: 0,
      expiryDate: null,
      _id: `temp-${bloodType}`
    };
  }, [stock]);

  // Filter and sort stock for table
  const filteredAndSortedStock = useMemo(() => {
    let filtered = stock.filter(item => 
      item.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case "bloodGroup":
          aVal = a.bloodGroup;
          bVal = b.bloodGroup;
          break;
        case "quantity":
          aVal = a.quantity || 0;
          bVal = b.quantity || 0;
          break;
        case "expiryDate":
          aVal = new Date(a.expiryDate || 0);
          bVal = new Date(b.expiryDate || 0);
          break;
        case "status":
          const aStatus = getStockStatus(a.quantity, a.expiryDate);
          const bStatus = getStockStatus(b.quantity, b.expiryDate);
          aVal = aStatus.priority;
          bVal = bStatus.priority;
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [stock, searchTerm, sortBy, sortOrder, getStockStatus]);

  // Chart data for visualization
  const chartData = useMemo(() => {
    return stock.map(item => ({
      blood: item.bloodGroup,
      units: item.quantity || 0,
      status: getStockStatus(item.quantity, item.expiryDate).status
    }));
  }, [stock, getStockStatus]);

  // Get chart bar color based on quantity
  const getBarColor = useCallback((units) => {
    if (units < 3) return "#ef4444";
    if (units < 10) return "#f59e0b";
    if (units < 20) return "#3b82f6";
    return "#22c55e";
  }, []);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Blood Type", "Quantity (units)", "Expiry Date", "Status", "Days Left"];
    const rows = stock.map(item => {
      const daysLeft = item.expiryDate ? Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : "N/A";
      const status = getStockStatus(item.quantity, item.expiryDate).status;
      return [item.bloodGroup, item.quantity, new Date(item.expiryDate).toLocaleDateString(), status, daysLeft];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blood-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Stock data exported successfully");
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Check if there are critical alerts
  const hasCriticalAlerts = useMemo(() => {
    return stock.some(item => {
      const status = getStockStatus(item.quantity, item.expiryDate);
      return status.status === 'critical' || status.status === 'expired' || (item.quantity || 0) < 3;
    });
  }, [stock, getStockStatus]);

  if (loading && stock.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading blood stock inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                  <Droplet className="w-7 h-7 text-white" />
                </div>
                Blood Stock Inventory
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage your hospital's blood supply efficiently</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowGraph(!showGraph)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
              >
                <BarChart3 size={18} />
                {showGraph ? "Hide Graph" : "Show Graph"}
              </button>
              
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
              >
                <Download size={18} />
                Export
              </button>
              
              <button
                onClick={printReport}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
              >
                <Printer size={18} />
                Print
              </button>
              
              <button
                onClick={() => loadStock(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Units</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUnits}</p>
              <div className="flex items-center gap-1 mt-1">
                <Package size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Blood units</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Blood Types</p>
              <p className="text-2xl font-bold text-green-600">{stats.bloodTypesCount}</p>
              <div className="flex items-center gap-1 mt-1">
                <Droplet size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Available types</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-yellow-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">&lt;10 units</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalStock}</p>
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">&lt;3 units</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Within 7 days</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-gray-500 hover:shadow-xl transition-shadow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expired</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Past expiry</p>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        {showGraph && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-slideDown">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-red-500" />
              Blood Stock Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="blood" />
                  <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="units" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.units)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Blood Type Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-500" />
            Blood Type Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {bloodTypes.map((bloodType) => {
              const stockItem = getStockForType(bloodType);
              const status = getStockStatus(stockItem.quantity, stockItem.expiryDate);
              const StatusIcon = status.icon;
              const isExpired = stockItem.expiryDate && new Date(stockItem.expiryDate) < new Date();
              
              return (
                <div
                  key={bloodType}
                  onClick={() => setSelectedBloodType(selectedBloodType === bloodType ? null : bloodType)}
                  className={`bg-gradient-to-br ${getBloodTypeColor(bloodType)} rounded-xl shadow-lg p-4 text-center transition-all duration-300 cursor-pointer hover:scale-105 ${
                    isExpired ? 'opacity-60' : ''
                  } ${selectedBloodType === bloodType ? 'ring-4 ring-offset-2 ring-red-400 scale-105' : ''}`}
                >
                  <div className="text-white">
                    <div className="text-xl font-bold mb-1">{bloodType}</div>
                    <div className="text-3xl font-bold mb-2">{stockItem.quantity || 0}</div>
                    <div className="flex items-center justify-center gap-1 text-xs bg-white bg-opacity-20 rounded-full px-2 py-1">
                      <StatusIcon size={12} />
                      <span className="capitalize">{status.status}</span>
                    </div>
                    {stockItem.expiryDate && (
                      <div className="text-xs mt-2 opacity-90">
                        {isExpired ? 'Expired' : 'Expires'} {new Date(stockItem.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by blood type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSort("bloodGroup")}
              className={`px-4 py-2 rounded-lg border transition-all ${
                sortBy === "bloodGroup" ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-300"
              }`}
            >
              Blood Type {sortBy === "bloodGroup" && (sortOrder === "asc" ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
            </button>
            <button
              onClick={() => handleSort("quantity")}
              className={`px-4 py-2 rounded-lg border transition-all ${
                sortBy === "quantity" ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-300"
              }`}
            >
              Quantity {sortBy === "quantity" && (sortOrder === "asc" ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
            </button>
            <button
              onClick={() => handleSort("expiryDate")}
              className={`px-4 py-2 rounded-lg border transition-all ${
                sortBy === "expiryDate" ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-300"
              }`}
            >
              Expiry {sortBy === "expiryDate" && (sortOrder === "asc" ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
            </button>
          </div>
        </div>

        {/* Detailed Stock Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500" />
              Detailed Inventory
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredAndSortedStock.length} records)
              </span>
            </h2>
          </div>

          {filteredAndSortedStock.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No blood stock available</h3>
              <p className="text-gray-600 mb-4">Request blood from blood labs to build your inventory</p>
              <button
                onClick={() => window.location.href = '/hospital/request-blood'}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Request Blood
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 text-left font-semibold text-gray-700">Blood Type</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Quantity</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Expiry Date</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Days Left</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStock.map((item) => {
                    const status = getStockStatus(item.quantity, item.expiryDate);
                    const StatusIcon = status.icon;
                    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysLeft = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
                    const isExpired = daysLeft !== null && daysLeft <= 0;

                    return (
                      <tr 
                        key={item._id} 
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          isExpired ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getBloodTypeColor(item.bloodGroup)} text-white shadow-sm`}>
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${item.quantity < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                              {item.quantity || 0}
                            </span>
                            <span className="text-sm text-gray-500">units</span>
                            {item.quantity < 5 && <AlertTriangle size={16} className="text-red-500" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${status.color}`}>
                            <StatusIcon size={14} />
                            <span className="capitalize">{status.status}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-700'}>
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {daysLeft !== null ? (
                            <span className={
                              daysLeft <= 0 ? 'text-red-600 font-bold' :
                              daysLeft <= 3 ? 'text-red-600 font-medium' :
                              daysLeft <= 7 ? 'text-yellow-600 font-medium' :
                              'text-green-600'
                            }>
                              {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts Section */}
        {hasCriticalAlerts && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg animate-pulse">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={22} />
              Critical Alerts
            </h3>
            <div className="space-y-3">
              {stock.map((item) => {
                const status = getStockStatus(item.quantity, item.expiryDate);
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                
                if (status.status === 'critical' || status.status === 'expired' || (item.quantity || 0) < 3) {
                  return (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-red-800 text-lg">{item.bloodGroup}</p>
                          <p className="text-sm text-red-600">
                            {isExpired ? '❌ Blood units have expired and must be disposed' :
                             status.status === 'critical' ? '⚠️ Blood expiring within 3 days' :
                             '⚠️ Critically low stock level'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{item.quantity || 0} units</p>
                        <p className="text-xs text-red-500">
                          Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/hospital/request-blood'}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <Plus size={18} />
                Request More Blood
              </button>
              <button
                onClick={() => loadStock(true)}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw size={18} />
                Refresh Inventory
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              Stock Status Guide
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Good</span>
                </div>
                <span className="text-xs text-gray-500">≥10 units & not expiring soon</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span>Warning</span>
                </div>
                <span className="text-xs text-gray-500">Expiring within 7 days</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-600" />
                  <span>Low</span>
                </div>
                <span className="text-xs text-gray-500">&lt;5 units available</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span>Critical</span>
                </div>
                <span className="text-xs text-gray-500">Expiring within 3 days</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span>Expired</span>
                </div>
                <span className="text-xs text-gray-500">Past expiry date</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HospitalBloodStock;