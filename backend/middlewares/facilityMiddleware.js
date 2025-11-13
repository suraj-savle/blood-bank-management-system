import jwt from "jsonwebtoken";
import Facility from "../models/facilityModel.js";

export const protectFacility = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" }); // <--- This is the source of the 401
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const facility = await Facility.findById(decoded.id).select("-password");
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    req.user = facility;
    next();
  } catch (error) {
    console.error("Facility Auth Error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
