import mongoose from "mongoose";
import Blood from "../models/bloodModel.js";
import BloodCamp from "../models/bloodCampModel.js";
import Facility from "../models/facilityModel.js";
import BloodRequest from "../models/bloodRequestModel.js";
import Donor from "../models/donorModel.js";


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


// Add these to your bloodLabController.js

/**
 * @desc Update a Blood Camp
 * @route PUT /api/blood-lab/camps/:id
 * @access Private (Blood Lab)
 */
export const updateBloodCamp = async (req, res) => {
  try {
    const labId = req.user._id;
    const { id } = req.params;
    const { title, description, date, time, location, expectedDonors } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const camp = await BloodCamp.findOne({ _id: id, hospital: labId });
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    // Update fields
    if (title) camp.title = title;
    if (description !== undefined) camp.description = description;
    if (date) camp.date = new Date(date);
    if (time) camp.time = time;
    if (location) camp.location = location;
    if (expectedDonors) camp.expectedDonors = expectedDonors;

    await camp.save();

    // Add to history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Blood Camp",
          description: `Updated camp: ${camp.title}`,
          date: new Date(),
          referenceId: camp._id,
        },
      },
    });

    res.json({
      success: true,
      message: "Camp updated successfully",
      data: camp,
    });
  } catch (error) {
    console.error("Update Blood Camp Error:", error);
    res.status(500).json({ success: false, message: "Failed to update camp" });
  }
};

/**
 * @desc Update Blood Camp Status
 * @route PATCH /api/blood-lab/camps/:id/status
 * @access Private (Blood Lab)
 */
export const updateCampStatus = async (req, res) => {
  try {
    const labId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const validStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: Upcoming, Ongoing, Completed, or Cancelled"
      });
    }

    const camp = await BloodCamp.findOne({ _id: id, hospital: labId });
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    camp.status = status;
    await camp.save();

    // Add to history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Blood Camp",
          description: `Changed camp status to: ${status} - ${camp.title}`,
          date: new Date(),
          referenceId: camp._id,
        },
      },
    });

    res.json({
      success: true,
      message: `Camp status updated to ${status}`,
      data: camp,
    });
  } catch (error) {
    console.error("Update Camp Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update camp status" });
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
// ---------------

/* ==============================================================
   BLOOD REQUEST MANAGEMENT FOR BLOOD LABS
   ============================================================== */

/**
 * @desc Get all blood requests for a lab
 * @route GET /api/blood-lab/blood/requests
 * @access Private (Blood Lab)
 */
export const getLabBloodRequests = async (req, res) => {
  try {
    const labId = req.user._id;

    const requests = await BloodRequest.find({ labId })
      .populate("hospitalId", "name email phone address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests
    });
  } catch (err) {
    console.error("Get Lab Requests Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blood requests"
    });
  }
};

/**
 * @desc Update blood request status (accept/reject)
 * @route PUT /api/blood-lab/blood/requests/:id
 * @access Private (Blood Lab)
 */
