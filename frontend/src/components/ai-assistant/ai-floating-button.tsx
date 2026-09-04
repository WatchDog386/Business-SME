import { useState } from "react";
import { Bot } from "lucide-react";
import { AIAssistant } from "./ai-assistant.component";
import { cn } from "@/lib/utils";

export function AIAssistantFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl",
          "bg-accent text-white shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-105 hover:shadow-2xl",
          "active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
          "dark:shadow-2xl"
        )}
        title="AI Assistant"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-7 w-7" />
      </button>

      {isOpen && (
        <AIAssistant isOpen={true} onClose={handleClose} />
      )}
    </>
  );
}