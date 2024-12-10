from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Date
from app.database import Base

class Strategy(Base):
    __tablename__ = "strategies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)


class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(255))  # Timestamp when the trade was created
    date_of_trade = Column(Date, nullable=False)  # Actual trade date
    ticker = Column(String(255), nullable=False)  # Stock ticker
    strategy_id = Column(Integer, ForeignKey("strategies.id"))  # Foreign key to strategies
    time_horizon = Column(Enum("Short", "Mid", "Long"))  # Duration of the trade
    price = Column(Float, nullable=False)  # Price at which the trade was executed
    units = Column(Float, nullable=False)  # Total quantity of the trade
    qty = Column(Float, nullable=False)
    current_price = Column(Float, default=0.0)  # Current market price
    open_qty = Column(Float, default=0.0)  # Remaining quantity
    matched_trade_ids = Column(String(255), nullable=True)  # Matched trades (comma-separated IDs)
    pnl = Column(Float, default=0.0)
    realised_pnl = Column(Float, default=0.0)  # Profit/Loss for matched trades
    unrealised_pnl = Column(Float, default=0.0)  # Unrealised PnL for open trades

    def calculate_unrealised_pnl(self):
        """
        Calculate unrealised PnL:
        (Current Price - Trade Price) * Open Quantity
        """
        return (self.current_price - self.price) * self.open_qty

    def update_trade(self, current_price: float):
        """
        Update trade details when the current price changes.
        This recalculates the unrealised PnL.
        """
        self.current_price = current_price
        self.unrealised_pnl = self.calculate_unrealised_pnl()

    def match_with_trade(self, other_trade):
        """
        Match this trade with another trade. Updates:
        - matched_trade_ids
        - realised_pnl for both trades
        - open_qty for both trades
        """
        if self.ticker != other_trade.ticker:
            raise ValueError("Trades must have the same ticker to be matched.")

        # Offset quantities
        smaller_qty = min(abs(self.open_qty), abs(other_trade.open_qty))
        larger_trade, smaller_trade = (
            (self, other_trade)
            if abs(self.open_qty) > abs(other_trade.open_qty)
            else (other_trade, self)
        )

        # Update matched trade IDs
        self.matched_trade_ids = (
            f"{self.matched_trade_ids},{other_trade.id}"
            if self.matched_trade_ids
            else str(other_trade.id)
        )
        other_trade.matched_trade_ids = (
            f"{other_trade.matched_trade_ids},{self.id}"
            if other_trade.matched_trade_ids
            else str(self.id)
        )

        # Update realised PnL
        smaller_trade.realised_pnl = (
            smaller_qty * (other_trade.price - self.price)
        )
        smaller_trade.open_qty = 0

        # Adjust larger trade's open_qty
        larger_trade.open_qty -= smaller_qty

        # Recalculate unrealised PnL
        self.unrealised_pnl = self.calculate_unrealised_pnl()
        other_trade.unrealised_pnl = other_trade.calculate_unrealised_pnl()