export const updateBloodRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // accept / reject
    const labId = req.user._id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid action. Must be 'accept' or 'reject'" 
      });
    }

    // Find the request
    const request = await BloodRequest.findOne({ 
      _id: id, 
      labId 
    }).populate("hospitalId", "name");

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: "Request already processed" 
      });
    }

    // If accepting, check stock availability
    if (action === "accept") {
      const labStock = await Blood.findOne({ 
        bloodLab: labId, 
        bloodGroup: request.bloodType 
      });

      if (!labStock || labStock.quantity < request.units) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${labStock?.quantity || 0} units, Requested: ${request.units} units`
        });
      }

      // Remove from lab stock
      labStock.quantity -= request.units;
      
      if (labStock.quantity === 0) {
        await Blood.findByIdAndDelete(labStock._id);
      } else {
        await labStock.save();
      }

      // Add to hospital stock (create or update)
      const hospitalStock = await Blood.findOne({
        hospital: request.hospitalId._id,
        bloodGroup: request.bloodType
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 42); // 42 days expiry

      if (hospitalStock) {
        hospitalStock.quantity += request.units;
        hospitalStock.expiryDate = expiryDate;
        await hospitalStock.save();
      } else {
        // FIX: Use hospital field instead of bloodLab
        await Blood.create({
          bloodGroup: request.bloodType,
          quantity: request.units,
          expiryDate,
          hospital: request.hospitalId._id // This is the fix
        });
      }

      // Add history to both facilities
      await Facility.findByIdAndUpdate(labId, {
        $push: {
          history: {
            eventType: "Stock Update",
            description: `Transferred ${request.units} units of ${request.bloodType} to ${request.hospitalId.name}`,
            date: new Date(),
            referenceId: request._id,
          },
        },
      });

      await Facility.findByIdAndUpdate(request.hospitalId._id, {
        $push: {
          history: {
            eventType: "Stock Update",
            description: `Received ${request.units} units of ${request.bloodType} from blood lab`,
            date: new Date(),
            referenceId: request._id,
          },
        },
      });
    } else {
      // For reject action, just add to history
      await Facility.findByIdAndUpdate(labId, {
        $push: {
          history: {
            eventType: "Stock Update",
            description: `Rejected blood request for ${request.units} units of ${request.bloodType} from ${request.hospitalId.name}`,
            date: new Date(),
            referenceId: request._id,
          },
        },
      });
    }

    // Update request status
    request.status = action === "accept" ? "accepted" : "rejected";
    request.processedAt = new Date();
    await request.save();

    res.status(200).json({ 
      success: true, 
      message: `Request ${action}ed successfully`,
      data: request
    });

  } catch (err) {
    console.error("Update Request Status Error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to process request" 
    });
  }
};

/**
 * @desc Get all approved blood labs for hospitals
 * @route GET /api/facility/labs
 * @access Private (Hospital)
 */
export const getAllLabs = async (req, res) => {
  try {
    const labs = await Facility.find({
      facilityType: "blood-lab",
      status: "approved"
    }).select("name email phone address operatingHours");

    res.status(200).json({
      success: true,
      labs
    });
  } catch (error) {
    console.error("Get Labs Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blood labs"
    });
  }
};

/**
 * @desc Get registrations for a camp (with donor info)
 * @route GET /api/blood-lab/camps/:id/registrations
 * @access Private (Blood Lab)
 */
export const getCampRegistrations = async (req, res) => {
  try {
    const labId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid camp ID" });

    const camp = await BloodCamp.findById(id).populate({
      path: 'registrations.donor',
      select: 'fullName email phone bloodGroup age weight address lastDonationDate eligibleToDonate',
    });

    if (!camp) {
      console.warn(`Camp ${id} not found`);
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    const campOwnerId = camp.hospital?._id ? String(camp.hospital._id) : String(camp.hospital || "");
    if (campOwnerId && campOwnerId !== String(labId)) {
      return res.status(403).json({ success: false, message: "Not authorized to view this camp" });
    }

    const registrations = (camp.registrations || []).map((r) => {
      const donorId = r.donor && r.donor._id ? String(r.donor._id) : (r.donor ? String(r.donor) : null);
      return {
        donor: r.donor && typeof r.donor === 'object' ? r.donor : null,
        donorId: donorId,
        bookedAt: r.bookedAt || null,
        donationDone: !!r.donationDone,
        verifiedAt: r.verifiedAt || null,
      };
    });

    return res.status(200).json({ 
      success: true, 
      registrations, 
      campId: camp._id,
      totalRegistrations: registrations.length,
      campTitle: camp.title,
    });
  } catch (error) {
    console.error("Get camp registrations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch registrations" });
  }
};

/**
 * @desc Verify a donor's donation for a specific camp
 * @route POST /api/blood-lab/camps/:campId/registrations/:donorId/verify
 * @access Private (Blood Lab)
 */
export const verifyCampDonation = async (req, res) => {
  try {
    const labId = req.user._id;
    const { campId, donorId } = req.params;
    const { quantity = 1, bloodGroup = null, remarks = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(campId) || !mongoose.Types.ObjectId.isValid(donorId))
      return res.status(400).json({ success: false, message: "Invalid IDs" });

    const camp = await BloodCamp.findById(campId);
    if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });

    const campOwnerId = camp.hospital?._id ? String(camp.hospital._id) : String(camp.hospital || "");
    if (campOwnerId && campOwnerId !== String(labId)) {
      return res.status(403).json({ success: false, message: "Not authorized to verify this camp" });
    }

    const reg = camp.registrations.find((r) => String(r.donor) === String(donorId));
    if (!reg) return res.status(404).json({ success: false, message: "Registration not found" });
    if (reg.donationDone) return res.status(409).json({ success: false, message: "Donation already verified" });

    // Mark registration verified
    reg.donationDone = true;
    reg.verifiedAt = new Date();

    // Increment camp actualDonors
    camp.actualDonors = (camp.actualDonors || 0) + 1;
    await camp.save();

    // Update donor donation history
    const donor = await Donor.findById(donorId);
    if (donor) {
      donor.lastDonationDate = new Date();
      donor.donationHistory.push({
        donationDate: new Date(),
        facility: labId,
        bloodGroup: bloodGroup || donor.bloodGroup,
        quantity,
        remarks,
        verified: true,
      });
      await donor.save();
    }

    // Add to blood stock
    try {
      const bloodType = bloodGroup || (donor && donor.bloodGroup) || 'Unknown';
      let stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab: labId });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 42);
      if (stock) {
        stock.quantity += Number(quantity);
        stock.expiryDate = expiryDate;
        await stock.save();
      } else {
        await Blood.create({ bloodGroup: bloodType, quantity: Number(quantity), expiryDate, bloodLab: labId });
      }
    } catch (err) {
      console.error('Error adding to blood stock after verification', err);
    }

    // Add to facility history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: 'Verification',
          description: `Verified donation for ${donor ? donor.fullName : donorId} at ${camp.title}`,
          date: new Date(),
          referenceId: camp._id,
        },
      },
    }).catch(() => null);

    return res.status(200).json({ success: true, message: 'Donation verified', campId: camp._id, donorId });
  } catch (error) {
    console.error('Verify camp donation error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify donation' });
  }
};