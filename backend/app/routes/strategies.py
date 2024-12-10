from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Strategy
from app.auth import get_current_user
from app.schemas import StrategyBase, StrategyCreate, StrategyResponse


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_strategies(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Use dependency
):
    user_id = current_user["user_id"]
    strategies = db.query(Strategy).filter(Strategy.user_id == user_id).all()
    return strategies

@router.post("/")
def add_strategy(strategy: StrategyBase, db: Session = Depends(get_db)):
    new_strategy = Strategy(name=strategy.name, user_id=strategy.user_id)
    db.add(new_strategy)
    db.commit()
    db.refresh(new_strategy)
    return new_strategy

@router.delete("/{strategy_id}")
def delete_strategy(strategy_id: int, db: Session = Depends(get_db)):
    """
    Delete a strategy by ID.
    """
    existing_trade = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(existing_trade)
    db.commit()
    return {"detail": f"Strategy with ID {strategy_id} deleted successfully"}
