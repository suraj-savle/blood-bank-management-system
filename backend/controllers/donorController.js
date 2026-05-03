import Donor from "../models/donorModel.js";
// Assuming you have a Facility model for population, and BloodCamp model for camps
import Facility from "../models/facilityModel.js"; // Placeholder import
import BloodCamp from "../models/bloodCampModel.js"; // Placeholder import
import mongoose from "mongoose"; // Needed for ObjectId in aggregation
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// /*  Get Donor Profile */
export const getDonorProfile = async (req, res) => {
  try {
    //  Security Check: Ensure the user ID comes from the authenticated token
    const donorId = req.donor.id; // Comes from verifyToken/protectDonor middleware

    const donor = await Donor.findById(donorId)
      .populate({
        path: "donationHistory.facility",
        select: "facilityName address.city address.state", // populate hospital/lab name + location
      })
      .select("-password -__v"); // Exclude sensitive/unnecessary fields

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // Use the virtual field 'isEligible' for 90-day cooldown status
    const isEligible = donor.isEligible; 
    
    // Calculate total donations
    const totalDonations = donor.donationHistory.length;

    // Last donation
    const lastDonation = donor.lastDonationDate || null;

    // Next eligible date (90 days rule)
    let nextEligibleDate = null;
    if (lastDonation) {
      const next = new Date(lastDonation);
      next.setDate(next.getDate() + 90);
      nextEligibleDate = next;
    }

    // Response Object for frontend
    const donorProfile = {
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      gender: donor.gender,
      weight: donor.weight,
      address: donor.address,
      totalDonations,
      lastDonationDate: lastDonation,
      nextEligibleDate,
      eligibleToDonate: isEligible && donor.eligibleToDonate, // Combine virtual and manual flag
      donationHistory: donor.donationHistory.map((don) => ({
        id: don._id,
        donationDate: don.donationDate,
        // The facility field is now populated. Access properties safely.
        facility: don.facility?.facilityName || "N/A", 
        city: don.facility?.address?.city,
        state: don.facility?.address?.state,
        bloodGroup: don.bloodGroup,
        quantity: don.quantity,
        remarks: don.remarks,
        verified: don.verified,
      })),
      createdAt: donor.createdAt,
      updatedAt: donor.updatedAt,
    };

    res.status(200).json({ donor: donorProfile });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching donor profile", error: error.message });
  }
};

