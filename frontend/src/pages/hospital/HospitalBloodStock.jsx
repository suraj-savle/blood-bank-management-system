import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Droplet, Plus, Minus, AlertTriangle, CheckCircle, Calendar, RefreshCw } from "lucide-react";

const HospitalBloodStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    lowStock: 0,
    expiringSoon: 0,
    bloodTypes: 0
  });

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const loadStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // In HospitalBloodStock component, change the API call:
const res = await axios.get("/api/hospital/blood/stock", {
  headers: { Authorization: `Bearer ${token}` },
});
      
      const stockData = res.data.data || [];
      setStock(stockData);
      calculateStats(stockData);
      
    } catch (err) {
      console.error("Load stock error:", err);
      toast.error("Failed to load blood stock");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (stockData) => {
    const totalUnits = stockData.reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = stockData.filter(item => item.quantity < 10).length;
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const expiringSoon = stockData.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= nextWeek && expiryDate > today;
    }).length;

    const bloodTypes = stockData.length;

    setStats({
      totalUnits,
      lowStock,
      expiringSoon,
      bloodTypes
    });
  };

  useEffect(() => {
    loadStock();
  }, []);

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

  const getStockForType = (bloodType) => {
    return stock.find(item => item.bloodGroup === bloodType) || {
      bloodGroup: bloodType,
      quantity: 0,
      expiryDate: null
    };
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading blood stock...</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
                Blood Stock Inventory
              </h1>
              <p className="text-gray-600 mt-1">Manage and monitor your hospital's blood supply</p>
            </div>
            <button
              onClick={loadStock}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-gray-800">{stats.totalUnits}</div>
              <div className="text-sm text-gray-600">Total Units</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-green-400">
              <div className="text-2xl font-bold text-green-600">{stats.bloodTypes}</div>
              <div className="text-sm text-gray-600">Blood Types</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-yellow-400">
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
              <div className="text-sm text-gray-600">Expiring Soon</div>
            </div>
          </div>
        </div>

        {/* Blood Type Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Blood Type Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {bloodTypes.map((bloodType) => {
              const stockItem = getStockForType(bloodType);
              const status = getStockStatus(stockItem.quantity, stockItem.expiryDate);
              const StatusIcon = status.icon;
              const isExpiredItem = isExpired(stockItem.expiryDate);

              return (
                <div
                  key={bloodType}
                  className={`bg-white rounded-xl shadow-lg border-2 p-4 text-center transition-all hover:shadow-xl ${
                    getBloodTypeColor(bloodType)
                  } ${isExpiredItem ? 'opacity-60' : ''}`}
                >
                  <div className="text-lg font-bold mb-1">{bloodType}</div>
                  <div className="text-2xl font-bold mb-2">{stockItem.quantity}</div>
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <StatusIcon size={12} />
                    <span className="capitalize">{status.status}</span>
                  </div>
                  {stockItem.expiryDate && (
                    <div className="text-xs mt-2 opacity-75">
                      {isExpiredItem ? 'Expired' : 'Expires'} {new Date(stockItem.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Stock Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-600" />
              Detailed Inventory
            </h2>
          </div>

          {stock.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No blood stock available</h3>
              <p className="text-gray-600 mb-4">Request blood from blood labs to build your inventory</p>
              <button
                onClick={() => window.location.href = '/hospital/request-blood'}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
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
                  {stock.map((item) => {
                    const status = getStockStatus(item.quantity, item.expiryDate);
                    const StatusIcon = status.icon;
                    const today = new Date();
                    const expiryDate = new Date(item.expiryDate);
                    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    const isExpiredItem = isExpired(item.expiryDate);

                    return (
                      <tr 
                        key={item._id} 
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          isExpiredItem ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBloodTypeColor(item.bloodGroup)}`}>
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-800">{item.quantity}</span>
                            <span className="text-sm text-gray-500">units</span>
                            {item.quantity < 5 && (
                              <Minus size={16} className="text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon size={14} />
                            {status.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className={isExpiredItem ? 'text-red-600 font-medium' : 'text-gray-700'}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={
                            daysLeft <= 0 ? 'text-red-600 font-bold' :
                            daysLeft <= 3 ? 'text-red-600 font-medium' :
                            daysLeft <= 7 ? 'text-yellow-600 font-medium' :
                            'text-green-600'
                          }>
                            {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
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
        {stock.some(item => {
          const status = getStockStatus(item.quantity, item.expiryDate);
          return status.status === 'critical' || status.status === 'expired' || item.quantity < 3;
        }) && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Important Alerts
            </h3>
            <div className="space-y-2">
              {stock.map((item) => {
                const status = getStockStatus(item.quantity, item.expiryDate);
                const isExpiredItem = isExpired(item.expiryDate);
                
                if (status.status === 'critical' || status.status === 'expired' || item.quantity < 3) {
                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="font-medium text-red-800">{item.bloodGroup}</span>
                        <span className="text-sm text-red-600">
                          {isExpiredItem ? 'Blood units have expired' :
                           status.status === 'critical' ? 'Blood expiring within 3 days' :
                           'Very low stock level'}
                        </span>
                      </div>
                      <div className="text-sm text-red-600">
                        {item.quantity} units • Expires {new Date(item.expiryDate).toLocaleDateString()}
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/hospital/request-blood'}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Request More Blood
              </button>
              <button
                onClick={loadStock}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh Inventory
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Status Guide</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Good: Adequate stock, not expiring soon</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-600" />
                <span>Low: Less than 5 units available</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-600" />
                <span>Warning: Expiring within 7 days</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span>Critical: Expiring within 3 days</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span>Expired: Blood units have expired</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalBloodStock;