import logging
import requests
import jwt
from typing import Optional, Dict, Any
from .db import settings

logger = logging.getLogger("buildsight.supabase")

def is_supabase_configured() -> bool:
    """Returns True if Supabase URL and key are configured."""
    return bool(settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY))

def get_supabase_headers() -> Dict[str, str]:
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

def supabase_signup(email: str, password: str, name: str, role: str) -> Dict[str, Any]:
    """
    Register a new user directly in Supabase Auth (GoTrue).
    Falls back to mock/local response if Supabase is unconfigured.
    """
    if not is_supabase_configured():
        return {
            "success": True,
            "provider": "local",
            "message": "Supabase not configured; registered in local database."
        }

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/signup"
    payload = {
        "email": email,
        "password": password,
        "data": {
            "name": name,
            "role": role
        }
    }
    try:
        res = requests.post(url, headers=get_supabase_headers(), json=payload, timeout=10)
        if res.status_code in (200, 201):
            data = res.json()
            return {
                "success": True,
                "provider": "supabase",
                "user": data.get("user", data),
                "session": data.get("session")
            }
        else:
            err = res.json().get("msg") or res.json().get("error_description") or res.text
            logger.warning(f"Supabase signup returned {res.status_code}: {err}")
            return {"success": False, "error": err}
    except Exception as exc:
        logger.error(f"Supabase signup connection error: {exc}")
        return {"success": False, "error": str(exc)}

def supabase_login(email: str, password: str) -> Dict[str, Any]:
    """
    Authenticate a user via Supabase Auth GoTrue password grant.
    """
    if not is_supabase_configured():
        return {"success": False, "fallback_to_local": True}

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
    payload = {
        "email": email,
        "password": password
    }
    try:
        res = requests.post(url, headers=get_supabase_headers(), json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return {
                "success": True,
                "access_token": data.get("access_token"),
                "refresh_token": data.get("refresh_token"),
                "user": data.get("user")
            }
        else:
            err = res.json().get("error_description") or res.json().get("msg") or "Invalid credentials"
            return {"success": False, "error": err}
    except Exception as exc:
        logger.error(f"Supabase login connection error: {exc}")
        return {"success": False, "fallback_to_local": True}

def supabase_reset_password(email: str) -> Dict[str, Any]:
    """
    Initiate password recovery email via Supabase Auth.
    """
    if not is_supabase_configured():
        return {
            "success": True,
            "message": "Password reset email simulated for local development."
        }

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/recover"
    payload = {"email": email}
    try:
        res = requests.post(url, headers=get_supabase_headers(), json=payload, timeout=10)
        if res.status_code in (200, 204):
            return {"success": True, "message": "Password reset email dispatched via Supabase."}
        else:
            err = res.json().get("msg") or res.text
            return {"success": False, "error": err}
    except Exception as exc:
        logger.error(f"Supabase recover connection error: {exc}")
        return {"success": False, "error": str(exc)}

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Supabase JWT token or demo bearer token.
    """
    if token.startswith("demo-"):
        # Format: demo-{user_id}-{role}
        parts = token.split("-")
        if len(parts) >= 3:
            return {"sub": parts[1], "role": parts[2], "type": "demo"}
        return {"sub": "1", "role": "ADMIN", "type": "demo"}

    if settings.SUPABASE_JWT_SECRET:
        try:
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return decoded
        except Exception as err:
            logger.warning(f"JWT verification failed: {err}")

    # Alternatively query Supabase /auth/v1/user
    if is_supabase_configured():
        try:
            res = requests.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={"apikey": settings.SUPABASE_KEY, "Authorization": f"Bearer {token}"},
                timeout=5
            )
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass

    return None

# -------------------------------------------------------------
# Supabase Storage Integration (Photos & Documents)
# -------------------------------------------------------------
DEFAULT_BUCKET = "buildsight-media"

def ensure_storage_bucket(bucket_name: str = DEFAULT_BUCKET, is_public: bool = True) -> bool:
    """Ensure the Supabase storage bucket exists. Creates it as public if missing."""
    if not is_supabase_configured():
        return False
    url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
    headers = get_supabase_headers()
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            existing = [b.get("id") or b.get("name") for b in res.json()]
            if bucket_name in existing:
                return True
        # Create bucket
        payload = {"id": bucket_name, "name": bucket_name, "public": is_public}
        create_res = requests.post(url, headers=headers, json=payload, timeout=10)
        return create_res.status_code in (200, 201)
    except Exception as exc:
        logger.error(f"Error ensuring storage bucket '{bucket_name}': {exc}")
        return False

def upload_file_to_supabase(
    file_bytes: bytes,
    storage_path: str,
    content_type: str = "image/jpeg",
    bucket_name: str = DEFAULT_BUCKET
) -> Optional[str]:
    """Uploads a file directly to Supabase Storage and returns its public URL."""
    if not is_supabase_configured():
        return None
    
    clean_path = storage_path.lstrip('/')
    url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket_name}/{clean_path}"
    headers = {
        **get_supabase_headers(),
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    try:
        res = requests.post(url, headers=headers, data=file_bytes, timeout=15)
        if res.status_code in (200, 201):
            public_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket_name}/{clean_path}"
            logger.info(f"Uploaded to Supabase Storage ({clean_path}): {public_url}")
            return public_url
        else:
            logger.warning(f"Supabase Storage upload failed ({res.status_code}): {res.text}")
            return None
    except Exception as exc:
        logger.error(f"Supabase Storage upload error: {exc}")
        return None

def get_storage_public_url(storage_path: str, bucket_name: str = DEFAULT_BUCKET) -> str:
    """Returns the direct public CDN URL for a file in Supabase Storage."""
    clean_path = storage_path.lstrip('/')
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket_name}/{clean_path}"

