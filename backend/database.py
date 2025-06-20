from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fire_detection.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class FireDetection(Base):
    __tablename__ = "fire_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    confidence = Column(Integer, nullable=False)
    brightness = Column(Float)
    scan = Column(Float)
    track = Column(Float)
    acq_date = Column(String, nullable=False)
    acq_time = Column(String, nullable=False)
    satellite = Column(String, nullable=False)
    instrument = Column(String, nullable=False)
    version = Column(String)
    bright_t31 = Column(Float)
    frp = Column(Float)
    daynight = Column(String)
    type = Column(Integer)
    source = Column(String, nullable=False)  # 'MODIS', 'VIIRS', 'USER_REPORTED'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FirePrediction(Base):
    __tablename__ = "fire_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # 'LOW', 'MEDIUM', 'HIGH'
    model_version = Column(String, nullable=False)
    features_used = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserFireReport(Base):
    __tablename__ = "user_fire_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text)
    reporter_name = Column(String)
    reporter_contact = Column(String)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()