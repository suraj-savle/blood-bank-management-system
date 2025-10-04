"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    address: "",
    dob: "",
    bloodType: "",
    healthInfo: {
      weight: "",
      height: "",
      hasDiseases: false,
      diseaseDetails: "",
    },
    hospitalInfo: {
      licenseNumber: "",
      emergencyContact: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Validation per step
  const validateStep = () => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }
    }
    
    if (step === 2) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (!formData.role) newErrors.role = "Please select a role";
    }
    
    if (step === 3) {
      if (formData.role === "donor") {
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.dob) newErrors.dob = "Date of birth is required";
        if (!formData.bloodType) newErrors.bloodType = "Blood type is required";
        if (!formData.healthInfo.weight) newErrors.weight = "Weight is required";
        if (!formData.healthInfo.height) newErrors.height = "Height is required";
        
        // Validate age (must be at least 18)
        if (formData.dob) {
          const today = new Date();
          const birthDate = new Date(formData.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 18) newErrors.dob = "Must be at least 18 years old";
        }
      }
      
      if (formData.role === "hospital") {
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.hospitalInfo.licenseNumber.trim()) newErrors.licenseNumber = "License number is required";
        if (!formData.hospitalInfo.emergencyContact.trim()) newErrors.emergencyContact = "Emergency contact is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("healthInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("hospitalInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        hospitalInfo: {
          ...prev.hospitalInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      console.log("Final Form Data:", formData);
      alert("Account Created Successfully!");
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden text-gray-900">
        {/* Header with progress bar */}
        <div className="bg-red-600 text-white p-6">
          <h1 className="text-2xl font-bold text-center mb-2">Blood Management System</h1>
          <p className="text-center mb-4">Create your account in a few simple steps</p>
          
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm">Step {step} of 3</span>
            <span className="text-sm">{progressPercentage.toFixed(0)}% Complete</span>
          </div>
          
          <div className="w-full bg-red-300 rounded-full h-2.5">
            <div 
              className="bg-white h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "font-semibold" : ""}>Basic Info</span>
            <span className={step >= 2 ? "font-semibold" : ""}>Account</span>
            <span className={step >= 3 ? "font-semibold" : ""}>Details</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.name ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.email ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Account Information</h2>
              
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.password ? "border-red-500" : "border-gray-300"}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-800 mb-1">
                  I am a <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["donor", "hospital"].map((role) => (
                    <div key={role} className="relative">
                      <input
                        type="radio"
                        id={role}
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={handleChange}
                        className="hidden peer"
                      />
                      <label
                        htmlFor={role}
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:ring-2 peer-checked:ring-red-200 ${errors.role && !formData.role ? "border-red-500" : "border-gray-300"}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${formData.role === role ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                          {role === "donor" ? "🩸" : "🏥"}
                        </div>
                        <span className="text-sm font-medium capitalize text-gray-900">{role}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                {formData.role === "donor" ? "Donor Information" : "Hospital Information"}
              </h2>

              {/* Donor */}
              {formData.role === "donor" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {/* DOB */}
                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-800 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.dob ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {/* Blood Type */}
                  <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-gray-800 mb-1">
                      Blood Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.bloodType ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select Blood Type</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  {/* Weight */}
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-800 mb-1">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="healthInfo.weight"
                      placeholder="Enter your weight"
                      value={formData.healthInfo.weight}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.weight ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {/* Height */}
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-800 mb-1">
                      Height (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="healthInfo.height"
                      placeholder="Enter your height"
                      value={formData.healthInfo.height}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${errors.height ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                </div>
              )}

              {/* Hospital */}
              {formData.role === "hospital" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">License Number</label>
                    <input type="text" name="hospitalInfo.licenseNumber" value={formData.hospitalInfo.licenseNumber} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Emergency Contact</label>
                    <input type="text" name="hospitalInfo.emergencyContact" value={formData.hospitalInfo.emergencyContact} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition">
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center"
              >
                Create Account
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
