# VERA Threat Model & Security Specification

## 🛡️ Overview

VERA (Verifiable Evaluation & Ranking Assistant) is a self-hosted, offline-first hackathon submission and judging platform. This document explicitly and transparently details VERA's threat model, security controls, mathematical limits, and known architectural boundaries.

---

## 1. Core Threat Analysis

### 1.1 Sybil Voting
* **Status:** **Not Applicable (N/A)**
* **Explanation:**
  - VERA does not implement a public voting feature (T3 is omitted from official ranking).
  - Official rankings are determined strictly by authenticated, organizer-invited judge accounts with assigned review quotas.
  - Because anonymous or unauthenticated users cannot register votes or influence final project rankings, Sybil attacks (creating multiple fake accounts to manipulate vote counts) are mathematically out of scope.

---

### 1.2 Ballot Stuffing
* **Status:** **Not Applicable (N/A)**
* **Explanation:**
  - Similar to Sybil voting, ballot stuffing (flooding the system with duplicate automated votes) is not applicable because VERA does not accept public or unauthenticated vote submissions.
  - For official judge scoring, VERA enforces a strict database-level composite unique index (`@@unique([judgeId, submissionId, criterionId])` in `prisma/schema.prisma`). A judge attempting to submit multiple scores for the same criterion updates their existing record rather than creating duplicate entries.

---

### 1.3 Judge Collusion & Unfair Rating
* **Detection Mechanism:**
  - VERA's statistical calibration engine (`lib/calibration.ts`) targets collusive or biased judging through **Low-Variance Detection (`JUDGE_FLAGGED_LOW_VARIANCE`)**.
  - **Trigger Threshold:** If a judge evaluates assigned criteria/submissions with a sample standard deviation $\sigma < 0.30$ on a 1–5 scale (e.g. colluding judges who agree in advance to award flat 5.0/5.0 or 4.0/4.0 scores across the board), VERA flags the judge.
  - **Penalty:** Flagged judges receive a **0.7x confidence weight penalty** ($C_j = 0.70$, or down to **0.56x** when combined with late-session fatigue). Their score contribution is down-weighted in the final score aggregation formula:
    $$\text{FinalScore}_S = \frac{\sum_{j \in J} \left( \text{RawScore}_j \times C_j \right)}{\sum_{j \in J} C_j}$$
* **Honest Technical Limitations:**
  - *What VERA Catches:* Judges who give flat, uninformative ratings or suffer late-stage fatigue.
  - *What VERA Does NOT Catch:* If two or more colluding judges coordinate off-platform to award variable, non-flat score patterns in lockstep (e.g. ratings of 5-3-4-5 across criteria to maintain $\sigma \ge 0.30$), VERA's single-judge variance tracking will **NOT** flag them. Detecting coordinated non-flat collusion would require multi-judge correlation matrices (e.g. Fleiss' Kappa or inter-rater distance metrics), which VERA does not currently implement.

---

### 1.4 Deadline Gaming
* **Status:** **Mitigated via Server-Side Enforcement**
* **Explanation:**
  - VERA enforces event submission deadlines strictly on the server side, rather than relying on hidden UI buttons or client-side JavaScript.
  - Every submission creation (`POST /api/submissions`) and update request (`PUT/PATCH /api/submissions/[id]`) queries the database for `event.endDate`.
  - If `new Date() > event.endDate`, the server immediately rejects the request with HTTP **`403 Forbidden`**.
  - **Audit Evidence:** This defense invariant was programmatically validated during VERA's security audit (`scripts/security-check.ts` / `SECURITY-CHECK.md` Test #4: *Participant attempting edit after event.endDate has passed* -> `403 Forbidden` PASS).

---

### 1.5 Role & Session Isolation Attacks
* **Status:** **Mitigated & Verified (6/6 Security Probes Passed)**
* **Explanation:**
  - VERA enforces server-side role isolation using JWT session tokens verified in API route middleware (`lib/auth.ts`).
  - Roles (`visitor`, `participant`, `judge`, `organizer`, `admin`) are checked on every API call.
  - As documented in `SECURITY-CHECK.md`, VERA successfully passed all 6 automated security attack probes:
    1. Judge A targeting Judge B's score endpoints (`403 Forbidden`).
    2. Judge A targeting Judge B's assignment queue (`403 Forbidden`).
    3. Participant A attempting to modify Team B's submission (`403 Forbidden`).
    4. Post-deadline submission edits (`403 Forbidden`).
    5. Unauthenticated access to organizer calibration API (`401 Unauthorized`).
    6. Non-organizer role accessing raw CSV score exports (`403 Forbidden`).

---

## 2. Known Limitations

In accordance with VERA's specification, the following security gaps and out-of-scope areas are explicitly acknowledged:

1. **No Rate-Limiting on Authentication Endpoints:**
   - Neither `/api/auth/callback/credentials` nor `/login` currently implement rate limiting (e.g. Redis/memory token bucket). The system relies on local environment isolation to mitigate brute-force credential attacks.

2. **No CAPTCHA or Bot Challenges:**
   - VERA does not feature CAPTCHA challenges on account registration or login routes, as it is designed for offline local execution.

3. **No Public Voting Security:**
   - Because public voting (T3) is omitted from VERA's core architecture, voting-specific attacks (Sybil manipulation, IP spoofing, cookie clearing) are out of scope.

4. **No Cross-Judge Correlation Clustering:**
   - As noted in Section 1.3, VERA cannot detect multi-judge collusion when colluders coordinate variable, non-flat score patterns ($\sigma \ge 0.30$).

5. **Plaintext Local Storage & Single Point of Trust:**
   - SQLite database data (`prisma/dev.db`) is stored unencrypted on the host machine.
   - Event organizers possess full administrative control to modify rubrics and trigger calibration without multi-signature consensus requirements.
