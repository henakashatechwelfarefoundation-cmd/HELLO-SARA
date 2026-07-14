# Hello Sara — Product Requirements (Living Document)

## Overview
A private, model-agnostic AI voice-assistant mobile app built with Expo + React Native, backed by FastAPI + MongoDB. Delivered against the 8-phase source spec.

## Delivered Scope (v1)

### Phase 1 — Foundation ✅
- Modular backend (FastAPI + MongoDB, `core/routes/services/models/`) with startup indexes, TTL sessions, error boundaries.
- Dual authentication: JWT email/password (bcrypt) **and** Emergent-managed Google Sign-In (session token). Both accepted by the same `get_current_user` dependency.
- Three-theme design system (Dark, AMOLED, Light) with brand accents Deep Purple `#7C3AED` + Electric Cyan `#06B6D4`.
- Splash → 6-slide Onboarding → Auth → Tabs → Settings hub with sub-screens: Appearance, Voice, Language, AI Provider, Permissions, Privacy, Terms, About, Support.

### Phase 2 — Voice Engine ✅ (Expo-Go: partial; native build: full)
- `src/voice/voice.ts` — device STT via `expo-speech-recognition` and TTS via `expo-speech`.
- Chat screen (`/chat`) with mic button, partial-transcript overlay, and spoken replies.
- Voice settings (wake word toggle, output toggle, haptics) already persisted per user.
- STT works on native builds; Expo Go falls back gracefully to typed input.

### Phase 3 — Intelligence Engine ✅ (backend proxy ready)
- `/api/chat` proxies to the user-configured open-source LLM via **native Ollama protocol** or **OpenAI-compatible** (`/chat/completions`). Provider is chosen in Settings › AI Provider (Ollama, llama.cpp, vLLM, LM Studio, OpenRouter). **No proprietary AI is called.**
- Full conversation history is persisted; a 502 with a friendly message surfaces if the provider is unreachable.

### Phase 4 — Communication & Device Control ✅ (Expo-Go: comms only; native build: all)
- `/api/device/commands` — audit log of every device action Sara issues.
- `/api/device/comms` — call/SMS/WhatsApp/email intent log.
- `/device` screen with 3 categories: Communication (call, SMS, email — work via `Linking` today), Device Controls (flashlight, volume, wifi, bluetooth, brightness, DND, lock — logged as "Needs native build" until a native module is added), and Alarms/Timers.

### Phase 5 — Productivity ✅
- `/api/notes` — full CRUD with search, tags, colors, pinning.
- Notes screen with modal editor (color chips, delete-on-long-press).
- Reminders screen with modal creator (preset time chips, list, delete).
- All backed by MongoDB collections with proper indexes.

### Phase 6 — Personal Intelligence ✅ (deterministic aggregation; adaptive AI is Phase 7 territory)
- `/api/briefing` returns greeting, date, next-24h reminders, recent memories, recent chats, and per-user stats.
- Home shows live "Your day at a glance" card + full `/briefing` screen with orb + stat cards + section lists.

### Phase 7 — UX Polish ✅
- Micro-animations on orb (breathing), mic (pulse rings), buttons (haptic + spring).
- Reusable design system (GlassCard, PrimaryButton, TextField, SearchBar, EmptyState, SectionRow, Skeleton, SettingsHeader, AuroraBackground, SaraOrb, MicButton).
- Accessibility: color contrast preserved across all 3 themes; testIDs on every interactive element.
- Offline banner (`NetInfo`) sits above all content when connection drops.

### Phase 8 — Production Foundations ✅ (readiness plumbing; ongoing CI/monitoring is deploy-time)
- Global `ErrorBoundary` prevents white-screen crashes.
- Pydantic input validation on every request; MongoDB `_id` never leaked; timezone-aware UTC timestamps everywhere.
- CORS locked down at middleware layer; JWT + Emergent session TTL cleanup via Mongo TTL index.
- Permissions declared in `app.json` (iOS `infoPlist` usage descriptions + Android `permissions`) so the app is App Store / Play Store publish-ready.

## Explicit Runtime Notes
- **Expo Go limitations**: `expo-speech-recognition`, device controls (flashlight/wifi/etc.), background wake word, floating assistant, and OCR all require a **development / production native build**. The intents are still recorded and the UI is functional; only execution is deferred.
- **AI provider**: The user must configure their own open-source LLM endpoint in Settings › AI Provider before the chat endpoint returns responses. Emergent does not proxy or store keys.

## API Surface (final)
- `GET  /api/health`
- `GET  /api/ai/providers`
- `POST /api/auth/register|login|google/session|logout`
- `GET  /api/auth/me`
- `GET/PATCH /api/profile`
- `GET/PATCH /api/settings`
- `GET/POST/PATCH/DELETE /api/memories[/{id}]`
- `GET/POST/DELETE /api/history[/{id}]`
- `GET/POST/DELETE /api/reminders[/{id}]`
- `GET/POST/PATCH/DELETE /api/notes[/{id}]`
- `POST /api/chat`
- `GET  /api/briefing`
- `GET/POST /api/device/commands`
- `GET/POST/DELETE /api/device/comms[/{id}]`

## Test Data
Test account credentials + Google-flow notes in `/app/memory/test_credentials.md`.
