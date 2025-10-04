import Facility from "../models/facilityModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// 🏥 Register Facility
export const registerFacility = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      emergencyContact,
      address,
      registrationNumber,
      facilityType,
      facilityCategory,
      documents,
    } = req.body;

    // Check if email already exists
    const existing = await Facility.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Create Facility
    const facility = await Facility.create({
      name,
      email,
      password,
      phone,
      emergencyContact,
      address,
      registrationNumber,
      facilityType,
      facilityCategory,
      documents,
    });

    res.status(201).json({
      message: "Facility registered successfully ✅ Pending admin approval.",
      facility: {
        id: facility._id,
        name: facility.name,
        facilityType: facility.facilityType,
        status: facility.status,
      },
      token: generateToken(facility._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering facility", error: error.message });
  }
};

// 🔓 Facility Login
export const loginFacility = async (req, res) => {
  try {
    const { email, password } = req.body;

    const facility = await Facility.findOne({ email }).select("+password");
    if (!facility) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, facility.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (facility.status !== "approved")
      return res.status(403).json({ message: "Facility not approved yet" });

    facility.lastLogin = new Date();
    await facility.save();

    res.json({
      message: "Login successful ✅",
      token: generateToken(facility._id),
      facility: {
        id: facility._id,
        name: facility.name,
        type: facility.facilityType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// 📝 Get Profile
export const getProfile = async (req, res) => {
  res.json(req.facility);
};

// ✏️ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const facility = req.facility;
    Object.assign(facility, req.body);
    await facility.save();
    res.json({ message: "Profile updated ✅", facility });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};
