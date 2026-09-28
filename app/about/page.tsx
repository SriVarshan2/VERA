"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Sliders, 
  Sparkles, 
  History, 
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Scale,
  Award,
  Zap,
  Layers,
  Search,
  Activity
} from "lucide-react";

export default function AboutPage() {
  // Active node index for animated pipeline diagram (cycles every 900ms)
  const [activeNode, setActiveNode] = useState(0);

  // Scroll reveal visibility states
  const [gridVisible, setGridVisible] = useState(false);
  const [demoVisible, setDemoVisible] = useState(false);
  const [rankVisible, setRankVisible] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLDivElement>(null);

  // Pipeline cycling logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 5);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // IntersectionObserver for scroll-reveals
  useEffect(() => {
    const options = { threshold: 0.2 };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === gridRef.current) setGridVisible(true);
          if (entry.target === demoRef.current) setDemoVisible(true);
          if (entry.target === rankRef.current) setRankVisible(true);
        }
      });
    }, options);

    if (gridRef.current) observer.observe(gridRef.current);
    if (demoRef.current) observer.observe(demoRef.current);
    if (rankRef.current) observer.observe(rankRef.current);

    return () => observer.disconnect();
  }, []);

  // Pipeline node definitions
  const pipelineNodes = [
    { label: "Submission", subtext: "Invite-based teams", icon: Layers, color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
    { label: "Judge Scores", subtext: "Role-isolated assignment", icon: Users, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
    { label: "Calibration", subtext: "Low-variance & fatigue", icon: Activity, color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
    { label: "Normalization", subtext: "Confidence weighting", icon: Scale, color: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10" },
    { label: "Final Rank", subtext: "Verifiable rank ledger", icon: Award, color: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  ];

  // Feature grid card data
  const featureCards = [
    {
      icon: ShieldCheck,
      title: "Role-isolated access",
      description: "Enforced server-side, not just hidden in UI — judges, participants, and organizers have strict API boundaries.",
      accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
    },
    {
      icon: Users,
      title: "Teams & submissions",
      description: "Invite-based teams with code sharing, supporting full metadata editing up until event deadline.",
      accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    },
    {
      icon: Sliders,
      title: "Weighted judging",
      description: "Configurable rubric criteria with weighted categories where judges see only their assigned reviews.",
      accent: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400",
    },
    {
      icon: Sparkles,
      title: "Calibration engine",
      description: "Flags judges who score too flatly or fade late in a session, automatically trusting them a little less.",
      accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    },
    {
      icon: History,
      title: "Event-sourced ledger",
      description: "Every score and adjustment is a permanent, appended record in the audit log that is never overwritten.",
      accent: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
    },
    {
      icon: Search,
      title: '"Explain This Rank"',
      description: "Click any project to see the full mathematical chain from raw judge evaluations to final calibrated position.",
      accent: "from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 py-12 px-4 sm:px-6 lg:px-8">
      {/* Inline styles for pulse animations & reduced motion support */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes linePulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-badge { animation: heroFadeUp 0.6s ease-out forwards; }
        .animate-hero-title { animation: heroFadeUp 0.6s ease-out 0.2s forwards; opacity: 0; }
        .animate-hero-sub { animation: heroFadeUp 0.6s ease-out 0.4s forwards; opacity: 0; }
        
        .animated-connecting-line {
          background: linear-gradient(90deg, rgba(51, 65, 85, 0.4) 0%, rgba(56, 189, 248, 0.8) 50%, rgba(51, 65, 85, 0.4) 100%);
          background-size: 200% 100%;
          animation: linePulse 2.5s infinite linear;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-hero-badge, .animate-hero-title, .animate-hero-sub {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .animated-connecting-line {
            animation: none !important;
            background: rgba(71, 85, 105, 0.5) !important;
          }
          .transition-all, .transition-all * {
            transition: none !important;
          }
        }
      ` }} />

      <div className="max-w-6xl mx-auto space-y-24">
        
        {/* 1. HERO SECTION */}
        <section className="text-center space-y-6 pt-8 pb-4 max-w-4xl mx-auto">
          {/* Pulsing Badge */}
          <div className="animate-hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>self-hosted · offline-first</span>
          </div>

          {/* Large Gradient Headline */}
          <h1 className="animate-hero-title font-display text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-indigo-400 bg-clip-text text-transparent pb-2">
            VERA
          </h1>

          {/* Subheading */}
          <p className="animate-hero-sub text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            <span className="text-white font-semibold">Verifiable Evaluation & Ranking Assistant</span> — a hackathon judging platform that shows its work.
          </p>
        </section>

        {/* 2. FEATURE GRID SECTION */}
        <section ref={gridRef} className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for Absolute Judging Fairness
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Every stage of the evaluation pipeline is designed to eliminate bias and isolate participant data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  style={{
                    transitionDelay: `${idx * 100}ms`,
                  }}
                  className={`glass-panel p-6 rounded-2xl border bg-gradient-to-br transition-all duration-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 ${
                    gridVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  } ${card.accent}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. PIPELINE DIAGRAM SECTION */}
        <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-8 shadow-xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Score Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">The VERA Evaluation Pipeline</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              How raw criteria evaluations flow through statistical calibration into final verifiable rankings.
            </p>
          </div>

          {/* Horizontally scrollable node flow */}
          <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="min-w-[720px] flex items-center justify-between px-4">
              {pipelineNodes.map((node, idx) => {
                const NodeIcon = node.icon;
                const isActive = activeNode === idx;
                const isLast = idx === pipelineNodes.length - 1;

                return (
                  <div key={idx} className="flex items-center flex-1">
                    {/* Node Circle */}
                    <div className="flex flex-col items-center text-center group relative">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-md ${
                          isActive
                            ? `${node.color} scale-110 shadow-lg shadow-cyan-500/20 ring-4 ring-cyan-500/20`
                            : "bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <NodeIcon className={`w-7 h-7 ${isActive ? "animate-pulse" : ""}`} />
                      </div>
                      <span className={`mt-3 font-bold text-sm transition-colors ${isActive ? "text-cyan-300" : "text-slate-300"}`}>
                        {node.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium max-w-[110px] leading-tight mt-0.5">
                        {node.subtext}
                      </span>
                    </div>

                    {/* Connecting Pulsing Line */}
                    {!isLast && (
                      <div className="flex-1 mx-3 h-1 rounded-full animated-connecting-line relative overflow-hidden" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. CALIBRATION DEMO SECTION */}
        <section ref={demoRef} className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Statistical Bias Detection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Judge Calibration in Action</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              VERA detects flat scoring and session fatigue, adjusting judge confidence weights to protect consensus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Normal Judge */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Dr. Sarah Chen</h3>
                  <span className="text-xs text-slate-400">Senior AI Researcher</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Normal
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Confidence Weight</span>
                  <span className="text-emerald-400 font-mono">1.00x (100%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: demoVisible ? "100%" : "0%",
                      transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Consistent score variance (σ = 0.65). Full 1.0x weight applied to all evaluations.
              </p>
            </div>

            {/* Card 2: Low Variance Judge */}
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Marcus Vance</h3>
                  <span className="text-xs text-slate-400">Systems Architect</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Variance
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Confidence Weight</span>
                  <span className="text-amber-400 font-mono">0.56x (56%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: demoVisible ? "56%" : "0%",
                      transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Flat scoring pattern detected (σ = 0.00 &lt; 0.30). Down-weighted to prevent rank distortion.
              </p>
            </div>

            {/* Card 3: Fatigued Judge */}
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Elena Rostova</h3>
                  <span className="text-xs text-slate-400">VC Technical Partner</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Fatigue
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Confidence Weight</span>
                  <span className="text-purple-400 font-mono">0.80x (80%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: demoVisible ? "80%" : "0%",
                      transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Late-session score variance collapse. Softly down-weighted to preserve multi-judge consensus.
              </p>
            </div>
          </div>
        </section>

        {/* 5. RANK LIST SECTION */}
        <section ref={rankRef} className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Verifiable Outcomes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Live Benchmark Calibrated Leaderboard</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              How VERA's calibration engine preserves genuine top-quality projects despite judge anomalies.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Rank 1 */}
            <div
              style={{
                transitionDelay: "0ms",
              }}
              className={`glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 transition-all duration-700 ${
                rankVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold flex items-center justify-center text-lg">
                  #1
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Aether Engine - Local Neural Inference</h3>
                  <span className="text-xs text-slate-400">Track: AI & Machine Learning</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400 font-mono">77.15%</div>
                <span className="text-[11px] text-emerald-400 font-medium block">
                  ✓ Stable Position (Raw Rank #1)
                </span>
              </div>
            </div>

            {/* Rank 2 */}
            <div
              style={{
                transitionDelay: "150ms",
              }}
              className={`glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 transition-all duration-700 ${
                rankVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-lg">
                  #2
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">PayStream - Micro-payroll Engine</h3>
                  <span className="text-xs text-slate-400">Track: Fintech & Open Finance</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400 font-mono">77.14%</div>
                <span className="text-[11px] text-emerald-400 font-medium block">
                  ✓ Stable Position (Raw Rank #2)
                </span>
              </div>
            </div>

            {/* Rank 39 */}
            <div
              style={{
                transitionDelay: "300ms",
              }}
              className={`glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between gap-4 transition-all duration-700 ${
                rankVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-base">
                  #39
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">PulseTrace - Real-Time Microsecond Distributed Tracing</h3>
                  <span className="text-xs text-slate-400">Track: Developer Tools</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400 font-mono">72.58%</div>
                <span className="text-[11px] text-cyan-300 font-medium block">
                  🚨 Calibrated Shift (+0.80% score increase)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="text-center pt-8 border-t border-slate-800/80 space-y-6">
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Ready to explore VERA's verifiable hackathon gallery or test role permissions?
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span>Explore Public Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/judge"
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-sm hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span>View Judge Dashboard</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
