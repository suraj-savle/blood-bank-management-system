import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Droplet, MapPin, Phone, Clock, Send } from "lucide-react";

const HospitalRequestBlood = () => {
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState({
    labId: "",
    bloodType: "",
    units: ""
  });
  const [loading, setLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(true);

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLabsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/facility/labs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLabs(res.data.labs || []);
        console.log("Labs loaded:", res.data.labs);
      } catch (err) {
        console.error("Load labs error:", err);
        toast.error("Failed to load blood labs");
      } finally {
        setLabsLoading(false);
      }
    };
    loadLabs();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/hospital/blood/request",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Blood request sent successfully!");
      setForm({ labId: "", bloodType: "", units: "" });
      console.log("Request sent:", response.data);
    } catch (err) {
      console.error("Submit request error:", err);
      toast.error(err.response?.data?.message || "Failed to send request");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Droplet className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Request Blood</h1>
          </div>
          <p className="text-gray-600">Request blood units from approved blood labs</p>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          <form onSubmit={submitRequest} className="space-y-6">
            {/* Select Lab */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-red-600" />
                Select Blood Lab
              </label>
              {labsLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  Loading labs...
                </div>
              ) : (
                <select
                  value={form.labId}
                  onChange={(e) => setForm({ ...form, labId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                  disabled={labs.length === 0}
                >
                  <option value="">-- Select Blood Lab --</option>
                  {labs.map((lab) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.name} — {lab.address?.city}
                      {lab.operatingHours && ` (${lab.operatingHours.open} - ${lab.operatingHours.close})`}
                    </option>
                  ))}
                </select>
              )}
              {labs.length === 0 && !labsLoading && (
                <p className="text-sm text-red-600 mt-1">No approved blood labs available</p>
              )}
            </div>

            {/* Blood Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Droplet size={16} className="text-red-600" />
                Blood Type
              </label>
              <select
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-purple-500 transition-colors"
                required
              >
                <option value="">-- Select Blood Type --</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Units */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Units Needed
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-purple-500 transition-colors"
                value={form.units}
                min="1"
                max="100"
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                placeholder="Enter number of units"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Minimum 1 unit, maximum 100 units</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || labs.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Blood Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Available Labs Info */}
        {labs.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-red-600" />
              Available Blood Labs ({labs.length})
            </h3>
            <div className="grid gap-3">
              {labs.map((lab) => (
                <div key={lab._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{lab.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={12} />
                      {lab.address?.street}, {lab.address?.city}, {lab.address?.state} - {lab.address?.pincode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock size={12} />
                      {lab.operatingHours?.open} - {lab.operatingHours?.close}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone size={12} />
                      {lab.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalRequestBlood;