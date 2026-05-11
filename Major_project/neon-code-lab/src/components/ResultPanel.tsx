import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { SubmissionResult } from "@/lib/api";

interface ResultPanelProps {
  result: SubmissionResult | null;
}

export const ResultPanel = ({ result }: ResultPanelProps) => {

  if (!result) return null;

  const tests = result.visibleTests ?? [];
  const passRate = (result.passed / result.total) * 100;
  const passedCount = tests.filter(t => t.passed).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Summary Card */}
      <Card className="glass gradient-border glow-purple">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Submission Results</CardTitle>
            <Badge
              variant="outline"
              className={
                passRate === 100
                  ? "border-green-500/50 text-green-400 bg-green-500/10"
                  : passRate >= 50
                  ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                  : "border-red-500/50 text-red-400 bg-red-500/10"
              }
            >
              {result.passed} / {result.total} Passed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${passRate}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full ${
                    passRate === 100
                      ? "bg-green-500"
                      : passRate >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{passRate.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compile Error */}
      {result.compileError && (
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

      {/* Visible Test Results */}
      <Card className="glass gradient-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Visible Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.map((test, index) => (
            <motion.div
              key={test.testId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                test.passed
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="font-medium">Test Case #{test.testId}</span>
                </div>
                {test.runtime && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {test.runtime}
                  </Badge>
                )}
              </div>

              {!test.passed && test.error && (
                <div className="mt-2 text-sm text-red-400">
                  <span className="font-medium">Error: </span>
                  {test.error}
                </div>
              )}

              {!test.passed && test.expectedOutput && test.actualOutput && (
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

      {/* Hidden Tests Indicator */}
      {result.hiddenTestCount > 0 && (
        <Card className="glass border-muted">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <EyeOff className="h-5 w-5" />
              <span className="text-sm">
                {result.hiddenTestCount} hidden test case{result.hiddenTestCount > 1 ? "s" : ""}{" "}
                {result.passed === result.total ? "passed" : "not shown"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Feedback */}
      <Card className="glass gradient-border glow-pink">
        <CardHeader>
          <CardTitle className="text-lg gradient-text">AI Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{result.aiFeedback}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
