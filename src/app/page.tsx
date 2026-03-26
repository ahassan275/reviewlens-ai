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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              ReviewLens AI
            </h1>
          </div>
          <p className="text-sm text-slate-500 hidden sm:block">
            Review Intelligence Portal
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Analyze Reviews with AI
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Ingest customer reviews from Trustpilot or upload a CSV, then
            ask questions about sentiment, trends, and pain points using our
            guardrailed Q&A interface.
          </p>
        </div>

        {/* Ingestion Card */}
        <Card className="max-w-2xl mx-auto mb-12">
          <CardHeader>
            <CardTitle>Import Reviews</CardTitle>
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
                  <label className="text-sm font-medium text-slate-700">
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
                    />
                    <Button
                      onClick={() => handleIngest("url")}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Paste a Trustpilot business page URL to scrape reviews
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="csv" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">
                          Drop a CSV file or click to browse
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
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
                      <span className="bg-card px-2 text-slate-500">or</span>
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
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-slate-500 mb-3">
                Just want to try it out?
              </p>
              <Button
                variant="outline"
                onClick={() => handleIngest("sample")}
                disabled={loading}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Load Sample Reviews (30 reviews)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <BarChart3 className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">
                Visual Dashboard
              </h3>
              <p className="text-sm text-slate-600">
                See rating distributions, sentiment breakdowns, and top
                keywords at a glance.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <MessageSquare className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">
                AI-Powered Q&A
              </h3>
              <p className="text-sm text-slate-600">
                Ask natural language questions about your reviews and get
                cited, analytical answers.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">
                Scope Guard
              </h3>
              <p className="text-sm text-slate-600">
                AI stays focused on your data — no hallucinations, no
                off-topic responses, no competitor data leakage.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
