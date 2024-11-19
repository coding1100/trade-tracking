from pydantic import BaseModel
from typing import Optional
from datetime import date


# Trade Schemas
class TradeBase(BaseModel):
    date_of_trade: str
    ticker: str
    strategy_id: int
    time_horizon: str
    price: float
    units: float
    qty: Optional[float] = 0.0
    current_price: Optional[float] = 0.0
    open_qty: Optional[float] = 0.0
    matched_trade_ids: Optional[str] = ""
    pnl: Optional[float] = 0.0
    realised_pnl: Optional[float] = 0.0
    unrealised_pnl: Optional[float] = 0.0    


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    date_of_trade: Optional[str] = None
    ticker: Optional[str] = None
    strategy_id: Optional[int] = None
    time_horizon: Optional[str] = None
    price: Optional[float] = None
    units: Optional[float] = None
    qty: Optional[float] = None
    current_price: Optional[float] = None
    open_qty: Optional[float] = None
    matched_trade_ids: Optional[str] = None
    pnl: Optional[float] = None
    realised_pnl: Optional[float] = None
    unrealised_pnl: Optional[float] = None


class TradeResponse(BaseModel):
    id: int
    date_of_trade: date  # Keep as `date`
    ticker: str
    strategy_id: int
    time_horizon: str
    price: float
    units: float
    qty: float
    current_price: Optional[float] = 0.0
    open_qty: Optional[float] = 0.0
    matched_trade_ids: Optional[str] = ""
    pnl: Optional[float] = 0.0
    realised_pnl: Optional[float] = 0.0
    unrealised_pnl: Optional[float] = 0.0

    class Config:
        orm_mode = True
        json_encoders = {
            date: lambda v: v.strftime("%Y-%m-%d")  # Automatically serialize `date`
        }


# Strategy Schemas
class StrategyBase(BaseModel):
    name: str


class StrategyCreate(StrategyBase):
    pass


class StrategyResponse(StrategyBase):
    id: int

    class Config:
        from_attributes = True
