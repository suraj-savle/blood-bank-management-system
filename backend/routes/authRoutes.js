import express from "express";
import { register, login, getProfile } from "../controllers/authContoller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   get:
 *     summary: Retorna uma mensagem de "Olá, mundo!"
 *     responses:
 *       200:
 *         description: Retorna a mensagem de sucesso
 */


router.post("/register", register);
router.post("/login", login);
// PROFILE (Protected Route)
router.get("/profile", protect, getProfile);


export default router;
