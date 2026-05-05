import Donor from "../models/donorModel.js";
import Facility from "../models/facilityModel.js";
import BloodCamp from "../models/bloodCampModel.js";
import Blood from "../models/bloodModel.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Constants for eligibility rules
const ELIGIBILITY_RULES = {
  MIN_AGE: 18,
  MAX_AGE: 65,
  MIN_WEIGHT: 45,
  MAX_WEIGHT: 200,
  COOLDOWN_DAYS: 90,
  MIN_DONATION_INTERVAL_DAYS: 90,
  BLOOD_GROUPS: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
};

// Helper function to format donor response
const formatDonorResponse = (donor) => {
  const totalDonations = donor.donationHistory?.length || 0;
  const lastDonation = donor.lastDonationDate || null;

  let nextEligibleDate = null;
  let eligibilityStatus = 'ELIGIBLE';
  let eligibilityMessage = 'You are eligible to donate blood';

  if (lastDonation) {
    const next = new Date(lastDonation);
    next.setDate(next.getDate() + ELIGIBILITY_RULES.COOLDOWN_DAYS);
    nextEligibleDate = next;

    if (nextEligibleDate > new Date()) {
      const remainingDays = Math.ceil((nextEligibleDate - new Date()) / (1000 * 60 * 60 * 24));
      eligibilityStatus = 'NOT_ELIGIBLE';
      eligibilityMessage = `Cooldown period: ${remainingDays} days remaining`;
    }
  }

  // Check other eligibility criteria
  if (donor.age < ELIGIBILITY_RULES.MIN_AGE || donor.age > ELIGIBILITY_RULES.MAX_AGE) {
    eligibilityStatus = 'NOT_ELIGIBLE';
    eligibilityMessage = `Age must be between ${ELIGIBILITY_RULES.MIN_AGE} and ${ELIGIBILITY_RULES.MAX_AGE} years`;
  } else if (donor.weight < ELIGIBILITY_RULES.MIN_WEIGHT) {
    eligibilityStatus = 'NOT_ELIGIBLE';
    eligibilityMessage = `Minimum weight requirement is ${ELIGIBILITY_RULES.MIN_WEIGHT} kg`;
  }

  return {
    id: donor._id,
    fullName: donor.fullName,
    email: donor.email,
    phone: donor.phone,
    bloodGroup: donor.bloodGroup,
    age: donor.age,
    gender: donor.gender,
    weight: donor.weight,
    address: donor.address,
    status: donor.status || 'active',
    donorId: donor.donorId || donor._id,
    totalDonations,
    lastDonationDate: lastDonation,
    nextEligibleDate,
    eligibilityStatus,
    eligibilityMessage,
    donationHistory: donor.donationHistory?.map(donation => ({
      id: donation._id,
      donationDate: donation.donationDate,
      facility: donation.facility?.facilityName || donation.facilityName || 'Unknown Facility',
      facilityId: donation.facility?._id,
      bloodGroup: donation.bloodGroup,
      quantity: donation.quantity,
      remarks: donation.remarks,
      verified: donation.verified || false,
      certificateId: donation.certificateId
    })) || [],
    createdAt: donor.createdAt,
    updatedAt: donor.updatedAt
  };
};

