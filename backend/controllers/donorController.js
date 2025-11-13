import Donor from "../models/donorModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// /* 👤 Get Donor Profile */
export const getDonorProfile = async (req, res) => {
  try {
    const donorId = req.donor.id; // Comes from verifyToken middleware

    const donor = await Donor.findById(donorId)
      .populate({
        path: "donationHistory.facility",
        select: "facilityName address.city address.state", // populate hospital/lab name + location
      })
      .select("-password -__v");

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // Calculate total donations
    const totalDonations = donor.donationHistory.length;

    // Last donation
    const lastDonation = donor.lastDonationDate
      ? donor.lastDonationDate
      : donor.donationHistory.length > 0
      ? donor.donationHistory[donor.donationHistory.length - 1].donationDate
      : null;

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
      eligibleToDonate: donor.isEligible,
      donationHistory: donor.donationHistory.map((don) => ({
        id: don._id,
        donationDate: don.donationDate,
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
    console.error("❌ Error fetching donor profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching donor profile", error: error.message });
  }
};

export const updateDonorProfile = async (req, res) => {
  try {
    const donorId = req.donor._id; // from protectDonor middleware
    const { fullName, phone, address, age, gender, weight, password } = req.body;

    const donor = await Donor.findById(donorId);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // ✅ Update fields only if provided
    donor.fullName = fullName || donor.fullName;
    donor.phone = phone || donor.phone;
    donor.address = address || donor.address;
    donor.age = age || donor.age;
    donor.gender = gender || donor.gender;
    donor.weight = weight || donor.weight;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      donor.password = await bcrypt.hash(password, salt);
    }

    const updatedDonor = await donor.save();

    res.status(200).json({
      message: "Profile updated successfully",
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
    console.error("❌ Error updating donor profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};