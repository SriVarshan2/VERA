import Link from "next/link";
import { ShieldCheck, Database, Lock, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="font-display font-bold text-lg text-white">VERA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Verifiable Evaluation & Ranking Assistant — self-hosted, event-sourced hackathon judging platform designed to run 100% offline.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Architecture & Trust Guarantees
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Append-only event sourcing for all scores & calibration changes
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Server-side role isolation & deadline enforcement
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Statistical variance calibration & fatigue detection
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Documentation & Guides
            </h4>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <Link href="/submissions/sub1/explain" className="hover:text-indigo-400 transition-colors">
                • Explain This Rank Algorithm
              </Link>
              <Link href="/organizer/audit" className="hover:text-cyan-400 transition-colors">
                • Audit Event Log Stream
              </Link>
              <span className="text-slate-500 font-mono">
                Running locally on SQLite (file:./dev.db)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 VERA Platform. All evaluation data is logged locally.</span>
          <span>Zero cloud calls. 100% offline execution.</span>
        </div>
      </div>
    </footer>
  );
}
