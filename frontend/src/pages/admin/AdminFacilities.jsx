import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Download,
  Eye,
  RefreshCw,
  AlertCircle
} from "lucide-react";

const FacilityApproval = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/admin";

  // Fetch pending facilities
  const fetchPendingFacilities = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      console.log("🔄 Fetching facilities...");
      
      const res = await fetch(`${API_URL}/facilities`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("📨 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Failed to fetch facilities: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Facilities data:", data);
      
      // Filter to show only pending facilities for approval
      const pendingFacilities = data.facilities?.filter(f => f.status === "pending") || [];
      setFacilities(pendingFacilities);
      
      if (showToast) {
        toast.success(`Found ${pendingFacilities.length} pending facilities`);
      }
    } catch (error) {
      console.error("🚨 Fetch facilities error:", error);
      toast.error("Failed to load facilities. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const handleApprove = async (facilityId) => {
    if (!facilityId) {
      toast.error("Invalid facility ID");
      return;
    }

    setActionLoading(facilityId);
    console.log("✅ Approving facility:", facilityId);

    try {
      const res = await fetch(`${API_URL}/facility/approve/${facilityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("📨 Approval response:", data);

      if (res.ok && data.message) {
        toast.success("Facility approved successfully!");
        // Remove the approved facility from the list
        setFacilities(prev => prev.filter(f => f._id !== facilityId));
        setSelectedFacility(null);
      } else {
        throw new Error(data.message || "Approval failed");
      }
    } catch (error) {
      console.error("🚨 Approval error:", error);
      toast.error(error.message || "Error approving facility");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (facilityId) => {
    if (!facilityId) {
      toast.error("Invalid facility ID");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(facilityId);
    console.log("❌ Rejecting facility:", facilityId, "Reason:", rejectionReason);

    try {
      const res = await fetch(`${API_URL}/facility/reject/${facilityId}`, {
            // 👇 FIX: Change method to PUT for status update
            method: "PUT", 
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ rejectionReason }),
        });

      const data = await res.json();
      console.log("📨 Rejection response:", data);

      if (res.ok && data.message) {
        toast.success("Facility rejected successfully!");
        // Remove the rejected facility from the list
        setFacilities(prev => prev.filter(f => f._id !== facilityId));
        setSelectedFacility(null);
        setRejectionReason("");
      } else {
        throw new Error(data.message || "Rejection failed");
      }
    } catch (error) {
      console.error("🚨 Rejection error:", error);
      toast.error(error.message || "Error rejecting facility");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDocument = (documentUrl, filename = "document") => {
    if (!documentUrl) {
      toast.error("Document not available");
      return;
    }
    
    console.log("📄 Opening document:", documentUrl);
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = (documentUrl, filename = "document") => {
    if (!documentUrl) {
      toast.error("Document not available for download");
      return;
    }

    console.log("💾 Downloading document:", documentUrl);
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        icon: Clock,
        label: "Pending Review"
      },
      approved: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle,
        label: "Approved"
      },
      rejected: { 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: XCircle,
        label: "Rejected"
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getFacilityTypeBadge = (type) => {
    const isHospital = type === "Hospital";
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
        isHospital 
          ? "bg-blue-100 text-blue-800 border-blue-200" 
          : "bg-purple-100 text-purple-800 border-purple-200"
      }`}>
        <Building size={12} />
        {type || "Facility"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Shield className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Facility Approvals
          </h2>
          <p className="text-gray-500">Fetching pending registration requests...</p>
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
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                Facility Verification
              </h1>
              <p className="text-gray-600 mt-2">
                Review and verify hospital and blood lab registration requests
              </p>
            </div>
            
            <button
              onClick={() => fetchPendingFacilities(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-lg">
                  {facilities.length} Facility{facilities.length !== 1 ? 's' : ''} Pending Verification
                </p>
                <p className="text-red-600 text-sm">
                  Facilities awaiting admin approval to access the system
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Facilities List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-red-600" />
              Pending Requests ({facilities.length})
            </h2>
            
            {facilities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-red-100">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending facility requests</p>
                <p className="text-sm text-gray-500 mt-1">All facilities have been processed and approved</p>
              </div>
            ) : (
              facilities.map((facility) => (
                <div
                  key={facility._id}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                    selectedFacility?._id === facility._id 
                      ? "border-red-300 bg-red-50" 
                      : "border-red-100 hover:border-red-300"
                  }`}
                  onClick={() => {
                    console.log("🎯 Selecting facility:", facility._id);
                    setSelectedFacility(facility);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {facility.name}
                        </h3>
                        {getFacilityTypeBadge(facility.facilityType)}
                      </div>
                      <p className="text-gray-600 text-sm flex items-center gap-1 mb-1">
                        <Mail size={14} />
                        {facility.email}
                      </p>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <Phone size={14} />
                        {facility.phone || "No phone provided"}
                      </p>
                    </div>
                    {getStatusBadge(facility.status)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <MapPin size={14} />
                      {facility.address?.street || "Address not provided"}, {facility.address?.city}, {facility.address?.state} - {facility.address?.pincode}
                    </p>
                    <p className="flex items-center gap-1">
                      <FileText size={14} />
                      Reg: {facility.registrationNumber || "Not provided"}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar size={14} />
                      Registered: {new Date(facility.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {facility.documents?.registrationProof && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(
                            facility.documents.registrationProof.url,
                            facility.documents.registrationProof.filename
                          );
                        }}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        <Eye size={14} />
                        View Document
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(
                            facility.documents.registrationProof.url,
                            facility.documents.registrationProof.filename
                          );
                        }}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Facility Details & Actions */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedFacility ? (
              <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-red-600" />
                  Review Facility
                </h2>
                
                {/* Facility Details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                      <p className="text-gray-900 font-semibold">{selectedFacility.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      {getFacilityTypeBadge(selectedFacility.facilityType)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedFacility.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{selectedFacility.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <p className="text-gray-900">{selectedFacility.emergencyContact || "Not provided"}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900">
                      {selectedFacility.address?.street || "Street not provided"}, {selectedFacility.address?.city}<br />
                      {selectedFacility.address?.state} - {selectedFacility.address?.pincode}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <p className="text-gray-900 font-mono">{selectedFacility.registrationNumber || "Not provided"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{selectedFacility.facilityCategory || "Not specified"}</p>
                  </div>

                  {selectedFacility.operatingHours && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                      <p className="text-gray-900">
                        {selectedFacility.operatingHours.open} - {selectedFacility.operatingHours.close}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedFacility.operatingHours.workingDays?.join(", ") || "Not specified"}
                        {selectedFacility.is24x7 && " • 24/7 Service"}
                      </p>
                    </div>
                  )}

                  {selectedFacility.emergencyServices && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-700 font-semibold flex items-center gap-2">
                        <Shield size={16} />
                        Emergency Services Available
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={() => handleApprove(selectedFacility._id)}
                    disabled={actionLoading === selectedFacility._id}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                  >
                    {actionLoading === selectedFacility._id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    {actionLoading === selectedFacility._id ? "Approving..." : "Approve Facility"}
                  </button>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Rejection Reason (required)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide specific reason for rejection. This will be communicated to the facility..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none transition-colors"
                      rows="3"
                    />
                    <button
                      onClick={() => handleReject(selectedFacility._id)}
                      disabled={actionLoading === selectedFacility._id || !rejectionReason.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                    >
                      {actionLoading === selectedFacility._id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle size={20} />
                      )}
                      {actionLoading === selectedFacility._id ? "Rejecting..." : "Reject Facility"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-12 text-center">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Facility</h3>
                <p className="text-gray-500">
                  Click on any facility from the list to review details and take action
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityApproval;