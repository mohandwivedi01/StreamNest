
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {heathcheck} from "../controllers/healthcheck.controller.js"

const router = Router();

router.route("/health-check").get(heathcheck);

export default router