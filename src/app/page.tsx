"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Globe,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  async function handleIngest(
    type: "url" | "csv" | "sample",
    data?: string
  ) {
    setLoading(true);
    try {
      let body: Record<string, unknown>;

      if (type === "url") {
        if (!url.trim()) {
          toast.error("Please enter a Trustpilot URL");
          setLoading(false);
          return;
        }
        body = { type: "url", url: url.trim() };
      } else if (type === "csv") {
        const text = data || csvText;
        if (!text.trim()) {
          toast.error("Please paste or enter CSV data");
          setLoading(false);
          return;
        }
        body = { type: "csv", csvText: text };
      } else {
        const res = await fetch("/sample-reviews.json");
        const sampleData = await res.json();
        body = { type: "sample", sampleData };
      }

      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Ingestion failed");
        return;
      }

      toast.success(`Loaded ${result.reviewCount} reviews!`);
      router.push(`/dashboard?sessionId=${result.sessionId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handleIngest("csv", text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-background bg-dots bg-grain">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              ReviewLens<span className="text-emerald-600">.</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block font-medium tracking-wide uppercase">
            Review Intelligence
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-20 pb-24">
        {/* Hero */}
        <div className="text-center mb-20 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-8">
            <Zap className="h-3 w-3" />
            AI-Powered Review Analysis
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[0.95] mb-6">
            Understand your
            <br />
            <span className="text-emerald-600">customer reviews</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Scrape reviews from Trustpilot, visualize sentiment at a glance,
            and interrogate your data with a guardrailed AI assistant.
          </p>
        </div>

        {/* Ingestion Card */}
        <Card className="max-w-2xl mx-auto mb-24 shadow-xl shadow-foreground/[0.03] border-border/60 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Import Reviews</CardTitle>
            <CardDescription>
              Choose how to load your review data for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Trustpilot URL
                </TabsTrigger>
                <TabsTrigger value="csv" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> CSV Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/70">
                    Trustpilot Business URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://www.trustpilot.com/review/example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleIngest("url")
                      }
                      className="h-12 text-base"
                    />
                    <Button
                      onClick={() => handleIngest("url")}
                      disabled={loading}
                      className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a Trustpilot business page URL to scrape reviews
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="csv" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium text-foreground/70">
                          Drop a CSV file or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Columns: reviewer, rating, title, body, date
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={loading}
                      />
                    </div>
                  </label>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground font-medium">or</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCsvDialogOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Paste CSV Text
                  </Button>
                  <Dialog
                    open={csvDialogOpen}
                    onOpenChange={setCsvDialogOpen}
                  >
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Paste CSV Data</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        placeholder={`reviewer,rating,title,body,date\nJohn D.,5,Great product!,Loved every aspect of this...,2024-01-15`}
                        rows={10}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          setCsvDialogOpen(false);
                          handleIngest("csv");
                        }}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Import Reviews
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>
            </Tabs>

            {/* Sample Data CTA */}
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Just want to explore?
              </p>
              <Button
                variant="outline"
                onClick={() => handleIngest("sample")}
                disabled={loading}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold btn-press"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Load 30 Sample Reviews
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: "200ms" }}>
          {[
            {
              icon: BarChart3,
              title: "Visual Dashboard",
              desc: "Rating distributions, sentiment breakdowns, and top keywords at a glance.",
              accent: "bg-amber-50 text-amber-600 border-amber-100",
            },
            {
              icon: MessageSquare,
              title: "AI-Powered Q&A",
              desc: "Ask natural language questions and get cited, analytical answers.",
              accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
            },
            {
              icon: Shield,
              title: "Scope Guard",
              desc: "AI stays on your data — no hallucinations, no off-topic leakage.",
              accent: "bg-rose-50 text-rose-600 border-rose-100",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl border border-border/60 bg-card card-lift hover:shadow-lg hover:shadow-foreground/[0.03]"
            >
              <div
                className={`inline-flex items-center justify-center h-11 w-11 rounded-xl border ${feature.accent} mb-4`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5 text-[15px]">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
    </div>
  );
}
