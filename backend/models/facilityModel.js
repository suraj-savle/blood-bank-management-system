import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const facilitySchema = new mongoose.Schema(
  {
    // 🏥 Basic Info
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },

    // 📞 Contact Info
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit phone number"]
    },
    emergencyContact: {
      type: String,
      required: [true, "Emergency contact number is required"],
      match: [/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit phone number"]
    },
    address: {
      street: { type: String, required: [true, "Street address is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"]
      }
    },

    // 🧾 Facility Details
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    facilityType: {
      type: String,
      enum: ["hospital", "blood-lab"],
      required: [true, "Facility type is required"]
    },
    role: {
      type: String,
      enum: ["hospital", "blood-lab"],
    },
    facilityCategory: {
      type: String,
      enum: ["Government", "Private", "Trust", "Charity", "Other"],
      default: "Private"
    },

    // 📄 Documents & Verification
    documents: {
      registrationProof: {
        url: { type: String, required: [true, "Document URL is required"] },
        filename: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: Date,
    rejectionReason: String,

    // 🕒 Operating Info (for admin dashboard)
    operatingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "18:00" },
      workingDays: {
        type: [String],
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        default: ["Mon", "Tue", "Wed", "Thu", "Fri"]
      }
    },
    is24x7: { type: Boolean, default: false },
    emergencyServices: { type: Boolean, default: false },

    // 📜 History for Admin Dashboard

    history: {
      type: [
        {
          eventType: {
            type: String,
            enum: [
              "Login",
              "Verification",
              "Stock Update",
              "Blood Camp",
              "Request Approved",
              "Profile Update",
              "Donation",
            ],
          },
          description: String,
          date: { type: Date, default: Date.now },
        },
      ],
      default: [], // ✅ ensures history is always initialized
    },


    // 🔐 Security & Access
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// 🧩 Auto-assign role from facilityType
facilitySchema.pre("save", function (next) {
  if (this.facilityType) {
    this.role = this.facilityType;
  }
  next();
});

//
// 🔐 Hash password before save
//
facilitySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// 🧠 Compare password
//
facilitySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Facility", facilitySchema);
