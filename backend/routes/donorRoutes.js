import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Donor from "../models/donorModel.js";

const router = express.Router();

// 🧠 JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🩸 REGISTER Donor
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, address, bloodGroup, age, gender, weight } = req.body;

    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) return res.status(400).json({ message: "Email already registered" });

    // Create new donor
    const donor = await Donor.create({
      fullName,
      email,
      password,
      phone,
      address,
      bloodGroup,
      age,
      gender,
      weight,
    });

    res.status(201).json({
      message: "Registration successful",
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
      },
      token: generateToken(donor._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔐 LOGIN Donor
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find donor by email
    const donor = await Donor.findOne({ email }).select("+password");
    if (!donor) return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Update last login
    donor.lastLogin = new Date();
    await donor.save();

    res.status(200).json({
      message: "Login successful",
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
      },
      token: generateToken(donor._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
