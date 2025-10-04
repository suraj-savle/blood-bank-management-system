import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

export const protectAdmin = async (req, res, next) => {
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

      // Find admin and attach to req
      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        return res.status(403).json({ message: "Admin not found or inactive" });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "No authorization token provided" });
  }
};
