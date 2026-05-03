import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import { swaggerUi, swaggerDocs } from "./openapi/index.js"
import { protectDonor } from "./middlewares/donorMiddleware.js";
import { protectFacility } from "./middlewares/facilityMiddleware.js";
import {
  bookDonationCamp,
  cancelDonationBooking,
  getDonorBookings,
} from "./controllers/donorController.js";
import {
  getCampRegistrations,
  verifyCampDonation,
} from "./controllers/bloodLabController.js";

dotenv.config();
const app = express();

app.use(express.json());

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both ports
  credentials: true,
}));

app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 🧩 Routes

app.use("/api/auth", authRoutes);

// Fallback explicit donor booking endpoints
app.get("/api/donor/camps/bookings", protectDonor, getDonorBookings);
app.post("/api/donor/camps/:id/book", protectDonor, bookDonationCamp);
app.delete("/api/donor/camps/:id/book", protectDonor, cancelDonationBooking);

// Fallback explicit blood lab camp registration endpoints
app.get("/api/blood-lab/camps/:id/registrations", protectFacility, getCampRegistrations);
app.post(
  "/api/blood-lab/camps/:campId/registrations/:donorId/verify",
  protectFacility,
  verifyCampDonation
);


app.use("/api/donor", donorRoutes);

app.use("/api/facility", facilityRoutes);

app.use("/api/admin", adminRoutes);



import bloodLabRoutes from "./routes/bloodLabRoutes.js";
app.use("/api/blood-lab", bloodLabRoutes);


import hospitalRoutes from "./routes/hospitalRoutes.js";
app.use("/api/hospital", hospitalRoutes);


// 🗄️ DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected successfully "))
  .catch((err) => console.log("MongoDB Error ", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} `));
