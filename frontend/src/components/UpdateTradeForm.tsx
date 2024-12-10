import { useState } from "react";
import axios from "axios";

interface Trade {
  id: number;
  current_price: number;
  open_qty: number;
  matched_trade_ids?: string | null;
  pnl?: number;
}

interface UpdateTradeFormProps {
  tradeToUpdate: Trade;
  onFormSubmit: () => void;
}

const UpdateTradeForm: React.FC<UpdateTradeFormProps> = ({ tradeToUpdate, onFormSubmit }) => {
  const [trade, setTrade] = useState<Trade>(tradeToUpdate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const payload = {
        current_price: parseFloat(trade.current_price.toString()),
        open_qty: parseFloat(trade.open_qty.toString()),
        matched_trade_ids: trade.matched_trade_ids,
        pnl: trade.pnl ? parseFloat(trade.pnl.toString()) : null,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/${trade.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Trade updated successfully!");

      onFormSubmit(); // Callback for parent refresh
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Error updating trade:", error.response?.data || error.message);
        alert(`Error: ${error.response?.data?.detail || error.response?.data?.message || "Failed to update trade."}`);
      } else {
        console.error("Unknown error:", error);
        alert("An unknown error occurred. Please try again.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTrade({ ...trade, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="trade-form">
      <h2>Update Trade</h2>

      <div className="form-group">
        <label htmlFor="current_price">Current Price:</label>
        <input
          type="number"
          id="current_price"
          name="current_price"
          placeholder="Enter current price"
          value={trade.current_price}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="open_qty">Open Qty:</label>
        <input
          type="number"
          id="open_qty"
          name="open_qty"
          value={trade.open_qty}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="matched_trade_ids">Matched Trade IDs:</label>
        <input
          type="text"
          id="matched_trade_ids"
          name="matched_trade_ids"
          placeholder="Matched trade IDs"
          value={trade.matched_trade_ids || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pnl">PnL:</label>
        <input
          type="number"
          id="pnl"
          name="pnl"
          placeholder="PnL"
          value={trade.pnl || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group button-group">
        <button type="submit">Update Trade</button>
      </div>
    </form>
  );
};

export default UpdateTradeForm;
