import mongoose from "mongoose";

const campSchema = new mongoose.Schema({

    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    location: {
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    enddate: {
        type: Date,
        required: true

    },
    capacity: {
        type: Number,
        required: true
    },
    registeredDonors: [
        {
            donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            registeredAt: { type: Date, default: Date.now }
        }
    ],
    status: {
        type: String,
        enum: ["upcoming", "completed", "cancelled"],
        default: "upcoming"
    }
}, { timestamps: true }
    
campSchema.pre("save", function (next) {
    if (this.date && !this.enddate) {
        const expiration = new Date(this.collectionDate);
        expiration.setDate(expiration.getDate() + 42);
        this.expirationDate = expiration;
    }
    next();
});
);

export default mongoose.model("Camp", campSchema);