// Helper function for validation
const validateDonorUpdate = (updates) => {
  const errors = {};

  if (updates.fullName !== undefined) {
    if (typeof updates.fullName !== 'string' || updates.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    } else if (updates.fullName.trim().length > 50) {
      errors.fullName = 'Full name cannot exceed 50 characters';
    }
  }

  if (updates.phone !== undefined) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(updates.phone)) {
      errors.phone = 'Phone number must be a valid 10-digit number';
    }
  }

  if (updates.age !== undefined) {
    const ageNum = Number(updates.age);
    if (isNaN(ageNum) || ageNum < ELIGIBILITY_RULES.MIN_AGE || ageNum > ELIGIBILITY_RULES.MAX_AGE) {
      errors.age = `Age must be between ${ELIGIBILITY_RULES.MIN_AGE} and ${ELIGIBILITY_RULES.MAX_AGE} years`;
    }
  }

  if (updates.weight !== undefined) {
    const weightNum = Number(updates.weight);
    if (isNaN(weightNum) || weightNum < ELIGIBILITY_RULES.MIN_WEIGHT || weightNum > ELIGIBILITY_RULES.MAX_WEIGHT) {
      errors.weight = `Weight must be between ${ELIGIBILITY_RULES.MIN_WEIGHT} and ${ELIGIBILITY_RULES.MAX_WEIGHT} kg`;
    }
  }

  if (updates.bloodGroup !== undefined && updates.bloodGroup !== '') {
    if (!ELIGIBILITY_RULES.BLOOD_GROUPS.includes(updates.bloodGroup)) {
      errors.bloodGroup = 'Invalid blood group';
    }
  }

  if (updates.gender !== undefined) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(updates.gender.toLowerCase())) {
      errors.gender = 'Gender must be male, female, or other';
    }
  }

  if (updates.address) {
    if (updates.address.pincode) {
      const pincodeRegex = /^[0-9]{6}$/;
      if (!pincodeRegex.test(updates.address.pincode)) {
        errors['address.pincode'] = 'PIN code must be a valid 6-digit number';
      }
    }
  }

  if (updates.password !== undefined && updates.password.length > 0 && updates.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/* 👤 Get Donor Profile */
export const getDonorProfile = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;

    if (!donorId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Donor ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    const donor = await Donor.findById(donorId)
      .populate({
        path: "donationHistory.facility",
        select: "facilityName address.city address.state facilityType"
      })
      .select("-password -__v");

    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donor profile not found",
        error: "DONOR_NOT_FOUND"
      });
    }

    const donorProfile = formatDonorResponse(donor);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Donor profile retrieved successfully",
      data: donorProfile
    });
  } catch (error) {
    console.error("❌ Error fetching donor profile:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error fetching donor profile",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 📝 Update Donor Profile */
export const updateDonorProfile = async (req, res) => {
  try {
    const donorId = req.donor?._id || req.donor?.id;
    const updates = req.body;

    if (!donorId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Donor ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    // Validate updates
    const validation = validateDonorUpdate(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: validation.errors,
        error: "VALIDATION_ERROR"
      });
    }

    // Check for duplicate phone number
    if (updates.phone) {
      const existingDonor = await Donor.findOne({
        phone: updates.phone,
        _id: { $ne: donorId }
      });
      if (existingDonor) {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          message: "Phone number already registered to another donor",
          error: "DUPLICATE_PHONE"
        });
      }
    }

    const donor = await Donor.findById(donorId).select('+password');
    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donor not found",
        error: "DONOR_NOT_FOUND"
      });
    }

    // Track updated fields
    const updatedFields = [];

    // Update fields
    if (updates.fullName !== undefined && updates.fullName !== donor.fullName) {
      donor.fullName = updates.fullName.trim();
      updatedFields.push('fullName');
    }

    if (updates.phone !== undefined && updates.phone !== donor.phone) {
      donor.phone = updates.phone;
      updatedFields.push('phone');
    }

    if (updates.age !== undefined && updates.age !== donor.age) {
      donor.age = Number(updates.age);
      updatedFields.push('age');
    }

    if (updates.gender !== undefined && updates.gender !== donor.gender) {
      donor.gender = updates.gender.toLowerCase();
      updatedFields.push('gender');
    }

    if (updates.weight !== undefined && updates.weight !== donor.weight) {
      donor.weight = Number(updates.weight);
      updatedFields.push('weight');
    }

    if (updates.bloodGroup !== undefined && updates.bloodGroup !== donor.bloodGroup) {
      donor.bloodGroup = updates.bloodGroup;
      updatedFields.push('bloodGroup');
    }

    // Update address
    if (updates.address && Object.keys(updates.address).length > 0) {
      let addressUpdated = false;

      if (updates.address.street !== undefined) {
        donor.address.street = updates.address.street.trim();
        addressUpdated = true;
      }
      if (updates.address.city !== undefined) {
        donor.address.city = updates.address.city.trim();
        addressUpdated = true;
      }
      if (updates.address.state !== undefined) {
        donor.address.state = updates.address.state.trim();
        addressUpdated = true;
      }
      if (updates.address.pincode !== undefined) {
        donor.address.pincode = updates.address.pincode;
        addressUpdated = true;
      }

      if (addressUpdated) updatedFields.push('address');
    }

    // Update password
    if (updates.password && updates.password.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      donor.password = await bcrypt.hash(updates.password, salt);
      updatedFields.push('password');
    }

    await donor.save();

    const responseData = formatDonorResponse(donor);
    delete responseData.donationHistory; // Remove history from update response

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: updatedFields.includes('password')
        ? "Profile and password updated successfully"
        : "Profile updated successfully",
      updatedFields,
      data: responseData
    });
  } catch (error) {
    console.error("❌ Error updating donor profile:", error);

    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: validationErrors,
        error: "VALIDATION_ERROR"
      });
    }

    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error updating profile",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 🏥 Get Public Blood Camps for Donors */
