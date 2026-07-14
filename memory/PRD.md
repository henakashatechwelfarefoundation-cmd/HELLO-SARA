# Hello Sara — Product Requirements (Living Document)

## Overview
A private, model-agnostic AI voice-assistant mobile app built with Expo + React Native, backed by FastAPI + MongoDB. Delivered in 8 phases per the source spec. This iteration ships **Phase 1 — Foundation** in full.

## Vision
A premium, futuristic AI companion that respects user privacy, runs against user-owned open-source LLMs, and evolves phase-by-phase without breaking prior data.

## Phase 1 Scope (Delivered)
- Modular backend architecture (`core/`, `routes/`, `services/`, `models/`) — FastAPI + Motor + MongoDB.
- Dual authentication: JWT email/password (bcrypt) **and** Emergent-managed Google Sign-In (session token). Both tokens accepted by the same `get_current_user` dependency.
- Model-agnostic AI provider registry (Ollama, llama.cpp, vLLM, LM Studio, OpenRouter) exposed via `/api/ai/providers`. **No proprietary AI is integrated.**
- MongoDB collections + indexes: `users`, `user_sessions` (TTL), `settings`, `memories`, `history`, `reminders`.
- Three-theme design system (Dark, AMOLED, Light) with brand accents Deep Purple `#7C3AED` + Electric Cyan `#06B6D4`, glassmorphic surfaces, aurora backdrops, breathing SaraOrb, glowing MicButton.
- Screens: Splash router, 6-slide Onboarding, Auth (Google + Email), Home (animated Sara + mic), Memory (search + filter chips + empty state), History (SectionList by day + empty state), Settings hub with sub-screens: Appearance, Voice, Language, AI Provider, Permissions, Privacy Policy, Terms & Conditions, About, Support.
- Reusable component library: GlassCard, PrimaryButton, TextField, SearchBar, EmptyState, SectionRow, Skeleton, AuroraBackground, SaraOrb, MicButton, SettingsHeader.

## Explicit Non-Goals for Phase 1
- Speech recognition, TTS, wake word, floating assistant → Phase 2
- AI reasoning, memory synthesis, web search → Phase 3
- Communication & device control → Phase 4
- Notes/OCR/PDF, Calendar, Cloud storage → Phase 5
- Personalization, proactive AI, automation → Phase 6
- Premium avatar, offline, performance polish → Phase 7
- Production security, CI/CD, monitoring → Phase 8

## API Surface (v1)
- `GET  /api/health`
- `GET  /api/ai/providers`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google/session`
- `GET  /api/auth/me`
- `POST /api/auth/logout`
- `GET/PATCH /api/profile`
- `GET/PATCH /api/settings`
- `GET/POST/PATCH/DELETE /api/memories[/{id}]`
- `GET/POST/DELETE /api/history[/{id}]`
- `GET/POST/DELETE /api/reminders[/{id}]`

## Data Model Highlights
- Custom string IDs (`user_id`, `memory_id`, `history_id`, `reminder_id`) — never `_id` exposed.
- Timezone-aware UTC timestamps everywhere.
- Session TTL index (`user_sessions.expires_at`) for hands-free cleanup.

## Success Criteria (Phase 1)
1. Fresh user can register, land in onboarding, complete it, and reach Home.
2. Auth persists across app restarts (secure storage on mobile, localStorage on web).
3. Theme changes apply instantly across all screens and persist.
4. Memory / History empty states render; created items appear in list.
5. Backend passes health-check + provider list + JWT round-trip + CRUD tests.
