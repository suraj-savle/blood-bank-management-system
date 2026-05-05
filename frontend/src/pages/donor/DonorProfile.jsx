import { useEffect, useState, useCallback, useMemo } from "react";
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
  Info,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDER_OPTIONS = [
  { value: "male", label: "Male", icon: "👨" },
  { value: "female", label: "Female", icon: "👩" },
  { value: "other", label: "Other", icon: "👤" },
];

// Validation schemas
const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: "Full name must be between 2 and 50 characters",
  },
  phone: {
    required: true,
    pattern: /^[0-9]{10}$/,
    message: "Please enter a valid 10-digit phone number",
  },
  age: {
    required: true,
    min: 18,
    max: 65,
    message: "Age must be between 18 and 65 years",
  },
  gender: {
    required: true,
    message: "Please select your gender",
  },
  weight: {
    required: true,
    min: 45,
    max: 200,
    message: "Weight must be between 45 and 200 kg",
  },
  bloodGroup: {
    required: true,
    message: "Please select your blood group",
  },
  "address.street": {
    required: true,
    minLength: 5,
    message: "Street address must be at least 5 characters",
  },
  "address.city": {
    required: true,
    minLength: 2,
    message: "City name must be at least 2 characters",
  },
  "address.state": {
    required: true,
    minLength: 2,
    message: "State name must be at least 2 characters",
  },
  "address.pincode": {
    required: true,
    pattern: /^[0-9]{6}$/,
    message: "Please enter a valid 6-digit PIN code",
  },
  password: {
    minLength: 6,
    message: "Password must be at least 6 characters",
  },
};

// Add CSS animation styles
const slideDownAnimation = `
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
`;

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
    password: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Helper function to get nested object value
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = VALIDATION_RULES[name];
    if (!rules) return null;

    if (rules.required && (!value || value === "")) {
      return rules.message || "This field is required";
    }

    if (value) {
      if (rules.minLength && value.length < rules.minLength) {
        return (
          rules.message || `Minimum ${rules.minLength} characters required`
        );
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `Maximum ${rules.maxLength} characters allowed`;
      }

      if (rules.min && Number(value) < rules.min) {
        return rules.message || `Minimum value is ${rules.min}`;
      }

      if (rules.max && Number(value) > rules.max) {
        return rules.message || `Maximum value is ${rules.max}`;
      }

      if (rules.pattern && !rules.pattern.test(String(value))) {
        return rules.message || "Invalid format";
      }
    }

    return null;
  }, []);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    const newErrors = {};

    Object.keys(VALIDATION_RULES).forEach((key) => {
      // Skip password if not provided and not required for update
      if (key === "password" && !formData.password) return;

      const value = getNestedValue(formData, key);
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    return newErrors;
  }, [formData, validateField]);

  // Fetch donor profile
  // Fetch donor profile
