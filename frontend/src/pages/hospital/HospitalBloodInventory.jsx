import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const HospitalBloodInventory = () => {
  const [bloodStock, setBloodStock] = useState([]);
  const [bloodType, setBloodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(""); // To track which button was clicked

  const token = localStorage.getItem("token");

  const fetchStock = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/blood/stock", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBloodStock(data.stock || []);
    } catch (error) {
      toast.error("Failed to fetch stock");
    }
  };

  const handleAction = async (type) => {
    if (!bloodType || !quantity) {
      toast.error("Please fill all fields");
      return;
    }

    if (parseInt(quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      setActionType(type);
      
      const endpoint = type === "add" ? "add" : "remove";
      const res = await fetch(`http://localhost:5000/api/blood/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bloodType, quantity: parseInt(quantity) }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        fetchStock();
        setQuantity("");
        setBloodType("");
      } else {
        toast.error(data.message || `Error ${type === "add" ? "adding" : "removing"} blood`);
      }
    } catch (error) {
      toast.error(`Error ${type === "add" ? "adding" : "removing"} blood`);
    } finally {
      setLoading(false);
      setActionType("");
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Get low stock items (less than 10 units)
  const lowStockItems = bloodStock.filter(item => item.quantity < 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-700 mb-3">🩸 Blood Stock Management</h1>
          <p className="text-gray-600 text-lg">Manage your hospital's blood inventory efficiently</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Stock Actions
              </h2>
              
              {/* Blood Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white"
                >
                  <option value="">Select Blood Type</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (units) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => handleAction("add")}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading && actionType === "add"
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                  } text-white`}
                >
                  {loading && actionType === "add" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      Add Stock
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleAction("remove")}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading && actionType === "remove"
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 hover:shadow-lg"
                  } text-white`}
                >
                  {loading && actionType === "remove" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <span>➖</span>
                      Remove Stock
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Fill in both fields to add or remove blood units
              </p>
            </div>
          </div>

          {/* Right Column - Stock Display */}
          <div className="lg:col-span-2">
            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-amber-600 text-xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
                    <p className="text-amber-700 text-sm">
                      {lowStockItems.map(item => `${item.bloodType} (${item.quantity} units)`).join(", ")} are running low
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {bloodStock.slice(0, 4).map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-md p-4 text-center border-l-4 border-red-500">
                  <div className="text-2xl font-bold text-red-600">{item.quantity}</div>
                  <div className="text-sm font-medium text-gray-600">{item.bloodType}</div>
                  <div className="text-xs text-gray-500">units</div>
                </div>
              ))}
            </div>

            {/* Detailed Stock Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  📦 Current Blood Inventory
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {bloodStock.length} types
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bloodStock.length > 0 ? (
                      bloodStock.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-gray-900">{b.bloodType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-gray-900">{b.quantity}</span>
                            <span className="text-sm text-gray-500 ml-1">units</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                b.quantity === 0
                                  ? "bg-red-100 text-red-800"
                                  : b.quantity < 10
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {b.quantity === 0
                                ? "Out of Stock"
                                : b.quantity < 10
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center">
                          <div className="text-gray-400 text-lg mb-2">💔</div>
                          <p className="text-gray-500 font-medium">No blood stock found</p>
                          <p className="text-gray-400 text-sm mt-1">Start by adding blood units to your inventory</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalBloodInventory;