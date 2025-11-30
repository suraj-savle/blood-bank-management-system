"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Constants for better maintainability
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STATES = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangalore"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Delhi: ["New Delhi", "Rohini", "Dwarka"],
  "Tamil Nadu": ["Chennai", "Madurai", "Coimbatore"],
};

// Validation functions
const validators = {
  fullName: (value) => (!value.trim() ? "Full name is required" : ""),
  email: (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(value)) return "Please enter a valid email address";
    return "";
  },
  password: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  },
  phone: (value) => {
    if (!value) return "Phone number is required";
    if (value.length !== 10) return "Phone number must be exactly 10 digits";
    if (!/^[6-9][0-9]{9}$/.test(value)) return "Phone number must start with 6-9";
    return "";
  },
  emergencyContact: (value) => {
    if (!value) return "Emergency contact is required";
    if (value.length !== 10) return "Emergency contact must be exactly 10 digits";
    if (!/^[6-9][0-9]{9}$/.test(value)) return "Emergency contact must start with 6-9";
    return "";
  },
  dob: (value) => {
    if (!value) return "Date of birth is required";
    const age = calculateAge(value);
    if (age < 18 || age > 65) return "Donor must be between 18 and 65 years old";
    return "";
  },
  gender: (value) => (!value ? "Gender is required" : ""),
  bloodGroup: (value) => (!value ? "Blood group is required" : ""),
  "healthInfo.weight": (value) => {
    if (!value) return "Weight is required";
    if (parseFloat(value) < 45) return "Minimum weight is 45kg";
    return "";
  },
  "healthInfo.height": (value) => (!value ? "Height is required" : ""),
  "address.street": (value) => (!value.trim() ? "Street address is required" : ""),
  "address.city": (value) => (!value.trim() ? "City is required" : ""),
  "address.state": (value) => (!value.trim() ? "State is required" : ""),
  "address.pincode": (value) => {
    if (!value) return "Pincode is required";
    if (!/^[1-9][0-9]{5}$/.test(value)) return "Pincode must be 6 digits";
    return "";
  },
};

