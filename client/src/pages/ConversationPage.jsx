import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ChatWindow from "../components/ChatWindow.jsx";
import { useConversations } from "../hooks/useConversations.js";

export default function ConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { conversations, isLoading } = useConversations();
  const [notFound, setNotFound] = useState(false);

  const conversation = conversations.find((c) => c.id === id);

  useEffect(() => {
    if (!isLoading && !conversation) {
      setNotFound(true);
    }
  }, [isLoading, conversation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-signal-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
        <p className="text-sm text-ink-900/50">This conversation couldn't be found.</p>
        <button onClick={() => navigate("/")} className="text-sm text-signal-500 font-medium">
          Back to chats
        </button>
      </div>
    );
  }

  return <ChatWindow conversation={conversation} onBack={() => navigate("/")} />;
}
