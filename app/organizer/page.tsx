"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Award, 
  Download, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  HelpCircle,
  FileText,
  Activity,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [processing, setProcessing] = useState(false);
  const [showRawScores, setShowRawScores] = useState(false);
  const [resultsRevealed, setResultsRevealed] = useState(false);

  // New Event Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDays, setNewEventDays] = useState(7);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const cur = events.find((e) => e.id === selectedEventId);
      if (cur) setResultsRevealed(Boolean(cur.resultsRevealed));
    }
  }, [selectedEventId, events]);

  useEffect(() => {
    if (selectedEventId) {
      fetchCalibrationDashboard();
    }
  }, [selectedEventId]);

  const handleToggleRevealResults = async () => {
    if (!selectedEventId) return;
    setProcessing(true);
    setActionMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/organizer/reveal-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reveal action failed");

      setResultsRevealed(data.resultsRevealed);
      setActionMessage({ type: "success", text: data.message });
      fetchEvents();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalibrationDashboard = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/calibration?eventId=${selectedEventId}`);
      if (res.ok) {
        const data = await res.json();
        setCalibrationData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRoundRobin = async () => {
    if (!selectedEventId) return;
    setProcessing(true);
    setActionMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/organizer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, type: "round-robin" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");

      setActionMessage({ type: "success", text: data.message });
      fetchCalibrationDashboard();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleRecalibrateEvent = async () => {
    if (!selectedEventId) return;
    setProcessing(true);
    setActionMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/organizer/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calibration failed");

      setActionMessage({ type: "success", text: data.message });
      fetchCalibrationDashboard();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(newEventDays));

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName,
          description: newEventDesc,
          startDate,
          endDate,
          tracks: ["AI & Machine Learning", "Developer Tools", "Systems", "Social Impact"],
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");
      setShowEventModal(false);
      fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = (type: "submissions" | "scores" | "rankings") => {
    if (!selectedEventId) return;
    window.open(`/api/organizer/export?eventId=${selectedEventId}&type=${type}`, "_blank");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 md:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium mb-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            Organizer Control Center
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Live Calibration & Judging Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch assign judges, monitor variance & fatigue flags, and export calibrated rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowEventModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {actionMessage.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunRoundRobin}
            disabled={processing}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            1-Click Round-Robin Assign
          </button>

          <button
            onClick={handleRecalibrateEvent}
            disabled={processing}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${processing ? "animate-spin" : ""}`} />
            Recalibrate All Submissions
          </button>

          <button
            onClick={handleToggleRevealResults}
            disabled={processing}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border disabled:opacity-50 ${
              resultsRevealed
                ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
                : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40"
            }`}
          >
            {resultsRevealed ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Public Results: REVEALED (Click to Hide)
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                Public Results: HIDDEN (Click to Reveal)
              </>
            )}
          </button>

          <Link
            href="/organizer/audit"
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            View Append-Only Audit Stream
          </Link>
        </div>

        {/* CSV Exports */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400">CSV Export:</span>
          <button
            onClick={() => handleExportCSV("rankings")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            Rankings
          </button>
          <button
            onClick={() => handleExportCSV("scores")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            Scores
          </button>
          <button
            onClick={() => handleExportCSV("submissions")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            Submissions
          </button>
        </div>
      </div>

      {/* 1. Judge Consistency & Progress Dashboard */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Judge Consistency & Batch Progress Monitor
          </h2>
          <span className="text-xs text-slate-400">
            Real-time variance check (stddev &lt; 0.3) & batch completion tracking
          </span>
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-slate-900/50 animate-pulse" />
        ) : !calibrationData || calibrationData.judgeStats.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No judges configured for this event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Judge Name</th>
                  <th className="p-3">Batch Progress</th>
                  <th className="p-3">StdDev (Variance)</th>
                  <th className="p-3">Confidence Weight</th>
                  <th className="p-3">Consistency Status & Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {calibrationData.judgeStats.map((item: any) => {
                  const cal = item.calibration;
                  const flags = cal?.flags || [];

                  return (
                    <tr key={item.judge.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-sans font-semibold text-white">
                        {item.judge.name}
                        <span className="block text-[10px] text-slate-500 font-normal">{item.judge.email}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isBatchComplete
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}>
                          {item.batchStatus}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-300 font-bold">
                        {cal?.stdDev ?? "0.00"}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${cal?.confidenceWeight < 1.0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {cal?.confidenceWeight ?? 1.0}x
                        </span>
                      </td>
                      <td className="p-3 font-sans">
                        {flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {flags.map((f: string) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            Normal / Consistent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Submissions Calibrated Rankings Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {showRawScores ? "Raw (Unweighted) Rankings" : "Calibrated Rankings & Normalization Output"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {showRawScores
                ? "Simple unweighted judge score averages (ignores judge fatigue & variance bias)"
                : "Weighted judge scores scaled by confidence weights (dampens noise & fatigue)"}
            </p>
          </div>

          {/* Live Toggle: Raw vs Normalized */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setShowRawScores(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                !showRawScores
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Normalized (Calibrated)
            </button>
            <button
              onClick={() => setShowRawScores(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                showRawScores
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              Raw (Unweighted)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-slate-900/50 animate-pulse" />
        ) : !calibrationData || calibrationData.rankings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No submissions configured for this event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">{showRawScores ? "Raw Rank" : "Calibrated Rank"}</th>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Track</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">{showRawScores ? "Raw Average Score" : "Calibrated Final Score"}</th>
                  <th className="p-3 text-right">Verification & Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {([...calibrationData.rankings]
                  .sort((a, b) => {
                    if (!a.isRanked) return 1;
                    if (!b.isRanked) return -1;
                    if (showRawScores) return (a.rawRank ?? 99) - (b.rawRank ?? 99);
                    return (a.calibratedRank ?? a.rank ?? 99) - (b.calibratedRank ?? b.rank ?? 99);
                  }))
                  .map((item: any) => {
                    const activeRank = showRawScores ? item.rawRank : (item.calibratedRank ?? item.rank);
                    const activeScore = showRawScores ? item.rawAverageScore : item.finalScore;
                    const rankChanged = item.isRanked && item.rawRank && item.calibratedRank && item.rawRank !== item.calibratedRank;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          {item.isRanked ? (
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                activeRank === 1
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : activeRank === 2
                                  ? "bg-slate-400/20 text-slate-200 border border-slate-400/40"
                                  : activeRank === 3
                                  ? "bg-amber-700/20 text-amber-400 border border-amber-700/40"
                                  : "bg-slate-900 text-slate-400"
                              }`}>
                                #{activeRank}
                              </span>
                              {rankChanged && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border ${
                                  !showRawScores && item.calibratedRank < item.rawRank
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                }`}>
                                  {showRawScores
                                    ? `Calibrated: #${item.calibratedRank}`
                                    : `Raw #${item.rawRank} ➔ #${item.calibratedRank}`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-normal">Unranked</span>
                          )}
                        </td>
                        <td className="p-3 font-sans font-bold text-white">
                          {item.name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-sans text-[11px]">
                            {item.track}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-sans">
                          {item.teamName}
                        </td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.isBatchComplete
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}>
                            {item.judgingStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.isRanked && activeScore != null ? (
                            <span className={`font-bold text-sm ${showRawScores ? "text-amber-300" : "text-emerald-400"}`}>
                              {activeScore.toFixed(2)} / 100
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Unrated</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {item.hasScores && (
                            <Link
                              href={`/submissions/${item.id}/explain`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              Explain Rank
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Create New Hackathon Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. VERA Autumn Hackathon 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Event description and goals..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newEventDays}
                  onChange={(e) => setNewEventDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
