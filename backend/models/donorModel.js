import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const donorSchema = new mongoose.Schema(
  {
    // 👤 Basic Info
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit phone number"],
    },

    // 📍 Location
    address: {
      street: { type: String, required: [true, "Street address is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"],
      },
    },

    // 🩸 Medical / Blood Info
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Must be at least 18 years old to donate blood"],
      max: [65, "Age limit for blood donation is 65 years"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    weight: {
      type: Number,
      min: [45, "Minimum weight should be 45kg to donate blood"],
    },
    lastDonationDate: { type: Date },
    eligibleToDonate: { type: Boolean, default: true },

    // 🧾 Documents (optional for verification)
    idProof: {
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
    },

    // 📜 Donation History (for admin + donor profile)
    donationHistory: [
      {
        donationDate: { type: Date, default: Date.now },
        facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
        bloodGroup: {
          type: String,
          enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        },
        quantity: { type: Number, default: 1 },
        remarks: String,
        verified: { type: Boolean, default: false },
      },
    ],

    // 🔐 Security & Access
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

//
// 🔐 Hash password before saving
//
donorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// 🧠 Compare password method
//
donorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

//
// 🧩 Virtuals for donor status
//
donorSchema.virtual("isEligible").get(function () {
  if (!this.lastDonationDate) return true;
  const last = new Date(this.lastDonationDate);
  const now = new Date();
  const diff = (now - last) / (1000 * 60 * 60 * 24); // days
  return diff >= 90; // 3 months gap rule
});

export default mongoose.model("Donor", donorSchema);
