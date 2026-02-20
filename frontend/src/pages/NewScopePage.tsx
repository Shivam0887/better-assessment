import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateScope } from "@/api/client";
import type { BudgetRange, TimelinePressure } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, DollarSign, Clock, Sparkles } from "lucide-react";

const scopeSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  idea_text: z.string().min(1, "Describe your product idea"),
  target_audience: z.string().optional(),
  budget_range: z.enum(["low", "medium", "high"]).optional(),
  timeline_pressure: z
    .enum(["asap", "1_3_months", "3_6_months", "flexible"])
    .optional(),
});

type ScopeFormData = z.infer<typeof scopeSchema>;

const LOADING_MESSAGES = [
  "Analyzing your idea…",
  "Breaking into epics…",
  "Generating user stories…",
  "Estimating timeline…",
  "Identifying risks…",
  "Almost there…",
];

const BUDGET_OPTIONS: { label: string; value: BudgetRange }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const TIMELINE_OPTIONS: { label: string; value: TimelinePressure }[] = [
  { label: "ASAP", value: "asap" },
  { label: "1–3 Months", value: "1_3_months" },
  { label: "3–6 Months", value: "3_6_months" },
  { label: "Flexible", value: "flexible" },
];

export function NewScopePage() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScopeFormData>({
    resolver: zodResolver(scopeSchema),
    defaultValues: {
      product_name: "",
      idea_text: "",
      target_audience: "",
    },
  });

  const ideaText = watch("idea_text");
  const budgetRange = watch("budget_range");
  const timelinePressure = watch("timeline_pressure");

  const onSubmit = useCallback(
    async (data: ScopeFormData) => {
      setIsGenerating(true);
      setError(null);
      setLoadingMsgIndex(0);

      // Rotate loading messages every 2s
      const interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);

      try {
        const scope = await generateScope({
          product_name: data.product_name,
          idea_text: data.idea_text,
          target_audience: data.target_audience,
          budget_range: data.budget_range,
          timeline_pressure: data.timeline_pressure,
        });
        clearInterval(interval);
        navigate(`/scopes/${scope.id}`);
      } catch (err) {
        clearInterval(interval);
        setIsGenerating(false);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate scope. Please try again.",
        );
      }
    },
    [navigate],
  );

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-border rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-heading font-semibold text-text mb-2 animate-pulse-slow">
          {LOADING_MESSAGES[loadingMsgIndex]}
        </p>
        <p className="text-sm text-text-tertiary">
          This usually takes 10–20 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">New Scope</h1>
        <p className="text-sm text-text-secondary mt-1">
          Describe your product idea and let AI do the rest
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-risk-high/5 border border-risk-high/20 rounded-lg text-sm text-risk-high flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — main inputs (3/5 width) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Product Name
              </label>
              <Input
                {...register("product_name")}
                type="text"
                placeholder="e.g., PetBnB"
                className="bg-surface border-border focus-visible:ring-primary/30"
              />
              {errors.product_name && (
                <p className="mt-1 text-xs text-risk-high">
                  {errors.product_name.message}
                </p>
              )}
            </div>

            {/* Idea Text */}
            <div>
              <label className="text-sm font-medium text-text mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Your Product Idea
              </label>
              <Textarea
                {...register("idea_text")}
                rows={6}
                placeholder="Describe your product idea in detail. For example: 'An Airbnb for dog sitters with real-time chat, payment processing, background checks, and review system…'"
                className="bg-surface border-border focus-visible:ring-primary/30 resize-y min-h-[150px]"
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.idea_text ? (
                  <p className="text-xs text-risk-high">
                    {errors.idea_text.message}
                  </p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs font-medium ${(ideaText?.length ?? 0) < 100 ? "text-risk-medium" : "text-status-completed"}`}
                >
                  {ideaText?.length ?? 0} characters
                  {(ideaText?.length ?? 0) < 100 && " (aim for 100+)"}
                </span>
              </div>
            </div>
          </div>

          {/* Right column — optional context (2/5 width) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="bg-surface-dim border-border border-dashed">
              <CardContent className="p-5 space-y-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Optional Context
                </p>

                {/* Target Audience */}
                <div>
                  <label className="text-sm font-medium text-text mb-1.5 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-text-tertiary" />
                    Target Audience
                  </label>
                  <Input
                    {...register("target_audience")}
                    type="text"
                    placeholder="e.g., Pet owners aged 25-45"
                    className="bg-surface border-border focus-visible:ring-primary/30"
                  />
                </div>

                {/* Budget Range */}
                <div>
                  <label className="text-sm font-medium text-text mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-text-tertiary" />
                    Budget Range
                  </label>
                  <div className="flex gap-2">
                    {BUDGET_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setValue(
                            "budget_range",
                            budgetRange === opt.value ? undefined : opt.value,
                          )
                        }
                        className={`flex-1 ${
                          budgetRange === opt.value
                            ? "bg-primary/10 border-primary text-primary hover:bg-primary/15"
                            : "bg-surface border-border text-text-secondary hover:border-border-strong"
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Timeline Pressure */}
                <div>
                  <label className="text-sm font-medium text-text mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-text-tertiary" />
                    Timeline Pressure
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setValue(
                            "timeline_pressure",
                            timelinePressure === opt.value
                              ? undefined
                              : opt.value,
                          )
                        }
                        className={`${
                          timelinePressure === opt.value
                            ? "bg-primary/10 border-primary text-primary hover:bg-primary/15"
                            : "bg-surface border-border text-text-secondary hover:border-border-strong"
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8">
          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2 highlight-btn h-12"
          >
            <Zap className="w-5 h-5 fill-current" />
            Generate Scope
          </Button>
        </div>
      </form>
    </div>
  );
}
