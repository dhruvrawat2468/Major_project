const API_BASE = "http://localhost:5000";

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
  exampleCount: number;
}

export interface ProblemDetail extends Problem {
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
}

export interface TestResult {
  testId: number;
  passed: boolean;
  runtime?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  input?: string;
}

export interface RunResult {
  visibleTests: TestResult[];
  compileError?: string;
}

export interface SubmissionResult {
  passed: number;
  total: number;
  visibleTests: TestResult[];
  hiddenTestCount: number;
  aiFeedback: string;
  compileError?: string;
}

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  language: string;
  status: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error";
  timestamp: string;
  passRate: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  problemContext: {
    id: string;
    title: string;
    description: string;
  };
  code: string;
  language: string;
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
}

export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch(`${API_BASE}/problems`);
  if (!res.ok) throw new Error("Failed to fetch problems");
  return res.json();
}

export async function fetchProblem(id: string): Promise<ProblemDetail> {
  const res = await fetch(`${API_BASE}/problems/${id}`);
  if (!res.ok) throw new Error("Failed to fetch problem");

  const data = await res.json();

  return {
    ...data.problem,
    examples: (data.visibleTestCases || []).map((test: any) => ({
      input: test.input,
      output: test.expected_output,
      explanation: "",
    })),
    constraints: [],
  };
}

export async function submitCode(
  problemId: string,
  code: string,
  language: string
): Promise<SubmissionResult> {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId, code, language }),
  });
  if (!res.ok) throw new Error("Failed to submit code");
  return res.json();
}

export async function fetchSubmission(id: string): Promise<SubmissionResult> {
  const res = await fetch(`${API_BASE}/submissions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch submission");
  return res.json();
}

export async function runCode(
  problemId: string,
  code: string,
  language: string
): Promise<RunResult> {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId, code, language, runOnly: true }),
  });
  if (!res.ok) throw new Error("Failed to run code");
  return res.json();
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const res = await fetch(`${API_BASE}/submissions`);
  if (!res.ok) throw new Error("Failed to fetch submissions");
  return res.json();
}

// ✅ NEW — send a chat message with full problem + code + test case context
export async function sendChatMessage(
  messages: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      problemContext: context.problemContext,
      code: context.code,
      language: context.language,
      testCases: context.testCases,
    }),
  });
  if (!res.ok) throw new Error("Failed to get AI response");
  const data = await res.json();
  return data.message;
}