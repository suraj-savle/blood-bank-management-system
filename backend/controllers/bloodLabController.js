import mongoose from "mongoose";
import Blood from "../models/bloodModel.js";
import BloodCamp from "../models/bloodCampModel.js";
import Facility from "../models/facilityModel.js";

/* ==============================================================
   BLOOD LAB DASHBOARD & HISTORY
   ============================================================== */

/**
 * @desc Get Blood Lab Dashboard Stats + Recent Camps
 * @route GET /api/bloodlabs/dashboard
 * @access Private (Blood Lab)
 */
export const getBloodLabDashboard = async (req, res) => {
  try {
    const labId = req.user?._id;

    const [camps, stock, facility] = await Promise.all([
      BloodCamp.find({ hospital: labId }).sort({ createdAt: -1 }),
      Blood.find({ bloodLab: labId }),
      // FIX: Select the history field
      Facility.findById(labId).select('history name email phone address operatingHours status lastLogin') // select relevant fields
    ]);

    const totalCamps = camps.length;
    const upcomingCamps = camps.filter((c) => c.status === "Upcoming").length;
    const completedCamps = camps.filter((c) => c.status === "Completed").length;
    const totalDonors = camps.reduce((sum, c) => sum + (c.actualDonors || 0), 0);
    const totalUnits = stock.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const recentCamps = camps.slice(0, 5);

    res.json({
      stats: { 
        totalCamps, 
        upcomingCamps, 
        completedCamps, 
        totalDonors,
        totalUnits 
      },
      recentCamps,
      facility: facility // Now includes history as fallback
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch blood lab dashboard data" });
  }
};

/**
 * @desc Get Blood Lab History (activity + login)
 * @route GET /api/bloodlabs/history
 * @access Private (Blood Lab)
 */
export const getBloodLabHistory = async (req, res) => {
  try {
    const labId = req.user?._id;
    const lab = await Facility.findById(labId).select("history lastLogin");

    if (!lab) return res.status(404).json({ message: "Blood Lab not found" });

    const activity = lab.history
      .filter((i) => ["Blood Camp", "Verification", "Login", "Stock Update"].includes(i.eventType))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const logins = lab.history
      .filter((i) => i.eventType === "Login")
      .map((login) => ({
        date: login.date,
        ip: login.description || "Unknown",
      }));

    res.json({ activity, logins });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ message: "Failed to fetch blood lab history" });
  }
};

/* ==============================================================
   BLOOD CAMP MANAGEMENT
   ============================================================== */

/**
 * @desc Create a new Blood Camp
 * @route POST /api/blood-lab/camps
 * @access Private (Blood Lab)
 */
export const createBloodCamp = async (req, res) => {
  try {
    const labId = req.user._id;
    const { title, description, date, time, location, expectedDonors } = req.body;

    const requiredFields = [
      { field: title, name: "title" },
      { field: date, name: "date" },
      { field: time?.start, name: "start time" },
      { field: time?.end, name: "end time" },
      { field: location?.venue, name: "venue" },
      { field: location?.city, name: "city" },
      { field: location?.state, name: "state" },
    ];

    const missing = requiredFields.filter((f) => !f.field);
    if (missing.length)
      return res.status(400).json({
        success: false,
        message: `Missing required: ${missing.map((f) => f.name).join(", ")}`,
      });

    const campDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (campDate < today)
      return res.status(400).json({ success: false, message: "Camp date cannot be in the past" });

    if (time.start >= time.end)
      return res.status(400).json({ success: false, message: "End time must be after start time" });

    const camp = await BloodCamp.create({
      hospital: labId,
      title,
      description,
      date: campDate,
      time,
      location,
      expectedDonors,
    });

    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Blood Camp",
          description: `Organized "${title}" at ${location.venue}, ${location.city}`,
          date: new Date(),
          referenceId: camp._id,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Blood camp created successfully",
      data: camp,
    });
  } catch (error) {
    console.error("Create Blood Camp Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc Get all Blood Camps for a Lab
 * @route GET /api/blood-lab/camps
 * @access Private (Blood Lab)
 */
export const getBloodLabCamps = async (req, res) => {
  try {
    const labId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { hospital: labId };
    if (status && status !== "all") filter.status = status;

    const skip = (page - 1) * limit;

    const [camps, total] = await Promise.all([
      BloodCamp.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      BloodCamp.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        camps,
        pagination: {
          total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Blood Camps Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blood camps" });
  }
};

/**
 * @desc Delete a Blood Camp
 * @route DELETE /api/blood-lab/camps/:id
 * @access Private (Blood Lab)
 */
export const deleteBloodCamp = async (req, res) => {
  try {
    const labId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid camp ID" });

    const camp = await BloodCamp.findOne({ _id: id, hospital: labId });
    if (!camp)
      return res.status(404).json({ success: false, message: "Camp not found" });

    await camp.deleteOne();

    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Blood Camp",
          description: `Deleted camp: ${camp.title}`,
          date: new Date(),
        },
      },
    });

    res.json({ success: true, message: "Camp deleted successfully" });
  } catch (error) {
    console.error("Delete Camp Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete camp" });
  }
};

