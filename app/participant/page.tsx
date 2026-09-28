"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  PlusCircle, 
  Users, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Github, 
  ExternalLink,
  Edit3
} from "lucide-react";

export default function ParticipantDashboard() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [myTeam, setMyTeam] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [teamNameInput, setTeamNameInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  
  // Submission form state
  const [projName, setProjName] = useState("");
  const [projTagline, setProjTagline] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projRepo, setProjRepo] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projTrack, setProjTrack] = useState("");
  const [projTags, setProjTags] = useState("Next.js, TypeScript, SQLite");
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadParticipantStatus();
    }
  }, [selectedEventId, session]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantStatus = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      // Find event details
      const evtRes = await fetch(`/api/events/${selectedEventId}`);
      if (evtRes.ok) {
        const evtData = await evtRes.json();
        
        // Find team user belongs to
        const userTeam = evtData.teams?.find((t: any) =>
          t.members.some((m: any) => m.userId === session?.user?.id)
        );

        setMyTeam(userTeam || null);

        if (userTeam && userTeam.submission) {
          const subRes = await fetch(`/api/submissions/${userTeam.submission.id}`);
          if (subRes.ok) {
            const subData = await subRes.json();
            setSubmission(subData);
            // Populate edit fields
            setProjName(subData.name || "");
            setProjTagline(subData.tagline || "");
            setProjDesc(subData.description || "");
            setProjRepo(subData.repoUrl || "");
            setProjDemo(subData.demoUrl || "");
            setProjTrack(subData.track || "");
            setProjTags(Array.isArray(subData.techTags) ? subData.techTags.join(", ") : "");
          }
        } else {
          setSubmission(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput) return;
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, name: teamNameInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");

      setMessage({ type: "success", text: `Team '${data.name}' created! Invite Code: ${data.inviteCode}` });
      setTeamNameInput("");
      loadParticipantStatus();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput) return;
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCodeInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join team");

      setMessage({ type: "success", text: data.message });
      setInviteCodeInput("");
      loadParticipantStatus();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam) return;
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    const techTagsArray = projTags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const isEditing = Boolean(submission);
      const url = isEditing ? `/api/submissions/${submission.id}` : "/api/submissions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: myTeam.id,
          eventId: selectedEventId,
          name: projName,
          tagline: projTagline,
          description: projDesc,
          repoUrl: projRepo,
          demoUrl: projDemo,
          track: projTrack || "General",
          techTags: techTagsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit project");

      setMessage({
        type: "success",
        text: isEditing ? "Submission updated successfully!" : "Project submitted successfully to VERA!",
      });
      loadParticipantStatus();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isPastDeadline = selectedEvent ? new Date() > new Date(selectedEvent.endDate) : false;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-emerald-400" />
            Participant Workstation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your hackathon team and submit/edit your project before the deadline.
          </p>
        </div>

        {events.length > 0 && (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
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

      {/* Deadline Warning Banner */}
      {selectedEvent && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
          isPastDeadline 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-200" 
            : "bg-amber-500/10 border-amber-500/30 text-amber-200"
        }`}>
          <div className="flex items-center gap-2">
            {isPastDeadline ? <Lock className="w-4 h-4 text-rose-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
            <span>
              {isPastDeadline
                ? "Submission deadline passed. Server-side writes are strictly locked."
                : `Deadline: ${new Date(selectedEvent.endDate).toLocaleString()} (Server-side enforced rejection after deadline)`}
            </span>
          </div>
        </div>
      )}

      {/* Step 1: Team Setup if user doesn't have a team */}
      {!myTeam ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Create a New Team
            </h2>
            <p className="text-xs text-slate-400">
              Form a new team and get an invite code for your teammates to join.
            </p>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Team Name (e.g. NeuralCraft)"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
              >
                Create Team
              </button>
            </form>
          </div>

          {/* Join Team Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Join Existing Team
            </h2>
            <p className="text-xs text-slate-400">
              Enter a 6-character team invite code provided by your team leader.
            </p>
            <form onSubmit={handleJoinTeam} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Invite Code (e.g. NC2026)"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono tracking-wider"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20"
              >
                Join Team
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Step 2: Submission Form & Team Badge */
        <div className="space-y-6">
          {/* Team Info Badge */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Your Team
              </span>
              <h3 className="font-display text-lg font-bold text-white">{myTeam.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Members: {myTeam.members.map((m: any) => m.user.name).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Invite Code
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300 px-3 py-1 rounded bg-slate-900 border border-slate-800 inline-block mt-0.5">
                {myTeam.inviteCode}
              </span>
            </div>
          </div>

          {/* Project Submission Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  {submission ? "Edit Project Submission" : "Submit Your Hackathon Project"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {submission
                    ? "Update details until deadline. Server verifies write validity on every request."
                    : "Fill in project details below to enter the evaluation pool."}
                </p>
              </div>

              {submission && (
                <Link
                  href={`/submissions/${submission.id}/explain`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                >
                  View Calibration Logs
                </Link>
              )}
            </div>

            <form onSubmit={handleSubmitProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPastDeadline}
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="e.g. Aether Engine"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Track *
                  </label>
                  <select
                    value={projTrack}
                    disabled={isPastDeadline}
                    onChange={(e) => setProjTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select Track</option>
                    {selectedEvent?.tracks?.map((t: string) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tagline * (Short 1-sentence summary)
                </label>
                <input
                  type="text"
                  required
                  disabled={isPastDeadline}
                  value={projTagline}
                  onChange={(e) => setProjTagline(e.target.value)}
                  placeholder="e.g. Ultra-low latency local AI inference in WebAssembly"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Project Description *
                </label>
                <textarea
                  rows={4}
                  required
                  disabled={isPastDeadline}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Describe your architecture, technical innovations, and zero-knowledge proof calculations..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    disabled={isPastDeadline}
                    value={projRepo}
                    onChange={(e) => setProjRepo(e.target.value)}
                    placeholder="https://github.com/myteam/project"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Demo URL
                  </label>
                  <input
                    type="url"
                    disabled={isPastDeadline}
                    value={projDemo}
                    onChange={(e) => setProjDemo(e.target.value)}
                    placeholder="https://demo.local"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tech Stack Tags (Comma separated)
                </label>
                <input
                  type="text"
                  disabled={isPastDeadline}
                  value={projTags}
                  onChange={(e) => setProjTags(e.target.value)}
                  placeholder="Next.js, TypeScript, Rust, SQLite"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isPastDeadline}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submission ? "Save Changes" : "Submit Project to VERA"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
