import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AIAssistant({ isOpen = false, onClose }: AIAssistantProps) {
  if (!isOpen) {
    return null;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      setMessages([
        { role: "assistant", content: `${greeting}! I'm your AI assistant for the Kenya SME Platform. How can I help you with your business today?` }
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          temperature: 0.7,
          maxTokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "AI assistant error" }));
        throw new Error(errorData.detail || "AI assistant error");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError("Failed to connect to AI assistant. Please check if the backend is running.");
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting to the AI assistant. Please make sure the backend is running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-[90vw]",
        "rounded-2xl border border-edge bg-surface shadow-2xl animate-slide-up",
        "flex flex-col overflow-hidden",
        "dark:bg-surface dark:border-edge"
      )}
      style={{ maxHeight: "500px" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-2 dark:bg-surface-3">
        <span className="text-sm font-medium text-foreground">AI Assistant</span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground-4 hover:bg-surface-3 hover:text-foreground transition-colors"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn("flex items-start gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-accent text-white rounded-tr-sm"
                  : "bg-surface-3 text-foreground rounded-tl-sm dark:bg-surface-2"
              )}
            >
              <p>{msg.content}</p>
            </div>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                msg.role === "user" ? "ml-2 bg-accent-soft text-accent" : "mr-2 bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
              )}
            >
              {msg.role === "user" ? "U" : "AI"}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-edge p-3 bg-surface-2 dark:bg-surface-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={cn(
              "flex-1 h-10 px-4 text-sm rounded-xl border border-edge bg-field",
              "text-foreground placeholder:text-foreground-4",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "dark:bg-field dark:border-edge"
            )}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "transition-colors",
              "bg-accent text-white hover:bg-accent-strong",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;