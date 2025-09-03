import express from "express";
import mongoose from "mongoose";
import authentication_routes from "./routes/authentication.js";
import hospital_routes from "./routes/hospital.js";
import campRoutes from "./routes/campRoutes.js";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// load express app
const app = express();
app.use(express.json());

// authentication routes like login, register
app.use("/api/auth", authentication_routes);

// Hospital routes
app.use("/api", hospital_routes);

// Camp routes
app.use("/api/camps", campRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});



// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB Connected");
  app.listen(5000, () => console.log("Server running on port 5000"));
}).catch((err) => console.log(err));
