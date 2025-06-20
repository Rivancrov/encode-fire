#!/usr/bin/env python3
"""Clear sample data from database"""

from database import SessionLocal, FireDetection, FirePrediction, UserFireReport

def clear_sample_data():
    db = SessionLocal()
    
    # Delete all existing data
    db.query(FireDetection).delete()
    db.query(FirePrediction).delete() 
    db.query(UserFireReport).delete()
    
    db.commit()
    db.close()
    
    print("✅ All sample data cleared from database")
    print("🔄 Ready for real NASA FIRMS data")

if __name__ == "__main__":
    clear_sample_data()