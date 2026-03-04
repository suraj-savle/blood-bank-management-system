import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Save,
  Edit3,
  X,
  MapPin,
  Mail,
  Phone,
  User,
  Shield,
  Heart,
  Droplet,
  Calendar,
  Scale,
  Droplets,
  VenusAndMars,
  Award,
  Clock,
  Tag,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = "/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" }
];

const DonorProfile = () => {
  const [donor, setDonor] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    age: "",
    gender: "",
    weight: "",
    bloodGroup: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validationRules = {
    fullName: { required: true, minLength: 2, maxLength: 50 },
    phone: { required: true, pattern: /^[0-9]{10}$/ },
    age: { required: true, min: 18, max: 65 },
    gender: { required: true },
    weight: { required: true, min: 45, max: 200 },
    bloodGroup: { required: true },
    "address.street": { required: true, minLength: 5 },
    "address.city": { required: true, minLength: 2 },
    "address.state": { required: true, minLength: 2 },
    "address.pincode": { required: true, pattern: /^[0-9]{6}$/ },
    password: { minLength: 6 }
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && !value) {
      return "This field is required";
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }

    if (rules.min && Number(value) < rules.min) {
      return `Minimum value is ${rules.min}`;
    }

    if (rules.max && Number(value) > rules.max) {
      return `Maximum value is ${rules.max}`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return "Invalid format";
    }

    return null;
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found.");
      }

      const { data } = await axios.get(`${API_BASE_URL}/donor/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const lastDonationDate = data.donor.lastDonationDate || data.donor.lastDonation;

      if (data.donor) {
        setDonor(data.donor);
        setFormData({
          fullName: data.donor.fullName || "",
          phone: data.donor.phone || "",
          age: data.donor.age || "",
          gender: data.donor.gender || "",
          weight: data.donor.weight || "",
          bloodGroup: data.donor.bloodGroup || "",
          address: {
            street: data.donor.address?.street || "",
            city: data.donor.address?.city || "",
            state: data.donor.address?.state || "",
            pincode: data.donor.address?.pincode || "",
          },
          password: ""
        });
        setDonor({
            ...data.donor,
            lastDonation: lastDonationDate, // Use the correct key for the display logic below
            status: data.donor.status || "active", // Default to active if status is missing
            donorId: data.donor._id, // Use _id as donorId if a specific one isn't provided
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("❌ Fetch Donor Profile Error:", error);
      let message;

      if (
        error.message.includes("No authorization token found") ||
        error.response?.status === 401
      ) {
        message = "Session expired or unauthorized. Please log in.";
        localStorage.removeItem("token");
        setDonor(null);
        toast.error(message);
        return;
      }

      message = error.response?.data?.message || "Failed to load profile";
      toast.error(message);
      setDonor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData((prev) => {
        const updatedData = {
          ...prev,
          address: { ...prev.address, [key]: value },
        };
        validateField(name, value);
        return updatedData;
      });
    } else {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        validateField(name, value);
        return updatedData;
      });
    }

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSave = async () => {
    // Validate all fields
    const newErrors = {};
    Object.keys(validationRules).forEach(key => {
      if (key === "password" && !formData.password) return; // Skip password if empty
      
      let value;
      if (key.startsWith("address.")) {
        const addressKey = key.split(".")[1];
        value = formData.address[addressKey];
      } else {
        value = formData[key];
      }
      
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required to save changes.");
        setSaving(false);
        return;
      }

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
        },
      };

      // Only include password if provided
      if (formData.password && formData.password.length >= 6) {
        payload.password = formData.password;
      }

      const { data } = await axios.put(
        `${API_BASE_URL}/donor/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success("Profile updated successfully! 🎉");
        setDonor(data.donor);
        setIsEditing(false);
        setErrors({});
        // Clear password field
        setFormData(prev => ({ ...prev, password: "" }));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (donor) {
      setFormData({
        fullName: donor.fullName || "",
        phone: donor.phone || "",
        age: donor.age || "",
        gender: donor.gender || "",
        weight: donor.weight || "",
        bloodGroup: donor.bloodGroup || "",
        address: {
          street: donor.address?.street || "",
          city: donor.address?.city || "",
          state: donor.address?.state || "",
          pincode: donor.address?.pincode || "",
        },
        password: ""
      });
    }
  };

  if (loading && !donor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Heart className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Donor Profile
          </h2>
          <p className="text-gray-500">Preparing your donor information...</p>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-red-100 p-8">
          <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Donor Profile Error
          </h3>
          <p className="text-gray-600 mb-4">
            Could not load profile. Please ensure you are authenticated.
          </p>
          <button
            onClick={fetchProfile}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <Toaster />
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {donor.fullName || "Donor Profile"}
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Droplets size={16} className="text-red-500" />
                  {donor.bloodGroup || "Blood Donor"} • 
                  <span className="font-mono text-sm">ID: {donor.donorId}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-300"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || hasErrors}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar - Donor Status and Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Donor Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                Donor Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    donor.status === "active"
                      ? "bg-green-100 text-green-700"
                      : donor.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {donor.status?.charAt(0).toUpperCase() + donor.status?.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blood Group</span>
                  <span className="text-sm font-bold text-red-600">{donor.bloodGroup || "N/A"}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Donor ID</span>
                  <span className="text-sm font-mono text-gray-800">{donor.donorId}</span>
                </div>
                
                {donor.lastDonation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Donation</span>
                    <span className="text-sm text-gray-800">
                      {new Date(donor.lastDonation).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Quick Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Quick Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">{donor.email}</span>
                </div>
                {donor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">{donor.phone}</span>
                  </div>
                )}
                {donor.age && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">{donor.age} years old</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Editable Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              
              {/* Personal Details */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.fullName ? "border-red-500" : ""}`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="10-digit phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!isEditing}
                      min="18"
                      max="65"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.age ? "border-red-500" : ""}`}
                      placeholder="Your age"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.age}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.gender ? "border-red-500" : ""}`}
                    >
                      <option value="">Select Gender</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={!isEditing}
                      min="45"
                      max="200"
                      step="0.1"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.weight ? "border-red-500" : ""}`}
                      placeholder="Weight in kg"
                    />
                    {errors.weight && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.weight}
                      </p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.bloodGroup ? "border-red-500" : ""}`}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(group => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    {errors.bloodGroup && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.bloodGroup}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["street", "city", "state", "pincode"].map((field) => (
                    <div key={field} className={field === "street" ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field === "pincode" ? "PIN Code" : field}
                      </label>
                      <input
                        type={field === "pincode" ? "number" : "text"}
                        name={`address.${field}`}
                        value={formData.address?.[field] || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          isEditing
                            ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            : "bg-gray-50 border-gray-200"
                        } ${
                          errors[`address.${field}`] ? "border-red-500" : ""
                        }`}
                        placeholder={`Enter ${field === "pincode" ? "PIN code" : field}`}
                      />
                      {errors[`address.${field}`] && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors[`address.${field}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-600" />
                  Email Address
                </h3>
                <input
                  type="email"
                  value={donor.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
              </div>

              {/* Password Update */}
              {isEditing && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Change Password
                  </h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Leave blank to keep current password
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;