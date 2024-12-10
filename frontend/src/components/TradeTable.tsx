import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

type Trade = {
  id: number;
  date_of_trade: string;
  ticker: string;
  strategy_id: number;
  time_horizon: string;
  price: number;
  units: number;
  matched_trade_ids?: string | null;
  pnl?: number;
  qty: number;
  current_price: number;
  open_qty: number;
  unrealised_pnl?: number;
  realised_pnl?: number;
};

type Strategy = {
  id: number;
  name: string;
};

interface TradeTableProps {
  trades: Trade[];
  fetchTrades: () => void; // Function to refresh trades in the parent component
  strategies: Strategy[]; // List of strategies to map strategy_id to name
}

const TradeTable: React.FC<TradeTableProps> = ({ trades, fetchTrades, strategies }) => {
  const [selectedTrades, setSelectedTrades] = useState<number[]>([]);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleCheckboxChange = (tradeId: number) => {
    if (selectedTrades.includes(tradeId)) {
      setSelectedTrades(selectedTrades.filter((id) => id !== tradeId));
    } else if (selectedTrades.length < 2) {
      setSelectedTrades([...selectedTrades, tradeId]);
    } else {
      alert("You can select a maximum of 2 trades for comparison.");
    }
  };

  const handleCompareTrades = async () => {
    if (selectedTrades.length !== 2) {
      alert("Please select exactly 2 trades for comparison.");
      return;
    }

    try {
      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
      }

      const payload = { trade_ids: selectedTrades };
      await axios.post(`${backendUrl}/trades/compare`, payload);

      alert("Comparison Successful!");
      setSelectedTrades([]); // Unselect all checkboxes after comparison
      await fetchTrades(); // Refresh trades after comparison
    } catch (error) {
      console.error("Error comparing trades:", error);
      alert("Failed to compare trades.");
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    if (!window.confirm("Are you sure you want to delete this trade?")) return;

    try {
      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
      }

      await axios.delete(`${backendUrl}/trades/${tradeId}`);
      alert("Trade deleted successfully!");
      await fetchTrades(); // Refresh trades after deletion
    } catch (error) {
      console.error("Error deleting trade:", error);
      alert("Failed to delete trade.");
    }
  };

  const getStrategyName = (strategyId: number): string => {
    if (!strategies || strategies.length === 0) return "Unknown"; // Add a fallback check
    return strategies.find((strategy) => strategy.id === strategyId)?.name || "Unknown";
  };

  return (
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd", fontSize: "15px" }}>
        <thead>
          <tr>
            <th>Select</th>
            <th>ID</th>
            <th>Date</th>
            <th>Ticker</th>
            <th>Strategy</th>
            <th>Time Horizon</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Current Price</th>
            <th>PNL</th>
            <th>Unrealised PNL</th>
            <th>Open Qty</th>
            <th>Matched Trade IDs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              style={{
                backgroundColor: trade.matched_trade_ids ? "lightgreen" : "",
                borderBottom: "1px solid #ddd",
              }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedTrades.includes(trade.id)}
                  onChange={() => handleCheckboxChange(trade.id)}
                  disabled={trade.open_qty === 0}
                  style={{
                    cursor: trade.open_qty === 0 ? "not-allowed" : "pointer",
                  }}
                />
              </td>
              <td>{trade.id}</td>
              <td>{trade.date_of_trade}</td>
              <td>{trade.ticker}</td>
              <td>{getStrategyName(trade.strategy_id)}</td>
              <td>{trade.time_horizon}</td>
              <td>{trade.price.toFixed(2)}</td>
              <td>{trade.qty}</td>
              <td>{trade.current_price.toFixed(2)}</td>
              <td>{trade.pnl?.toFixed(2)}</td>
              <td>{trade.unrealised_pnl?.toFixed(2) || "N/A"}</td>
              <td>{trade.open_qty}</td>
              <td>{trade.matched_trade_ids || "N/A"}</td>
              <td>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link href={`/trades/edit/${trade.id}`} legacyBehavior>
                    <a
                      style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        textDecoration: "none",
                        fontSize: "14px",
                      }}
                    >
                      Edit
                    </a>
                  </Link>
                  <button
                    onClick={() => handleDeleteTrade(trade.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedTrades.length === 2 && (
        <button
          onClick={handleCompareTrades}
          style={{
            marginTop: "10px",
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 15px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Compare Trades
        </button>
      )}
    </div>
  );
};

export default TradeTable;
