"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Send,
  ArrowLeft,
  BarChart3,
  Shield,
  Loader2,
  Info,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "What are the most common complaints?",
  "Summarize the positive reviews",
  "What themes appear in 1-star reviews?",
  "What do customers praise the most?",
  "Are there any patterns in the negative feedback?",
  "What is the overall customer sentiment?",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function isScopeGuardResponse(text: string): boolean {
  return (
    text.includes("falls outside my scope") ||
    text.includes("can only analyze") ||
    text.includes("can only answer questions about")
  );
}

function getMessageText(msg: ChatMessage): string {
  return msg.content;
}

export default function ChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessionInfo, setSessionInfo] = useState<{
    sourceName: string;
    totalReviews: number;
  } | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/reviews?sessionId=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found");
        return res.json();
      })
      .then((data) => {
        setSessionInfo({
          sourceName: data.sourceName,
          totalReviews: data.stats.totalReviews,
        });
      })
      .catch((err) => setSessionError(err.message));
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messages: newMessages.map((m) => ({
              role: m.role,
              content: getMessageText(m),
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to get response");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        };

        setMessages([...newMessages, assistantMsg]);

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages([
            ...newMessages,
            { ...assistantMsg, content: fullContent },
          ]);
        }
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}. Please try again.`,
        };
        setMessages([...newMessages, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, sessionId]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">No session found.</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Import Reviews First
          </Button>
        </Link>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{sessionError}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shrink-0">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                ReviewLens AI
              </span>
            </Link>
            {sessionInfo && (
              <Badge variant="secondary">
                {sessionInfo.sourceName} · {sessionInfo.totalReviews} reviews
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard?sessionId=${sessionId}`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
              </Button>
            </Link>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Scope Guard Banner */}
      <div className="bg-indigo-50 border-b border-indigo-100 shrink-0">
        <div className="mx-auto max-w-4xl px-6 py-2 flex items-center gap-2 text-sm text-indigo-700">
          <Shield className="h-4 w-4 shrink-0" />
          <span>
            Scope Guard active — AI will only answer questions about your
            loaded reviews
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ask about your reviews
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  I can analyze sentiment, identify trends, find common
                  complaints, and answer any question about the{" "}
                  {sessionInfo?.totalReviews || ""} reviews you loaded.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3"
                      : "bg-white border rounded-2xl rounded-bl-md px-5 py-4 shadow-sm"
                  }`}
                >
                  {message.role === "assistant" &&
                    isScopeGuardResponse(message.content) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Scope Guard
                        </Badge>
                      </div>
                    )}
                  <div
                    className={`text-sm leading-relaxed ${
                      message.role === "user"
                        ? "text-white"
                        : "text-slate-700 prose prose-sm prose-slate max-w-none"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="border-t bg-white/80 backdrop-blur-sm shrink-0">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about the reviews..."
                className="resize-none min-h-[44px] max-h-32 pr-12"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <Info className="h-3 w-3" />
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
