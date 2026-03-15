import sql from "../database/db.js";

export const getAllProblems = async (req, res) => {
  try {
    const problems = await sql`
      SELECT id, title, difficulty
      FROM problems
      ORDER BY created_at DESC
    `;

    res.status(200).json(problems);
  } catch (err) {
    console.error("Error fetching problems:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProblemById = async (req, res) => {
  const { id } = req.params;

  try {
    const problem = await sql`
      SELECT * FROM problems
      WHERE id = ${id}
    `;

    if (problem.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const visibleTestCases = await sql`
      SELECT input, expected_output
      FROM test_cases
      WHERE problem_id = ${id}
      AND is_hidden = false
    `;

    res.status(200).json({
      problem: problem[0],
      visibleTestCases
    });

  } catch (err) {
    console.error("Error fetching problem:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};