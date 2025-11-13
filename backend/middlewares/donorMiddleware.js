import jwt from "jsonwebtoken";
import Donor from "../models/donorModel.js";

export const protectDonor = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.donor = await Donor.findById(decoded.id).select("-password");

      if (!req.donor) return res.status(401).json({ message: "Unauthorized" });

      next();
    } catch (error) {
      console.error("Donor auth error:", error);
      res.status(401).json({ message: "Token invalid or expired" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};
