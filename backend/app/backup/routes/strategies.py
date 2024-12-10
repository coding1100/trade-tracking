from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Strategy
from app.schemas import StrategyBase, StrategyCreate, StrategyResponse


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_strategies(db: Session = Depends(get_db)):
    strategies = db.query(Strategy).all()
    return strategies

@router.post("/")
def add_strategy(strategy: StrategyBase, db: Session = Depends(get_db)):
    new_strategy = Strategy(name=strategy.name)
    db.add(new_strategy)
    db.commit()
    db.refresh(new_strategy)
    return new_strategy
