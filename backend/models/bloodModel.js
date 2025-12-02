// models/bloodModel.js
import mongoose from "mongoose";

const bloodSchema = new mongoose.Schema({
  bloodGroup: { 
    type: String, 
    required: true,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  bloodLab: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility" 
  },
  hospital: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility" 
  },
}, { timestamps: true });

// Add validation to ensure either bloodLab OR hospital is set
bloodSchema.pre('save', function(next) {
  if (!this.bloodLab && !this.hospital) {
    return next(new Error('Either bloodLab or hospital must be provided'));
  }
  if (this.bloodLab && this.hospital) {
    return next(new Error('Blood unit cannot belong to both bloodLab and hospital'));
  }
  next();
});

// Add index for better query performance
bloodSchema.index({ bloodLab: 1, bloodGroup: 1 });
bloodSchema.index({ hospital: 1, bloodGroup: 1 });

export default mongoose.model("Blood", bloodSchema);