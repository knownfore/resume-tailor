# Resume Tailor MVP

Resume Tailor is a Next.js app that:
- Authenticates users (email/password + secure session cookie)
- Accepts resume uploads (`.txt`, `.pdf`, `.docx`)
- Accepts a job posting
- Rewrites the resume for ATS alignment using OpenAI
- Stores tailoring history per user in local JSON persistence
- Exports tailored resumes as PDF or Word (`.docx`)

## Tech Stack
- Next.js 14 (App Router)
- React 18
- OpenAI Node SDK
- Local JSON persistence (`data/db.json`)
- Vitest for tests

## Why These Dependencies
- `openai`: required for resume tailoring generation.
- `mammoth`: extracts text from `.docx` files.
- `pdf-parse`: extracts text from `.pdf` files.
- `pdf-lib`: generates downloadable PDF resumes.
- `docx`: generates downloadable Word resumes.
- `eslint` + `eslint-config-next`: linting aligned with Next.js.
- `vitest`: lightweight unit/integration test runner.

## Project Structure
- `app/page.js`: authenticated UI for upload + job posting + history
- `app/api/auth/*`: register/login/logout/me
- `app/api/tailor/route.js`: authenticated tailoring endpoint
- `app/api/tailor/history/route.js`: tailoring history endpoint
- `lib/config.js`: env/config defaults
- `lib/security.js`: password hashing + session token hashing
- `lib/session.js`: cookie/session handling
- `lib/db.js`: JSON file persistence
- `lib/repository.js`: persistence access layer
- `lib/file-extract.js`: file text extraction
- `lib/validation.js`: request/input validation
- `lib/rate-limit.js`: in-memory per-IP/user throttling
- `tests/unit/*`: unit tests
- `tests/integration/*`: integration smoke test

## Environment Variables
Copy `.env.example` to `.env.local` and set values:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
SESSION_COOKIE_NAME=rt_session
SESSION_TTL_HOURS=168
DATA_DIR=./data
MAX_UPLOAD_BYTES=3145728
```

## Setup
```bash
npm install
```

## Run Commands
```bash
# development
npm run dev

# lint
npm run lint

# tests
npm run test

# production build
npm run build
npm start
```

## API Summary
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/tailor` (multipart form data: `resumeFile`, `jobText`)
- `GET /api/tailor/history`
- `GET /api/tailor/download?id=<tailoringId>&format=pdf|docx`

## Security Baseline
- Passwords are hashed using `crypto.scrypt` + random salt.
- Sessions use random opaque tokens and store only SHA-256 token hashes.
- Session cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Input validation on auth, file type/size, and text lengths.
- Rate limiting on tailoring requests.
- Security headers configured in `next.config.mjs`.
- No secrets committed; environment variables are externalized.

## Persistence
This MVP stores data in `DATA_DIR/db.json`.

Stored records:
- users
- sessions
- tailoring history

## Deployment Notes
- Works well for single-instance deployments (VM/container with writable disk).
- For horizontally scaled or serverless production, replace JSON storage with a shared DB (PostgreSQL/MySQL) and a shared session store.
- Ensure `OPENAI_API_KEY` is set in deployment secrets.
- Use HTTPS in production so secure cookies are enforced.

## Verification Checklist
1. Start app with `npm run dev`.
2. Register a new account.
3. Upload a resume file (`.txt/.pdf/.docx`).
4. Paste a job posting and tailor.
5. Confirm tailored output renders.
6. Refresh and confirm history persists.
7. Run `npm run lint`, `npm run test`, and `npm run build`.
