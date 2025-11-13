import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  User,
  MapPin,
  Phone,
  Calendar,
  Scale,
  Droplets,
  Edit3,
  Save,
  X,
  Mail,
  Award,
  Clock,
  Shield,
  VenusAndMars,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// Constants for better maintainability
const API_BASE_URL = "http://localhost:5000/api";
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
    street: "",
    city: "",
    state: "",
    pincode: "",
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const token = localStorage.getItem("token");

  // Validation rules
  const validationRules = {
    fullName: { required: true, minLength: 2, maxLength: 50 },
    phone: { required: true, pattern: /^[0-9]{10}$/ },
    age: { required: true, min: 18, max: 65 },
    gender: { required: true },
    weight: { required: true, min: 45, max: 200 },
    bloodGroup: { required: true },
    street: { required: true, minLength: 5 },
    city: { required: true, minLength: 2 },
    state: { required: true, minLength: 2 },
    pincode: { required: true, pattern: /^[0-9]{6}$/ },
    password: { minLength: 6 }
  };

  // Validate form field
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

  // Validate entire form
  const validateForm = useCallback((data) => {
    const newErrors = {};
    Object.keys(validationRules).forEach(key => {
      if (key === "password" && !data[key]) return; // Skip password if empty
      const error = validateField(key, data[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  }, []);

  // Fetch Donor Profile
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      const res = await fetch(`${API_BASE_URL}/donor/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
          // Redirect to login or handle token refresh
          return;
        }
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.donor) {
        throw new Error('Invalid response format');
      }

      setDonor(data.donor);

      // Set form data with proper fallbacks
      const initialFormData = {
        fullName: data.donor.fullName || "",
        phone: data.donor.phone || "",
        age: data.donor.age || "",
        gender: data.donor.gender || "",
        weight: data.donor.weight || "",
        bloodGroup: data.donor.bloodGroup || "",
        street: data.donor.address?.street || "",
        city: data.donor.address?.city || "",
        state: data.donor.address?.state || "",
        pincode: data.donor.address?.pincode || "",
        password: ""
      };

      setFormData(initialFormData);
      
    } catch (err) {
      console.error("Profile fetch error:", err);
      setErrors({ fetch: err.message });
      toast.error(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsUpdating(true);
    
    try {
      // Prepare address object
      const updatedData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
      };

      // Only include password if provided and valid
      if (formData.password && formData.password.length >= 6) {
        updatedData.password = formData.password;
      }

      const res = await fetch(`${API_BASE_URL}/donor/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      
      if (res.ok) {
        setDonor(data.donor);
        setIsEditing(false);
        // Clear password field and errors
        setFormData(prev => ({ ...prev, password: "" }));
        setErrors({});
        toast.success("Profile updated successfully! 🎉");
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original donor data
    if (donor) {
      setFormData({
        fullName: donor.fullName || "",
        phone: donor.phone || "",
        age: donor.age || "",
        gender: donor.gender || "",
        weight: donor.weight || "",
        bloodGroup: donor.bloodGroup || "",
        street: donor.address?.street || "",
        city: donor.address?.city || "",
        state: donor.address?.state || "",
        pincode: donor.address?.pincode || "",
        password: ""
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleRetry = () => {
    fetchProfile();
  };

  // Input classes with error states
  const getInputClasses = (fieldName) => {
    const baseClasses = `w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${
      isEditing 
        ? "bg-white focus:ring-red-200" 
        : "bg-gray-50 cursor-not-allowed"
    }`;
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500`;
    }
    
    return `${baseClasses} ${
      isEditing ? "border-red-200 focus:border-red-500" : "border-gray-200"
    }`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load profile</h3>
        <p className="text-gray-600 mb-4">{errors.fetch}</p>
        <button 
          onClick={handleRetry}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mx-auto"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load profile data</p>
        <button 
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="">
        {/* Main Profile Form */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={24} />
                  Personal Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold shadow-sm"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold disabled:opacity-50 shadow-sm"
                    >
                      {isUpdating ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {isUpdating ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-8">
              {/* Personal Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", name: "fullName", icon: User, type: "text" },
                  { label: "Phone Number", name: "phone", icon: Phone, type: "tel" },
                  { label: "Age", name: "age", icon: Calendar, type: "number" },
                  { label: "Gender", name: "gender", icon: VenusAndMars, type: "select", options: GENDER_OPTIONS },
                  { label: "Weight (kg)", name: "weight", icon: Scale, type: "number" },
                  { label: "Blood Group", name: "bloodGroup", icon: Droplets, type: "select", options: BLOOD_GROUPS.map(bg => ({ value: bg, label: bg })) }
                ].map(({ label, name, icon: Icon, type, options }) => (
                  <div key={name}>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Icon size={16} />
                      {label}
                    </label>
                    {type === "select" ? (
                      <select
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={getInputClasses(name)}
                      >
                        <option value="">Select {label}</option>
                        {options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={getInputClasses(name)}
                        min={type === "number" ? (name === "age" ? 18 : 45) : undefined}
                        max={type === "number" ? (name === "age" ? 65 : 200) : undefined}
                        step={name === "weight" ? "0.1" : undefined}
                      />
                    )}
                    {errors[name] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors[name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Address Section */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <MapPin size={20} />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: "street", label: "Street Address", fullWidth: true },
                    { name: "city", label: "City" },
                    { name: "state", label: "State" },
                    { name: "pincode", label: "PIN Code" }
                  ].map(({ name, label, fullWidth }) => (
                    <div key={name} className={fullWidth ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {label}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={getInputClasses(name)}
                        placeholder={`Enter your ${label.toLowerCase()}`}
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors[name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="border-t border-gray-200 pt-8">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={donor.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Password Update */}
              {isEditing && (
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={getInputClasses("password")}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep current password
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;