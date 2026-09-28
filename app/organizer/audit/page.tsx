"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Zap,
  Activity
} from "lucide-react";

export default function AuditLogPage() {
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAuditLog();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEventsList(data);
        if (data.length > 0) setSelectedEventId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLog = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/audit-log`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((e) => {
    if (filterType === "all") return true;
    return e.type === filterType;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "SCORE_SUBMITTED":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "SCORE_UPDATED":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "NORMALIZATION_APPLIED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "JUDGE_FLAGGED_LOW_VARIANCE":
      case "JUDGE_FLAGGED_FATIGUE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 md:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Append-Only Audit Stream
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Verifiable Event Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every score submission, revision, low-variance flag, and normalization calculation is immutably logged.
          </p>
        </div>

        {eventsList.length > 0 && (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {eventsList.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "All Events", value: "all" },
            { label: "Score Submitted", value: "SCORE_SUBMITTED" },
            { label: "Score Updated", value: "SCORE_UPDATED" },
            { label: "Normalization", value: "NORMALIZATION_APPLIED" },
            { label: "Low Variance Flag", value: "JUDGE_FLAGGED_LOW_VARIANCE" },
            { label: "Fatigue Flag", value: "JUDGE_FLAGGED_FATIGUE" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterType(item.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === item.value
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing <strong className="text-white">{filtered.length}</strong> events
        </span>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl glass-panel animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-2xl text-xs text-slate-400">
          No audit log entries matching filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}

                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase border ${getBadgeStyle(item.type)}`}>
                      {item.type}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {item.submission?.name || item.judge?.name || "System Event"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pl-7 sm:pl-0">
                    {item.judge && <span>Judge: {item.judge.name}</span>}
                    <span className="text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Raw Event Payload (JSON):
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
