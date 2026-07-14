"""AI chat routes — proxies to the user's configured open-source LLM provider.

Supported wire formats:
  - Ollama native  (POST {base}/api/chat)             for provider="ollama"
  - OpenAI-compat  (POST {base}/chat/completions)     for openrouter, vllm, lm_studio, llama_cpp

The provider itself is defined in user Settings; no keys are stored server-side.
Requests time out at 60s; errors bubble back as 502 with a friendly message.
"""
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.deps import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    save_history: bool = True


class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str
    history_id: str | None = None


async def _get_provider_config(user_id: str) -> dict[str, Any]:
    db = get_db()
    s = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=400, detail="Settings not configured")
    return {
        "provider": s.get("ai_provider", "ollama"),
        "base_url": (s.get("ai_provider_base_url") or "").rstrip("/"),
        "model": s.get("ai_provider_model") or "",
    }


async def _call_ollama(base: str, model: str, messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{base}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
        )
        r.raise_for_status()
        data = r.json()
        return (data.get("message") or {}).get("content", "") or data.get("response", "")


async def _call_openai_compat(base: str, model: str, messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{base}/chat/completions",
            json={"model": model, "messages": messages, "stream": False},
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
        choices = data.get("choices") or []
        if not choices:
            return ""
        return (choices[0].get("message") or {}).get("content", "")


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    cfg = await _get_provider_config(user["user_id"])
    if not cfg["base_url"] or not cfg["model"]:
        raise HTTPException(
            status_code=400,
            detail="AI provider not configured. Set base URL and model in Settings.",
        )

    payload = [m.model_dump() for m in body.messages]
    try:
        if cfg["provider"] == "ollama":
            reply = await _call_ollama(cfg["base_url"], cfg["model"], payload)
        else:
            reply = await _call_openai_compat(cfg["base_url"], cfg["model"], payload)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    reply = (reply or "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="AI provider returned empty response")

    history_id: str | None = None
    if body.save_history:
        last_user = next((m.content for m in reversed(body.messages) if m.role == "user"), "")
        db = get_db()
        history_id = f"hist_{uuid.uuid4().hex[:12]}"
        await db.history.insert_one({
            "history_id": history_id,
            "user_id": user["user_id"],
            "title": (last_user[:60] or "Conversation") + ("…" if len(last_user) > 60 else ""),
            "snippet": reply[:140],
            "turns": len(body.messages) + 1,
            "created_at": datetime.now(timezone.utc),
        })

    return ChatResponse(
        reply=reply,
        provider=cfg["provider"],
        model=cfg["model"],
        history_id=history_id,
    )
