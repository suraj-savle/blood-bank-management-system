"use client";
import { useState } from "react";

export default function FacilityRegisterForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    address: { street: "", city: "", state: "", pincode: "" },
    registrationNumber: "",
    facilityType: "Hospital",
    facilityCategory: "Private",
    documents: { registrationProof: { url: "", filename: "" } },
    operatingHours: {
      open: "09:00",
      close: "18:00",
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    is24x7: false,
    emergencyServices: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const facilityTypes = ["Hospital", "Blood Lab"];
  const facilityCategories = [
    "Government",
    "Private",
    "Trust",
    "Charity",
    "Other",
  ];
  const states = {
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Karnataka: ["Bengaluru", "Mysore", "Mangalore"],
    Delhi: ["New Delhi", "Dwarka", "Rohini"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.startsWith("documents.registrationProof.")) {
      const field = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        documents: {
          registrationProof: {
            ...prev.documents.registrationProof,
            [field]: value,
          },
        },
      }));
    } else if (name.startsWith("operatingHours.")) {
      const field = name.split(".")[1];
      if (field === "workingDays") {
        const options = Array.from(e.target.selectedOptions).map(
          (o) => o.value
        );
        setFormData((prev) => ({
          ...prev,
          operatingHours: { ...prev.operatingHours, workingDays: options },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          operatingHours: { ...prev.operatingHours, [field]: value },
        }));
      }
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Facility name required";
      if (!formData.email.trim()) newErrors.email = "Email required";
      else if (!/^\S+@\S+\.\S+$/.test(formData.email))
        newErrors.email = "Invalid email";
    }
    if (step === 2) {
      if (!formData.password || formData.password.length < 6)
        newErrors.password = "Password min 6 chars";
      if (!formData.facilityType)
        newErrors.facilityType = "Select facility type";
    }
    if (step === 3) {
      if (!/^[6-9][0-9]{9}$/.test(formData.phone))
        newErrors.phone = "Phone must be 10 digits";
      if (!/^[6-9][0-9]{9}$/.test(formData.emergencyContact))
        newErrors.emergencyContact = "Emergency must be 10 digits";
      if (!formData.registrationNumber.trim())
        newErrors.registrationNumber = "Registration number required";
      if (!formData.address.street.trim())
        newErrors["address.street"] = "Street required";
      if (!formData.address.city.trim())
        newErrors["address.city"] = "City required";
      if (!formData.address.state.trim())
        newErrors["address.state"] = "State required";
      if (!/^[1-9][0-9]{5}$/.test(formData.address.pincode))
        newErrors["address.pincode"] = "Pincode must be 6 digits";
      if (!formData.documents.registrationProof.url.trim())
        newErrors["documents.registrationProof.url"] = "Document URL required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      console.log("Facility Data:", formData);
      alert("Facility Registered Successfully!");
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden text-gray-900">
        <div className="bg-red-600 text-white p-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            Blood Facility Registration
          </h1>
          <p className="text-center mb-4">
            Register your facility in 3 simple steps
          </p>
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm">Step {step} of 3</span>
            <span className="text-sm">
              {progressPercentage.toFixed(0)}% Complete
            </span>
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
              <div>
                <label className="block font-medium mb-1">
                  Facility Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Facility Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="facilityType"
                  value={formData.facilityType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                    errors.facilityType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {facilityTypes.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Facility Category
                </label>
                <select
                  name="facilityCategory"
                  value={formData.facilityCategory}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 border-gray-300"
                >
                  {facilityCategories.map((fc) => (
                    <option key={fc} value={fc}>
                      {fc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Emergency Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors.emergencyContact
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-1">Address</label>

                  {/* Street */}
                  <input
                    type="text"
                    name="address.street"
                    placeholder="Street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors["address.street"]
                        ? "border-red-500"
                        : "border-gray-300"
                    } mb-2`}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* State */}
                    <select
                      name="address.state"
                      value={formData.address.state}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, city: "" },
                        })); // reset city
                      }}
                      className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                        errors["address.state"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select State</option>
                      {Object.keys(states).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>

                    {/* City */}
                    <select
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                        errors["address.city"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      disabled={!formData.address.state}
                    >
                      <option value="">Select City</option>
                      {formData.address.state &&
                        states[formData.address.state].map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>

                    {/* Pincode */}
                    <input
                      type="text"
                      name="address.pincode"
                      placeholder="Pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                        errors["address.pincode"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-1">
                    Registration Proof URL{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="documents.registrationProof.url"
                    value={formData.documents.registrationProof.url}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors["documents.registrationProof.url"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-1">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      errors.registrationNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Opening Time</label>
                  <input
                    type="time"
                    name="operatingHours.open"
                    value={formData.operatingHours.open}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Closing Time</label>
                  <input
                    type="time"
                    name="operatingHours.close"
                    value={formData.operatingHours.close}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is24x7"
                    checked={formData.is24x7}
                    onChange={handleChange}
                    className="accent-red-500"
                  />
                  <span>24x7 Service</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="emergencyServices"
                    checked={formData.emergencyServices}
                    onChange={handleChange}
                    className="accent-red-500"
                  />
                  <span>Emergency Services</span>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Register Facility
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
