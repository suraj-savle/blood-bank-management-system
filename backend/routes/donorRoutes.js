import express from "express";
import {
	bookDonationCamp,
	cancelDonationBooking,
	getDonorBookings,
	getDonorCamps,
	getDonorHistory,
	getDonorProfile,
	getDonorStats,
	updateDonorProfile,
} from "../controllers/donorController.js";
import { protectDonor } from "../middlewares/donorMiddleware.js";


const router = express.Router();

router.get("/profile", protectDonor, getDonorProfile)

router.put("/profile", protectDonor, updateDonorProfile);

router.get("/camps", protectDonor, getDonorCamps);
router.get("/camps/bookings", protectDonor, getDonorBookings);
router.post("/camps/:id/book", protectDonor, bookDonationCamp);
router.delete("/camps/:id/book", protectDonor, cancelDonationBooking);

router.get("/history", protectDonor, getDonorHistory);

router.get("/stats", protectDonor, getDonorStats);



export default router;
