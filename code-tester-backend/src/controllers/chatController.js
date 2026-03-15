import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chat = async (req, res) => {
  const { messages, problemContext, code, language, testCases } = req.body;

  if (!messages || !problemContext) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const systemPrompt = `You are a helpful coding assistant embedded in a coding challenge platform.

The user is solving the following problem:

## Problem: ${problemContext.title}
${problemContext.description}

${testCases && testCases.length > 0 ? `
## Test Cases
${testCases.map((tc, i) => `
Test ${i + 1}:
  Input: ${tc.input}
  Expected Output: ${tc.expectedOutput}
`).join("")}
` : ""}

${code ? `
## User's Current Code (${language || "unknown"})
\`\`\`${language || ""}
${code}
\`\`\`
` : ""}

Your role:
- Help the user understand the problem
- Give hints without directly solving it for them
- If they are clearly stuck, you may guide them more directly
- Point out bugs or logic errors in their code if asked
- Keep responses concise and focused
- Use markdown formatting for code snippets`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",       // free tier model
      systemInstruction: systemPrompt,
    });

    // Gemini uses "user"/"model" roles (not "assistant")
    // Separate history from the latest message — Gemini requires this split
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const latestMessage = messages[messages.length - 1].content;

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(latestMessage);
    const reply = result.response.text();

    res.status(200).json({ message: reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ message: "Failed to get AI response" });
  }
};