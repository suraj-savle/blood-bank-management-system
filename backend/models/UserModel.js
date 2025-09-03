import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true,
      select: false  // Don’t include password in queries by default
    },
    role: {
      type: String,
      enum: ["donor", "hospital", "admin"],
      required: true,
    },
    phone: { 
      type: String,
      required: function() {
        return this.role !== "admin"; // Admins might not need phone
      }
    },
    address: { 
      type: String,
      required: function() {
        return this.role === "hospital"; // Hospitals need addresses
      }
    },

    // Donor-specific fields
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: function() {
        return this.role === "donor";
      }
    },
    healthInfo: {
      weight: { type: Number, min: 40, max: 200 }, // kg
      height: { type: Number, min: 140, max: 220 }, // cm
      hasDiseases: { type: Boolean, default: false },
      diseaseDetails: { type: String }
    },

    // Hospital-specific fields
    hospitalInfo: {
      licenseNumber: { 
        type: String,
        required: function() {
          return this.role === "hospital";
        },
        unique: true,
        sparse: true
      },
      emergencyContact: { type: String }
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
export default mongoose.model("User", userSchema);
