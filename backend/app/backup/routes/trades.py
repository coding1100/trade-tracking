from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Trade
from typing import List
import yfinance as yf
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
    # Fetch the current price using yfinance
    try:
        ticker = yf.Ticker(trade.ticker)
        history = ticker.history(period="1d")  # Fetch latest day data
        current_price = history['Close'].iloc[-1]  # Extract the latest closing price
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching price for ticker {trade.ticker}: {str(e)}")
    
    # Calculate Unrealized PNL
    #unrealized_pnl = (current_price - trade.price) * trade.units

    # Create a new trade
    new_trade = Trade(
        date_of_trade=trade.date_of_trade,
        ticker=trade.ticker,
        strategy_id=trade.strategy_id,
        time_horizon=trade.time_horizon,
        price=trade.price,
        units=trade.units,
        qty=trade.units,
        current_price=current_price,  # Updated with the fetched price
        open_qty=trade.units,  # Set open_qty equal to qty initially
        pnl=0,  # Unrealized PNL
        unrealised_pnl=0
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

    # Update fields dynamically if they are present in the update payload
    update_fields = [
        "date_of_trade",
        "ticker",
        "strategy_id",
        "time_horizon",
        "price",
        "units",
        "qty",
        "current_price",
        "open_qty",
        "matched_trade_ids",
        "pnl",
        "realised_pnl",
        "unrealised_pnl",
    ]

    for field in update_fields:
        if getattr(trade, field, None) is not None:
            setattr(existing_trade, field, getattr(trade, field))

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
    trade_ids: List[int]

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

    # Initialize PnL and matching logic
    matched_qty = min(abs(trade1.open_qty), abs(trade2.open_qty))
    realised_pnl = (trade2.price - trade1.price) * matched_qty

    # Update for perfect offset
    if trade1.open_qty + trade2.open_qty == 0:
        trade1.matched_trade_ids = str(trade2.id)
        trade2.matched_trade_ids = str(trade1.id)

        trade1.pnl = 0  # Earlier trade has 0 PnL
        trade2.pnl = realised_pnl  # Later trade has realised PnL
        trade2.realised_pnl = realised_pnl  # Later trade has realised PnL

        trade1.open_qty = 0
        trade2.open_qty = 0

    # Partial match
    else:
        if abs(trade1.open_qty) < abs(trade2.open_qty):
            # Trade1 fully matched
            trade1.matched_trade_ids = str(trade2.id)
            trade1.pnl = 0
            trade2.pnl = realised_pnl

            trade2.open_qty += trade1.open_qty  # Remaining open quantity
            trade1.open_qty = 0

            # Update unrealised PnL for the remaining quantity in trade2
            trade2.unrealised_pnl = (trade2.current_price - trade2.price) * trade2.open_qty

        else:
            # Trade2 fully matched
            trade2.matched_trade_ids = str(trade1.id)
            trade2.pnl = 0
            trade1.pnl = realised_pnl

            trade1.open_qty += trade2.open_qty  # Remaining open quantity
            trade2.open_qty = 0

            # Update unrealised PnL for the remaining quantity in trade1
            trade1.unrealised_pnl = (trade1.current_price - trade1.price) * trade1.open_qty

    # Commit updates
    db.commit()
    db.refresh(trade1)
    db.refresh(trade2)

    return {
        "message": "Trades matched and updated.",
        "updated_trades": [jsonable_encoder(trade1), jsonable_encoder(trade2)],
    }

