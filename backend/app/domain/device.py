"""Device domain entity and name derivation."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Device:
    id: str
    name: str
    created_at: str
    last_used_at: str


def derive_device_name(user_agent: str) -> str:
    """Derive a friendly name like "Chrome no Android" from a User-Agent."""
    ua = user_agent or ""

    if "Android" in ua:
        os_name = "Android"
    elif "iPhone" in ua or "iPad" in ua:
        os_name = "iOS"
    elif "Macintosh" in ua or "Mac OS" in ua:
        os_name = "macOS"
    elif "Windows" in ua:
        os_name = "Windows"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "desconhecido"

    if "Edg" in ua:
        browser = "Edge"
    elif "Chrome" in ua:
        browser = "Chrome"
    elif "Firefox" in ua:
        browser = "Firefox"
    elif "Safari" in ua:
        browser = "Safari"
    else:
        browser = "Navegador"

    return f"{browser} no {os_name}"
