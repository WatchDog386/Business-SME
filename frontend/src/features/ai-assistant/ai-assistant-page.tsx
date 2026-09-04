import { AIAssistant } from '@/components/ai-assistant/ai-assistant.component';

export function AIAssistantPage() {
  return (
    <div className="min-h-screen bg-surface p-6 dark:bg-surface-2">
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
        <div className="h-full rounded-3xl bg-surface/50 backdrop-blur-sm border border-edge dark:bg-surface-2/50 dark:border-edge">
          <AIAssistant isOpen={true} />
        </div>
      </div>
    </div>
  );
}