/* ==============================================================
   BLOOD STOCK MANAGEMENT (FIXED)
   ============================================================== */

/**
 * @desc Add Blood Units to Stock
 * @route POST /api/blood-lab/blood/add
 * @access Private (Blood Lab)
 */
export const addBloodStock = async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;
    const bloodLab = req.user._id;

    if (!bloodType || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid bloodType and quantity",
      });
    }

    // Auto expiry (42 days later)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42);

    const createdAt = new Date();

    let stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab });

    if (stock) {
      stock.quantity += Number(quantity);
      stock.expiryDate = expiryDate;
      await stock.save();
    } else {
      stock = await Blood.create({
        bloodGroup: bloodType,
        quantity: Number(quantity),
        expiryDate,
        bloodLab,
      });
    }

    // Add to facility history
    await Facility.findByIdAndUpdate(bloodLab, {
      $push: {
        history: {
          eventType: "Stock Update",
          description: `Added ${quantity} units of ${bloodType}`,
          date: new Date(),
        },
      },
    });

    res.json({
      success: true,
      message: "Blood stock added successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Add Blood Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

/**
 * @desc Remove Blood Units from Stock (FIXED)
 * @route POST /api/blood-lab/blood/remove
 * @access Private (Blood Lab)
 */
export const removeBloodStock = async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;
    const bloodLab = req.user._id;

    if (!bloodType || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid bloodType and quantity",
      });
    }

    const stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `No stock found for blood type ${bloodType}`,
      });
    }

    if (stock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${stock.quantity} units`,
      });
    }

    stock.quantity -= Number(quantity);
    
    // Remove the document if quantity becomes zero
    if (stock.quantity === 0) {
      await Blood.findByIdAndDelete(stock._id);
    } else {
      await stock.save();
    }

    // Add to facility history
    await Facility.findByIdAndUpdate(bloodLab, {
      $push: {
        history: {
          eventType: "Stock Update",
          description: `Removed ${quantity} units of ${bloodType}`,
          date: new Date(),
        },
      },
    });

    res.json({
      success: true,
      message: "Blood stock removed successfully",
      data: { bloodType, remainingQuantity: stock.quantity },
    });
  } catch (error) {
    console.error("Remove Blood Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

/**
 * @desc Get All Blood Stock for Blood Lab
 * @route GET /api/blood-lab/blood/stock
 * @access Private (Blood Lab)
 */
export const getBloodStock = async (req, res) => {
  try {
    const labId = req.user._id;

    const stock = await Blood.find({ bloodLab: labId }).sort({ bloodGroup: 1 });

    res.json({ 
      success: true, 
      data: stock 
    });
  } catch (error) {
    console.error("Get Blood Stock Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
    });
  }
};