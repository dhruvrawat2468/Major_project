import sql from "../database/db.js";
import { v4 as uuidv4 } from "uuid";
import { runCode } from "./services/execservice.js";


// CREATE SUBMISSION
export const createSubmission = async (req, res) => {

  const { problemId, language, code } = req.body;

  if (!problemId || !language || !code) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {

    const submissionId = uuidv4();

    // 1️⃣ Insert submission (initial status)
    await sql`
      INSERT INTO submissions (id, problem_id, language, source_code, status)
      VALUES (${submissionId}, ${problemId}, ${language}, ${code}, 'pending')
    `;

    // 2️⃣ Fetch test cases
    const testCases = await sql`
      SELECT input, expected_output, is_hidden
      FROM test_cases
      WHERE problem_id = ${problemId}
    `;

    let visibleTests = [];
    let totalTests = 0;
    let passed = 0;
    let testId = 1;

    for (const test of testCases) {
      const start = Date.now();
      const output = await runCode(code, test.input);
      const runtime = Date.now() - start;

      const passedTest = output.trim() === test.expected_output.trim();

      totalTests++;
      if (passedTest) passed++;

      if (!test.is_hidden) {
        visibleTests.push({
          testId: testId++,
          input: test.input,
          expectedOutput: test.expected_output,
          actualOutput: output,
          passed: passedTest,
          runtime: `${runtime}ms`
        });
      }
    }

    // 3️⃣ Determine status label
    const statusLabel =
      passed === totalTests
        ? "Accepted"
        : passed === 0
        ? "Wrong Answer"
        : "Wrong Answer";

    // 4️⃣ Build result payload
    const resultPayload = {
      passed,
      total: totalTests,
      visibleTests,
      hiddenTestCount: totalTests - visibleTests.length,
      aiFeedback: "AI feedback will be available soon."
    };

    // 5️⃣ Update submission with result and resolved status
    await sql`
      UPDATE submissions
      SET
        status = ${statusLabel},
        result_json = ${JSON.stringify(resultPayload)}
      WHERE id = ${submissionId}
    `;

    res.status(200).json({
      submissionId,
      ...resultPayload
    });

  } catch (err) {
    console.error("Submission execution error:", err);
    res.status(500).json({ message: "Execution error" });
  }
};


// GET ALL SUBMISSIONS (for Dashboard)
export const getAllSubmissions = async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        s.id,
        s.problem_id        AS "problemId",
        p.title             AS "problemTitle",
        s.language,
        s.status,
        s.created_at        AS "timestamp",
        s.result_json       AS "resultJson"
      FROM submissions s
      JOIN problems p ON p.id = s.problem_id
      ORDER BY s.created_at DESC
    `;

    const submissions = rows.map((row) => {
      const result = row.resultJson || {};
      const passed = result.passed ?? 0;
      const total = result.total ?? 0;

      return {
        id: row.id,
        problemId: row.problemId,
        problemTitle: row.problemTitle,
        language: row.language,
        status: row.status,           // "Accepted" | "Wrong Answer" etc.
        timestamp: row.timestamp,
        passRate: `${passed}/${total}`,
      };
    });

    res.status(200).json(submissions);

  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// GET SINGLE SUBMISSION BY ID
export const getSubmissionById = async (req, res) => {

  const { id } = req.params;

  try {

    const submission = await sql`
      SELECT result_json
      FROM submissions
      WHERE id = ${id}
    `;

    if (submission.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const result = submission[0].result_json;

    if (!result) {
      return res.status(404).json({ message: "Result not available yet" });
    }

    res.status(200).json(result);

  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};