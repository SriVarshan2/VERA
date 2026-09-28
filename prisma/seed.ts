import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting VERA database seeding process (40 projects, 30 judges, 8 tracks)...");

  // Clean existing database
  await prisma.publicVote.deleteMany();
  await prisma.scoreEvent.deleteMany();
  await prisma.score.deleteMany();
  await prisma.judgeAssignment.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = bcrypt.hashSync("password123", 10);

  // 1. Create Admin & Organizer Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@vera.eval",
      passwordHash: commonPasswordHash,
      role: "admin",
      name: "System Administrator",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: "organizer@vera.eval",
      passwordHash: commonPasswordHash,
      role: "organizer",
      name: "Alex Rivera",
    },
  });

  // 2. Load official fixtures.json if available
  const fixturesPath = path.join(process.cwd(), "fixtures.json");
  let fixData: any = null;
  if (fs.existsSync(fixturesPath)) {
    try {
      fixData = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));
    } catch (e) {
      console.warn("Could not parse fixtures.json:", e);
    }
  }

  // 3. Create 30 Judges
  const judgesList = [];

  const judge1 = await prisma.user.create({
    data: {
      email: "judge.sarah@vera.eval",
      passwordHash: commonPasswordHash,
      role: "judge",
      name: "Dr. Sarah Chen (Senior AI Researcher)",
    },
  });
  judgesList.push(judge1);

  const judge2 = await prisma.user.create({
    data: {
      email: "judge.marcus@vera.eval",
      passwordHash: commonPasswordHash,
      role: "judge",
      name: "Marcus Vance (Systems Architect - Planted Bad Judge)",
    },
  });
  judgesList.push(judge2);

  const judge3 = await prisma.user.create({
    data: {
      email: "judge.elena@vera.eval",
      passwordHash: commonPasswordHash,
      role: "judge",
      name: "Elena Rostova (VC Technical Partner)",
    },
  });
  judgesList.push(judge3);

  // Create remaining 27 judges (Judges 4 to 30)
  for (let i = 4; i <= 30; i++) {
    const idxStr = i < 10 ? `0${i}` : `${i}`;
    const jUser = await prisma.user.create({
      data: {
        email: `judge_${idxStr}@vera.eval`,
        passwordHash: commonPasswordHash,
        role: "judge",
        name: i >= 29 ? `Judge ${idxStr} (Unfinished Batch)` : `Judge ${idxStr}`,
      },
    });
    judgesList.push(jUser);
  }

  console.log("  👥 30 Judges created (including planted bad judge & 2 unfinished review batches)");

  // 4. Create 40 Participant Users
  const participantsList = [];
  for (let i = 1; i <= 40; i++) {
    const idxStr = i < 10 ? `0${i}` : `${i}`;
    const pUser = await prisma.user.create({
      data: {
        email: i === 1 ? "dev.alice@vera.eval" : (i === 2 ? "dev.bob@vera.eval" : `dev.participant_${idxStr}@vera.eval`),
        passwordHash: commonPasswordHash,
        role: "participant",
        name: i === 1 ? "Alice Zhang" : `Participant ${idxStr}`,
      },
    });
    participantsList.push(pUser);
  }

  // 5. Create Event (8 tracks)
  const tracks = [
    "AI & Machine Learning",
    "Developer Tools",
    "Systems & Infrastructure",
    "Social Impact",
    "Web3 & Decentralized",
    "Healthcare & Biotech",
    "Fintech & Open Finance",
    "Education & EdTech",
  ];

  const event = await prisma.event.create({
    data: {
      name: "VERA Global Hackathon 2026",
      description: "Official 40-project benchmark dataset with planted bad judge, unfinished review batches, and duplicate submission.",
      startDate: new Date("2026-02-01T00:00:00Z"),
      endDate: new Date("2026-03-01T18:00:00Z"), // Closed event date per dogfood spec
      tracks: JSON.stringify(tracks),
      organizerId: organizer.id,
      resultsRevealed: false,
    },
  });

  console.log(`  🏆 Event created: ${event.name} (8 tracks)`);

  // 6. Create Rubric Criteria
  const c1 = await prisma.rubricCriterion.create({
    data: { eventId: event.id, name: "Technical Complexity & Architecture", weight: 35.0, maxScore: 5.0 },
  });
  const c2 = await prisma.rubricCriterion.create({
    data: { eventId: event.id, name: "Innovation & Originality", weight: 25.0, maxScore: 5.0 },
  });
  const c3 = await prisma.rubricCriterion.create({
    data: { eventId: event.id, name: "UI/UX & Design Polish", weight: 20.0, maxScore: 5.0 },
  });
  const c4 = await prisma.rubricCriterion.create({
    data: { eventId: event.id, name: "Practical Impact & Feasibility", weight: 20.0, maxScore: 5.0 },
  });
  const criteria = [c1, c2, c3, c4];

  // 7. Create 40 Teams & 40 Submissions from fixtures.json
  const fixtureProjects = fixData?.projects || [];
  const createdSubmissions = [];

  for (let i = 0; i < 40; i++) {
    const fProj = fixtureProjects[i] || {};
    const title = fProj.title || fProj.name || `Project ${i + 1}`;
    const trk = fProj.track || tracks[i % tracks.length];
    const teamName = fProj.teamName || fProj.team || `Team ${i + 1}`;
    const summary = fProj.summary || `Description for ${title}`;
    const isDup = i === 39 || Boolean(fProj.isDuplicate);

    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        name: teamName,
        inviteCode: `TEAM_CODE_${i + 1}_${Date.now()}`,
      },
    });

    await prisma.teamMember.create({
      data: {
        userId: participantsList[i].id,
        teamId: team.id,
        role: "leader",
      },
    });

    const sub = await prisma.submission.create({
      data: {
        teamId: team.id,
        eventId: event.id,
        name: isDup ? `${title} (Duplicate Draft)` : title,
        tagline: isDup ? `⚠️ DUPLICATE SUBMISSION: ${summary}` : summary,
        description: isDup
          ? `[DUPLICATE SUBMISSION DETECTED] This is a duplicate draft submission of project #${i} submitted by ${teamName}.`
          : summary,
        repoUrl: fProj.repo_url || `https://github.com/vera-demo/project-${i + 1}`,
        demoUrl: fProj.demo_url || `https://project-${i + 1}.vera-demo.local`,
        imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"]),
        techTags: JSON.stringify(["TypeScript", "Next.js", "SQLite", "Tailwind CSS"]),
        track: trk,
        customAnswers: JSON.stringify({
          challenges: isDup ? "Duplicate submission flag probe." : "Optimizing performance and offline execution.",
        }),
        isLocked: false,
      },
    });

    createdSubmissions.push(sub);
  }

  console.log("  🚀 40 Teams & Submissions created (including Project #40 Duplicate Submission)");

  // 8. Create Judge Assignments & Seed Scores
  // Judges 1..28 complete their assignments; Judges 29 & 30 have UNFINISHED review batches (status: "pending")
  const sub1 = createdSubmissions[0];
  const sub2 = createdSubmissions[1];
  const sub3 = createdSubmissions[2];

  // Map assignments:
  // Sarah (judge1), Marcus (judge2), Elena (judge3) evaluate the top 3 projects to form our explicit rank swap benchmark
  const mainEvaluators = [judge1, judge2, judge3];
  const topSubmissions = [sub1, sub2, sub3];

  for (const j of mainEvaluators) {
    for (const s of topSubmissions) {
      await prisma.judgeAssignment.create({
        data: {
          judgeId: j.id,
          submissionId: s.id,
          eventId: event.id,
          status: "completed",
        },
      });
    }
  }

  // Judge 1 (Dr. Sarah Chen): Consistent expert scores (NO FLAGS -> weight 1.0x)
  const sarahScores = [
    { subId: sub1.id, scores: [4.5, 4.5, 4.0, 4.0] }, // 86.0% raw
    { subId: sub2.id, scores: [3.5, 4.0, 4.0, 3.5] }, // 75.0% raw
    { subId: sub3.id, scores: [3.0, 3.0, 3.0, 3.0] }, // 60.0% raw
  ];

  for (const item of sarahScores) {
    for (let i = 0; i < criteria.length; i++) {
      await prisma.score.create({
        data: {
          judgeId: judge1.id,
          submissionId: item.subId,
          criterionId: criteria[i].id,
          value: item.scores[i],
        },
      });
    }
  }

  // Judge 2 (Marcus Vance): PLANTED BAD JUDGE (Gives 4.0 to everything -> stdDev = 0.0 < 0.3 -> LOW_VARIANCE flag, weight 0.56x)
  const marcusScores = [
    { subId: sub1.id, scores: [4.0, 4.0, 4.0, 4.0] }, // 80.0% raw
    { subId: sub2.id, scores: [4.0, 4.0, 4.0, 4.0] }, // 80.0% raw
    { subId: sub3.id, scores: [4.0, 4.0, 4.0, 4.0] }, // 80.0% raw
  ];

  for (const item of marcusScores) {
    for (let i = 0; i < criteria.length; i++) {
      await prisma.score.create({
        data: {
          judgeId: judge2.id,
          submissionId: item.subId,
          criterionId: criteria[i].id,
          value: item.scores[i],
        },
      });
    }
  }

  // Judge 3 (Elena Rostova): FATIGUED JUDGE (First 2 subs 4.5/3.5, last sub 1.0 -> FATIGUE flag, weight 0.8x)
  const elenaOrdered = [
    { subId: sub2.id, scores: [4.5, 4.5, 4.0, 4.0] }, // 86.0% raw
    { subId: sub3.id, scores: [2.5, 2.5, 2.5, 2.5] }, // 50.0% raw
    { subId: sub1.id, scores: [1.0, 1.0, 1.0, 1.0] }, // 20.0% raw (fatigue crash)
  ];

  for (const item of elenaOrdered) {
    for (let i = 0; i < criteria.length; i++) {
      await prisma.score.create({
        data: {
          judgeId: judge3.id,
          submissionId: item.subId,
          criterionId: criteria[i].id,
          value: item.scores[i],
        },
      });
    }
  }

  // Assign remaining 25 completed judges across submissions
  for (let jIdx = 3; jIdx < 28; jIdx++) {
    const judge = judgesList[jIdx];
    for (let sIdx = 0; sIdx < 40; sIdx++) {
      if ((sIdx + jIdx) % 4 === 0) {
        const sub = createdSubmissions[sIdx];
        await prisma.judgeAssignment.create({
          data: {
            judgeId: judge.id,
            submissionId: sub.id,
            eventId: event.id,
            status: "completed",
          },
        });

        // Seed realistic varied scores for completed judges
        for (let cIdx = 0; cIdx < criteria.length; cIdx++) {
          const val = 3.0 + ((sIdx * 7 + cIdx * 3 + jIdx) % 5) * 0.4;
          await prisma.score.create({
            data: {
              judgeId: judge.id,
              submissionId: sub.id,
              criterionId: criteria[cIdx].id,
              value: Number(Math.min(5.0, Math.max(1.0, val)).toFixed(1)),
            },
          });
        }
      }
    }
  }

  // Plant 2 UNFINISHED REVIEW BATCHES (Judges 29 & 30 with status "pending")
  const unfinishedJudge29 = judgesList[28]; // judge_29
  const unfinishedJudge30 = judgesList[29]; // judge_30

  for (let sIdx = 0; sIdx < 5; sIdx++) {
    await prisma.judgeAssignment.create({
      data: {
        judgeId: unfinishedJudge29.id,
        submissionId: createdSubmissions[sIdx].id,
        eventId: event.id,
        status: "pending", // Unfinished batch
      },
    });

    await prisma.judgeAssignment.create({
      data: {
        judgeId: unfinishedJudge30.id,
        submissionId: createdSubmissions[sIdx + 5].id,
        eventId: event.id,
        status: "pending", // Unfinished batch
      },
    });
  }

  console.log("  📋 30 Judge assignments mapped (including 2 unfinished review batches for Judge 29 & Judge 30)");

  // Run initial event calibration & normalization calculations
  const { runEventCalibration } = await import("../lib/calibration");
  await runEventCalibration(event.id);

  console.log("  ⚡ Event calibration & normalization executed!");

  // Generate .dogfood.toml Auth Cookies
  const { encode } = await import("next-auth/jwt");
  const secret = process.env.NEXTAUTH_SECRET || "vera-fallback-secret-2026";

  const organizerToken = await encode({
    token: { name: organizer.name, email: organizer.email, id: organizer.id, role: "organizer" },
    secret,
  });

  const judgeAToken = await encode({
    token: { name: judge1.name, email: judge1.email, id: judge1.id, role: "judge" },
    secret,
  });

  const judgeBToken = await encode({
    token: { name: judge2.name, email: judge2.email, id: judge2.id, role: "judge" },
    secret,
  });

  const participantToken = await encode({
    token: { name: participantsList[0].name, email: participantsList[0].email, id: participantsList[0].id, role: "participant" },
    secret,
  });

  const orgHeader = `Cookie: next-auth.session-token=${organizerToken}`;
  const judgeAHeader = `Cookie: next-auth.session-token=${judgeAToken}`;
  const judgeBHeader = `Cookie: next-auth.session-token=${judgeBToken}`;
  const partHeader = `Cookie: next-auth.session-token=${participantToken}`;

  console.log("\n================================================================================");
  console.log("             .dogfood.toml AUTH COOKIES (COPIED TO .dogfood.toml)               ");
  console.log("================================================================================\n");
  console.log("[auth]");
  console.log(`organizer   = "${orgHeader}"`);
  console.log(`judge_a     = "${judgeAHeader}"`);
  console.log(`judge_b     = "${judgeBHeader}"`);
  console.log(`participant = "${partHeader}"\n`);
  console.log("[routes]");
  console.log('gallery      = "/api/submissions"');
  console.log('submit       = "/api/submissions"');
  console.log('judge_scores = "/api/judge/scores"');
  console.log(`peer_scores  = "/api/judge/scores?judgeId=${judge1.id}"`);
  console.log('csv_export   = "/api/organizer/export?type=scores"');
  console.log("================================================================ philosophy\n");

  const dogfoodTomlContent = `[portal]
base_url = "http://localhost:3000"

[tiers]
claimed = ["T1", "T2"]
pitch = "VERA: Verifiable Evaluation & Ranking Assistant"

[auth]
organizer   = "${orgHeader}"
judge_a     = "${judgeAHeader}"
judge_b     = "${judgeBHeader}"
participant = "${partHeader}"

[routes]
gallery      = "/api/submissions"
submit       = "/api/submissions"
judge_scores = "/api/judge/scores"
peer_scores  = "/api/judge/scores?judgeId=${judge1.id}"
csv_export   = "/api/organizer/export?type=scores"
`;

  fs.writeFileSync(path.join(process.cwd(), ".dogfood.toml"), dogfoodTomlContent, "utf-8");
  console.log("✅ Written .dogfood.toml to repo root!");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
