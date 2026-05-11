import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchSubmissions, type Submission } from "@/lib/api"; // ✅ from api.ts

const statusConfig = {
  Accepted: {
    icon: CheckCircle2,
    className: "text-green-400 bg-green-500/10 border-green-500/50",
  },
  "Wrong Answer": {
    icon: XCircle,
    className: "text-red-400 bg-red-500/10 border-red-500/50",
  },
  "Time Limit Exceeded": {
    icon: Clock,
    className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/50",
  },
  "Runtime Error": {
    icon: AlertCircle,
    className: "text-orange-400 bg-orange-500/10 border-orange-500/50",
  },
};

const Dashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions()
      .then(setSubmissions)
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not load submission history.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Submission History</h1>
          <p className="text-muted-foreground">
            Track your progress and review past submissions
          </p>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Submissions list */}
        {!isLoading && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((submission, index) => {
              const config = statusConfig[submission.status];
              const StatusIcon = config?.icon || AlertCircle;
              const statusClass = config?.className || "";

              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass gradient-border hover:glow-blue transition-all duration-250 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-2">
                            {submission.problemTitle}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {submission.language}
                            </Badge>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(submission.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${statusClass} flex items-center gap-1.5`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {submission.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Test Cases: </span>
                          <span className="font-medium">{submission.passRate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && submissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No submissions yet. Start solving problems!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;