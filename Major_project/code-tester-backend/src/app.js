import express from "express";
import cors from "cors";

import problemsRoute from "./routes/problems.js";
import submissionsRoute from "./routes/submissions.js";
import chatRoute from "./routes/chat.js"; // ✅ NEW

const app = express();

app.use(cors());
app.use(express.json());

app.use("/problems", problemsRoute);
app.use("/submissions", submissionsRoute);
app.use("/chat", chatRoute); // ✅ NEW

export default app;