const fetchProfile = useCallback(async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No authorization token found");
      setLoading(false);
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/donor/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Full Response:", response.data);

    // Your backend structure: { success: true, data: { donor object } }
    if (response.data?.success === true && response.data?.data) {
      const donorData = response.data.data;
      
      console.log("Donor Data Extracted:", donorData);

      // Set donor state
      setDonor({
        ...donorData,
        donorId: donorData._id,
        email: donorData.email || "",
        lastDonation: donorData.lastDonationDate || donorData.lastDonation,
        status: donorData.status || "active",
      });

      // Set form data
      setFormData({
        fullName: donorData.fullName || "",
        phone: donorData.phone || "",
        age: donorData.age || "",
        gender: donorData.gender || "",
        weight: donorData.weight || "",
        bloodGroup: donorData.bloodGroup || "",
        address: {
          street: donorData.address?.street || "",
          city: donorData.address?.city || "",
          state: donorData.address?.state || "",
          pincode: donorData.address?.pincode || "",
        },
        password: "",
      });
    } else {
      console.error("Invalid response structure:", response.data);
      toast.error(response.data?.message || "Failed to load profile");
      setDonor(null);
    }
  } catch (error) {
    console.error("Fetch Profile Error:", error);

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } else {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to load profile";
      toast.error(message);
    }

    setDonor(null);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchProfile();
    // Inject animation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = slideDownAnimation;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [fetchProfile]);

  // Handle input changes
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        let updatedData;

        if (name.startsWith("address.")) {
          const key = name.split(".")[1];
          updatedData = {
            ...prev,
            address: { ...prev.address, [key]: value },
          };
        } else {
          updatedData = { ...prev, [name]: value };
        }

        // Validate field on change
        const error = validateField(name, getNestedValue(updatedData, name));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));

        return updatedData;
      });

      // Clear success message when user starts editing
      if (successMessage) setSuccessMessage("");
    },
    [validateField, successMessage],
  );

  // Handle field blur for validation
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const value = getNestedValue(formData, name);
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [formData, validateField],
  );

  // Save profile changes
  const handleSave = async () => {
    // Validate all fields first
    const newErrors = validateAllFields();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(
        Object.keys(newErrors).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {},
        ),
      );
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Prepare payload with proper type conversions
      const payload = {
        fullName: formData.fullName?.trim() || "",
        phone: formData.phone?.trim() || "",
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.address.street?.trim() || "",
          city: formData.address.city?.trim() || "",
          state: formData.address.state?.trim() || "",
          pincode: formData.address.pincode?.trim() || "",
        },
      };

      // Only include password if provided and valid
      if (formData.password && formData.password.length >= 6) {
        payload.password = formData.password;
      }

      console.log("📤 Sending update payload:", payload);

      const response = await axios.put(
        `${API_BASE_URL}/donor/profile`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Check if update was successful
      if (response.data?.success) {
        toast.success(response.data.message || "Profile updated successfully! 🎉");
        setSuccessMessage(response.data.message || "Your profile has been updated");

        // Update donor state with new data from response
        const updatedDonorData = response.data?.data;
        if (updatedDonorData) {
          setDonor({
            ...updatedDonorData,
            donorId: updatedDonorData._id,
            email: updatedDonorData.email || donor?.email,
          });
        } else {
          // If backend doesn't return updated data, merge payload with existing donor
          setDonor((prev) => ({
            ...prev,
            ...payload,
          }));
        }

        setIsEditing(false);
        setErrors({});
        setTouched({});
        setFormData((prev) => ({ ...prev, password: "" }));

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Save Error:", error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error("Please fix the highlighted errors");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    setTouched({});

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
        password: "",
      });
    }
  }, [donor]);

  // Check if donor is eligible to donate
  const isEligibleToDonate = useMemo(() => {
    if (!donor) return false;

    const lastDonation = donor.lastDonation
      ? new Date(donor.lastDonation)
      : null;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return !lastDonation || lastDonation <= threeMonthsAgo;
  }, [donor]);

  // Loading state
  if (loading && !donor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Heart className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading Donor Profile
          </h2>
          <p className="text-gray-500">Preparing your donor information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!donor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to Load Profile
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't retrieve your donor information. Please check your
            connection and try again.
          </p>
          <button
            onClick={fetchProfile}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = !hasErrors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 sm:p-6">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <div className="max-w-6xl mx-auto">
        {/* Success Message Banner */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slideDown">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {donor.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Droplets size={16} className="text-red-500" />
                    {donor.bloodGroup || "Blood Donor"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm font-mono text-gray-500">
                    ID: {donor.donorId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-300"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      donor.status === "active"
                        ? "bg-green-100 text-green-700"
                        : donor.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {donor.status?.charAt(0).toUpperCase() +
                      donor.status?.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Eligibility</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isEligibleToDonate
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isEligibleToDonate ? "Eligible to Donate" : "On Cooldown"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blood Group</span>
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    {donor.bloodGroup || "N/A"}
                  </span>
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

            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-red-600" />
                Quick Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-gray-600 break-all">{donor.email}</span>
                </div>
                {donor.phone && (
                  <div className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-600">{donor.phone}</span>
                  </div>
                )}
                {donor.age && (
                  <div className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-600">{donor.age} years old</span>
                  </div>
                )}
                {donor.weight && (
                  <div className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Scale className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-600">{donor.weight} kg</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              {/* Personal Details */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "fullName",
                      label: "Full Name",
                      type: "text",
                      placeholder: "Enter your full name",
                      icon: User,
                    },
                    {
                      name: "phone",
                      label: "Phone Number",
                      type: "tel",
                      placeholder: "10-digit phone number",
                      icon: Phone,
                    },
                    {
                      name: "age",
                      label: "Age",
                      type: "number",
                      placeholder: "Your age",
                      icon: Calendar,
                      min: 18,
                      max: 65,
                    },
                    {
                      name: "gender",
                      label: "Gender",
                      type: "select",
                      options: GENDER_OPTIONS,
                      icon: VenusAndMars,
                    },
                    {
                      name: "weight",
                      label: "Weight (kg)",
                      type: "number",
                      placeholder: "Weight in kg",
                      icon: Scale,
                      min: 45,
                      max: 200,
                      step: 0.1,
                    },
                    {
                      name: "bloodGroup",
                      label: "Blood Group",
                      type: "select",
                      options: BLOOD_GROUPS,
                      icon: Droplet,
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 rounded-xl border transition-all ${
                            isEditing
                              ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              : "bg-gray-50 border-gray-200"
                          } ${errors[field.name] && touched[field.name] ? "border-red-500" : ""}`}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((option) => (
                            <option
                              key={option.value || option}
                              value={option.value || option}
                            >
                              {option.label || option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={!isEditing}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className={`w-full px-4 py-3 rounded-xl border transition-all ${
                            isEditing
                              ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              : "bg-gray-50 border-gray-200"
                          } ${errors[field.name] && touched[field.name] ? "border-red-500" : ""}`}
                          placeholder={field.placeholder}
                        />
                      )}
                      {errors[field.name] && touched[field.name] && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "street",
                      label: "Street Address",
                      type: "text",
                      placeholder: "Enter street address",
                      span: true,
                    },
                    {
                      name: "city",
                      label: "City",
                      type: "text",
                      placeholder: "Enter city name",
                    },
                    {
                      name: "state",
                      label: "State",
                      type: "text",
                      placeholder: "Enter state name",
                    },
                    {
                      name: "pincode",
                      label: "PIN Code",
                      type: "text",
                      placeholder: "Enter 6-digit PIN code",
                    },
                  ].map((field) => (
                    <div
                      key={field.name}
                      className={field.span ? "md:col-span-2" : ""}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={`address.${field.name}`}
                        value={formData.address?.[field.name] || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition-all ${
                          isEditing
                            ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            : "bg-gray-50 border-gray-200"
                        } ${errors[`address.${field.name}`] && touched[`address.${field.name}`] ? "border-red-500" : ""}`}
                        placeholder={field.placeholder}
                      />
                      {errors[`address.${field.name}`] &&
                        touched[`address.${field.name}`] && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors[`address.${field.name}`]}
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
                  value={donor.email || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  Email address cannot be changed
                </p>
              </div>

              {/* Password Update */}
              {isEditing && (
                <div className="mb-8 pt-4 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Change Password
                  </h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password{" "}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditing
                          ? "border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "bg-gray-50 border-gray-200"
                      } ${errors.password && touched.password ? "border-red-500" : ""}`}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    {errors.password && touched.password && (
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