from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Trade
from app.schemas import TradeCreate, TradeUpdate, TradeResponse
from pydantic import BaseModel, validator
from fastapi.encoders import jsonable_encoder

router = APIRouter()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_trades(db: Session = Depends(get_db)):
    """
    Fetch all trades.
    """
    trades = db.query(Trade).all()
    # Convert the `date_of_trade` field to string for each trade
    for trade in trades:
        trade.date_of_trade = trade.date_of_trade.strftime('%Y-%m-%d')
    return trades


@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    """
    Fetch a specific trade by ID.
    """
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # Manually convert date_of_trade to string
    trade_dict = trade.__dict__.copy()
    trade_dict['date_of_trade'] = trade.date_of_trade.strftime('%Y-%m-%d')

    return trade_dict



@router.post("/", response_model=TradeResponse)
def create_trade(trade: TradeCreate, db: Session = Depends(get_db)):
    new_trade = Trade(
        date_of_trade=trade.date_of_trade,
        ticker=trade.ticker,
        strategy_id=trade.strategy_id,
        time_horizon=trade.time_horizon,
        price=trade.price,
        units=trade.units,
        qty=trade.qty,
        current_price=trade.current_price,
        open_qty=trade.qty,  # Set open_qty equal to qty initially
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade


@router.put("/{trade_id}", response_model=TradeResponse)
def update_trade(trade_id: int, trade: TradeUpdate, db: Session = Depends(get_db)):
    existing_trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    if trade.current_price is not None:
        existing_trade.current_price = trade.current_price
    if trade.open_qty is not None:
        existing_trade.open_qty = trade.open_qty
    if trade.matched_trade_ids is not None:
        existing_trade.matched_trade_ids = trade.matched_trade_ids
    if trade.pnl is not None:
        existing_trade.pnl = trade.pnl  
    if trade.realised_pnl is not None:
        existing_trade.realised_pnl = trade.realised_pnl
    if trade.unrealised_pnl is not None:
        existing_trade.unrealised_pnl = trade.unrealised_pnl

    db.commit()
    db.refresh(existing_trade)
    return existing_trade


@router.delete("/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    """
    Delete a trade by ID.
    """
    existing_trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(existing_trade)
    db.commit()
    return {"detail": f"Trade with ID {trade_id} deleted successfully"}


class CompareTradesRequest(BaseModel):
    trade_ids: list[int]

    @validator("trade_ids")
    def validate_trade_ids(cls, value):
        if len(value) != 2:
            raise ValueError("Exactly two trades must be selected for comparison.")
        return value


@router.post("/compare")
def compare_trades(payload: CompareTradesRequest, db: Session = Depends(get_db)):
    """
    Compare two trades and update matched trades and PnL.
    """
    trade_ids = payload.trade_ids
    trade1 = db.query(Trade).filter(Trade.id == trade_ids[0]).first()
    trade2 = db.query(Trade).filter(Trade.id == trade_ids[1]).first()

    if not trade1 or not trade2:
        raise HTTPException(status_code=404, detail="One or both trades not found.")

    if trade1.ticker != trade2.ticker:
        raise HTTPException(status_code=400, detail="Trades must have the same ticker for comparison.")

    if abs(trade1.open_qty + trade2.open_qty) == 0:  # Perfect offset
        trade1.matched_trade_ids = str(trade2.id)
        trade2.matched_trade_ids = str(trade1.id)
        trade2.pnl = (trade2.price - trade1.price) * trade2.units
        trade1.pnl = 0

        trade1.open_qty = 0
        trade2.open_qty = 0

    else:  # Partial match
        smaller_qty = min(abs(trade1.open_qty), abs(trade2.open_qty))
        if abs(trade1.open_qty) < abs(trade2.open_qty):
            trade1.matched_trade_ids = str(trade2.id)
            trade1.pnl = (trade2.price - trade1.price) * smaller_qty
            trade2.open_qty += trade1.open_qty
            trade1.open_qty = 0
        else:
            trade2.matched_trade_ids = str(trade1.id)
            trade2.pnl = (trade2.price - trade1.price) * smaller_qty
            trade1.open_qty += trade2.open_qty
            trade2.open_qty = 0

    db.commit()
    db.refresh(trade1)
    db.refresh(trade2)
    return {"message": "Trades matched and updated.", "updated_trades": [trade1, trade2]}
