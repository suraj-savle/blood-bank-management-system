import express from "express";
import {
  createBloodCamp,
  deleteBloodCamp,
  getBloodLabCamps,
  getBloodLabDashboard,
  getBloodLabHistory,
  updateBloodCamp,        // ADD THIS
  updateCampStatus,       // ADD THIS
  addBloodStock,
  removeBloodStock,
  getBloodStock,
  updateBloodRequestStatus,
  getLabBloodRequests,
  getAllLabs,
  getCampRegistrations,
  verifyCampDonation,
} from "../controllers/bloodLabController.js";
import { protectFacility } from "../middlewares/facilityMiddleware.js";
import { getRecentDonations, markDonation, searchDonor } from "../controllers/donorController.js";

const router = express.Router();

// Dashboard routes
router.get("/dashboard", protectFacility, getBloodLabDashboard);
router.get("/history", protectFacility, getBloodLabHistory);

// Camp management
router.post("/camps", protectFacility, createBloodCamp);
router.get("/camps", protectFacility, getBloodLabCamps);
router.put("/camps/:id", protectFacility, updateBloodCamp);        // ADD THIS
router.patch("/camps/:id/status", protectFacility, updateCampStatus); // ADD THIS
router.delete("/camps/:id", protectFacility, deleteBloodCamp);
router.get('/camps/:id/registrations', protectFacility, getCampRegistrations);
router.post('/camps/:campId/registrations/:donorId/verify', protectFacility, verifyCampDonation);

// Blood stock routes
router.post("/blood/add", protectFacility, addBloodStock);
router.post("/blood/remove", protectFacility, removeBloodStock);
router.get("/blood/stock", protectFacility, getBloodStock);


// Blood request routes for labs
router.get("/blood/requests", protectFacility, getLabBloodRequests);
router.put("/blood/requests/:id", protectFacility, updateBloodRequestStatus);

// Get labs for hospitals
router.get("/labs", protectFacility, getAllLabs);

// Add these routes to your bloodLabRoutes.js
router.get("/donors/search", protectFacility, searchDonor);
router.post("/donors/donate/:id", protectFacility, markDonation);
router.get("/donations/recent", protectFacility, getRecentDonations);

export default router;