/*  Update Donor Profile */
export const updateDonorProfile = async (req, res) => {
  try {
    //  Security Check: Ensure donorId is authenticated and authorized
    const donorId = req.donor._id; // from protectDonor middleware
    const { fullName, phone, address, age, gender, weight, password } = req.body;

    // Find by ID and exclude the password for initial retrieval
    const donor = await Donor.findById(donorId).select('+password'); 
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    //  Update fields only if provided
    donor.fullName = fullName !== undefined ? fullName : donor.fullName;
    donor.phone = phone !== undefined ? phone : donor.phone;
    
    // Only update address subfields if the main address object is provided
    if (address) {
        donor.address.street = address.street || donor.address.street;
        donor.address.city = address.city || donor.address.city;
        donor.address.state = address.state || donor.address.state;
        donor.address.pincode = address.pincode || address.pincode;
    }
    
    donor.age = age !== undefined ? age : donor.age;
    donor.gender = gender !== undefined ? gender : donor.gender;
    donor.weight = weight !== undefined ? weight : donor.weight;

    if (password) {
      //  Hash new password using the same salt rounds as the schema (12)
      const salt = await bcrypt.genSalt(12); 
      donor.password = await bcrypt.hash(password, salt);
    }

    const updatedDonor = await donor.save();

    res.status(200).json({
      message: "Profile updated successfully",
      // Only send back non-sensitive/non-history fields
      donor: {
        fullName: updatedDonor.fullName,
        email: updatedDonor.email,
        phone: updatedDonor.phone,
        address: updatedDonor.address,
        age: updatedDonor.age,
        gender: updatedDonor.gender,
        weight: updatedDonor.weight,
      },
    });
  } catch (error) {
    // Handle validation errors from the schema
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


/* Get Public Blood Camps for Donors */
export const getDonorCamps = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;
    const { status, page = 1, limit = 10, q = "" } = req.query;

    const filter = {};
    
    // Filter by status if provided (e.g., 'active', 'completed', 'cancelled')
    if (status && status !== "all") {
      filter.status = status;
    }

    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { "location.venue": searchRegex },
        { "location.city": searchRegex },
        { "location.state": searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Use Promise.all to fetch camps and total count concurrently (efficient)
    const [camps, total] = await Promise.all([
      // Sort by date ascending (upcoming first)
      BloodCamp.find(filter)
        .populate("hospital", "name facilityType address.city address.state")
        .sort({ date: 1 }) 
        .skip(skip)
        .limit(parseInt(limit)),
      
      BloodCamp.countDocuments(filter),
    ]);

    const normalizedDonorId = String(donorId || "");
    const campsWithBooking = camps.map((camp) => {
      const booked = camp.registrations?.some(
        (entry) => String(entry.donor) === normalizedDonorId
      );
      const expectedDonors = camp.expectedDonors || 0;
      const remainingSlots =
        expectedDonors > 0
          ? Math.max(0, expectedDonors - (camp.actualDonors || 0))
          : null;

      return {
        ...camp.toObject(),
        isBooked: Boolean(booked),
        remainingSlots,
      };
    });

    res.json({
      success: true,
      data: {
        camps: campsWithBooking,
        pagination: {
          total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get Donor Camps Error:", error);
    // Better to return 401 if it's an Auth issue
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    res.status(500).json({ success: false, message: "Failed to fetch blood camps" });
  }
};

/**
 * @desc Book a donor slot in a blood camp
 * @route POST /api/donor/camps/:id/book
 * @access Private (Donor)
 */
export const bookDonationCamp = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;
    const campId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const donor = await Donor.findById(donorId).select(
      "fullName lastDonationDate eligibleToDonate age weight"
    );
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    const isCurrentlyEligible = donor.isEligible && donor.eligibleToDonate;
    if (!isCurrentlyEligible) {
      return res.status(400).json({
        success: false,
        message: "You are currently not eligible to schedule a donation.",
      });
    }

    const camp = await BloodCamp.findById(campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    // Prevent bookings exceeding expected donors (use registrations count)
    if ((camp.expectedDonors || 0) > 0 && (camp.registrations?.length || 0) >= camp.expectedDonors) {
      return res.status(409).json({ success: false, message: "Camp is full." });
    }

    if (!["Upcoming", "Ongoing"].includes(camp.status)) {
      return res.status(400).json({
        success: false,
        message: "This camp is not accepting bookings.",
      });
    }

    const alreadyBooked = camp.registrations?.some(
      (entry) => String(entry.donor) === String(donorId)
    );

    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "You have already booked this camp.",
      });
    }

    const updateFilter = {
      _id: campId,
      "registrations.donor": { $ne: donorId },
    };

    if ((camp.expectedDonors || 0) > 0) {
      updateFilter.actualDonors = { $lt: camp.expectedDonors };
    }

    const updatedCamp = await BloodCamp.findOneAndUpdate(
      updateFilter,
      {
        $push: {
          registrations: {
            donor: donorId,
            bookedAt: new Date(),
            donationDone: false,
          },
        },
      },
      { new: true }
    );

    if (!updatedCamp) {
      return res.status(409).json({
        success: false,
        message: "Camp is full or already booked.",
      });
    }

    await Facility.findByIdAndUpdate(updatedCamp.hospital, {
      $push: {
        history: {
          eventType: "Blood Camp",
          description: `${donor.fullName} booked a donation slot for ${updatedCamp.title}`,
          date: new Date(),
        },
      },
    }).catch(() => null);

    return res.status(200).json({
      success: true,
      message: "Donation slot booked successfully.",
      booking: {
        campId: updatedCamp._id,
        title: updatedCamp.title,
        date: updatedCamp.date,
      },
    });
  } catch (error) {
    console.error("Book donation camp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to book donation slot." });
  }
};

/**
 * @desc Cancel donor booking for a blood camp
 * @route DELETE /api/donor/camps/:id/book
 * @access Private (Donor)
 */
export const cancelDonationBooking = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;
    const campId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const updatedCamp = await BloodCamp.findOneAndUpdate(
      { _id: campId, "registrations.donor": donorId },
      {
        $pull: { registrations: { donor: donorId } },
      },
      { new: true }
    );

    if (!updatedCamp) {
      return res.status(404).json({
        success: false,
        message: "No booking found for this camp.",
      });
    }

    if ((updatedCamp.actualDonors || 0) < 0) {
      updatedCamp.actualDonors = 0;
      await updatedCamp.save();
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel donation booking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel booking." });
  }
};

/**
 * @desc Get bookings for authenticated donor
 * @route GET /api/donor/camps/bookings
 * @access Private (Donor)
 */
export const getDonorBookings = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;

    const camps = await BloodCamp.find({ "registrations.donor": donorId })
      .populate("hospital", "name facilityType address.city address.state")
      .sort({ date: 1 });

    const bookings = camps.map((camp) => {
      const registration = camp.registrations.find(
        (entry) => String(entry.donor) === String(donorId)
      );

      return {
        campId: camp._id,
        title: camp.title,
        status: camp.status,
        date: camp.date,
        time: camp.time,
        location: camp.location,
        hospital: camp.hospital,
        bookedAt: registration?.bookedAt || null,
      };
    });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Get donor bookings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch donor bookings." });
  }
};


