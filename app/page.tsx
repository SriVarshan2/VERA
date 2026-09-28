"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Search, 
  Trophy, 
  ExternalLink, 
  Github, 
  HelpCircle, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Layers,
  ThumbsUp,
  Eye,
  EyeOff,
  Scale,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  FileCode,
  FileCheck
} from "lucide-react";

interface Submission {
  id: string;
  name: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl: string;
  imageUrls: string[];
  techTags: string[];
  track: string;
  createdAt: string;
  publicVoteCount?: number;
  hasVoted?: boolean;
  resultsRevealed?: boolean;
  team: {
    name: string;
    members: { user: { name: string } }[];
  };
  event: {
    id: string;
    name: string;
    endDate: string;
    resultsRevealed?: boolean;
  };
}

export default function PublicGallery() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [tracksList, setTracksList] = useState<string[]>([]);
  const [eventDetails, setEventDetails] = useState<any>(null);

  // Single deliberate motion: Hero score counter animation
  const [animatedScore, setAnimatedScore] = useState(0.0);

  useEffect(() => {
    fetchSubmissions();
    fetchEventInfo();
  }, [selectedTrack]);

  // Single deliberate animation on page load for the hero rank proof score
  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedScore(77.15);
      return;
    }

    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const current = progress * (2 - progress) * 77.15;
      setAnimatedScore(Number(current.toFixed(2)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const fetchEventInfo = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const events = await res.json();
        if (events.length > 0) {
          setEventDetails(events[0]);
          setTracksList(events[0].tracks || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let url = "/api/submissions";
      const params = new URLSearchParams();
      if (selectedTrack !== "all") params.append("track", selectedTrack);
      if (searchQuery) params.append("search", searchQuery);
      
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (subId: string) => {
    try {
      const res = await fetch("/api/public/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: subId }),
      });

      const data = await res.json();
      if (res.ok || res.status === 409) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === subId
              ? {
                  ...s,
                  hasVoted: true,
                  publicVoteCount: data.voteCount ?? ((s.publicVoteCount || 0) + 1),
                }
              : s
          )
        );
      }
    } catch (e) {
      console.error("Voting error:", e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const isPastDeadline = eventDetails ? new Date() > new Date(eventDetails.endDate) : false;
  const isResultsRevealed = Boolean(eventDetails?.resultsRevealed);

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO SECTION: LEDGER PROOF FOCUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#111827] border border-[#1f293d] rounded-2xl p-6 sm:p-10 shadow-2xl">
        
        {/* Left Column: Platform Thesis & Real Context */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stamp Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0b1320] border border-[#0d9488]/40 text-[#2dd4bf] font-mono text-xs font-semibold">
            <FileCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>[ SYSTEM LEDGER :: EVENT_01 :: VERIFIED ]</span>
          </div>

          <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight leading-snug">
            Every rank provable. Every evaluation calibrated.
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            VERA is an event-sourced hackathon judging and verification system. It automatically detects flat scoring bias, down-weights judge fatigue, and logs every evaluation to an append-only ledger.
          </p>

          {/* Real Metrics Index Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#0b0f17] p-3 rounded-xl border border-[#1f293d]">
              <span className="block text-[11px] text-slate-400 font-mono uppercase">Projects</span>
              <span className="text-xl font-bold font-mono text-slate-100">40</span>
            </div>
            <div className="bg-[#0b0f17] p-3 rounded-xl border border-[#1f293d]">
              <span className="block text-[11px] text-slate-400 font-mono uppercase">Judges</span>
              <span className="text-xl font-bold font-mono text-slate-100">30</span>
            </div>
            <div className="bg-[#0b0f17] p-3 rounded-xl border border-[#1f293d]">
              <span className="block text-[11px] text-slate-400 font-mono uppercase">Tracks</span>
              <span className="text-xl font-bold font-mono text-slate-100">8</span>
            </div>
          </div>

          {/* Quick Demo Accounts Index */}
          <div className="pt-2 border-t border-[#1f293d]/80 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Audit Quick Switcher (Password: password123)
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-[#1f293d] text-slate-300 border border-slate-700">
                Organizer: organizer@vera.eval
              </span>
              <span className="px-2.5 py-1 rounded bg-[#1f293d] text-slate-300 border border-slate-700">
                Judge: judge.sarah@vera.eval
              </span>
              <span className="px-2.5 py-1 rounded bg-[#1f293d] text-[#f59e0b] border border-[#d97706]/40">
                Bad Judge: judge.marcus@vera.eval
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Real "Explain This Rank" Proof Visual */}
        <div className="lg:col-span-5 bg-[#0b0f17] border border-[#1f293d] rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
            <span className="text-[#2dd4bf] font-bold flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              [ RANK PROOF BREAKDOWN ]
            </span>
            <span className="text-slate-400 text-[11px]">ID: PRJ_02</span>
          </div>

          {/* Project Title & Rank Score */}
          <div className="flex items-center justify-between bg-[#131b2a] p-3 rounded-lg border border-[#1f293d]">
            <div>
              <span className="text-slate-300 font-bold block text-sm">Aether Engine</span>
              <span className="text-[11px] text-slate-400">Track: AI & Machine Learning</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#2dd4bf] font-mono">
                {animatedScore.toFixed(2)}%
              </div>
              <span className="text-[10px] text-slate-400 block font-bold">RANK #1</span>
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span>Simple Unweighted Raw Mean:</span>
              <span className="font-bold text-slate-200">77.45%</span>
            </div>

            <div className="bg-[#131b2a] p-2.5 rounded border border-[#1f293d] space-y-1.5">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Judge Weight Breakdown:</span>
              
              <div className="flex justify-between text-slate-300">
                <span>• Dr. Sarah Chen (Expert)</span>
                <span className="text-[#2dd4bf]">1.00x weight (74.5%)</span>
              </div>
              
              <div className="flex justify-between text-[#f59e0b]">
                <span>• Marcus Vance (Low Variance)</span>
                <span>0.56x weight [FLAGGED]</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>• Elena Rostova (Fatigued)</span>
                <span>0.80x weight [FLAGGED]</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#0d9488]/10 border border-[#0d9488]/30 text-[#2dd4bf] text-[10px] leading-relaxed">
              ✓ <strong>Verifiable Outcome:</strong> Marcus Vance&apos;s flat 80% score was down-weighted to 0.56x. Discriminative evaluations carried higher weight, validating Rank #1.
            </div>
          </div>
        </div>

      </div>

      {/* 2. EVENT & PUBLIC VOTE REVEAL STATUS BANNERS */}
      {eventDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Deadline Lock Banner */}
          <div className="bg-[#131b2a] border border-[#1f293d] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPastDeadline ? (
                <Lock className="w-4 h-4 text-rose-400" />
              ) : (
                <Unlock className="w-4 h-4 text-[#2dd4bf]" />
              )}
              <div>
                <span className="text-slate-200 font-bold block">{eventDetails.name}</span>
                <span className="text-slate-400 text-[11px]">
                  Deadline: {new Date(eventDetails.endDate).toLocaleString()}
                </span>
              </div>
            </div>
            {isPastDeadline ? (
              <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                [ DEADLINE LOCKED ]
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/40 text-[10px] font-bold">
                [ SUBMISSIONS ACTIVE ]
              </span>
            )}
          </div>

          {/* Results Reveal Banner */}
          <div className="bg-[#131b2a] border border-[#1f293d] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isResultsRevealed ? (
                <Eye className="w-4 h-4 text-[#2dd4bf]" />
              ) : (
                <EyeOff className="w-4 h-4 text-[#f59e0b]" />
              )}
              <div>
                <span className="text-slate-200 font-bold block">Public Voting & Leaderboard State</span>
                <span className="text-slate-400 text-[11px]">
                  {isResultsRevealed ? "Results revealed by organizer" : "Tallies hidden until organizer reveal"}
                </span>
              </div>
            </div>
            {isResultsRevealed ? (
              <span className="px-2.5 py-1 rounded bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/40 text-[10px] font-bold">
                [ RESULTS REVEALED ]
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 text-[10px] font-bold">
                [ REVEAL PENDING ]
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111827] p-4 rounded-xl border border-[#1f293d]">
        {/* Track Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          <button
            onClick={() => setSelectedTrack("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              selectedTrack === "all"
                ? "bg-[#0d9488] text-white border border-[#2dd4bf]"
                : "bg-[#0b0f17] text-slate-400 hover:text-slate-200 border border-[#1f293d]"
            }`}
          >
            [ ALL TRACKS ]
          </button>

          {tracksList.map((tr) => (
            <button
              key={tr}
              onClick={() => setSelectedTrack(tr)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                selectedTrack === tr
                  ? "bg-[#0d9488] text-white border border-[#2dd4bf]"
                  : "bg-[#0b0f17] text-slate-400 hover:text-slate-200 border border-[#1f293d]"
              }`}
            >
              [{tr.toUpperCase()}]
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 font-mono">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, tech tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0b0f17] border border-[#1f293d] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf]"
          />
        </form>
      </div>

      {/* 4. SUBMISSIONS EVIDENCE GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-[#111827] border border-[#1f293d] p-6 space-y-4 font-mono">
              <div className="h-4 bg-[#1f293d] rounded w-1/2" />
              <div className="h-6 bg-[#1f293d] rounded w-3/4" />
              <div className="h-16 bg-[#1f293d] rounded" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-[#111827] rounded-xl border border-[#1f293d] space-y-4 font-mono">
          <Layers className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">[ NO SUBMISSIONS MATCHING FILTER ]</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Adjust search criteria or register a project as a participant.
          </p>
          <Link
            href="/participant"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-[#14b8a6] transition-colors"
          >
            <span>Create Submission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 flex flex-col justify-between space-y-6 font-mono text-xs"
            >
              <div className="space-y-4">
                {/* Header Track & Team */}
                <div className="flex items-center justify-between border-b border-[#1f293d] pb-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[#0b0f17] text-[#2dd4bf] border border-[#0d9488]/40 font-bold">
                    {sub.track}
                  </span>
                  <span className="text-slate-400">
                    Team: {sub.team.name}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-tight">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sub.tagline}
                  </p>
                </div>

                {/* Tech Tags */}
                {sub.techTags && sub.techTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sub.techTags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0b0f17] text-slate-400 border border-[#1f293d]"
                      >
                        {tag}
                      </span>
                    ))}
                    {sub.techTags.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                        +{sub.techTags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-[#1f293d] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Public Vote Button */}
                  <button
                    onClick={() => handleVote(sub.id)}
                    disabled={sub.hasVoted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                      sub.hasVoted
                        ? "bg-[#0d9488]/20 text-[#2dd4bf] border-[#0d9488]/40 cursor-default"
                        : "bg-[#131b2a] hover:bg-[#1f293d] text-slate-200 border-[#1f293d]"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-[#2dd4bf]" />
                    {sub.hasVoted ? "Voted ✓" : "Public Vote"}
                    {isResultsRevealed && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-[#0b0f17] text-slate-300 text-[10px] font-bold border border-[#1f293d]">
                        {sub.publicVoteCount ?? 0}
                      </span>
                    )}
                  </button>

                  {/* Explain Rank Link */}
                  <Link
                    href={`/submissions/${sub.id}/explain`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2dd4bf] hover:underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    [ EXPLAIN RANK ]
                  </Link>
                </div>

                {/* Repo & Demo links */}
                <div className="flex items-center justify-end gap-2 text-slate-400 pt-1">
                  {sub.repoUrl && (
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#0b0f17] hover:text-slate-100 border border-[#1f293d]"
                      title="Repository"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {sub.demoUrl && (
                    <a
                      href={sub.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#0b0f17] hover:text-slate-100 border border-[#1f293d]"
                      title="Demo URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