export const getDonorCamps = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, city, dateFrom, dateTo } = req.query;

    const filter = { status: { $ne: 'Cancelled' } };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [camps, total] = await Promise.all([
      BloodCamp.find(filter)
        .populate('hospital', 'name address')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum),
      BloodCamp.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Blood camps retrieved successfully",
      data: {
        camps,
        pagination: {
          total,
          currentPage: parseInt(page),
          totalPages,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error("Get Donor Camps Error:", error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Invalid or expired token",
        error: "INVALID_TOKEN"
      });
    }

    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch blood camps",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 📊 Get Donor Statistics */
export const getDonorStats = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;

    if (!donorId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Donor ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    const donor = await Donor.findById(donorId)
      .select('donationHistory age weight bloodGroup')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donor profile not found",
        error: "DONOR_NOT_FOUND"
      });
    }

    const totalDonations = donor.donationHistory?.length || 0;
    const lastDonation = donor.donationHistory?.length > 0
      ? donor.donationHistory[donor.donationHistory.length - 1]?.donationDate
      : null;

    // Calculate total blood donated
    const totalBloodDonated = donor.donationHistory?.reduce((sum, donation) =>
      sum + (donation.quantity || 1), 0) || 0;

    // Get donation by year
    const donationsByYear = {};
    donor.donationHistory?.forEach(donation => {
      const year = new Date(donation.donationDate).getFullYear();
      donationsByYear[year] = (donationsByYear[year] || 0) + 1;
    });

    // Calculate next eligible date
    let nextEligibleDate = null;
    let daysUntilEligible = null;

    if (lastDonation) {
      const nextDate = new Date(lastDonation);
      nextDate.setDate(nextDate.getDate() + ELIGIBILITY_RULES.COOLDOWN_DAYS);
      nextEligibleDate = nextDate;

      if (nextEligibleDate > new Date()) {
        daysUntilEligible = Math.ceil((nextEligibleDate - new Date()) / (1000 * 60 * 60 * 24));
      }
    }

    // Determine eligibility
    let isEligible = true;
    let eligibilityReasons = [];

    if (donor.age < ELIGIBILITY_RULES.MIN_AGE || donor.age > ELIGIBILITY_RULES.MAX_AGE) {
      isEligible = false;
      eligibilityReasons.push(`Age must be between ${ELIGIBILITY_RULES.MIN_AGE} and ${ELIGIBILITY_RULES.MAX_AGE}`);
    }

    if (donor.weight < ELIGIBILITY_RULES.MIN_WEIGHT) {
      isEligible = false;
      eligibilityReasons.push(`Minimum weight requirement is ${ELIGIBILITY_RULES.MIN_WEIGHT} kg`);
    }

    if (daysUntilEligible > 0) {
      isEligible = false;
      eligibilityReasons.push(`${daysUntilEligible} days remaining in cooldown period`);
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Donor statistics retrieved successfully",
      data: {
        totalDonations,
        totalBloodDonated,
        lastDonationDate: lastDonation,
        nextEligibleDate,
        daysUntilEligible: daysUntilEligible || 0,
        isEligible,
        eligibilityReasons,
        donationsByYear,
        bloodGroup: donor.bloodGroup,
        age: donor.age,
        weight: donor.weight
      }
    });
  } catch (error) {
    console.error("Get Donor Stats Error:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch donor statistics",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 📜 Get Donation History */
export const getDonorHistory = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;
    const { page = 1, limit = 10, year, verified } = req.query;

    if (!donorId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Donor ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build match conditions
    const matchConditions = { _id: new mongoose.Types.ObjectId(donorId) };

    const donor = await Donor.aggregate([
      { $match: matchConditions },
      { $unwind: "$donationHistory" },
      { $sort: { "donationHistory.donationDate": -1 } },
      // Apply filters
      ...(year ? [{
        $match: {
          "donationHistory.donationDate": {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      }] : []),
      ...(verified !== undefined ? [{
        $match: { "donationHistory.verified": verified === 'true' }
      }] : []),
      {
        $lookup: {
          from: 'facilities',
          localField: 'donationHistory.facility',
          foreignField: '_id',
          as: 'facilityInfo'
        }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 0,
                id: "$donationHistory._id",
                donationDate: "$donationHistory.donationDate",
                bloodGroup: "$donationHistory.bloodGroup",
                quantity: "$donationHistory.quantity",
                remarks: "$donationHistory.remarks",
                verified: "$donationHistory.verified",
                certificateId: "$donationHistory.certificateId",
                facility: { $arrayElemAt: ["$facilityInfo.facilityName", 0] },
                facilityCity: { $arrayElemAt: ["$facilityInfo.address.city", 0] },
                facilityState: { $arrayElemAt: ["$facilityInfo.address.state", 0] }
              }
            }
          ]
        }
      }
    ]);

    const total = donor[0]?.metadata[0]?.total || 0;
    const history = donor[0]?.data || [];
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Donation history retrieved successfully",
      data: {
        history,
        summary: {
          totalDonations: total,
          totalPages,
          currentPage: parseInt(page),
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error("Get Donor History Error:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch donation history",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 🔍 Search Donor (Blood Lab) */
export const searchDonor = async (req, res) => {
  try {
    const { term, bloodGroup, minAge, maxAge, status } = req.query;

    if (!term && !bloodGroup && !minAge && !maxAge && !status) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "At least one search parameter is required",
        error: "MISSING_SEARCH_PARAMS"
      });
    }

    const searchQuery = {};

    if (term) {
      searchQuery.$or = [
        { fullName: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } }
      ];
    }

    if (bloodGroup) {
      searchQuery.bloodGroup = bloodGroup;
    }

    if (minAge || maxAge) {
      searchQuery.age = {};
      if (minAge) searchQuery.age.$gte = parseInt(minAge);
      if (maxAge) searchQuery.age.$lte = parseInt(maxAge);
    }

    if (status) {
      searchQuery.status = status;
    }

    const donors = await Donor.find(searchQuery)
      .select('fullName email phone bloodGroup age gender weight status lastDonationDate address')
      .limit(20)
      .sort({ lastDonationDate: -1 });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Donors retrieved successfully",
      data: {
        donors,
        count: donors.length,
        searchParams: { term, bloodGroup, minAge, maxAge, status }
      }
    });
  } catch (err) {
    console.error("Search donor error:", err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to search donors",
      error: err.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 💉 Mark Donation (Blood Lab) */
export const markDonation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const labId = req.user?._id;
    const { quantity = 1, remarks = "", bloodGroup, hemoglobin, bloodPressure } = req.body;

    if (!labId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Lab ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donor not found",
        error: "DONOR_NOT_FOUND"
      });
    }

    // Check eligibility
    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - ELIGIBILITY_RULES.MIN_DONATION_INTERVAL_DAYS);

      if (lastDonation > cooldownDate) {
        const daysRemaining = Math.ceil((lastDonation.getTime() +
          (ELIGIBILITY_RULES.MIN_DONATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000) - Date.now()) /
          (1000 * 60 * 60 * 24));

        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: `Donor cannot donate yet. ${daysRemaining} days remaining in cooldown period`,
          error: "COOLDOWN_PERIOD_ACTIVE",
          data: { daysRemaining }
        });
      }
    }

    // Check age and weight
    if (donor.age < ELIGIBILITY_RULES.MIN_AGE || donor.age > ELIGIBILITY_RULES.MAX_AGE) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Donor age (${donor.age}) does not meet eligibility requirements`,
        error: "AGE_NOT_ELIGIBLE"
      });
    }

    if (donor.weight < ELIGIBILITY_RULES.MIN_WEIGHT) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Donor weight (${donor.weight}kg) is below minimum requirement of ${ELIGIBILITY_RULES.MIN_WEIGHT}kg`,
        error: "WEIGHT_NOT_ELIGIBLE"
      });
    }

    // Generate certificate ID
    const certificateId = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Update donor
    donor.lastDonationDate = new Date();

    if (bloodGroup) {
      donor.bloodGroup = bloodGroup;
    }

    // Add medical screening data if provided
    const donationRecord = {
      donationDate: new Date(),
      facility: labId,
      bloodGroup: bloodGroup || donor.bloodGroup,
      quantity,
      remarks,
      verified: true,
      certificateId,
      ...(hemoglobin && { hemoglobin }),
      ...(bloodPressure && { bloodPressure })
    };

    donor.donationHistory.push(donationRecord);
    await donor.save();

    // Update facility history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Donation",
          description: `Recorded donation from ${donor.fullName} - ${quantity} unit(s) of ${bloodGroup || donor.bloodGroup} blood`,
          date: new Date(),
          referenceId: donor._id,
        }
      }
    });

    // Update blood stock
    const bloodType = bloodGroup || donor.bloodGroup;
    await addToBloodStock(labId, bloodType, quantity);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Donation recorded successfully",
      data: {
        donorId: donor._id,
        donorName: donor.fullName,
        bloodGroup: bloodType,
        quantity,
        donationDate: donationRecord.donationDate,
        certificateId,
        nextEligibleDate: new Date(Date.now() + ELIGIBILITY_RULES.COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
      }
    });
  } catch (err) {
    console.error("Mark donation error:", err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to record donation",
      error: err.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 📈 Get Recent Donations (Blood Lab Dashboard) */
export const getRecentDonations = async (req, res) => {
  try {
    const labId = req.user?._id;

    if (!labId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: Lab ID missing",
        error: "AUTHENTICATION_REQUIRED"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(today);
    monthStart.setDate(1);

    const [todayDonations, weekDonations, monthDonations, allDonations, recentDonors, bloodGroupStats] = await Promise.all([
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: today, $lt: tomorrow }
      }),
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: weekStart }
      }),
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: monthStart }
      }),
      Donor.aggregate([
        { $unwind: '$donationHistory' },
        { $match: { 'donationHistory.facility': labId } },
        { $count: 'total' }
      ]),
      Donor.find({
        'donationHistory.facility': labId
      })
        .select('fullName bloodGroup donationHistory')
        .sort({ 'donationHistory.donationDate': -1 })
        .limit(10),
      Donor.aggregate([
        { $unwind: '$donationHistory' },
        { $match: { 'donationHistory.facility': labId } },
        {
          $group: {
            _id: '$donationHistory.bloodGroup',
            count: { $sum: 1 },
            totalUnits: { $sum: '$donationHistory.quantity' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    // Format recent donations
    const recentDonations = recentDonors.flatMap(donor =>
      donor.donationHistory
        .filter(d => d.facility.equals(labId))
        .slice(0, 3)
        .map(d => ({
          donorId: donor._id,
          donorName: donor.fullName,
          bloodGroup: d.bloodGroup,
          quantity: d.quantity,
          date: d.donationDate,
          remarks: d.remarks,
          verified: d.verified
        }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const totalDonations = allDonations[0]?.total || 0;

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Recent donations retrieved successfully",
      data: {
        stats: {
          today: todayDonations,
          thisWeek: weekDonations,
          thisMonth: monthDonations,
          total: totalDonations
        },
        bloodGroupDistribution: bloodGroupStats,
        recentDonations,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    console.error("Get recent donations error:", err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch recent donations",
      error: err.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* 🏷️ Generate Donation Certificate */
export const generateDonationCertificate = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;
    const { donationId } = req.params;

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donor not found",
        error: "DONOR_NOT_FOUND"
      });
    }

    const donation = donor.donationHistory.id(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Donation record not found",
        error: "DONATION_NOT_FOUND"
      });
    }

    // Get facility details
    const facility = await Facility.findById(donation.facility);

    const certificateData = {
      certificateId: donation.certificateId || `DON-${Date.now()}`,
      donorName: donor.fullName,
      bloodGroup: donation.bloodGroup,
      donationDate: donation.donationDate,
      quantity: donation.quantity,
      facilityName: facility?.facilityName || "Blood Bank",
      issuedDate: new Date()
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Certificate generated successfully",
      data: certificateData
    });
  } catch (error) {
    console.error("Generate certificate error:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to generate certificate",
      error: error.message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};

// Helper function to add to blood stock
const addToBloodStock = async (labId, bloodType, quantity) => {
  try {
    let stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab: labId });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42); // Blood expires in 42 days

    if (stock) {
      stock.quantity += quantity;
      stock.expiryDate = expiryDate;
      stock.lastUpdated = new Date();
      await stock.save();
    } else {
      await Blood.create({
        bloodGroup: bloodType,
        quantity,
        expiryDate,
        bloodLab: labId,
        status: 'available'
      });
    }
  } catch (error) {
    console.error("Error adding to blood stock:", error);
    throw error;
  }
};