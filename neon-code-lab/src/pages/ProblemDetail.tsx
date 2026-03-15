import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorPanel, Language } from "@/components/EditorPanel";
import { ResultPanel } from "@/components/ResultPanel";
import { RunPanel } from "@/components/RunPanel";
import { ChatbotDialog } from "@/components/ChatbotDialog";
import {
  fetchProblem,
  submitCode,
  runCode,
  type ProblemDetail as ProblemDetailType,
  type SubmissionResult,
  type RunResult,
} from "@/lib/api";
import { ArrowLeft, Code2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const difficultyColors = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/50",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  Hard: "bg-red-500/20 text-red-400 border-red-500/50",
};

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [problem, setProblem] = useState<ProblemDetailType | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  // ✅ Chatbot state — stores code+language snapshot at the moment user opens it
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatCode, setChatCode] = useState("");
  const [chatLanguage, setChatLanguage] = useState<Language>("python");

  useEffect(() => {
    if (!id) return;
    setIsLoadingProblem(true);
    fetchProblem(id)
      .then(setProblem)
      .catch(() => {
        toast({ title: "Error", description: "Failed to load problem.", variant: "destructive" });
      })
      .finally(() => setIsLoadingProblem(false));
  }, [id]);

  const handleRun = async (code: string, language: Language) => {
    if (!id) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const result = await runCode(id, code, language);
      setRunResult(result);
      const passed = result.visibleTests.filter((t) => t.passed).length;
      toast({ title: "Run Complete", description: `${passed}/${result.visibleTests.length} sample test cases passed` });
    } catch {
      toast({ title: "Run Failed", description: "An error occurred while running your code.", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async (code: string, language: Language) => {
    if (!id) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const result = await submitCode(id, code, language);
      setSubmitResult(result);
    } catch {
      toast({ title: "Submission Failed", description: "An error occurred while processing your submission.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Called by EditorPanel — captures code+language at the moment AI Assistant is clicked
  const handleOpenChatbot = (code: string, language: Language) => {
    setChatCode(code);
    setChatLanguage(language);
    setShowChatbot(true);
  };

  if (isLoadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Problem Not Found</h1>
          <Button asChild variant="gradient">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back to Problems</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Map problem examples → test cases format for the chatbot
  const testCasesForChat = problem.examples.map((ex) => ({
    input: ex.input,
    expectedOutput: ex.output,
  }));

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back to Problems</Link>
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
              <Badge className={difficultyColors[problem.difficulty]}>{problem.difficulty}</Badge>
            </div>
            {!showEditor && (
              <Button variant="gradient" size="lg" onClick={() => setShowEditor(true)} className="glow-purple">
                <Code2 className="h-5 w-5" />Open Editor
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Problem Description */}
          <div className="space-y-6">
            <Card className="glass gradient-border">
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-line">{problem.description}</p>
              </CardContent>
            </Card>

            <Card className="glass gradient-border">
              <CardHeader><CardTitle>Examples</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {problem.examples.map((example, index) => (
                  <div key={index} className="space-y-2">
                    <div className="font-medium text-primary">Example {index + 1}:</div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Input:</span>
                        <pre className="mt-1 p-2 bg-muted/30 rounded overflow-x-auto">{example.input}</pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Output:</span>
                        <pre className="mt-1 p-2 bg-muted/30 rounded overflow-x-auto">{example.output}</pre>
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="text-muted-foreground">Explanation:</span>
                          <p className="mt-1 text-foreground/80">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                    {index < problem.examples.length - 1 && <Separator className="my-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {problem.constraints.length > 0 && (
              <Card className="glass gradient-border">
                <CardHeader><CardTitle>Constraints</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <code className="text-foreground/90">{constraint}</code>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Editor and Results */}
          <div className="space-y-6">
            {showEditor && (
              <EditorPanel
                onSubmit={handleSubmit}
                onRun={handleRun}
                isSubmitting={isSubmitting}
                isRunning={isRunning}
                onOpenChatbot={handleOpenChatbot} // ✅ receives code+language on click
                problemContext={{
                  id: problem.id,
                  title: problem.title,
                  description: problem.description,
                }}
              />
            )}
            {runResult && <RunPanel result={runResult} />}
            {submitResult && <ResultPanel result={submitResult} />}
          </div>
        </div>
      </div>

      {/* ✅ ChatbotDialog at top level with full context */}
      <ChatbotDialog
        open={showChatbot}
        onOpenChange={setShowChatbot}
        problemContext={{
          id: problem.id,
          title: problem.title,
          description: problem.description,
        }}
        code={chatCode}
        language={chatLanguage}
        testCases={testCasesForChat}
      />
    </div>
  );
};

export default ProblemDetail;