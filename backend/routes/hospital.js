import express from "express";
import Blood from "../models/BloodModel.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET all blood units for a hospital
router.get("/hospital/blood", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, bloodType } = req.query;
    
    const filter = { hospital: req.user.id };
    if (status) filter.status = status;
    if (bloodType) filter.bloodType = bloodType;
    
    const bloodUnits = await Blood.find(filter)
      .sort({ collectionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blood.countDocuments(filter);
    
    res.json({
      success: true,
      bloodUnits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get blood units error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching blood units" 
    });
  }
});

// GET blood inventory summary for hospital
router.get("/hospital/blood/inventory", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const inventory = await Blood.aggregate([
      { 
        $match: { 
          hospital: req.user._id, 
          status: "available",
          expirationDate: { $gt: new Date() }
        } 
      },
      {
        $group: {
          _id: "$bloodType",
          totalQuantity: { $sum: "$quantity" },
          units: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching inventory" 
    });
  }
});

// POST add new blood unit
router.post("/hospital/blood", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { bloodType, quantity, collectionDate } = req.body;
    
    // Validation
    if (!bloodType || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: "Blood type and quantity are required" 
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Quantity must be greater than 0" 
      });
    }
    
    const bloodUnit = new Blood({
      bloodType,
      quantity,
      collectionDate: collectionDate || new Date(),
      hospital: req.user.id,
      status: "available"
    });
    
    await bloodUnit.save();
    
    res.status(201).json({
      success: true,
      message: "Blood unit added successfully",
      bloodUnit
    });
  } catch (error) {
    console.error("Add blood unit error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(", ") 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error while adding blood unit" 
    });
  }
});

// PUT update blood unit
router.put("/hospital/blood/:id", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodType, quantity, status, collectionDate } = req.body;
    
    const bloodUnit = await Blood.findOne({ 
      _id: id, 
      hospital: req.user.id 
    });
    
    if (!bloodUnit) {
      return res.status(404).json({ 
        success: false, 
        message: "Blood unit not found" 
      });
    }
    
    // Update fields if provided
    if (bloodType) bloodUnit.bloodType = bloodType;
    if (quantity) bloodUnit.quantity = quantity;
    if (status) bloodUnit.status = status;
    if (collectionDate) {
      bloodUnit.collectionDate = collectionDate;
      // Reset expiration date (will be recalculated in pre-save)
      bloodUnit.expirationDate = undefined;
    }
    
    await bloodUnit.save();
    
    res.json({
      success: true,
      message: "Blood unit updated successfully",
      bloodUnit
    });
  } catch (error) {
    console.error("Update blood unit error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(", ") 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error while updating blood unit" 
    });
  }
});

// DELETE remove blood unit
router.delete("/hospital/blood/:id", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const bloodUnit = await Blood.findOneAndDelete({ 
      _id: id, 
      hospital: req.user.id 
    });
    
    if (!bloodUnit) {
      return res.status(404).json({ 
        success: false, 
        message: "Blood unit not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Blood unit deleted successfully"
    });
  } catch (error) {
    console.error("Delete blood unit error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while deleting blood unit" 
    });
  }
});

// GET expired blood units
router.get("/hospital/blood/expired", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const expiredBlood = await Blood.find({
      hospital: req.user.id,
      expirationDate: { $lt: new Date() }
    }).sort({ expirationDate: 1 });
    
    res.json({
      success: true,
      expiredBlood,
      count: expiredBlood.length
    });
  } catch (error) {
    console.error("Get expired blood error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching expired blood" 
    });
  }
});

// PATCH mark blood as used
router.patch("/hospital/blood/:id/use", authenticate, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { usedQuantity } = req.body;
    
    const bloodUnit = await Blood.findOne({ 
      _id: id, 
      hospital: req.user.id 
    });
    
    if (!bloodUnit) {
      return res.status(404).json({ 
        success: false, 
        message: "Blood unit not found" 
      });
    }
    
    if (bloodUnit.status !== "available") {
      return res.status(400).json({ 
        success: false, 
        message: "Only available blood can be used" 
      });
    }
    
    if (bloodUnit.isExpired) {
      return res.status(400).json({ 
        success: false, 
        message: "Expired blood cannot be used" 
      });
    }
    
    if (usedQuantity) {
      if (usedQuantity > bloodUnit.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: "Used quantity cannot exceed available quantity" 
        });
      }
      
      // Partial usage
      bloodUnit.quantity -= usedQuantity;
      
      if (bloodUnit.quantity === 0) {
        bloodUnit.status = "used";
      }
    } else {
      // Full usage
      bloodUnit.status = "used";
    }
    
    await bloodUnit.save();
    
    res.json({
      success: true,
      message: `Blood unit ${usedQuantity ? 'partially' : 'fully'} used successfully`,
      bloodUnit
    });
  } catch (error) {
    console.error("Use blood error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while using blood" 
    });
  }
});

export default router;