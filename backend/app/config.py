from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("WEREWOLF_HOST", "127.0.0.1")
    port: int = int(os.getenv("WEREWOLF_PORT", "8765"))
    model_name: str = os.getenv("WEREWOLF_MODEL", "Qwen/Qwen3-8B")
    api_base: str = os.getenv("SILICONFLOW_API_BASE", "https://api.siliconflow.cn/v1")
    api_key: str = os.getenv("SILICONFLOW_API_KEY", "")
    room_size: int = int(os.getenv("WEREWOLF_ROOM_SIZE", "6"))
    debug: bool = os.getenv("WEREWOLF_DEBUG", "false").lower() == "true"


def get_settings() -> Settings:
    return Settings()