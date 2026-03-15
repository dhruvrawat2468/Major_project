import express from "express";
import {
  createSubmission,
  getSubmissionById,
  getAllSubmissions, // ✅ NEW import
} from "../controllers/submissionscontroller.js";

const router = express.Router();

router.get("/", getAllSubmissions);    // ✅ NEW — GET /submissions
router.post("/", createSubmission);
router.get("/:id", getSubmissionById);

export default router;