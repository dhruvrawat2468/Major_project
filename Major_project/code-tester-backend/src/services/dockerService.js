// dockerService.js
// Runs user code in an isolated Docker container and destroys it afterwards.
// Place this in: backend/services/dockerService.js

import { spawn } from "child_process";
import { writeFile, mkdir, rm, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import os from "os";

/**
 * Polyfill prepended to every JavaScript submission.
 * Replaces browser's prompt() with a synchronous stdin line reader
 * so that code like: let n = Number(prompt("Enter:")) works in Node.js.
 */
const JS_PROMPT_POLYFILL = `
const { readFileSync } = require('fs');
const _stdinData = readFileSync('/dev/stdin', 'utf8');
const _stdinLines = _stdinData.split('\\n');
let _stdinIndex = 0;
function prompt(_msg) {
  const line = _stdinLines[_stdinIndex++];
  return line !== undefined ? line.trim() : '';
}
`;


// Maps language identifiers to pre-built image names and run commands
const LANGUAGE_CONFIG = {
  python: {
    image: "code-runner-python",   // was "judge-python"
    filename: "solution.py",
    runCmd: (file) => `python ${file}`,
    compileCmd: null,
  },
  javascript: {
    image: "code-runner-js",       // was "judge-js"
    filename: "solution.js",
    runCmd: (file) => `node ${file}`,
    compileCmd: null,
  },
  cpp: {
    image: "code-runner-cpp",      // was "judge-cpp"
    filename: "solution.cpp",
    compileCmd: (file) => `g++ -o /app/solution ${file} 2>&1`,
    runCmd: () => `/app/solution`,
  },
};

const EXECUTION_TIMEOUT_MS = 10_000; // 10 seconds max per run
const MEMORY_LIMIT = "128m";         // 128 MB RAM cap
const CPU_QUOTA = "50000";           // 50% of one CPU core

/**
 * Executes user code inside a fresh Docker container.
 * The container is always destroyed after the run, pass or fail.
 *
 * @param {string} code       - The user's source code
 * @param {string} language   - "python" | "javascript" | "cpp"
 * @param {string} stdin      - Optional stdin to feed into the program
 * @returns {{ stdout, stderr, exitCode, runtime }}
 */
export async function runInContainer(code, language, stdin = "") {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  // Create a unique temp directory for this submission
  const runId = randomUUID();
  const tmpDir = path.join(os.tmpdir(), `judge-${runId}`);
  await mkdir(tmpDir, { recursive: true });

  const srcFile = path.join(tmpDir, config.filename);

  // For JavaScript, prepend the prompt() polyfill so stdin-based input works in Node.js
  const finalCode = language === "javascript"
    ? JS_PROMPT_POLYFILL + code
    : code;

  await writeFile(srcFile, finalCode, "utf8");

  // Write stdin to a file so we can pipe it into the container
  const stdinFile = path.join(tmpDir, "stdin.txt");
  await writeFile(stdinFile, stdin, "utf8");

  const containerName = `judge-${runId}`;

  try {
    // --- Compile step (C++ only) ---
    if (config.compileCmd) {
      const compileResult = await dockerRun({
        containerName: `${containerName}-compile`,
        image: config.image,
        tmpDir,
        command: config.compileCmd(`/app/${config.filename}`),
        stdinFile: null,
        timeoutMs: EXECUTION_TIMEOUT_MS,
      });

      if (compileResult.exitCode !== 0) {
        return {
          stdout: "",
          stderr: compileResult.stdout + compileResult.stderr,
          exitCode: compileResult.exitCode,
          runtime: null,
          compileError: compileResult.stdout + compileResult.stderr,
        };
      }
    }

    // --- Run step ---
    const start = Date.now();
    const result = await dockerRun({
      containerName,
      image: config.image,
      tmpDir,
      command: config.runCmd(`/app/${config.filename}`),
      stdinFile,
      timeoutMs: EXECUTION_TIMEOUT_MS,
    });
    const runtime = Date.now() - start;

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      exitCode: result.exitCode,
      runtime: `${runtime}ms`,
      compileError: null,
    };
  } finally {
    // Always clean up the temp directory
    await rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Internal helper — spins up one Docker container, runs a command, destroys the container.
 */
async function dockerRun({ containerName, image, tmpDir, command, stdinFile, timeoutMs }) {
  // Read stdin content from file (or use empty string)
  const stdinContent = stdinFile ? await readFile(stdinFile, "utf8") : "";

  return new Promise((resolve) => {
    // Build docker run args as an array — avoids shell quoting issues on Windows
    const args = [
      "run",
      "--rm",
      "-i",                        // ← keeps stdin open so piped content reaches the container
      `--name`, containerName,
      "--network", "none",
      `--memory=${MEMORY_LIMIT}`,
      `--cpu-quota=${CPU_QUOTA}`,
      `--pids-limit=64`,
      "-v", `${tmpDir}:/app`,
      image,
      "sh", "-c",
      command,
    ];

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });

    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });

    // Write stdin content and close the stream so the program sees EOF naturally
    child.stdin.write(stdinContent);
    child.stdin.end();

    child.on("close", (code) => {
      if (timedOut) return; // already resolved
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });

    child.on("error", (err) => {
      if (!timedOut) resolve({ stdout: "", stderr: String(err), exitCode: 1 });
    });

    // Kill container on timeout to ensure cleanup
    const timer = setTimeout(() => {
      timedOut = true;
      spawn("docker", ["kill", containerName]);
      resolve({ stdout: "", stderr: "Time limit exceeded", exitCode: 124, runtime: null });
    }, timeoutMs);

    child.on("close", () => clearTimeout(timer));
  });
}