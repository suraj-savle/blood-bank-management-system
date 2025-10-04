import express from "express";
import {
  registerFacility,
  loginFacility,
  getProfile,
  updateProfile,
} from "../controllers/facilityController.js";
import { protectFacility } from "../middleware/facilityMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerFacility);
router.post("/login", loginFacility);

// Protected routes (only approved facilities)
router.get("/profile", protectFacility, getProfile);
router.put("/profile", protectFacility, updateProfile);

export default router;
