import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode2 } from "lucide-react";

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
  exampleCount: number;
}

interface ProblemCardProps {
  problem: Problem;
  index: number;
}

const difficultyColors = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/50",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  Hard: "bg-red-500/20 text-red-400 border-red-500/50",
};

export const ProblemCard = ({ problem, index }: ProblemCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/problems/${problem.id}`}>
        <Card className="glass gradient-border hover:glow-blue transition-all duration-250 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileCode2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:gradient-text transition-all">
                    {problem.title}
                  </CardTitle>
                </div>
              </div>
              <Badge className={difficultyColors[problem.difficulty]}>
                {problem.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {problem.summary}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{problem.exampleCount} examples</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};