/**
 * @desc Get key statistics for the authenticated donor (efficiently using Aggregation)
 * @route GET /api/donor/stats
 * @access Private (Donor)
 */
export const getDonorStats = async (req, res) => {
  try {
    // FIX: Safely retrieve donorId using req.donor.id, which worked in getDonorProfile
    const donorId = req.donor?.id || req.donor?._id; 

    if (!donorId) {
        // If the middleware failed to attach the ID, return unauthorized
        return res.status(401).json({ success: false, message: "Unauthorized: Donor ID missing from request." });
    }
    
    // Use a single query/aggregation to fetch the donor and calculate all necessary stats
    const donorStats = await Donor.aggregate([
      // 1. Match the specific donor document
      { $match: { _id: new mongoose.Types.ObjectId(donorId) } },
      {
        $project: {
          _id: 0, // Exclude the donor ID from the result array
          totalDonations: { $size: "$donationHistory" },
          lastDonationDate: { $max: "$donationHistory.donationDate" },
          weight: "$weight", 
          age: "$age"
        },
      },
    ]);

    if (!donorStats || donorStats.length === 0) {
      return res.status(404).json({ success: false, message: "Donor profile not found." });
    }

    const stats = donorStats[0];
    
    const totalDonations = stats.totalDonations || 0;
    const lastDonationDate = stats.lastDonationDate || null;
    
    let nextEligibleDonationDate = null;
    let eligibilityStatus = 'Eligible'; // Default

    // 1. Check eligibility based on the 90-day cooldown period
    if (lastDonationDate) {
      const lastDate = new Date(lastDonationDate);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 90); 
      nextEligibleDonationDate = nextDate;

      if (nextEligibleDonationDate > new Date()) {
        const remainingDays = Math.ceil((nextEligibleDonationDate - new Date()) / (1000 * 60 * 60 * 24));
        eligibilityStatus = `Ineligible (Cooldown: ${remainingDays} days remaining)`;
      }
    }
    
    // 2. Check general medical eligibility rules (overrides cooldown status)
    if (stats.age < 18 || stats.age > 65) {
      eligibilityStatus = 'Ineligible (Age constraint)';
    } else if (stats.weight < 45) {
      eligibilityStatus = 'Ineligible (Weight constraint)';
    }


    res.json({
      success: true,
      dashboard: {
        totalDonations,
        lastDonationDate,
        nextEligibleDonationDate,
        eligibilityStatus: eligibilityStatus,
      },
    });

  } catch (error) {
    console.error("Get Donor Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch donor statistics." });
  }
};

/**
 * @desc Get paginated donation history from the embedded array (efficiently using Aggregation)
 * @route GET /api/donor/history
 * @access Private (Donor)
 */
