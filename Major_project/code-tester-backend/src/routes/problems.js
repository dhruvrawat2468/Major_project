import express from "express";
import {
  getAllProblems,
  getProblemById
} from "../controllers/problemscontroller.js";   // ← exact file name

const router = express.Router();

router.get("/", getAllProblems);
router.get("/:id", getProblemById);

export default router;