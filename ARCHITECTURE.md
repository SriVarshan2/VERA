# VERA System Architecture & Event Sourcing Design

## 🏛️ Executive Summary

VERA (Verifiable Evaluation & Ranking Assistant) adopts an **event-sourced architecture** for all evaluation score entries and calibration adjustments. 

Unlike conventional CRUD hackathon platforms that overwrite scores in-place, VERA treats score evaluations as an **append-only ledger** of immutable `ScoreEvent` records. Every score submission, revision, statistical calibration adjustment, low-variance flag, and fatigue warning appends a new event row to the database.

---

## 🔁 Event-Sourced Scoring Flow

```
[ Judge Evaluation Form ]
           │
           ▼ (POST /api/judge/scores)
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. Write/Update Score Row in `Score` Table                  │
 │ 2. Append `SCORE_SUBMITTED` / `SCORE_UPDATED` to ScoreEvent  │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 3. Trigger Calibration Engine (lib/calibration.ts)          │
 │    - Compute Judge Standard Deviation (σ)                   │
 │    - Check Low Variance Threshold (σ < 0.3)                  │
 │    - Analyze Session Fatigue (1st half vs 2nd half stddev)  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (If threshold violated)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 4. Append `JUDGE_FLAGGED_LOW_VARIANCE` or `FATIGUE` Event   │
 │    - Reduce Confidence Weight (e.g. 0.7x)                  │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 5. Compute Submission Normalization                         │
 │    - FinalScore = Σ(RawScore * Weight) / Σ(Weight)           │
 │ 6. Append `NORMALIZATION_APPLIED` Event Log                 │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Why Event Sourcing for Hackathon Judging?

### 1. Complete Auditability & Zero Disputes
In competitive hackathons, participants frequently question final rankings or request score reviews. With VERA's event log:
- Organizers can inspect the exact chronological sequence of every score cast.
- The **"Explain This Rank"** feature reconstructs rankings directly from historical `NORMALIZATION_APPLIED` events rather than relying on an opaque, mutable database column.

### 2. Immutability & Non-Repudiation
Scores can never be silently deleted or altered without leaving an explicit audit event (`SCORE_UPDATED`). Every write records:
- The judge's identity (`judgeId`)
- The target submission (`submissionId`)
- The previous score value and new score value
- ISO timestamp

### 3. Replayability & Algorithm Iteration
Because all raw scores and calibration triggers exist as event payloads in `ScoreEvent`, organizers can tweak calibration parameters (e.g. changing the low-variance standard deviation threshold from `0.3` to `0.25`) and replay the event stream to generate new calibrated rankings without corrupting historical evaluation records.

---

## 🛡️ Server-Side Role Isolation Architecture

VERA enforces security at the API route layer through `enforceApiAuth(allowedRoles)` in `lib/auth.ts`:

1. **Judge Isolation:** `/api/judge/assignments` and `/api/judge/scores` verify that the requesting user's `session.user.id` matches the targeted `judgeId`. If a judge attempts to supply `?judgeId=other_judge_id` in a direct HTTP request, the handler returns HTTP `403 Forbidden`.
2. **Participant Deadline Isolation:** `/api/submissions` checks `now > event.endDate`. Write operations (POST/PUT) attempted after the deadline return HTTP `403 Forbidden` with a locked state message.
