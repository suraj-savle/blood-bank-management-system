import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import Facility from "../models/facilityModel.js";

// 🔐 Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🛠️ Admin Registration (for initial setup, not exposed in routes)
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.trim() }).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      message: "Login successful ✅",
      token: generateToken(admin._id),
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// 🔎 List Pending Facilities
export const listPendingFacilities = async (req, res) => {
  try {
    const pendingFacilities = await Facility.find({ status: "pending" })
      .select("name email facilityType registrationNumber createdAt")
      .sort({ createdAt: -1 });

    res.json(pendingFacilities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending facilities", error: error.message });
  }
};

// ✅ Approve Facility
export const approveFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const facility = await Facility.findById(facilityId);

    if (!facility) return res.status(404).json({ message: "Facility not found" });

    facility.status = "approved";
    facility.approvedBy = req.admin._id;
    facility.approvedAt = new Date();
    await facility.save();

    res.json({ message: "Facility approved successfully ✅", facility });
  } catch (error) {
    res.status(500).json({ message: "Error approving facility", error: error.message });
  }
};

// ❌ Reject Facility
export const rejectFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { reason } = req.body;

    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    facility.status = "rejected";
    facility.rejectionReason = reason || "Rejected by admin";
    await facility.save();

    res.json({ message: "Facility rejected ❌", facility });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting facility", error: error.message });
  }
};
