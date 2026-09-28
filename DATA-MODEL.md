# VERA Data Model & Schema Specification

## 🗄️ Database Architecture

VERA uses a local, file-based SQLite database powered by Prisma ORM (`prisma/dev.db`).

---

## 📊 Entity Relationship & Schema Details

```prisma
// User Model (Roles: visitor, participant, judge, organizer, admin)
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Event Model
model Event {
  id          String   @id @default(cuid())
  name        String
  description String
  startDate   DateTime
  endDate     DateTime
  tracks      String   // JSON array of strings e.g. '["AI", "Web3"]'
  organizerId String
}

// Team & TeamMember Models
model Team {
  id         String   @id @default(cuid())
  eventId    String
  name       String
  inviteCode String   @unique // 6-character uppercase code
}

model TeamMember {
  id        String   @id @default(cuid())
  userId    String
  teamId    String
  role      String   @default("member") // "leader" | "member"
}

// Submission Model
model Submission {
  id            String   @id @default(cuid())
  teamId        String   @unique
  eventId       String
  name          String
  tagline       String
  description   String
  repoUrl       String
  demoUrl       String
  imageUrls     String   // JSON array string
  techTags      String   // JSON array string
  track         String
  customAnswers String   // JSON object string
  isLocked      Boolean  @default(false)
}

// Judge Assignment
model JudgeAssignment {
  id           String   @id @default(cuid())
  judgeId      String
  submissionId String
  eventId      String
  status       String   @default("pending") // "pending" | "completed"
}

// Rubric Criteria
model RubricCriterion {
  id        String   @id @default(cuid())
  eventId   String
  name      String
  weight    Float    // Weight percentage e.g. 35.0
  maxScore  Float    @default(5.0)
}

// Score Model
model Score {
  id           String   @id @default(cuid())
  judgeId      String
  submissionId String
  criterionId  String
  value        Float    // 1.0 to 5.0 rating
}

// ScoreEvent (Append-only Event Log)
model ScoreEvent {
  id           String   @id @default(cuid())
  type         String   // SCORE_SUBMITTED | SCORE_UPDATED | NORMALIZATION_APPLIED | JUDGE_FLAGGED_LOW_VARIANCE | JUDGE_FLAGGED_FATIGUE
  payload      String   // Full JSON payload
  submissionId String?
  judgeId      String?
  createdAt    DateTime @default(now())
}
```

---

## 📥 Custom Fixtures Import (`fixtures.json`)

During `npm run setup`, VERA checks for `fixtures.json` in the project root. If found, it seeds users, events, teams, submissions, judge assignments, scores, and score events directly from your custom JSON fixture.

### Example `fixtures.json` structure:

```json
{
  "users": [
    { "id": "u1", "email": "judge.sarah@vera.eval", "password": "password123", "role": "judge", "name": "Dr. Sarah Chen" }
  ],
  "events": [
    { "id": "e1", "name": "Hackathon 2026", "description": "...", "startDate": "2026-09-01", "endDate": "2026-10-01", "tracks": ["AI", "Web3"], "organizerId": "u1" }
  ]
}
```

---

## 📤 CSV Export Endpoints

Organizers and Admins can export live event datasets via `/api/organizer/export?eventId={id}&type={type}`:

1. **`type=rankings`**: Generates CSV containing final calibrated rank, project name, track, team name, final score (0-100), and total evaluating judges.
2. **`type=scores`**: Generates CSV containing every judge's raw criterion score, weight, and timestamp.
3. **`type=submissions`**: Generates CSV containing project details, team leaders, repo URLs, and demo links.
