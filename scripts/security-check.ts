import { prisma } from "../lib/prisma";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  details?: string;
}

import { encode } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET || "vera-fallback-secret-2026";

async function getSessionCookie(user: { id: string; email: string; name: string; role: string }): Promise<string> {
  const token = await encode({
    token: { id: user.id, email: user.email, name: user.name, role: user.role },
    secret,
  });
  return `next-auth.session-token=${token}`;
}

async function runSecurityAudit() {
  console.log("🛡️  Starting VERA Role Isolation & Security Verification Audit...\n");

  // Warm up dev server routes
  for (let i = 0; i < 15; i++) {
    try {
      const ping = await fetch(`${BASE_URL}/api/submissions`);
      if (ping.status === 200 || ping.status === 401 || ping.status === 403) break;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  const results: TestResult[] = [];

  // Fetch reference users & entities from database for testing
  const judgeA = await prisma.user.findUnique({ where: { email: "judge.sarah@vera.eval" } });
  const judgeB = await prisma.user.findUnique({ where: { email: "judge.marcus@vera.eval" } });
  const participantA = await prisma.user.findUnique({ where: { email: "dev.alice@vera.eval" } });
  const participantB = await prisma.user.findUnique({ where: { email: "dev.bob@vera.eval" } });
  const event = await prisma.event.findFirst();

  if (!judgeA || !judgeB || !participantA || !participantB || !event) {
    console.error("❌ Test database missing required seed entities. Please run `npm run setup` first.");
    process.exit(1);
  }

  // Get submissions owned by Team A and Team B
  const teamA = await prisma.team.findFirst({ where: { members: { some: { userId: participantA.id } } }, include: { submission: true } });
  const teamB = await prisma.team.findFirst({ where: { members: { some: { userId: participantB.id } } }, include: { submission: true } });

  const subB = teamB?.submission;

  // Obtain Session Cookies
  const judgeACookie = await getSessionCookie(judgeA);
  const judgeBCookie = await getSessionCookie(judgeB);
  const partACookie = await getSessionCookie(participantA);

  console.log("🔒 Credentials Authenticated. Executing Attack Vector Probes...\n");

  // TEST 1: Judge A calling /api/judge/scores with judgeId belonging to Judge B
  {
    const res = await fetch(`${BASE_URL}/api/judge/scores?judgeId=${judgeB.id}`, {
      headers: judgeACookie ? { Cookie: judgeACookie } : {},
    });
    const passed = res.status === 403;
    results.push({
      name: "1. Judge A calling /api/judge/scores targeting Judge B's ID",
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 403 Forbidden" : `Unexpected status: ${res.status}`,
    });
  }

  // TEST 2: Judge A calling /api/judge/assignments targeting Judge B's assignments
  {
    const res = await fetch(`${BASE_URL}/api/judge/assignments?judgeId=${judgeB.id}`, {
      headers: judgeACookie ? { Cookie: judgeACookie } : {},
    });
    const passed = res.status === 403;
    results.push({
      name: "2. Judge A calling /api/judge/assignments targeting Judge B's assignments",
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 403 Forbidden" : `Unexpected status: ${res.status}`,
    });
  }

  // TEST 3: Participant A trying to PUT/PATCH another team's submission (Team B)
  if (subB) {
    const res = await fetch(`${BASE_URL}/api/submissions/${subB.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(partACookie ? { Cookie: partACookie } : {}),
      },
      body: JSON.stringify({
        name: "HACKED PROJECT TITLE BY PARTICIPANT A",
      }),
    });
    const passed = res.status === 403;
    results.push({
      name: "3. Participant A attempting to modify Team B's submission",
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 403 Forbidden" : `Unexpected status: ${res.status}`,
    });
  }

  // TEST 4: Participant trying to submit/edit after event.endDate has passed
  {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const expiredEvent = await prisma.event.create({
      data: {
        name: "Expired Event Security Check",
        description: "Testing post-deadline rejection",
        startDate: new Date(Date.now() - 172800000),
        endDate: pastDate,
        tracks: JSON.stringify(["Security"]),
        organizerId: judgeA.id,
      },
    });

    const expiredTeam = await prisma.team.create({
      data: {
        eventId: expiredEvent.id,
        name: "Expired Security Team",
        inviteCode: `SEC${Math.floor(Math.random() * 8999 + 1000)}`,
        members: { create: { userId: participantA.id, role: "leader" } },
      },
    });

    const expiredSub = await prisma.submission.create({
      data: {
        teamId: expiredTeam.id,
        eventId: expiredEvent.id,
        name: "Expired Submission",
        tagline: "Testing deadline enforcement",
        description: "Should be locked",
        repoUrl: "",
        demoUrl: "",
        imageUrls: "[]",
        techTags: "[]",
        track: "Security",
        customAnswers: "{}",
      },
    });

    const res = await fetch(`${BASE_URL}/api/submissions/${expiredSub.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(partACookie ? { Cookie: partACookie } : {}),
      },
      body: JSON.stringify({ name: "Attempt Post-Deadline Edit" }),
    });

    const passed = res.status === 403;
    results.push({
      name: "4. Participant attempting edit after event.endDate has passed",
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 403 Forbidden" : `Unexpected status: ${res.status}`,
    });

    // Cleanup temporary expired test entities
    await prisma.submission.delete({ where: { id: expiredSub.id } });
    await prisma.teamMember.deleteMany({ where: { teamId: expiredTeam.id } });
    await prisma.team.delete({ where: { id: expiredTeam.id } });
    await prisma.event.delete({ where: { id: expiredEvent.id } });
  }

  // TEST 5: Unauthenticated request to organizer endpoints (/api/organizer/calibration)
  {
    const res = await fetch(`${BASE_URL}/api/organizer/calibration?eventId=${event.id}`);
    const passed = res.status === 401;
    results.push({
      name: "5. Unauthenticated request to /api/organizer/calibration",
      expectedStatus: 401,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 401 Unauthorized" : `Unexpected status: ${res.status}`,
    });
  }

  // TEST 6: Judge trying to access organizer-only endpoint (/api/organizer/export)
  {
    const res = await fetch(`${BASE_URL}/api/organizer/export?eventId=${event.id}&type=scores`, {
      headers: judgeACookie ? { Cookie: judgeACookie } : {},
    });
    const passed = res.status === 403;
    results.push({
      name: "6. Judge attempting to access /api/organizer/export",
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: passed ? "Correctly rejected with 403 Forbidden" : `Unexpected status: ${res.status}`,
    });
  }

  // Summary Output
  console.log("================================================================================");
  console.log("                        SECURITY AUDIT ACCEPTANCE EVIDENCE                      ");
  console.log("================================================================================\n");

  let allPassed = true;
  for (const r of results) {
    const statusLabel = r.passed ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${statusLabel} ${r.name}`);
    console.log(`         Expected: ${r.expectedStatus} | Actual: ${r.actualStatus} | Details: ${r.details}\n`);
    if (!r.passed) allPassed = false;
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL 6 SECURITY ATTACK VECTORS SUCCESSFULLY REJECTED! ROLE ISOLATION IS HARDENED.");
    process.exit(0);
  } else {
    console.error("🚨 SECURITY AUDIT FAILED AT LEAST ONE CHECK!");
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error("Security script error:", err);
  process.exit(1);
});
