import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle, Play } from "lucide-react";
import type { RunResult } from "@/lib/api";

interface RunPanelProps {
  result: RunResult | null;
}

export const RunPanel = ({ result }: RunPanelProps) => {

  // Prevent crashes if result is null or API response not ready
  const tests = result?.visibleTests ?? [];

  const passedCount = tests.filter((t) => t.passed).length;

  const allPassed = tests.length > 0 && passedCount === tests.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >

      {/* Compile Error */}
      {result?.compileError && (
        <Card className="glass border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Compilation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-lg overflow-x-auto">
              {result.compileError}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Test Case Results */}
      <Card className="glass gradient-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Sample Test Cases
            </CardTitle>

            <Badge
              variant="outline"
              className={
                allPassed
                  ? "border-green-500/50 text-green-400 bg-green-500/10"
                  : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
              }
            >
              {passedCount} / {tests.length} Passed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">

          {tests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sample tests available.
            </p>
          )}

          {tests.map((test, index) => (
            <motion.div
              key={test.testId ?? index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`p-4 rounded-lg border ${
                test.passed
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >

              {/* Header */}
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}

                  <span className="font-medium">
                    Test Case #{test.testId ?? index + 1}
                  </span>
                </div>

                {test.runtime && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {test.runtime}
                  </Badge>
                )}

              </div>

              {/* Input */}
              {test.input && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Input:</span>
                  <pre className="mt-1 p-2 bg-muted/30 rounded text-xs overflow-x-auto">
                    {test.input}
                  </pre>
                </div>
              )}

              {/* Runtime Error */}
              {!test.passed && test.error && (
                <div className="mt-2 text-sm text-red-400">
                  <span className="font-medium">Error: </span>
                  {test.error}
                </div>
              )}

              {/* Expected vs Output */}
              {test.expectedOutput && test.actualOutput && (
                <div className="mt-3 space-y-2 text-sm">

                  <div>
                    <span className="text-muted-foreground">Expected:</span>
                    <pre className="mt-1 p-2 bg-muted/30 rounded text-xs overflow-x-auto">
                      {test.expectedOutput}
                    </pre>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Your Output:</span>
                    <pre className="mt-1 p-2 bg-muted/30 rounded text-xs overflow-x-auto">
                      {test.actualOutput}
                    </pre>
                  </div>

                </div>
              )}

            </motion.div>
          ))}

        </CardContent>
      </Card>

    </motion.div>
  );
};