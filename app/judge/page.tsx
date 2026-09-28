"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  UserCheck, 
  CheckCircle, 
  Clock, 
  Award, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  Layers,
  Sparkles
} from "lucide-react";

export default function JudgeDashboard() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [session]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/judge/assignments");
      if (res.status === 403) {
        throw new Error("Role Isolation Guard: You can only access your own judge assignments.");
      }
      if (!res.ok) {
        throw new Error("Failed to fetch judge assignments");
      }
      const data = await res.json();
      setAssignments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const pendingCount = assignments.length - completedCount;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 md:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-medium mb-2">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Judge Station — {session?.user?.name || "Judge"}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Assigned Hackathon Submissions
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Strict Role Isolation Enforced: You can only view and score projects assigned to your account. 
            Scores trigger mathematical variance and fatigue calibration automatically.
          </p>
        </div>

        {/* Status Metrics Pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Pending</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{pendingCount}</span>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Scored</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{completedCount}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-panel animate-pulse p-6" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Assignments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You do not have any active submission assignments assigned to your account. 
            Organizers can dispatch assignments via the Organizer Hub.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const sub = assignment.submission;
            const isCompleted = assignment.status === "completed";
            const criteriaCount = sub?.event?.rubricCriteria?.length || 0;
            const scoresSubmitted = sub?.scores?.length || 0;

            return (
              <div
                key={assignment.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                      {sub.track}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Team {sub.team?.name}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {sub.tagline}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span>
                      Rubric Progress: <strong className="text-white font-mono">{scoresSubmitted} / {criteriaCount} criteria</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Scored
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Evaluation
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/judge/score/${sub.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-lg shadow-cyan-600/20"
                  >
                    {isCompleted ? "Edit Evaluation" : "Score Project"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
