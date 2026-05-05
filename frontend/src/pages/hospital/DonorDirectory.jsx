import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Droplet,
  Calendar,
  Filter,
  Heart,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  MessageCircle,
  Mail as MailIcon
} from "lucide-react";

const DonorDirectory = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    bloodGroup: "all",
    city: "all",
    availability: "all",
    sortBy: "lastDonation"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rareBlood: 0
  });

  // Fetch all donors
  const fetchDonors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        search: searchTerm,
        bloodGroup: filters.bloodGroup,
        city: filters.city,
        availability: filters.availability,
        sortBy: filters.sortBy
      });

      const res = await axios.get(
        `http://localhost:5000/api/hospital/donors?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDonors(res.data.donors || []);
      setStats(res.data.stats || { total: 0, available: 0, rareBlood: 0 });
    } catch (err) {
      console.error("Fetch donors error:", err);
      toast.error("Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [filters, searchTerm]);

  // Contact donor
  const contactDonor = (donor) => {
    setSelectedDonor(donor);
    setShowContactModal(true);
    
    // Log contact attempt in history
    logContactAttempt(donor._id);
  };

  const logContactAttempt = async (donorId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/hopital/donors/${donorId}/contact`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Log contact error:", err);
    }
  };

  // Check donor availability
  const isDonorAvailable = (lastDonationDate) => {
    if (!lastDonationDate) return true;
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return lastDonation < threeMonthsAgo;
  };

  const getAvailabilityStatus = (lastDonationDate) => {
    if (!lastDonationDate) return { status: "available", text: "Available", color: "bg-green-100 text-green-800" };
    
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (lastDonation < threeMonthsAgo) {
      return { status: "available", text: "Available", color: "bg-green-100 text-green-800" };
    }
    
    const nextDonationDate = new Date(lastDonation);
    nextDonationDate.setMonth(nextDonationDate.getMonth() + 3);
    const daysUntilAvailable = Math.ceil((nextDonationDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilAvailable <= 7) {
      return { status: "soon", text: `Available in ${daysUntilAvailable} days`, color: "bg-yellow-100 text-yellow-800" };
    }
    
    return { status: "unavailable", text: "Recently donated", color: "bg-red-100 text-red-800" };
  };

  const getTimeSinceLastDonation = (lastDonationDate) => {
    if (!lastDonationDate) return "Never donated";
    
    const lastDonation = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  const isRareBloodGroup = (bloodGroup) => {
    return ['O-', 'AB-', 'B-', 'A-'].includes(bloodGroup);
  };

  // Blood group options
  const bloodGroups = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                Donor Directory
              </h1>
              <p className="text-gray-600 mt-1">Find and contact blood donors for emergencies</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-400">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Donors</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-green-400">
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-gray-600">Available Now</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-purple-400">
              <div className="text-2xl font-bold text-purple-600">{stats.rareBlood}</div>
              <div className="text-sm text-gray-600">Rare Blood Types</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search donors by name, email, phone, or city..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-48 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              {/* Blood Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({...filters, bloodGroup: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Blood Groups</option>
                  {bloodGroups.filter(bg => bg !== 'all').map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Donors</option>
                  <option value="available">Available Now</option>
                  <option value="soon">Available Soon</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="lastDonation">Last Donation</option>
                  <option value="name">Name</option>
                  <option value="bloodGroup">Blood Group</option>
                  <option value="city">City</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Donors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading donors...</span>
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="text-gray-400 mb-4">
              <User size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No donors found</h3>
            <p className="text-gray-600">
              {searchTerm || filters.bloodGroup !== 'all' || filters.city !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'No donors registered in the system'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor) => {
              const availability = getAvailabilityStatus(donor.lastDonationDate);
              const isRare = isRareBloodGroup(donor.bloodGroup);
              
              return (
                <div
                  key={donor._id}
                  className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* Donor Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{donor.fullName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donor.bloodGroup === 'O-' ? 'bg-red-100 text-red-800 border border-red-200' :
                            donor.bloodGroup === 'O+' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            donor.bloodGroup === 'A-' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            donor.bloodGroup === 'A+' ? 'bg-green-100 text-green-800 border border-green-200' :
                            donor.bloodGroup === 'B-' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            donor.bloodGroup === 'B+' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            donor.bloodGroup === 'AB-' ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {donor.bloodGroup}
                          </span>
                          {isRare && (
                            <Shield size={14} className="text-purple-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}>
                      {availability.text}
                    </span>
                  </div>

                  {/* Donor Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-red-500 flex-shrink-0" />
                      <span className="font-medium">{donor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-red-500 flex-shrink-0" />
                      <span>{donor.email}</span>
                    </div>
                    {donor.address?.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-red-500 flex-shrink-0" />
                        <span>{donor.address.city}, {donor.address.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-red-500 flex-shrink-0" />
                      <span>Last donation: {getTimeSinceLastDonation(donor.lastDonationDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Droplet size={14} className="text-red-500 flex-shrink-0" />
                      <span>Total donations: {donor.donationHistory?.length || 0}</span>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => contactDonor(donor)}
                    disabled={availability.status === "unavailable"}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={16} />
                    Contact Donor
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedDonor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Contact Donor
              </h3>
              <p className="text-gray-600 mb-6">Choose how you'd like to contact {selectedDonor.fullName}</p>
              
              <div className="space-y-3">
                {/* Phone Call */}
                <a
                  href={`tel:${selectedDonor.phone}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
                >
                  <PhoneCall size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Call Now</div>
                    <div className="text-sm opacity-90">{selectedDonor.phone}</div>
                  </div>
                </a>

                {/* SMS */}
                <a
                  href={`sms:${selectedDonor.phone}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
                >
                  <MessageCircle size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Send SMS</div>
                    <div className="text-sm opacity-90">Quick message</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${selectedDonor.email}`}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
                >
                  <MailIcon size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Send Email</div>
                    <div className="text-sm opacity-90">{selectedDonor.email}</div>
                  </div>
                </a>
              </div>

              {/* Donor Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Donor Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Blood Group:</strong> {selectedDonor.bloodGroup}</div>
                  <div><strong>Last Donation:</strong> {getTimeSinceLastDonation(selectedDonor.lastDonationDate)}</div>
                  {selectedDonor.address?.city && (
                    <div><strong>Location:</strong> {selectedDonor.address.city}, {selectedDonor.address.state}</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowContactModal(false)}
                className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDirectory;