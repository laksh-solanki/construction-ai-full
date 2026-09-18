from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

logger = logging.getLogger("buildsight.db")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./buildsight.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    YOLO_MODEL_PATH: str = "../ai-model/weights/best.pt"
    SECRET_KEY: str = "dev-secret"
    ENVIRONMENT: str = "development"
    
    # Rate Limiting Settings
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AUTH_MAX_ATTEMPTS: int = 5
    RATE_LIMIT_AUTH_WINDOW_SECONDS: int = 60
    RATE_LIMIT_AUTH_BASE_BACKOFF_SECONDS: int = 2
    RATE_LIMIT_PUBLIC_PER_MINUTE: int = 60
    RATE_LIMIT_AUTHENTICATED_PER_MINUTE: int = 300
    
    # File Upload Security Settings
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_IMAGE_EXTENSIONS: str = ".jpg,.jpeg,.png,.webp"

    # Supabase Integration Settings
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

if settings.ENVIRONMENT != "development" and settings.SECRET_KEY in ("dev-secret", "change-this-for-production", ""):
    logger.warning("INSECURE CONFIGURATION: SECRET_KEY is set to a default value in a non-development environment.")


def init_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            # Check if database needs creation
            import psycopg
            from urllib.parse import urlparse
            parsed = urlparse(db_url.replace("postgresql+psycopg://", "postgresql://"))
            db_name = parsed.path.lstrip('/') or 'buildsight'
            user = parsed.username or 'postgres'
            password = parsed.password or ''
            host = parsed.hostname or 'localhost'
            port = parsed.port or 5432
            
            # Connect to default postgres DB to check/create target database
            try:
                with psycopg.connect(host=host, port=port, user=user, password=password, dbname='postgres', autocommit=True) as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                        if not cur.fetchone():
                            cur.execute(f'CREATE DATABASE "{db_name}"')
                            logger.info(f"Created PostgreSQL database: {db_name}")
            except Exception as exc:
                logger.warning(f"Could not auto-create database {db_name}: {exc}")
                
            eng = create_engine(db_url)
            # Test connection
            with eng.connect() as conn:
                pass
            logger.info("Connected to PostgreSQL successfully")
            return eng
        except Exception as err:
            logger.error(f"PostgreSQL connection failed ({err}). Falling back to SQLite.")
            return create_engine("sqlite:///./buildsight.db", connect_args={"check_same_thread": False})
    else:
        return create_engine(db_url, connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {})

engine = init_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

