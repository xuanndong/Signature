from sqlalchemy.orm import declarative_base

# Base for models
# Base class for models SQLAlchemy
Base = declarative_base()

from .key import Key
from .document import Document, Signature, SharedDocument
from .log import ActivityLog
from .verificate import Verification
from .auth import User

__all__ = ["Base", "User", "Key", "Document", "Signature", "SharedDocument", "ActivityLog", "Verification"]