import { cn } from "@/lib/utils";
import Icons from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  role: 'user' | 'bot';
  content: string;
  isLoading?: boolean;
}

export default function ChatMessage({ role, content, isLoading = false }: ChatMessageProps) {
  const isBot = role === 'bot';

  return (
    <div className={cn("flex items-start gap-3", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Icons.Bot className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isBot ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Icons.Loader className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          content
        )}
      </div>
      {!isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Icons.User className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
