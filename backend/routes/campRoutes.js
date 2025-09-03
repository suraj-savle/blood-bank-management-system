import express from "express";
import Camp from "../models/CampModel.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// CREATE a new camp
router.post("/", authenticate, authorize("hospital", "admin"), async (req, res) => {
    try {
        const { name, description, location, date, capacity } = req.body;

        if (!name || !location || !date || !capacity) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const camp = new Camp({
            hospital: req.user._id,
            name,
            description,
            location,
            date,
            capacity,

        });

        await camp.save();

        res.status(201).json({ success: true, message: "Camp created successfully", camp });
    } catch (error) {
        console.error("Create camp error:", error);
        res.status(500).json({ success: false, message: "Server error while creating camp" });
    }
});

// GET all camps (for donors to see)
router.get("/", authenticate, async (req, res) => {
    try {
        const camps = await Camp.find({ status: "upcoming" })
            .populate("hospital", "name address phone")
            .sort({ date: 1 });

        res.json({ success: true, camps });
    } catch (error) {
        console.error("Get camps error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching camps" });
    }
});

// GET hospital’s own camps
router.get("/my-camps", authenticate, authorize("hospital", "admin"), async (req, res) => {
    try {
        const camps = await Camp.find({ hospital: req.user._id }).sort({ date: -1 });
        res.json({ success: true, camps });
    } catch (error) {
        console.error("Get hospital camps error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching hospital camps" });
    }
});

// UPDATE camp
router.put("/:id", authenticate, authorize("hospital", "admin"), async (req, res) => {
    try {
        const camp = await Camp.findOneAndUpdate(
            { _id: req.params.id, hospital: req.user._id },
            req.body,
            { new: true }
        );

        if (!camp) {
            return res.status(404).json({ success: false, message: "Camp not found" });
        }

        res.json({ success: true, message: "Camp updated successfully", camp });
    } catch (error) {
        console.error("Update camp error:", error);
        res.status(500).json({ success: false, message: "Server error while updating camp" });
    }
});

// DELETE camp
router.delete("/:id", authenticate, authorize("hospital", "admin"), async (req, res) => {
    try {
        const camp = await Camp.findOneAndDelete({ _id: req.params.id, hospital: req.user._id });

        if (!camp) {
            return res.status(404).json({ success: false, message: "Camp not found" });
        }

        res.json({ success: true, message: "Camp deleted successfully" });
    } catch (error) {
        console.error("Delete camp error:", error);
        res.status(500).json({ success: false, message: "Server error while deleting camp" });
    }
});

export default router;
