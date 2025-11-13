import { useState } from "react";

export default function DonorRegister() {
  const [formData, setFormData] = useState({
    // MATCHES Mongoose: 'fullName'
    fullName: "", 
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    dob: "",
    // MATCHES Mongoose: 'gender' (Required)
    gender: "", 
    // MATCHES Mongoose: 'bloodGroup'
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
  const [step, setStep] = useState(1);

  const states = {
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangalore"],
    Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
    Delhi: ["New Delhi", "Rohini", "Dwarka"],
    "Tamil Nadu": ["Chennai", "Madurai", "Coimbatore"],
  };

  const stepsConfig = [
    { key: 1, name: "Personal Details", fields: ["fullName", "email", "password", "phone", "emergencyContact"] },
    { key: 2, name: "Health & Type", fields: ["dob", "gender", "bloodGroup", "weight", "height"] },
    { key: 3, name: "Address Details", fields: ["street", "state", "city", "pincode"] },
  ];
  
  // Helper function to calculate age from DOB string (YYYY-MM-DD)
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

  // 🧠 Validation
  const validate = (currentStep) => {
    const newErrors = {};
    const stepFields = stepsConfig.find(s => s.key === currentStep).fields;

    // --- Step 1 Validation ---
    if (stepFields.includes("fullName") && !formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (stepFields.includes("email")) {
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email";
    }
    if (stepFields.includes("password") && (!formData.password || formData.password.length < 8))
      newErrors.password = "Password must be at least 8 characters";
    if (stepFields.includes("phone") && !formData.phone.match(/^[6-9][0-9]{9}$/))
      newErrors.phone = "Invalid 10-digit phone number";
    if (stepFields.includes("emergencyContact") && !formData.emergencyContact.match(/^[6-9][0-9]{9}$/))
      newErrors.emergencyContact = "Invalid emergency number";

    // --- Step 2 Validation ---
    const age = calculateAge(formData.dob);
    if (stepFields.includes("dob") && (!formData.dob || age < 18 || age > 65)) {
        if (!formData.dob) newErrors.dob = "Date of birth is required";
        else newErrors.dob = "Donor must be between 18 and 65 years old";
    }
    if (stepFields.includes("gender") && !formData.gender) newErrors.gender = "Gender is required";
    if (stepFields.includes("bloodGroup") && !formData.bloodGroup) newErrors.bloodGroup = "Select blood type";
    if (stepFields.includes("weight") && (!formData.healthInfo.weight || parseFloat(formData.healthInfo.weight) < 45)) newErrors.weight = "Minimum weight is 45kg";
    if (stepFields.includes("height") && !formData.healthInfo.height) newErrors.height = "Height is required";

    // --- Step 3 Validation ---
    if (stepFields.includes("street") && !formData.address.street.trim()) newErrors.street = "Street address is required";
    if (stepFields.includes("state") && !formData.address.state) newErrors.state = "Select your state";
    if (stepFields.includes("city") && !formData.address.city) newErrors.city = "Select your city";
    if (stepFields.includes("pincode") && !formData.address.pincode.match(/^[1-9][0-9]{5}$/))
      newErrors.pincode = "Invalid 6-digit pincode";

    // Mongoose schema uses simple keys for errors, so we map nested keys here for validation display
    const finalErrors = {};
    for (const key in newErrors) {
        if (key === 'weight' || key === 'height') {
            finalErrors[key] = newErrors[key];
        } else if (key === 'street' || key === 'state' || key === 'city' || key === 'pincode') {
             finalErrors[key] = newErrors[key];
        } else {
            finalErrors[key] = newErrors[key];
        }
    }

    setErrors(prevErrors => ({ ...prevErrors, ...finalErrors }));
    return Object.keys(finalErrors).length === 0;
  };

  // 📝 Handle Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Determine the error key based on the field name structure (e.g., 'healthInfo.weight' -> 'weight')
    const errorKey = name.includes('.') ? name.split('.')[1] : name;
    
    // Reset error for the field being changed
    setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors[errorKey]) {
            delete newErrors[errorKey];
        }
        return newErrors;
    });

    if (name.startsWith("healthInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ➡️ Handle Next Step
  const handleNext = () => {
    if (validate(step)) {
      setStep((prev) => prev + 1);
      // setErrors({}); // Validation handles this for single step.
    } else {
      console.log(`Validation failed on step ${step}`);
    }
  };

  // ⬅️ Handle Back Step
  const handleBack = () => {
    setStep((prev) => prev - 1);
    setErrors({}); // Clear errors when moving back
  };

  // 🚀 Connect to Backend
  const handleSubmit = async () => {
    // Final validation of step 3
    if (!validate(3)) { 
      console.log("Validation failed on final step. Data not submitted.");
      return;
    }

    setIsSubmitting(true);
    const API_URL = "http://localhost:5000/api/donor/register";
    const age = calculateAge(formData.dob);

    // 🧱 FINAL DATA STRUCTURE ALIGNMENT FOR MONGOOSE SCHEMA
    const dataToSend = {
      // 1. Basic Info (Renamed fields)
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact, // This field is extra on the schema, but harmless to send.
      
      // 2. Calculated & Required Fields
      age: age,
      gender: formData.gender, 
      
      // 3. Health/Blood Info (Renamed and Flattened)
      bloodGroup: formData.bloodGroup,
      weight: parseFloat(formData.healthInfo.weight), // Ensure number type
      // Mongoose doesn't require 'height', 'hasDiseases', 'diseaseDetails'

      // 4. Address (Already correctly structured)
      address: formData.address,
    };
    
    console.log("Submitting Donor Data:", dataToSend);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend), 
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🩸 Donor Registered Successfully:", result);
        alert("✅ Donor Registered Successfully!");
        
        // Reset form to initial state and step 1
        setFormData({
            fullName: "", email: "", password: "", phone: "", emergencyContact: "", dob: "", gender: "", bloodGroup: "",
            healthInfo: { weight: "", height: "", hasDiseases: false, diseaseDetails: "" },
            address: { street: "", city: "", state: "", pincode: "" },
        });
        setStep(1); 
      } else {
        const errorData = await response.json();
        console.error("Registration failed:", response.status, errorData);
        alert(`❌ Registration failed. Status: ${response.status}. Message: ${errorData.message || 'Check server logs.'}`);
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      alert("❌ Registration failed due to a network error. Ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎨 JSX UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white border border-red-100 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-2">
          🩸 Donor Registration
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Step {step} of {stepsConfig.length}: {stepsConfig.find(s => s.key === step)?.name}
        </p>

        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8 relative">
          {stepsConfig.map((s, index) => (
            <div key={s.key} className="flex flex-col items-center flex-1 z-10">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${
                  step === s.key ? 'bg-red-600' : step > s.key ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                {s.key}
              </div>
              {/* Label */}
              <p className={`text-xs mt-1 transition-colors ${step >= s.key ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{s.name}</p>
              {/* Connecting Line */}
              {index < stepsConfig.length - 1 && (
                <div
                  className={`absolute h-1 top-[1.2rem] transition-colors duration-300 -z-0 ${
                    step > s.key ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: `calc(100% / ${stepsConfig.length} - 32px)`, left: `${(index + 0.5) * 100 / stepsConfig.length}%` }}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Form Content Wrapper - use type="button" for all navigation to prevent accidental form submission */}
        <form className="space-y-6 text-gray-800" onSubmit={(e) => e.preventDefault()}> 
          
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name (Mongoose: fullName) */}
              <div>
                <label className="font-medium text-sm">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your name" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.fullName ? "border-red-500" : "border-gray-300"}`} />
                {errors.fullName && (<p className="text-sm text-red-500">{errors.fullName}</p>)}
              </div>
              {/* Email */}
              <div>
                <label className="font-medium text-sm">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.email ? "border-red-500" : "border-gray-300"}`} />
                {errors.email && (<p className="text-sm text-red-500">{errors.email}</p>)}
              </div>
              {/* Password */}
              <div className="col-span-1 md:col-span-2">
                <label className="font-medium text-sm">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.password ? "border-red-500" : "border-gray-300"}`} />
                  <button type="button" className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && (<p className="text-sm text-red-500">{errors.password}</p>)}
              </div>
              {/* Phone */}
              <div>
                <label className="font-medium text-sm">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit phone" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.phone ? "border-red-500" : "border-gray-300"}`} />
                {errors.phone && (<p className="text-sm text-red-500">{errors.phone}</p>)}
              </div>
              {/* Emergency Contact */}
              <div>
                <label className="font-medium text-sm">Emergency Contact</label>
                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Emergency number" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.emergencyContact ? "border-red-500" : "border-gray-300"}`} />
                {errors.emergencyContact && (<p className="text-sm text-red-500">{errors.emergencyContact}</p>)}
              </div>
            </div>
          )}

          {/* STEP 2: Health & Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DOB (Used to calculate Mongoose: age) */}
                <div>
                  <label className="font-medium text-sm">Date of Birth (Must be 18-65)</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.dob ? "border-red-500" : "border-gray-300"}`} />
                  {errors.dob && (<p className="text-sm text-red-500">{errors.dob}</p>)}
                </div>
                {/* Gender (Mongoose: gender) */}
                <div>
                  <label className="font-medium text-sm">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.gender ? "border-red-500" : "border-gray-300"}`} >
                      <option value="">Select Gender</option>
                      {["Male", "Female", "Other"].map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                  {errors.gender && (<p className="text-sm text-red-500">{errors.gender}</p>)}
                </div>
                {/* Blood Type (Mongoose: bloodGroup) */}
                <div>
                  <label className="font-medium text-sm">Blood Type</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.bloodGroup ? "border-red-500" : "border-gray-300"}`} >
                    <option value="">Select Blood Type</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (<option key={b} value={b}>{b}</option>))}
                  </select>
                  {errors.bloodGroup && (<p className="text-sm text-red-500">{errors.bloodGroup}</p>)}
                </div>
                {/* Weight (Mongoose: weight) */}
                <div>
                  <label className="font-medium text-sm">Weight (kg) - Min 45kg</label>
                  <input type="number" name="healthInfo.weight" value={formData.healthInfo.weight} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.weight ? "border-red-500" : "border-gray-300"}`} />
                  {errors.weight && (<p className="text-sm text-red-500">{errors.weight}</p>)}
                </div>
                {/* Height (Not explicitly required by schema, kept for completeness) */}
                <div>
                  <label className="font-medium text-sm">Height (cm)</label>
                  <input type="number" name="healthInfo.height" value={formData.healthInfo.height} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.height ? "border-red-500" : "border-gray-300"}`} />
                  {errors.height && (<p className="text-sm text-red-500">{errors.height}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address Details */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Street */}
              <div className="col-span-1 md:col-span-2">
                <label className="font-medium text-sm">Street</label>
                <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} placeholder="Street name" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.street ? "border-red-500" : "border-gray-300"}`} />
                {errors.street && (<p className="text-sm text-red-500">{errors.street}</p>)}
              </div>
              {/* State */}
              <div>
                <label className="font-medium text-sm">State</label>
                <select name="address.state" value={formData.address.state} onChange={handleChange} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.state ? "border-red-500" : "border-gray-300"}`} >
                  <option value="">Select State</option>
                  {Object.keys(states).map((state) => (<option key={state} value={state}>{state}</option>))}
                </select>
                {errors.state && (<p className="text-sm text-red-500">{errors.state}</p>)}
              </div>
              {/* City */}
              <div>
                <label className="font-medium text-sm">City</label>
                <select name="address.city" value={formData.address.city} onChange={handleChange} disabled={!formData.address.state} className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${errors.city ? "border-red-500" : "border-gray-300"}`} >
                  <option value="">{formData.address.state ? "Select City" : "Select State First"}</option>
                  {formData.address.state && states[formData.address.state].map((city) => (<option key={city} value={city}>{city}</option>))}
                </select>
                {errors.city && (<p className="text-sm text-red-500">{errors.city}</p>)}
              </div>
              {/* Pincode */}
              <div>
                <label className="font-medium text-sm">Pincode</label>
                <input type="text" name="address.pincode" value={formData.address.pincode} onChange={handleChange} placeholder="6-digit pincode" className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.pincode ? "border-red-500" : "border-gray-300"}`} />
                {errors.pincode && (<p className="text-sm text-red-500">{errors.pincode}</p>)}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex ${step > 1 ? 'justify-between' : 'justify-end'} pt-6 border-t border-gray-100`}>
            {step > 1 && (
              <button
                type="button" // Prevents accidental submission
                onClick={handleBack}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                ← Back
              </button>
            )}
            
            {step < stepsConfig.length ? (
              <button
                type="button" // Prevents accidental submission
                onClick={handleNext}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button" // Manually calls handleSubmit
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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