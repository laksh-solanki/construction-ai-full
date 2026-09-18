import os
import sys
import mimetypes
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import settings
from app.supabase_client import (
    is_supabase_configured,
    ensure_storage_bucket,
    upload_file_to_supabase,
    DEFAULT_BUCKET
)

def sync_all():
    if not is_supabase_configured():
        print("[ERROR] Supabase is not configured in backend/.env!")
        return

    print(f"[*] Ensuring Supabase storage bucket '{DEFAULT_BUCKET}' exists...")
    if not ensure_storage_bucket(DEFAULT_BUCKET):
        print("[ERROR] Could not initialize storage bucket on Supabase.")
        return

    base_dir = Path(__file__).resolve().parent
    uploads_dir = base_dir / "uploads"
    reports_dir = base_dir / "generated_reports"

    # 1. Sync Photos
    photo_count = 0
    if uploads_dir.exists():
        print(f"\n[+] Syncing evidence photos from {uploads_dir.name}...")
        for p in uploads_dir.glob("*"):
            if p.name == ".gitkeep" or p.is_dir():
                continue
            ctype, _ = mimetypes.guess_type(str(p))
            ctype = ctype or "image/jpeg"
            with open(p, "rb") as f:
                data = f.read()
            url = upload_file_to_supabase(data, f"photos/{p.name}", content_type=ctype)
            if url:
                photo_count += 1
                print(f"  [OK] photos/{p.name}")

    # 2. Sync Documents / PDFs
    doc_count = 0
    if reports_dir.exists():
        print(f"\n[+] Syncing PDF reports from {reports_dir.name}...")
        for r in reports_dir.glob("*"):
            if r.name == ".gitkeep" or r.is_dir():
                continue
            ctype, _ = mimetypes.guess_type(str(r))
            ctype = ctype or "application/pdf"
            with open(r, "rb") as f:
                data = f.read()
            url = upload_file_to_supabase(data, f"documents/{r.name}", content_type=ctype)
            if url:
                doc_count += 1
                print(f"  [OK] documents/{r.name}")

    print(f"\n=======================================================")
    print(f"[SUCCESS] Storage synchronization complete!")
    print(f"  - Total Photos uploaded: {photo_count}")
    print(f"  - Total Documents/PDFs uploaded: {doc_count}")
    print(f"  - Bucket: '{DEFAULT_BUCKET}'")
    print(f"=======================================================")

if __name__ == "__main__":
    sync_all()