export const getDonorHistory = async (req, res) => {
  try {
    // FIX: Safely retrieve donorId using req.donor.id, which worked in getDonorProfile
    const donorId = req.donor?.id || req.donor?._id; 

    if (!donorId) {
        // If the middleware failed to attach the ID, return unauthorized
        return res.status(401).json({ success: false, message: "Unauthorized: Donor ID missing from request." });
    }
    
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const aggregationPipeline = [
      // 1. Match the specific donor document
      { $match: { _id: new mongoose.Types.ObjectId(donorId) } },

      // 2. Count the total history items before unwinding
      {
        $addFields: {
          totalHistoryLength: { $size: "$donationHistory" }
        }
      },
      
      // 3. Deconstruct the array field to generate a document for each item (Crucial for array pagination)
      { $unwind: "$donationHistory" },

      // 4. Sort the history items (most recent first)
      { $sort: { "donationHistory.donationDate": -1 } },

      // 5. Apply pagination (skip and limit)
      { $skip: skip },
      { $limit: parseInt(limit) },

      // 6. Optionally, lookup facility details if they were not populated in getDonorProfile
      { 
        $lookup: {
          from: 'facilities', // The name of the collection that stores Facility documents
          localField: 'donationHistory.facility',
          foreignField: '_id',
          as: 'facilityDetails'
        }
      },

      // 7. Reshape the output
      {
        $project: {
          _id: 0, // Exclude the Donor's _id
          donation: "$donationHistory",
          total: "$totalHistoryLength",
          facility: { $arrayElemAt: ["$facilityDetails", 0] } // Extract the single facility object
        }
      }
    ];

    const result = await Donor.aggregate(aggregationPipeline);

    // Extract total count and history array from the aggregation result
    // Total should be retrieved safely if the result array is not empty
    const total = result.length > 0 ? result[0].total : 0; 
    
    const history = result.map(item => ({ 
      id: item.donation._id,
      donationDate: item.donation.donationDate,
      bloodGroup: item.donation.bloodGroup,
      quantity: item.donation.quantity,
      remarks: item.donation.remarks,
      verified: item.donation.verified,
      // Include facility details
      facility: item.facility?.facilityName || "N/A",
      city: item.facility?.address?.city,
      state: item.facility?.address?.state,
    }));
    
    res.json({
      success: true,
      history,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error("Get Donor History Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch donation history." });
  }
};

// Add these to your bloodLabController.js

/**
 * @desc Search donors
 * @route GET /api/blood-lab/donors/search
 * @access Private (Blood Lab)
 */
export const searchDonor = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term) {
      return res.status(400).json({ success: false, message: "Search term required" });
    }

    const donors = await Donor.find({
      $or: [
        { fullName: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } }
      ]
    })
    .select('fullName email phone bloodGroup lastDonationDate donationHistory')
    .limit(20)
    .sort({ lastDonationDate: -1 });

    res.status(200).json({ success: true, donors });
  } catch (err) {
    console.error("Search donor error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Mark donation
 * @route POST /api/blood-lab/donors/donate/:id
 * @access Private (Blood Lab)
 */
export const markDonation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const labId = req.user._id;
    const { quantity = 1, remarks = "", bloodGroup } = req.body;

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    // Check if donor can donate (3 months gap)
    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (lastDonation > threeMonthsAgo) {
        return res.status(400).json({ 
          success: false, 
          message: "Donor cannot donate yet. Minimum 3 months required between donations." 
        });
      }
    }

    // Update last donation date
    donor.lastDonationDate = new Date();
    
    // Update blood group if provided
    if (bloodGroup) {
      donor.bloodGroup = bloodGroup;
    }

    // Add to donation history
    donor.donationHistory.push({
      donationDate: new Date(),
      facility: labId,
      bloodGroup: bloodGroup || donor.bloodGroup,
      quantity,
      remarks,
      verified: true
    });

    await donor.save();

    // Add to facility history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Donation",
          description: `Recorded donation from ${donor.fullName} - ${quantity} unit(s) of ${bloodGroup || donor.bloodGroup}`,
          date: new Date(),
          referenceId: donor._id,
        },
      },
    });

    // Add to blood stock
    const bloodType = bloodGroup || donor.bloodGroup;
    await addToBloodStock(labId, bloodType, quantity);

    res.status(200).json({ 
      success: true, 
      message: "Donation recorded successfully", 
      donor 
    });
  } catch (err) {
    console.error("Mark donation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get recent donations
 * @route GET /api/blood-lab/donations/recent
 * @access Private (Blood Lab)
 */
export const getRecentDonations = async (req, res) => {
  try {
    const labId = req.user._id;
    
    // Get today's start and end
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's start
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [todayDonations, weekDonations, allDonations, recentDonors] = await Promise.all([
      // Today's donations
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: today, $lt: tomorrow }
      }),
      
      // This week's donations
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: weekStart }
      }),
      
      // Total donations
      Donor.aggregate([
        { $unwind: '$donationHistory' },
        { $match: { 'donationHistory.facility': labId } },
        { $count: 'total' }
      ]),
      
      // Recent donations with donor details
      Donor.find({
        'donationHistory.facility': labId
      })
      .select('fullName bloodGroup donationHistory')
      .sort({ 'donationHistory.donationDate': -1 })
      .limit(10)
    ]);

    // Format recent donations
    const recentDonations = recentDonors.flatMap(donor => 
      donor.donationHistory
        .filter(d => d.facility.equals(labId))
        .slice(0, 3)
        .map(d => ({
          donorName: donor.fullName,
          bloodGroup: d.bloodGroup,
          quantity: d.quantity,
          date: d.donationDate,
          remarks: d.remarks
        }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      stats: {
        today: todayDonations,
        thisWeek: weekDonations,
        total: allDonations[0]?.total || 0
      },
      donations: recentDonations
    });
  } catch (err) {
    console.error("Get recent donations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recent donations" });
  }
};

// Helper function to add to blood stock
const addToBloodStock = async (labId, bloodType, quantity) => {
  try {
    let stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab: labId });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42);

    if (stock) {
      stock.quantity += quantity;
      stock.expiryDate = expiryDate;
      await stock.save();
    } else {
      await Blood.create({
        bloodGroup: bloodType,
        quantity,
        expiryDate,
        bloodLab: labId,
      });
    }
  } catch (error) {
    console.error("Error adding to blood stock:", error);
  }
};