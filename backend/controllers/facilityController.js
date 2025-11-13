import Facility from "../models/facilityModel.js";
import bcrypt from "bcryptjs";

/**
 * @desc Get facility profile
 * @route GET /api/facility/profile
 */
export const getProfile = async (req, res) => {
  try {
    const facility = await Facility.findById(req.user.id)
      .select("-password -__v")
      .lean();

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    res.status(200).json({
      success: true,
      facility
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
};

/**
 * @desc Update facility profile
 * @route PUT /api/facility/profile
 */
export const updateProfile = async (req, res) => {
  const session = await Facility.startSession();
  session.startTransaction();

  try {
    console.log("📝 Facility profile update request:", {
      userId: req.user._id,
      updates: Object.keys(req.body)
    });

    const updates = { ...req.body };
    // The user ID is expected to be attached to the request object via middleware (e.g., auth middleware)
    const facilityId = req.user._id;

    // Validate facility exists
    const existingFacility = await Facility.findById(facilityId).session(session);
    if (!existingFacility) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    // Define allowed fields for update by the facility user
    const allowedFields = [
      "name", "phone", "emergencyContact", "operatingHours",
      "services", "description", "website", "contactPerson",
      "password" // Allowing password update via the same endpoint
    ];

    // Filter updates to only include allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && key !== "password") {
        filteredUpdates[key] = updates[key];
      }
    });

    // Handle address updates separately to merge with existing data
    if (updates.address && typeof updates.address === 'object') {
      // Merge new address fields with existing ones to avoid accidental deletion
      filteredUpdates.address = {
        ...existingFacility.address.toObject(), // Use toObject() for Mongoose subdocuments
        ...updates.address
      };
    }

    // Handle password update (if provided)
    if (updates.password) {
      if (updates.password.length < 6) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long"
        });
      }
      const salt = await bcrypt.genSalt(12);
      filteredUpdates.password = await bcrypt.hash(updates.password, salt);
    }

    // Update facility in MongoDB
    const updatedFacility = await Facility.findByIdAndUpdate(
      facilityId,
      {
        ...filteredUpdates,
        // Log the profile update event in history
        $push: {
          history: {
            eventType: "Profile Update",
            description: "Facility profile updated by user",
            date: new Date(),
          }
        }
      },
      {
        new: true,
        runValidators: true,
        session,
        // Exclude sensitive fields from the returned object
        select: "-password -__v"
      }
    );

    // Trim history if too long (optional safety feature)
    if (updatedFacility.history.length > 50) {
      updatedFacility.history = updatedFacility.history.slice(-50);
      await updatedFacility.save({ session });
    }

    await session.commitTransaction();

    console.log("✅ Facility profile updated successfully:", updatedFacility._id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      facility: updatedFacility
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("🚨 Update Facility Profile Error:", error);

    let errorMessage = "Failed to update profile";
    let validationErrors = {};

    if (error.name === 'ValidationError') {
      // Format Mongoose validation errors for frontend consumption
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      errorMessage = "Validation failed: Please check your input.";
    }

    res.status(400).json({ // Use 400 for validation errors
      success: false,
      message: errorMessage,
      errors: validationErrors, // Send detailed errors to frontend
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};
/**
 * @desc Facility dashboard overview
 * @route GET /api/facility/dashboard
 */
export const getFacilityDashboard = async (req, res) => {
  try {
    const facility = await Facility.findById(req.user._id)
      .select("name history facilityType")
      .lean();

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    // Calculate stats (you'll replace these with actual model queries)
    const totalCamps = facility.history.filter(h => h.eventType === "Blood Camp").length;
    const recentHistory = facility.history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const dashboardData = {
      totalCamps,
      upcomingCamps: 2, // Replace with: await Camp.countDocuments({ facility: facilityId, date: { $gte: new Date() } })
      bloodSlots: 10, // Replace with: await Slot.countDocuments({ facility: facilityId, status: 'available' })
      activeRequests: 4, // Replace with: await Request.countDocuments({ facility: facilityId, status: 'pending' })
      totalHistory: facility.history.length,
      recentHistory,
    };

    res.status(200).json({
      success: true,
      facility: facility.name,
      facilityType: facility.facilityType,
      stats: dashboardData,
    });
  } catch (error) {
    console.error("Facility Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data"
    });
  }
};