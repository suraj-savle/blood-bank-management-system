import express from "express";
import {
  loginAdmin,
  approveFacility,
  rejectFacility,
  listPendingFacilities,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// 🔓 Public Route
router.post("/login", loginAdmin);

// 🔐 Protected Routes
router.get("/pending-facilities", protectAdmin, listPendingFacilities);
router.put("/facility/:facilityId/approve", protectAdmin, approveFacility);
router.put("/facility/:facilityId/reject", protectAdmin, rejectFacility);

export default router;
