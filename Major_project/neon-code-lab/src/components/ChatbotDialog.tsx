import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { Language } from "@/components/EditorPanel";

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemContext: {
    id: string;
    title: string;
    description: string;
  };
  code: string;                // ✅ current editor code
  language: Language;          // ✅ current language
  testCases: {                 // ✅ visible test cases
    input: string;
    expectedOutput: string;
  }[];
}

export const ChatbotDialog = ({
  open,
  onOpenChange,
  problemContext,
  code,
  language,
  testCases,
}: ChatbotDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // ✅ sends all context to Express backend → Anthropic
      const reply = await sendChatMessage(updatedMessages, {
        problemContext,
        code,
        language,
        testCases,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9998,
            }}
          />

          {/* Slide-in panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "100%", maxWidth: "480px",
              zIndex: 9999, display: "flex", flexDirection: "column",
              backgroundColor: "hsl(var(--background))",
              borderLeft: "1px solid hsl(var(--border))",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Bot style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Problem Assistant</h2>
                  <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", margin: 0, marginTop: 2 }}>
                    {problemContext.title} · {language}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", borderRadius: "4px" }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", paddingTop: "48px" }}>
                  <Bot style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.4 }} />
                  <p style={{ fontSize: "14px", margin: 0 }}>Ask me anything about this problem!</p>
                  <p style={{ fontSize: "12px", margin: "4px 0 0" }}>I can see your code, the problem, and the test cases.</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} style={{ display: "flex", gap: "10px", justifyContent: message.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                  {message.role === "assistant" && (
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--primary) / 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
                    </div>
                  )}
                  <div style={{ maxWidth: "80%", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap", backgroundColor: message.role === "user" ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted))", color: "hsl(var(--foreground))", border: message.role === "assistant" ? "1px solid hsl(var(--border))" : "none" }}>
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--secondary) / 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User style={{ width: 16, height: 16 }} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--primary) / 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
                  </div>
                  <div style={{ borderRadius: "12px", padding: "10px 14px", backgroundColor: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                    <Loader2 style={{ width: 16, height: 16, color: "hsl(var(--primary))", animation: "spin 1s linear infinite" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid hsl(var(--border))", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about this problem..."
                  style={{ minHeight: "60px", resize: "none", flex: 1 }}
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" style={{ height: "60px", width: "60px", flexShrink: 0 }}>
                  <Send style={{ width: 18, height: 18 }} />
                </Button>
              </div>
              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "8px" }}>
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};