// Helper function to calculate age
const calculateAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function DonorRegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    healthInfo: {
      weight: "",
      height: "",
      hasDiseases: false,
      diseaseDetails: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      if (name.startsWith("healthInfo.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          healthInfo: {
            ...prev.healthInfo,
            [field]: type === "checkbox" ? checked : value,
          },
        };
      } else if (name.startsWith("address.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          address: { ...prev.address, [field]: value },
        };
      }
      
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle blur events for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate single field
    validateField(name);
  };

  // Validate single field
  const validateField = (fieldName) => {
    let value;
    
    if (fieldName.includes(".")) {
      const [parent, child] = fieldName.split(".");
      if (parent === "healthInfo") {
        value = formData.healthInfo[child];
      } else if (parent === "address") {
        value = formData.address[child];
      }
    } else {
      value = formData[fieldName];
    }
    
    const error = validators[fieldName]?.(value, formData);
    
    setErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
    });
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    const stepValidations = {
      1: ["fullName", "email", "password", "phone", "emergencyContact"],
      2: ["dob", "gender", "bloodGroup", "healthInfo.weight", "healthInfo.height"],
      3: ["address.street", "address.city", "address.state", "address.pincode"],
    };

    stepValidations[step].forEach(field => {
      let value;
      
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        if (parent === "healthInfo") {
          value = formData.healthInfo[child];
        } else if (parent === "address") {
          value = formData.address[child];
        }
      } else {
        value = formData[field];
      }
      
      const error = validators[field]?.(value, formData);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    
    // Mark all step fields as touched to show errors
    const newTouched = { ...touched };
    stepValidations[step].forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!validateStep()) {
      console.log("Validation failed on step 3. Data not submitted.");
      return;
    }
    
    setIsSubmitting(true);

    const age = calculateAge(formData.dob);
    const submissionPayload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact,
      age: age,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      weight: parseFloat(formData.healthInfo.weight),
      height: parseFloat(formData.healthInfo.height),
      address: formData.address,
      role: "donor",
    };
    
        const API_URL = "http://localhost:5000/api/auth/register"; 

    
    console.log("Submitting Donor Data:", submissionPayload);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Donor Registered Successfully:", result);
        toast.success("🎉 Donor Registered Successfully!");
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error("Registration failed:", response.status, errorData);
        toast.error(`Registration failed: ${errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      toast.error("❌ Registration failed due to a network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if field should show error
  const shouldShowError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-8 px-4 outline-0">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-red-700 text-white p-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            Blood Donor Registration
          </h1>
          <p className="text-center mb-4 opacity-90">
            Join our life-saving mission in 3 simple steps
          </p>
          
          {/* Progress Bar */}
          <div className="mb-2 flex justify-between items-center text-sm">
            <span>Step {step} of 3</span>
            <span>{progressPercentage.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full bg-red-300 rounded-full h-2.5">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "font-semibold" : "opacity-75"}>Personal Info</span>
            <span className={step >= 2 ? "font-semibold" : "opacity-75"}>Health Details</span>
            <span className={step >= 3 ? "font-semibold" : "opacity-75"}>Address</span>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                    shouldShowError("fullName") ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                />
                {shouldShowError("fullName") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.fullName}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                    shouldShowError("email") ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
                {shouldShowError("email") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block font-medium mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("password") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter password (min 8 characters)"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {shouldShowError("password") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.password}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("phone") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="10-digit phone number"
                    maxLength="10"
                  />
                  {shouldShowError("phone") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="emergencyContact" className="block font-medium mb-2">
                    Emergency Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="emergencyContact"
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("emergencyContact") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="10-digit emergency contact"
                    maxLength="10"
                  />
                  {shouldShowError("emergencyContact") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.emergencyContact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Health Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dob" className="block font-medium mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("dob") ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {shouldShowError("dob") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.dob}
                    </p>
                  )}
                  {formData.dob && (
                    <p className="text-sm text-gray-600 mt-1">
                      Age: {calculateAge(formData.dob)} years
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="gender" className="block font-medium mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("gender") ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                  {shouldShowError("gender") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="bloodGroup" className="block font-medium mb-2">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                    shouldShowError("bloodGroup") ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {shouldShowError("bloodGroup") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.bloodGroup}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="block font-medium mb-2">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="weight"
                    type="number"
                    name="healthInfo.weight"
                    value={formData.healthInfo.weight}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("healthInfo.weight") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Minimum 45kg"
                    min="45"
                    step="0.1"
                  />
                  {shouldShowError("healthInfo.weight") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors["healthInfo.weight"]}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="height" className="block font-medium mb-2">
                    Height (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="height"
                    type="number"
                    name="healthInfo.height"
                    value={formData.healthInfo.height}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("healthInfo.height") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Height in cm"
                    min="100"
                    step="0.1"
                  />
                  {shouldShowError("healthInfo.height") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors["healthInfo.height"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="hasDiseases"
                  name="healthInfo.hasDiseases"
                  checked={formData.healthInfo.hasDiseases}
                  onChange={handleChange}
                  className="w-4 h-4 accent-red-500"
                />
                <label htmlFor="hasDiseases" className="font-medium">
                  I have existing medical conditions
                </label>
              </div>

              {formData.healthInfo.hasDiseases && (
                <div>
                  <label htmlFor="diseaseDetails" className="block font-medium mb-2">
                    Medical Conditions Details
                  </label>
                  <textarea
                    id="diseaseDetails"
                    name="healthInfo.diseaseDetails"
                    value={formData.healthInfo.diseaseDetails}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    placeholder="Please describe any medical conditions, allergies, or medications..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Address Information */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="street" className="block font-medium mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="street"
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                    shouldShowError("address.street") ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter street address"
                />
                {shouldShowError("address.street") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors["address.street"]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="state" className="block font-medium mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: "" },
                      }));
                    }}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("address.state") ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select State</option>
                    {Object.keys(STATES).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {shouldShowError("address.state") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors["address.state"]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block font-medium mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("address.city") ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={!formData.address.state}
                  >
                    <option value="">Select City</option>
                    {formData.address.state &&
                      STATES[formData.address.state].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                  </select>
                  {shouldShowError("address.city") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors["address.city"]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="pincode" className="block font-medium mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${
                      shouldShowError("address.pincode") ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="6-digit pincode"
                    maxLength="6"
                  />
                  {shouldShowError("address.pincode") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors["address.pincode"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex ${step > 1 ? 'justify-between' : 'justify-end'} pt-6 border-t`}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Registering...
                  </>
                ) : (
                  "Register as Donor"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}