import mongoose from "mongoose";

const bloodCampSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Camp title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Camp date is required"],
    },
    time: {
      start: { type: String, required: [true, "Start time is required"] },
      end: { type: String, required: [true, "End time is required"] },
    },
    location: {
      venue: { type: String, required: [true, "Venue name is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      pincode: {
        type: String,
        match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"],
      },
    },
    expectedDonors: { type: Number, default: 0 },
    actualDonors: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BloodCamp", bloodCampSchema);
