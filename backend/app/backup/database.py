from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Replace the following with your actual database credentials
DATABASE_URL = "mysql+pymysql://root:123456@localhost/u929767277_stock_app"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()
