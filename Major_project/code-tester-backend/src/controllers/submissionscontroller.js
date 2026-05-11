// submissionsController.js
// Place in: backend/controllers/submissionsController.js

import sql from "../database/db.js";
import { runInContainer } from "../services/dockerService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── GET /submissions ───────────────────────────────────────────────────────
export async function getAllSubmissions(req, res) {
  try {
    const rows = await sql`
      SELECT id, problem_id, language, status, execution_time, created_at
      FROM submissions
      ORDER BY created_at DESC
      LIMIT 50
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
}

// ─── GET /submissions/:id ────────────────────────────────────────────────────
export async function getSubmissionById(req, res) {
  try {
    const [row] = await sql`
      SELECT * FROM submissions WHERE id = ${req.params.id}
    `;
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
}

// ─── POST /submissions  (main judge endpoint) ────────────────────────────────
export async function createSubmission(req, res) {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ error: "problemId, code, and language are required" });
  }

  // 1. Fetch the problem + its test cases from DB
  const [problem] = await sql`SELECT * FROM problems WHERE id = ${problemId}`;
  if (!problem) return res.status(404).json({ error: "Problem not found" });

  const testCases = await sql`
    SELECT * FROM test_cases WHERE problem_id = ${problemId} ORDER BY id
  `;

  // 2. Run code against every test case in isolated containers
  let passed = 0;
  const visibleTests = [];
  const hiddenTestCount = testCases.filter((t) => t.is_hidden).length;

  for (const tc of testCases) {
    const result = await runInContainer(code, language, tc.input);

    const testPassed = result.exitCode === 0 &&
      result.stdout.trim() === tc.expected_output.trim();

    if (testPassed) passed++;

    // Only surface visible test case details to the frontend
    if (!tc.is_hidden) {
      visibleTests.push({
        testId: tc.id,
        passed: testPassed,
        runtime: result.runtime,
        error: result.stderr || null,
        expectedOutput: testPassed ? null : tc.expected_output,
        actualOutput: testPassed ? null : result.stdout,
        compileError: result.compileError || null,
      });
    }
  }

  const total = testCases.length;

  // 3. Generate AI feedback via Gemini
  const aiFeedback = await generateAiFeedback({
    code,
    language,
    passed,
    total,
    problemTitle: problem.title,
    visibleTests,
  });

  // 4. Persist submission to Supabase
  const [submission] = await sql`
    INSERT INTO submissions (problem_id, language, source_code, status, execution_time)
    VALUES (
      ${problemId}, ${language}, ${code},
      ${passed === total ? "accepted" : "wrong_answer"},
      ${parseFloat(visibleTests[0]?.runtime) || null}
    )
    RETURNING id
  `;

  // Write AI feedback to the separate feedback table
  await sql`
    INSERT INTO feedback (submission_id, ai_feedback)
    VALUES (${submission.id}, ${aiFeedback})
  `;

  // 5. Return the full result to the frontend (matches SubmissionResult type)
  res.json({
    submissionId: submission.id,
    passed,
    total,
    visibleTests,
    hiddenTestCount,
    compileError: visibleTests[0]?.compileError || null,
    aiFeedback,
  });
}

// ─── POST /submissions/run  (run-only, no DB write) ──────────────────────────
// Used by the "Run" button (not Submit) — only runs visible test cases
export async function runCode(req, res) {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ error: "problemId, code, and language are required" });
  }

  const testCases = await sql`
    SELECT * FROM test_cases
    WHERE problem_id = ${problemId} AND is_hidden = false
    ORDER BY id
    LIMIT 3
  `;

  const visibleTests = [];
  let passed = 0;

  for (const tc of testCases) {
    const result = await runInContainer(code, language, tc.input);
    const testPassed = result.exitCode === 0 &&
      result.stdout.trim() === tc.expected_output.trim();

    if (testPassed) passed++;

    visibleTests.push({
      testId: tc.id,
      passed: testPassed,
      runtime: result.runtime,
      error: result.stderr || null,
      expectedOutput: tc.expected_output,
      actualOutput: result.stdout,
      compileError: result.compileError || null,
    });
  }

  res.json({
    passed,
    total: testCases.length,
    visibleTests,
    hiddenTestCount: 0,
    compileError: visibleTests[0]?.compileError || null,
    aiFeedback: null,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function generateAiFeedback({ code, language, passed, total, problemTitle, visibleTests }) {
  try {
    const failedTests = visibleTests.filter((t) => !t.passed);
    const prompt = `
You are a concise coding mentor. A student submitted code for the problem "${problemTitle}".
Language: ${language}
Result: ${passed}/${total} test cases passed.
${failedTests.length > 0
  ? `First failing test:\n- Expected: ${failedTests[0].expectedOutput}\n- Got: ${failedTests[0].actualOutput}`
  : ""}
Code:
\`\`\`${language}
${code}
\`\`\`
Give 2-3 sentences of helpful, specific feedback. If all tests passed, mention one improvement idea.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return passed === total
      ? "Great job! All test cases passed."
      : `${passed} of ${total} test cases passed. Review your logic for edge cases.`;
  }
}