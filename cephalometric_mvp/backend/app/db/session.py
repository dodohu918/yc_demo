"""
Database session configuration for async SQLAlchemy.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

settings = get_settings()

# Determine if using SQLite
is_sqlite = "sqlite" in settings.async_database_url

# Create async engine with appropriate settings
engine_kwargs = {
    "echo": settings.debug,
    "future": True,
}

# SQLite-specific settings
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool

engine = create_async_engine(
    settings.async_database_url,
    **engine_kwargs,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
