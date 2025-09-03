import mongoose from "mongoose";

const bloodSchema = new mongoose.Schema(
  {
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    quantity: {
      type: Number, // in milliliters (ml)
      required: true,
      min: 0,
    },
    collectionDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
      // required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "used", "expired"],
      default: "available",
    },
  },
  { timestamps: true }
);

// Pre-save middleware to set expiration date (42 days after collection)
bloodSchema.pre("save", function (next) {
  if (this.collectionDate && !this.expirationDate) {
    const expiration = new Date(this.collectionDate);
    expiration.setDate(expiration.getDate() + 42);
    this.expirationDate = expiration;
  }
  next();
});

// Virtual for checking if blood is expired
bloodSchema.virtual("isExpired").get(function () {
  return new Date() > this.expirationDate;
});

// Update status if expired
bloodSchema.post("find", function (docs) {
  docs.forEach(async (doc) => {
    if (doc.isExpired && doc.status !== "expired") {
      doc.status = "expired";
      await doc.save();
    }
  });
});

export default mongoose.model("Blood", bloodSchema);