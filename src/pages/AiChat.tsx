import { useState, useRef, useEffect } from "react";
import api from "../lib/axios";
import { Button } from "../ui/UI";


interface Message {
  role: "user" | "ai";
  text: string;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: input,
        history: messages,
      });

      setMessages((prev) => [...prev, { role: "ai", text: response.data.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error connecting to Gemini. Please check your server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] max-w-3xl mx-auto my-4 bg-base-100 shadow-2xl rounded-3xl overflow-hidden border border-base-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
          <h1 className="font-bold text-lg tracking-tight">Gemini Pro AI</h1>
        </div>
        <Button
          label="Clear Chat"
           variant="sand" 
           size="sm" 
           onClick={() => setMessages([])} 
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-base-100">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-2">
            <div className="text-4xl">✨</div>
            <p className="text-sm font-medium">How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
          >
            <div className={`chat-bubble py-3 px-4 shadow-sm ${
              msg.role === "user" 
                ? "chat-bubble-primary text-white!" 
                : "chat-bubble-secondary"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat chat-start">
            <div className="chat-bubble chat-bubble-secondary flex items-center gap-2 opacity-80">
              <span className="loading loading-dots loading-sm"></span>
              Gemini is thinking
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-base-200/50 border-t border-base-300">
        <div className="relative flex items-center">
          <input
            type="text"
            className="input input-bordered w-full pr-24 rounded-2xl focus:outline-none focus:border-(--color-accent) transition-all bg-base-100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <div className="absolute right-1.5">
            <Button 
              label="Send"
              size="sm" 
              variant="submit" 
              loading={isLoading || !input.trim()}
            />
          </div>
        </div>
      </form>
    </div>
  );
}