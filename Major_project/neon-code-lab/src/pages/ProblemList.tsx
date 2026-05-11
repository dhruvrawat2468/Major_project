import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProblemCard } from "@/components/ProblemCard";
import { ProblemListSkeleton } from "@/components/LoadingSkeleton";
import { fetchProblems, type Problem } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProblemList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProblems()
      .then(setProblems)
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load problems. Is the backend running?",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProblems = problems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.id.includes(searchQuery)
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Problem Set</h1>
            <p className="text-muted-foreground">
              Choose a problem to solve and test your coding skills
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <ProblemListSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map((problem, index) => (
              <ProblemCard key={problem.id} problem={problem} index={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredProblems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No problems found matching your search.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProblemList;
