import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import donorRoutes from "./routes/donorRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// 🧩 Routes
app.use("/api/donor", donorRoutes);
app.use("/api/facility", facilityRoutes);

app.use("/api/admin", adminRoutes);



// 🗄️ DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error ❌", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
