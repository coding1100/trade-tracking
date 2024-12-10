from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Replace the following with your actual database credentials
#DATABASE_URL = "mysql+pymysql://root:123456@localhost/u929767277_stock_app"
DATABASE_URL = "mysql+pymysql://root:@localhost/trade_tracker"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get a database session
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()