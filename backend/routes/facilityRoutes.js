import express from "express";
import {
  getFacilityDashboard,
  getProfile,
  updateProfile,
} from "../controllers/facilityController.js";
import { protectFacility } from "../middlewares/facilityMiddleware.js";


const router = express.Router();

/**
 * @route   GET /api/facility/dashboard
 * @desc    Get facility dashboard stats
 * @access  Private (facility only)
 */
router.get("/dashboard", protectFacility, getFacilityDashboard);

/**
 * @route   GET /api/facility/profile
 * @desc    Get facility profile details
 * @access  Private
 */
router.get("/profile", protectFacility, getProfile);

/**
 * @route   PUT /api/facility/profile
 * @desc    Update facility profile
 * @access  Private
 */
router.put("/profile", protectFacility, updateProfile);

export default router;
