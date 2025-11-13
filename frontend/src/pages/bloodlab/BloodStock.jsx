import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Droplets, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  AlertTriangle,
  Beaker,
  TrendingDown
} from "lucide-react";
import { toast } from "react-hot-toast";

const BloodStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState("add");
  const [form, setForm] = useState({ 
    bloodType: "", 
    quantity: "" 
  });

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/blood-lab";

  // Blood types for dropdown
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Fetch current stock
  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/blood/stock`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console .log("Fetched Stock Data:", data);
      if (data.success) {
        setStock(data.data || []);
      } else {
        toast.error("Failed to load blood stock");
      }
    } catch (error) {
      console.error("Fetch Stock Error:", error);
      toast.error(error.response?.data?.message || "Failed to load blood stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.bloodType || !form.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = action === "add" ? "/blood/add" : "/blood/remove";
      const { data } = await axios.post(
        `${API_URL}${endpoint}`, 
        form, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setForm({ bloodType: "", quantity: "" });
        fetchStock();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Stock Update Error:", error);
      toast.error(
        error.response?.data?.message || `Error ${action === "add" ? "adding" : "removing"} blood stock`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Check for low stock items
  const lowStockItems = stock.filter(item => item.quantity < 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Droplets className="w-6 h-6 text-red-600" />
            </div>
            Blood Stock Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your blood inventory and track stock levels
          </p>
        </div>
        
        <button
          onClick={fetchStock}
          disabled={loading}
          className="mt-4 lg:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Stock'}
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Low Stock Alert</p>
            <p className="text-amber-600 text-sm">
              {lowStockItems.length} blood type{lowStockItems.length > 1 ? 's' : ''} have low inventory
            </p>
          </div>
        </div>
      )}

      {/* Stock Management Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-red-600" />
          {action === "add" ? "Add Blood Stock" : "Remove Blood Stock"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Type
            </label>
            <select
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select Blood Type</option>
              {bloodTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                action === "add"
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              }`}
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : action === "add" ? (
                <PlusCircle className="w-4 h-4" />
              ) : (
                <MinusCircle className="w-4 h-4" />
              )}
              {submitting ? "Processing..." : action === "add" ? "Add Units" : "Remove Units"}
            </button>
          </div>
        </form>
      </div>

      {/* Blood Stock Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-red-600" />
            Current Blood Inventory
          </h2>
          <div className="text-sm text-gray-500">
            Total: {stock.reduce((sum, item) => sum + item.quantity, 0)} units
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading blood stock...</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No blood stock available.</p>
            <p className="text-sm">Start by adding some blood units to your inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-3 font-medium text-gray-700">Blood Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Quantity</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Expiry Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => {
                  const isLowStock = item.quantity < 10;
                  const isCritical = item.quantity < 5;
                  
                  return (
                    <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{item.bloodGroup}</span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${
                          isCritical ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-gray-800'
                        }`}>
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="p-3">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <TrendingDown className="w-3 h-3" />
                            Critical
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-gray-600">
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
    </div>
  );
};

export default BloodStock;