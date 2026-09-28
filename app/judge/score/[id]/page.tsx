"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Award, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Github, 
  ExternalLink, 
  ShieldAlert,
  Zap,
  Activity
} from "lucide-react";

export default function ScoringFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [submission, setSubmission] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [scoresMap, setScoresMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [calibrationResult, setCalibrationResult] = useState<any>(null);

  useEffect(() => {
    fetchSubmissionData();
  }, [params.id]);

  const fetchSubmissionData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${params.id}`);
      if (!res.ok) throw new Error("Submission not found");
      const data = await res.json();
      setSubmission(data);
      const eventCriteria = data.event?.rubricCriteria || [];
      setCriteria(eventCriteria);

      // Fetch existing scores for this judge
      const scoresRes = await fetch(`/api/judge/scores?submissionId=${params.id}`);
      if (scoresRes.ok) {
        const existingScores = await scoresRes.json();
        const initialMap: Record<string, number> = {};
        for (const c of eventCriteria) {
          initialMap[c.id] = 3.0; // Default middle value 3.0
        }
        for (const s of existingScores) {
          initialMap[s.criterionId] = s.value;
        }
        setScoresMap(initialMap);
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionId: string, val: number) => {
    setScoresMap((prev) => ({ ...prev, [criterionId]: val }));
  };

  const handleSubmitScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    const payloadScores = Object.keys(scoresMap).map((criterionId) => ({
      criterionId,
      value: scoresMap[criterionId],
    }));

    try {
      const res = await fetch("/api/judge/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: params.id,
          scores: payloadScores,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save scores");

      setMessage({
        type: "success",
        text: "Scores saved! Append-only ScoreEvent recorded and Calibration Engine executed.",
      });
      setCalibrationResult(data.calibration);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-slate-400">
        Loading evaluation criteria...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-rose-400">
        Submission not found or access restricted.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/judge"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Submissions
        </Link>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          Judge: {session?.user?.name}
        </span>
      </div>

      {/* Submission Overview Box */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
            {submission.track}
          </span>
          <div className="flex items-center gap-2">
            {submission.repoUrl && (
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                Repo
              </a>
            )}
            {submission.demoUrl && (
              <a
                href={submission.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Demo
              </a>
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-white">
          {submission.name}
        </h1>
        <p className="text-xs text-slate-300 font-medium">{submission.tagline}</p>
        <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
          {submission.description}
        </p>

        {submission.techTags && submission.techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {submission.techTags.map((tag: string) => (
              <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Live Calibration Result Banner */}
      {calibrationResult && (
        <div className="p-5 rounded-2xl glass-panel border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              Calibration Engine Status Output
            </span>
            <span className="font-mono text-slate-400">
              StdDev: <strong className="text-white">{calibrationResult.stdDev}</strong>
            </span>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-3">
            <span>
              Applied Confidence Weight: <strong className="text-cyan-400 font-mono text-sm">{calibrationResult.confidenceWeight}x</strong>
            </span>
            {calibrationResult.flags.length > 0 ? (
              <div className="flex gap-1.5">
                {calibrationResult.flags.map((f: string) => (
                  <span key={f} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    FLAG: {f}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-emerald-400 font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                High Variance / Consistent
              </span>
            )}
          </div>
        </div>
      )}

      {/* Scoring Form */}
      <form onSubmit={handleSubmitScores} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-8">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Weighted Rubric Evaluation (1-5 Scale)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rate the submission for each criterion below. Each rating is weighted according to the event rubric.
          </p>
        </div>

        <div className="space-y-6">
          {criteria.map((c) => {
            const currentValue = scoresMap[c.id] || 3.0;

            return (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{c.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Weight: <strong className="text-indigo-300">{c.weight}%</strong> | Max Score: {c.maxScore}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {currentValue.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono"> / 5.0</span>
                  </div>
                </div>

                {/* Score Slider & Radio Pills */}
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={currentValue}
                    onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex items-center justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleScoreChange(c.id, val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          currentValue === val
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Link
            href="/judge"
            className="text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving Scores..." : "Submit Evaluation Scores"}
          </button>
        </div>
      </form>
    </div>
  );
}
