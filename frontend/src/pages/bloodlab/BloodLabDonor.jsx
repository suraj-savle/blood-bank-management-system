import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Droplet, 
  Calendar,
  CheckCircle,
  XCircle,
  History,
  Filter,
  Plus
} from "lucide-react";

const BloodLabDonor = () => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationData, setDonationData] = useState({
    quantity: 1,
    remarks: "",
    bloodGroup: ""
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    total: 0
  });

  // Search donors
  const searchDonors = async () => {
    if (!term.trim()) {
      toast.error("Please enter search term");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/blood-lab/donors/search?term=${term}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResults(res.data.donors || []);
      if (res.data.donors.length === 0) {
        toast.error("No donors found");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Load recent donations and stats
  const loadRecentDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "/api/blood-lab/donations/recent",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentDonations(res.data.donations || []);
      setStats(res.data.stats || { today: 0, thisWeek: 0, total: 0 });
    } catch (err) {
      console.error("Failed to load recent donations:", err);
    }
  };

  useEffect(() => {
    loadRecentDonations();
  }, []);

  // Open donation form
  const openDonationForm = (donor) => {
    setSelectedDonor(donor);
    setDonationData({
      quantity: 1,
      remarks: "",
      bloodGroup: donor.bloodGroup
    });
    setShowDonationForm(true);
  };

  // Mark donation
  const markDonation = async () => {
    if (!selectedDonor) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/blood-lab/donors/donate/${selectedDonor._id}`,
        donationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Donation recorded successfully!");
      setShowDonationForm(false);
      setSelectedDonor(null);
      searchDonors(); // Refresh search results
      loadRecentDonations(); // Refresh recent donations
    } catch (err) {
      console.error("Donation error:", err);
      toast.error(err.response?.data?.message || "Failed to record donation");
    }
  };

  // Quick donation (1 unit, no remarks)
  const quickDonation = async (donorId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/blood-lab/donors/donate/${donorId}`,
        { quantity: 1, remarks: "Quick donation" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Donation recorded!");
      searchDonors();
      loadRecentDonations();
    } catch (err) {
      toast.error("Failed to record donation");
    }
  };

  const canDonate = (lastDonationDate) => {
    if (!lastDonationDate) return true;
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return lastDonation < threeMonthsAgo;
  };

  const getTimeSinceLastDonation = (lastDonationDate) => {
    if (!lastDonationDate) return "Never donated";
    
    const lastDonation = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
                Donor Management
              </h1>
              <p className="text-gray-600 mt-1">Search and manage blood donors</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">{stats.today}</div>
              <div className="text-sm text-gray-600">Donations Today</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">{stats.thisWeek}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Donations</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" />
                Search Donors
              </h2>
              
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone number..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchDonors()}
                  />
                </div>
                <button
                  onClick={searchDonors}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search size={18} />
                  )}
                  Search
                </button>
              </div>

              {/* Results */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((donor) => (
                  <div key={donor._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg">{donor.fullName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donor.bloodGroup === 'O-' ? 'bg-red-100 text-red-800' :
                            donor.bloodGroup === 'O+' ? 'bg-orange-100 text-orange-800' :
                            donor.bloodGroup === 'A-' ? 'bg-blue-100 text-blue-800' :
                            donor.bloodGroup === 'A+' ? 'bg-green-100 text-green-800' :
                            donor.bloodGroup === 'B-' ? 'bg-purple-100 text-purple-800' :
                            donor.bloodGroup === 'B+' ? 'bg-indigo-100 text-indigo-800' :
                            donor.bloodGroup === 'AB-' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {donor.bloodGroup}
                          </span>
                          {!canDonate(donor.lastDonationDate) && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Recently Donated
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-red-500" />
                            <span>{donor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-red-500" />
                            <span>{donor.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-red-500" />
                            <span>Last donation: {getTimeSinceLastDonation(donor.lastDonationDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <History size={14} className="text-red-500" />
                            <span>Total donations: {donor.donationHistory?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openDonationForm(donor)}
                          disabled={!canDonate(donor.lastDonationDate)}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                          <Plus size={16} />
                          Donate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.length === 0 && !loading && term && (
                  <div className="text-center py-8 text-gray-500">
                    <User size={48} className="mx-auto mb-2 text-gray-400" />
                    <p>No donors found matching "{term}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Donations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-red-600" />
                Recent Donations
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentDonations.map((donation, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">{donation.donorName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        donation.bloodGroup === 'O-' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {donation.bloodGroup}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{donation.quantity} unit{donation.quantity > 1 ? 's' : ''}</span>
                        <span>{new Date(donation.date).toLocaleDateString()}</span>
                      </div>
                      {donation.remarks && (
                        <p className="text-xs text-gray-500 mt-1">Note: {donation.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {recentDonations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent donations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Modal */}
        {showDonationForm && selectedDonor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Record Donation
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Donor
                  </label>
                  <p className="font-semibold text-gray-800">{selectedDonor.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedDonor.email} | {selectedDonor.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={donationData.bloodGroup}
                    onChange={(e) => setDonationData({...donationData, bloodGroup: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    value={donationData.quantity}
                    onChange={(e) => setDonationData({...donationData, quantity: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={donationData.remarks}
                    onChange={(e) => setDonationData({...donationData, remarks: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={markDonation}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
                >
                  Confirm Donation
                </button>
                <button
                  onClick={() => setShowDonationForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodLabDonor;