import jwt from "jsonwebtoken";
import Facility from "../models/facilityModel.js";

export const protectFacility = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find facility and attach to req
      const facility = await Facility.findById(decoded.id).select("-password");
      if (!facility) return res.status(403).json({ message: "Facility not found" });

      // Only approved facilities can access protected routes
      if (facility.status !== "approved")
        return res.status(403).json({ message: "Facility not approved yet" });

      req.facility = facility;
      next();
    } catch (error) {
      console.error("Facility Auth Error:", error);
      res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "No authorization token provided" });
  }
};
