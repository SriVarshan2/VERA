"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HelpCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Trophy, 
  Award, 
  AlertTriangle, 
  Calculator, 
  Layers, 
  FileText,
  Activity,
  CheckCircle2
} from "lucide-react";

export default function ExplainRankPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExplainData();
  }, [params.id]);

  const fetchExplainData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${params.id}/explain`);
      if (!res.ok) throw new Error("Failed to load rank explanation");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-xs text-slate-400">
        Reconstructing rank proof from append-only ScoreEvent audit stream...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-xs text-rose-400">
        {error || "Submission data not found."}
      </div>
    );
  }

  const { submission, rank, totalSubmissions, rubricCriteria, normalizationLog, judgeFlagsExplanations } = data;
  const judgesList = normalizationLog?.judges || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Gallery
        </Link>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Verified Event Log
        </span>
      </div>

      {/* Main Submission Rank Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              {submission.track}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Team: {submission.teamName}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {submission.name}
          </h1>
          <p className="text-xs text-slate-400">{submission.tagline}</p>
        </div>

        {/* Rank Badge */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Event Position
            </span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              #{rank ?? "N/A"}
            </span>
            <span className="text-[10px] text-slate-500 block">of {totalSubmissions} projects</span>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Calibrated Score
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {normalizationLog ? normalizationLog.finalScore.toFixed(2) : "0.00"}
            </span>
            <span className="text-[10px] text-slate-500 block">out of 100</span>
          </div>
        </div>
      </div>

      {/* Mathematical Proof & Normalization Formula Box */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-indigo-500/30 space-y-4 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Mathematical Normalization Calculation
          </h2>
          <span className="text-[11px] font-mono text-indigo-300">
            Source: ScoreEvent Log
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-indigo-200 space-y-2">
          <div className="text-slate-400 text-[11px]">CALIBRATED FORMULA:</div>
          <div className="text-sm font-bold text-cyan-300">
            FinalScore = &Sigma; ( RawScore_j &times; ConfidenceWeight_j ) / &Sigma; ( ConfidenceWeight_j )
          </div>
          {normalizationLog && (
            <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800">
              Calculation = (
              {judgesList.map((j: any, idx: number) => (
                <span key={j.judgeId}>
                  {idx > 0 ? " + " : ""}
                  <span className="text-white font-bold">{j.rawScore}</span> &times;{" "}
                  <span className="text-cyan-400">{j.confidenceWeight}x</span>
                </span>
              ))}
              ) / (
              {judgesList.map((j: any, idx: number) => (
                <span key={j.judgeId}>
                  {idx > 0 ? " + " : ""}{j.confidenceWeight}
                </span>
              ))}
              ) = <strong className="text-emerald-400 text-sm font-bold">{normalizationLog.finalScore}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Per-Judge Score & Calibration Breakdown */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Judge Evaluation & Calibration Diagnostics
        </h2>

        {judgesList.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-400">
            No judge evaluations recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {judgesList.map((j: any) => {
              const flags = j.flags || [];
              const judgeFlagDetails = judgeFlagsExplanations[j.judgeId] || [];

              return (
                <div
                  key={j.judgeId}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-white">
                        {j.judgeName}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Score Variance StdDev: <strong className="text-cyan-300">{j.stdDev}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Raw Score
                        </span>
                        <span className="text-lg font-bold font-mono text-white">
                          {j.rawScore} / 100
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Applied Weight
                        </span>
                        <span className={`text-lg font-bold font-mono ${j.confidenceWeight < 1.0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {j.confidenceWeight}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flag Explanations */}
                  {flags.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Confidence Weight Reduced Due To Calibration Flags:
                      </div>
                      {judgeFlagDetails.map((fd: any, i: number) => (
                        <p key={i} className="text-[11px] text-amber-200/90 pl-5">
                          • {fd.payload?.message || `${fd.type} triggered.`}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Criteria Breakdown Table */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2">
                      Criterion Ratings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {j.criteriaScores.map((cs: any) => (
                        <div
                          key={cs.criterionId}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">{cs.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Weight: {cs.weight}%</span>
                          </div>
                          <div className="font-mono font-bold text-amber-400 text-sm">
                            {cs.value} / {cs.maxScore}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
