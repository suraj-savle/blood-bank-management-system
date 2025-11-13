import mongoose from "mongoose";

const bloodSchema = new mongoose.Schema({
  bloodGroup: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  bloodLab: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
});


export default mongoose.model("Blood", bloodSchema);
