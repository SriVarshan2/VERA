"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import { 
  ShieldCheck, 
  Award, 
  UserCheck, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  LogOut, 
  LogIn, 
  Sparkles,
  Zap
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const user = session?.user;
  const role = user?.role || "visitor";

  const isNavActive = (path: string) => pathname === path;

  // Quick Switcher accounts for seamless local evaluation
  const demoAccounts = [
    { label: "Admin", email: "admin@vera.eval", role: "admin", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    { label: "Organizer", email: "organizer@vera.eval", role: "organizer", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    { label: "Judge (Dr. Sarah)", email: "judge.sarah@vera.eval", role: "judge", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    { label: "Judge (Marcus)", email: "judge.marcus@vera.eval", role: "judge", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { label: "Participant", email: "dev.alice@vera.eval", role: "participant", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  ];

  const handleQuickSwitch = async (email: string) => {
    await signIn("credentials", {
      email,
      password: "password123",
      redirect: false,
    });
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
                  VERA
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Offline
                  </span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wide">
                  Verifiable Evaluation & Ranking
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isNavActive("/")
                  ? "bg-slate-800/80 text-white border border-slate-700/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              Public Gallery
            </Link>

            <Link
              href="/about"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isNavActive("/about")
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              How it Works
            </Link>



            {(role === "judge" || role === "admin" || role === "organizer") && (
              <Link
                href="/judge"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/judge")
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10"
                }`}
              >
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Judge Dashboard
              </Link>
            )}

            {(role === "participant" || role === "admin" || role === "organizer") && (
              <Link
                href="/participant"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/participant")
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                My Submissions
              </Link>
            )}

            {(role === "organizer" || role === "admin") && (
              <>
                <Link
                  href="/organizer"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isNavActive("/organizer")
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Organizer Hub
                </Link>

                <Link
                  href="/organizer/audit"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isNavActive("/organizer/audit")
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-300 hover:text-amber-300 hover:bg-amber-500/10"
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  Audit Log
                </Link>
              </>
            )}
          </nav>

          {/* User Controls & Quick Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Demo Quick Switcher Dropdown */}
            <div className="relative group">
              <button
                id="quick-role-switcher"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500 transition-all"
                title="1-Click Role Switcher for Testing"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Role Switcher</span>
              </button>

              <div className="absolute right-0 mt-2 w-56 p-2 glass-panel rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Quick Login (Offline)
                </div>
                <div className="space-y-1">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleQuickSwitch(acc.email)}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium border flex items-center justify-between transition-colors ${acc.color}`}
                    >
                      <span>{acc.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">1-click</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {session ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-white">{user?.name}</div>
                  <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wide">
                    {user?.role}
                  </div>
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                id="nav-login-link"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
