from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Trade
from typing import List
import yfinance as yf
from app.schemas import TradeCreate, TradeUpdate, TradeResponse
from pydantic import BaseModel, validator
from fastapi.encoders import jsonable_encoder
from app.auth import get_current_user

router = APIRouter()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_trades(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch all trades for the logged-in user.
    """
    trades = db.query(Trade).filter(Trade.user_id == current_user["user_id"]).all()
    # Convert the `date_of_trade` field to string for each trade
    for trade in trades:
        trade.date_of_trade = trade.date_of_trade.strftime('%Y-%m-%d')
    return trades

@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch a specific trade by ID for the logged-in user.
    """
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user["user_id"]).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # Manually convert date_of_trade to string
    trade_dict = trade.__dict__.copy()
    trade_dict['date_of_trade'] = trade.date_of_trade.strftime('%Y-%m-%d')

    return trade_dict

@router.post("/", response_model=TradeResponse)
def create_trade(
    trade: TradeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new trade for the logged-in user.
    """
    try:
        ticker = yf.Ticker(trade.ticker)
        history = ticker.history(period="1d")
        current_price = history['Close'].iloc[-1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching price for ticker {trade.ticker}: {str(e)}")

    new_trade = Trade(
        user_id=current_user["user_id"],
        date_of_trade=trade.date_of_trade,
        ticker=trade.ticker,
        strategy_id=trade.strategy_id,
        time_horizon=trade.time_horizon,
        price=trade.price,
        units=trade.units,
        qty=trade.units,
        current_price=current_price,
        open_qty=trade.units,
        pnl=0,
        unrealised_pnl=0
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade


@router.delete("/{trade_id}")
def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a trade by ID for the logged-in user.
    """
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user["user_id"]).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(trade)
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
    Trades must have the same ticker, time horizon, and strategy.
    """
    trade_ids = sorted(payload.trade_ids)
    trade1 = db.query(Trade).filter(Trade.id == trade_ids[0]).first()
    trade2 = db.query(Trade).filter(Trade.id == trade_ids[1]).first()

    if not trade1 or not trade2:
        raise HTTPException(status_code=404, detail="One or both trades not found.")

    if trade1.ticker != trade2.ticker:
        raise HTTPException(status_code=400, detail="Trades must have the same ticker for comparison.")
    
    if trade1.time_horizon != trade2.time_horizon:
        raise HTTPException(status_code=400, detail="Trades must have the same time horizon for comparison.")
    
    if trade1.strategy_id != trade2.strategy_id:
        raise HTTPException(status_code=400, detail="Trades must belong to the same strategy for comparison.")

    # Initialize PnL and matching logic
    matched_qty = min(abs(trade1.open_qty), abs(trade2.open_qty))
    realised_pnl = (trade2.price - trade1.price) * matched_qty

    # Update for perfect offset
    if trade1.open_qty + trade2.open_qty == 0:
        trade1.matched_trade_ids = str(trade2.id)
        trade2.matched_trade_ids = str(trade1.id)

        trade1.pnl = 0  # Earlier trade has 0 PnL
        trade2.pnl = (trade2.current_price - trade2.price) * trade2.open_qty  # Later trade has PnL
        trade2.realised_pnl = (trade2.current_price - trade2.price) * trade2.open_qty  # Later trade has realised PnL

        trade1.open_qty = 0
        trade2.open_qty = 0

    # Partial match
    else:
        if abs(trade1.open_qty) < abs(trade2.open_qty):
            # Trade1 fully matched
            trade1.matched_trade_ids = str(trade2.id)
            trade1.pnl = 0
            #trade2.pnl = realised_pnl

            # Update unrealised PnL for the remaining quantity in trade2
            #trade2.unrealised_pnl = (trade2.current_price - trade2.price) * trade2.open_qty
            
            # Unrealized PNL = (Total Open Units×Current Price)−((Units of Trade 1×Price of Trade 1)+(Units of Trade 2×Price of Trade 2))
            total_open_qty = trade2.open_qty +  trade1.open_qty    
            trade2.unrealised_pnl = (total_open_qty * trade2.current_price)-((trade1.open_qty * trade1.price)+(trade2.open_qty * trade2.price)) 
            trade2.open_qty = total_open_qty  # Remaining open quantity
            trade1.open_qty = 0

        else:
            # Trade2 fully matched
            trade2.matched_trade_ids = str(trade1.id)
            trade2.pnl = 0
            #trade1.pnl = realised_pnl

            # Update unrealised PnL for the remaining quantity in trade1
            #trade1.unrealised_pnl = (trade1.current_price - trade1.price) * trade1.open_qty

            # Unrealized PNL = (Total Open Units×Current Price)−((Units of Trade 1×Price of Trade 1)+(Units of Trade 2×Price of Trade 2))
            total_open_qty = trade2.open_qty +  trade1.open_qty
            trade1.unrealised_pnl = (total_open_qty * trade1.current_price)-((trade1.open_qty * trade1.price)+(trade2.open_qty * trade2.price))            
            trade1.open_qty += trade2.open_qty  # Remaining open quantity
            trade2.open_qty = 0

    # Commit updates
    db.commit()
    db.refresh(trade1)
    db.refresh(trade2)

    return {
        "message": "Trades matched and updated.",
        "updated_trades": [jsonable_encoder(trade1), jsonable_encoder(trade2)],
    }


# Ensure this route is defined before any conflicting dynamic routes like "/{trade_id}"
@router.put("/update_prices")
def update_trades_prices(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update trades for the logged-in user with the latest current price from Yahoo Finance.
    """
    trades = db.query(Trade).filter(Trade.user_id == current_user["user_id"]).all()
    if not trades:
        raise HTTPException(status_code=404, detail="No trades found to update.")

    updated_trades = []
    for trade in trades:
        try:
            ticker = yf.Ticker(trade.ticker)
            history = ticker.history(period="1d")
            current_price = history['Close'].iloc[-1]

            trade.current_price = current_price
            trade.unrealised_pnl = (current_price - trade.price) * trade.open_qty
            updated_trades.append(trade)
        except Exception as e:
            print(f"Failed to update trade for ticker {trade.ticker}: {str(e)}")

    db.commit()
    return {
        "message": f"{len(updated_trades)} trades updated successfully.",
        "updated_trades": len(updated_trades),
    }

@router.put("/{trade_id}")
def update_trade(
    trade_id: int,
    trade: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a specific trade by ID for the logged-in user.
    """
    existing_trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user["user_id"]).first()
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")

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


