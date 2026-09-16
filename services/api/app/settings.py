from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
LOCAL_ENV_FILE = PROJECT_ROOT / ".env.local"


def _load_local_env() -> None:
    """Load local-only settings without overriding exported environment values."""
    if not LOCAL_ENV_FILE.exists():
        return

    for raw_line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


_load_local_env()


@dataclass(frozen=True)
class OpenAIConfig:
    api_key: str
    base_url: str
    model: str
    timeout_seconds: float

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.model)


def get_openai_config() -> OpenAIConfig:
    return OpenAIConfig(
        api_key=os.getenv("OPENAI_API_KEY", "").strip(),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/"),
        model=os.getenv("OPENAI_MODEL", "gpt-5.5").strip() or "gpt-5.5",
        timeout_seconds=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "60")),
    )


def openai_settings() -> dict[str, str | bool]:
    config = get_openai_config()
    return {
        "credential_configured": bool(config.api_key),
        "configured": config.configured,
        "model": config.model,
        "endpoint_configured": bool(config.base_url),
        "env_file": ".env.local",
    }
