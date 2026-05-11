import { useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Play, Upload, Loader2, Sparkles, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type Language = "python" | "cpp" | "javascript";

interface EditorPanelProps {
  onSubmit: (code: string, language: Language) => Promise<void>;
  onRun: (code: string, language: Language) => Promise<void>;
  isSubmitting: boolean;
  isRunning: boolean;
  onOpenChatbot?: (code: string, language: Language) => void;
  problemContext?: {
    id: string;
    title: string;
    description: string;
  };
}

const languageTemplates: Record<Language, string> = {
  python: `def solution():
    # Write your code here
    pass

# Test your solution
result = solution()
print(result)`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
  javascript: `function solution() {
    // Write your code here
}

// Test your solution
const result = solution();
console.log(result);`,
};

const languageMap: Record<Language, string> = {
  python: "python",
  cpp: "cpp",
  javascript: "javascript",
};

export const EditorPanel = ({
  onSubmit,
  onRun,
  isSubmitting,
  isRunning,
  onOpenChatbot,
  problemContext,
}: EditorPanelProps) => {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(languageTemplates.python);
  const { toast } = useToast();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setCode(languageTemplates[newLang]);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({ title: "Empty Code", description: "Please write some code before submitting.", variant: "destructive" });
      return;
    }
    await onSubmit(code, language);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast({ title: "Empty Code", description: "Please write some code before running.", variant: "destructive" });
      return;
    }
    await onRun(code, language);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCode(content);
        toast({ title: "File Loaded", description: `Successfully loaded ${file.name}` });
      };
      reader.readAsText(file);
    }
  };

  const isBusy = isSubmitting || isRunning;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="glass gradient-border p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Language:</span>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-36 glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="cursor-pointer">
            <input type="file" accept=".py,.cpp,.js,.txt" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="sm" type="button" asChild>
              <span><Upload className="h-4 w-4" />Upload File</span>
            </Button>
          </label>

          {/* ✅ passes current code + language snapshot to parent on open */}
          {problemContext && onOpenChatbot && (
            <Button variant="neon" size="sm" onClick={() => onOpenChatbot(code, language)} className="ml-auto">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border border-border/50 glow-blue">
          <Editor
            height="400px"
            language={languageMap[language]}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="lg" onClick={handleRun} disabled={isBusy} className="min-w-32">
            {isRunning ? <><Loader2 className="h-4 w-4 animate-spin" />Running...</> : <><Play className="h-4 w-4" />Run</>}
          </Button>
          <Button variant="gradient" size="lg" onClick={handleSubmit} disabled={isBusy} className="min-w-32">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><Send className="h-4 w-4" />Submit</>}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};