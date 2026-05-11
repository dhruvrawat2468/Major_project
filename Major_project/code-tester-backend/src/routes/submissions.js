// submissions.js (router)
// Updated to include the /run endpoint for the "Run" button

import express from "express";
import {
  createSubmission,
  getSubmissionById,
  getAllSubmissions,
  runCode,
} from "../controllers/submissionscontroller.js";

const router = express.Router();

router.get("/", getAllSubmissions);
router.get("/:id", getSubmissionById);
router.post("/", createSubmission);      // Submit — runs all test cases + saves to DB
router.post("/run", runCode);            // Run — only visible tests, no DB write

export default router;