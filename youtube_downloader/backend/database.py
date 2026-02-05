"""Database setup and session management."""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Run database migrations for existing tables."""
    with engine.connect() as conn:
        # Check and add is_deleted column
        result = conn.execute(text("PRAGMA table_info(segments)"))
        columns = [row[1] for row in result]

        if 'is_deleted' not in columns:
            conn.execute(text("ALTER TABLE segments ADD COLUMN is_deleted BOOLEAN DEFAULT 0"))
            conn.commit()

        if 'deleted_from_speaker_id' not in columns:
            conn.execute(text("ALTER TABLE segments ADD COLUMN deleted_from_speaker_id VARCHAR"))
            conn.commit()


def init_db():
    """Initialize database tables."""
    from .models import project, speaker, segment  # noqa
    Base.metadata.create_all(bind=engine)
    # Run migrations for existing databases
    run_migrations()
