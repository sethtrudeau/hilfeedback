# Flex Credit Feedback (HITL v1)

Prototype of the *Human In The Loop Feedback* PRD (v0.3). Learners get formative AI feedback on Flex Credit project artifacts, and evaluators fill gaps, review the process and complete the final rubric.

## Run

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY
npm run dev                   # http://localhost:3000
```

Log in with one of the seeded accounts listed on the login page. **Ava Chen** already has a sample project (Community Skatepark Design) with a rubric. **Dr. Morgan Lee** is the evaluator for all learners.

`npm run reset-db` deletes `data/` (SQLite DB and uploads). Restart the dev server afterwards; the DB is recreated and reseeded on first request.

`npm test` runs the unit tests (vitest). `npm run typecheck` runs `tsc`.

## Stack

Next.js 16 (App Router, Server Actions), SQLite via better-sqlite3, Tailwind v4. Files are stored in `data/uploads` and served through `/files/[name]`, which checks project access.

**AI:** MiniMax M3 (`minimax/minimax-m3`) through OpenRouter's Chat Completions API (`lib/llm.ts`). It accepts text and images, but not documents, so the server first extracts text from PDF, Word (.docx), PowerPoint (.pptx: slide text and speaker notes) and Excel (.xlsx: cell values and formulas) files, see `lib/files.ts` and `lib/office.ts`. CSV and other plain text are sent as is. Legacy .xls/.doc/.ppt files go to a human. **Transcription:** `openai/whisper-1` through OpenRouter's `/audio/transcriptions` endpoint (`lib/transcribe.ts`), which handles up to 25 MB per file and times out after 60 seconds of processing. Both use the same `OPENROUTER_API_KEY`.

## What's in v1

| PRD | Where |
|---|---|
| R1–R2 accounts and roles | `lib/auth.ts`, `/login` |
| R3–R5 projects and brief | `/learner/projects/new`. Upload the brief (PDF, DOCX or TXT) or paste it. The rubric is extracted by the LLM, and you can retry if extraction fails. |
| R6–R6a upload, iteration, audio mode | `/learner/projects/[id]/upload` |
| R7–R10 AI feedback chat with iteration history | `lib/feedback.ts`, `lib/prompts.ts`, `/api/versions/[id]/chat` |
| R11 Layer 1 (always human) | `lib/routing.ts`. Video, games and Listen-mode audio go to a person. So does anything the AI can't read: scanned PDFs, link-only submissions, unsupported formats, images over 10 MB. |
| R14 Layer 3 (manual request) | Version page, for both learners and evaluators |
| R15, R35 evaluator text and audio responses | Version page. Evaluator audio is transcribed. |
| R27–R31 Most recent / History views, final submission and lock | `/learner/projects/[id]` |
| R32–R34 directory, overview with AI summary, pending queue | `/evaluator`, `/evaluator/projects/[id]`, `/evaluator/pending` |
| R36–R38 final report and rubric evaluation | `/evaluator/projects/[id]` |
| §8.10 notifications | In-app, `/notifications` |

## Deliberately not in v1

- **§8.5 self-assessment prompt (Layer 2, R12–R13, R16–R21).** There's no criterion-level confident/flagged routing and no structured routing record. The feedback prompt does keep one basic rule: only comment on what's actually visible.
- **§8.6 calibration (R22–R26).** No spot checks, no evaluator verdicts, no calibration view.

The `routing_decisions` table already carries `layer` and is where Layer 2 and spot-check rows would go.

## Defaults chosen for open questions

- **OQ5:** evaluators can read the full AI chat log for each version (read-only).
- **OQ6:** brief ingestion is file upload or paste. There's no Google Docs integration.
- AI summary is generated on demand by the evaluator and marked stale when new feedback arrives.
