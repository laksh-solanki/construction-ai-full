import time
import threading
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from .db import settings
import logging

logger = logging.getLogger("buildsight.security")

class RateLimiter:
    """
    Thread-safe in-memory rate limiter supporting:
    1. Sliding window rate limiting for public and authenticated routes.
    2. Combined per-IP and per-account exponential backoff for authentication routes.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # key -> list of timestamp floats
        self._requests: Dict[str, List[float]] = {}
        # key -> (attempt_count, last_attempt_timestamp, backoff_until_timestamp)
        self._auth_attempts: Dict[str, Tuple[int, float, float]] = {}

    def _clean_old_requests(self, key: str, window: float, now: float):
        cutoff = now - window
        if key in self._requests:
            self._requests[key] = [t for t in self._requests[key] if t > cutoff]
            if not self._requests[key]:
                del self._requests[key]

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: float) -> Tuple[bool, int]:
        """
        Check if key has exceeded max_requests within window_seconds.
        Returns (is_allowed, retry_after_seconds).
        """
        if not settings.RATE_LIMIT_ENABLED:
            return True, 0

        now = time.time()
        with self._lock:
            self._clean_old_requests(key, window_seconds, now)
            history = self._requests.get(key, [])
            if len(history) >= max_requests:
                oldest = history[0]
                retry_after = max(1, int(window_seconds - (now - oldest)))
                return False, retry_after

            history.append(now)
            self._requests[key] = history
            return True, 0

    def check_auth_backoff(self, key: str) -> Tuple[bool, int]:
        """
        Check if an account or IP is currently within an exponential backoff period.
        Returns (is_allowed, retry_after_seconds).
        """
        if not settings.RATE_LIMIT_ENABLED:
            return True, 0

        now = time.time()
        with self._lock:
            state = self._auth_attempts.get(key)
            if not state:
                return True, 0

            attempts, last_time, backoff_until = state
            if now < backoff_until:
                retry_after = max(1, int(backoff_until - now))
                return False, retry_after
            return True, 0

    def record_auth_failure(self, key: str):
        """
        Increment failed attempt count and compute exponential backoff:
        backoff = min(300, base_backoff * (2 ** (attempts - 1)))
        """
        if not settings.RATE_LIMIT_ENABLED:
            return

        now = time.time()
        with self._lock:
            state = self._auth_attempts.get(key)
            attempts = state[0] + 1 if state else 1
            
            # Apply backoff once attempts exceed threshold or starting from attempt 2
            base = settings.RATE_LIMIT_AUTH_BASE_BACKOFF_SECONDS
            backoff_duration = min(300, base * (2 ** max(0, attempts - settings.RATE_LIMIT_AUTH_MAX_ATTEMPTS)))
            if attempts < settings.RATE_LIMIT_AUTH_MAX_ATTEMPTS:
                backoff_until = now  # No backoff until max attempts exceeded
            else:
                backoff_until = now + backoff_duration

            self._auth_attempts[key] = (attempts, now, backoff_until)
            logger.warning(f"Auth failure recorded for key '{key}'. Total attempts: {attempts}. Backoff until: {backoff_until}")

    def record_auth_success(self, key: str):
        """
        Reset auth failure counter on successful login.
        """
        with self._lock:
            if key in self._auth_attempts:
                del self._auth_attempts[key]


# Global rate limiter instance
limiter = RateLimiter()

def get_client_ip(request: Request) -> str:
    """Safely determine client IP from request headers or socket."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the leftmost untrusted client IP
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def rate_limit_public(request: Request):
    """Dependency for public endpoints (e.g. /api/health)."""
    ip = get_client_ip(request)
    allowed, retry_after = limiter.check_rate_limit(
        key=f"pub:{ip}",
        max_requests=settings.RATE_LIMIT_PUBLIC_PER_MINUTE,
        window_seconds=60
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down.",
            headers={"Retry-After": str(retry_after), "X-RateLimit-Limit": str(settings.RATE_LIMIT_PUBLIC_PER_MINUTE)}
        )


def rate_limit_authenticated(request: Request):
    """Dependency for authenticated actions."""
    ip = get_client_ip(request)
    auth_header = request.headers.get("Authorization", "")
    key = f"auth_user:{auth_header[:32]}" if auth_header else f"auth_ip:{ip}"
    allowed, retry_after = limiter.check_rate_limit(
        key=key,
        max_requests=settings.RATE_LIMIT_AUTHENTICATED_PER_MINUTE,
        window_seconds=60
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for authenticated actions. Please try again shortly.",
            headers={"Retry-After": str(retry_after), "X-RateLimit-Limit": str(settings.RATE_LIMIT_AUTHENTICATED_PER_MINUTE)}
        )


def check_auth_rate_limit(request: Request, email: str = ""):
    """
    Check both IP-level rate limits and account-level exponential backoff
    prior to executing login logic.
    """
    ip = get_client_ip(request)
    
    # 1. Check IP general rate
    allowed_ip, retry_ip = limiter.check_rate_limit(
        key=f"auth_ip_win:{ip}",
        max_requests=settings.RATE_LIMIT_AUTH_MAX_ATTEMPTS * 3,
        window_seconds=settings.RATE_LIMIT_AUTH_WINDOW_SECONDS
    )
    if not allowed_ip:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts from this IP. Please retry in {retry_ip} seconds.",
            headers={"Retry-After": str(retry_ip)}
        )

    # 2. Check IP backoff
    allowed_ip_bo, retry_ip_bo = limiter.check_auth_backoff(f"ip:{ip}")
    if not allowed_ip_bo:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts from this IP. Please retry in {retry_ip_bo} seconds.",
            headers={"Retry-After": str(retry_ip_bo)}
        )

    # 3. Check Account backoff if email is provided
    if email:
        clean_email = email.strip().lower()
        allowed_acct, retry_acct = limiter.check_auth_backoff(f"acct:{clean_email}")
        if not allowed_acct:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed attempts for this account. Please retry in {retry_acct} seconds.",
                headers={"Retry-After": str(retry_acct)}
            )


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a secure random salt."""
    import hashlib
    import os
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{dk.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plain password against stored salt:hash string."""
    import hashlib
    try:
        salt, h = hashed_password.split(':', 1)
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return dk.hex() == h
    except Exception:
        return False
