import {
  addBloodStock,
  removeBloodStock,
  getBloodStock,
} from "../controllers/bloodLabController.js";
import express from "express";
import {
  createBloodCamp,
  deleteBloodCamp,
  getBloodLabCamps,
  getBloodLabDashboard,
  getBloodLabHistory,
} from "../controllers/bloodLabController.js";
import { protectFacility } from "../middlewares/facilityMiddleware.js";

const router = express.Router();

// Dashboard routes
router.get("/dashboard", protectFacility, getBloodLabDashboard);
router.get("/history", protectFacility, getBloodLabHistory);

// Camp management
router.post("/camps", protectFacility, createBloodCamp);
router.get("/camps", protectFacility, getBloodLabCamps); // Fixed: removed :id
router.delete("/camps/:id", protectFacility, deleteBloodCamp); // Fixed: added /camps prefix

// Blood stock routes
router.post("/blood/add", protectFacility, addBloodStock);
router.post("/blood/remove", protectFacility, removeBloodStock);
router.get("/blood/stock", protectFacility, getBloodStock);

export default router;