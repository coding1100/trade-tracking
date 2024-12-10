import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Trade {
  id?: number;
  date_of_trade: string;
  ticker: string;
  strategy_id: number;
  time_horizon: string;
  price: number;
  units: number;
  qty: number;
  current_price: number;
  open_qty: number;
  matched_trade_ids: string;
  pnl: number;
  realised_pnl: number;
  unrealised_pnl: number;
}

interface Strategy {
  id: number;
  name: string;
}

const EditTradePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [trade, setTrade] = useState<Trade>({
    date_of_trade: "",
    ticker: "",
    strategy_id: 0,
    time_horizon: "Short",
    price: 0,
    units: 0,
    qty: 0,
    current_price: 0,
    open_qty: 0,
    matched_trade_ids: "",
    pnl: 0,
    realised_pnl: 0,
    unrealised_pnl: 0,
  });
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Fetch the trade details
  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        if (!backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");

        const { data } = await axios.get<Trade>(`${backendUrl}/trades/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrade(data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Error fetching trade:", error.response?.data || error.message);
          alert("Failed to load trade data.");
        } else {
          console.error("Unknown error:", error);
          alert("An unknown error occurred while fetching the trade.");
        }
        router.push("/trades");
      }
    };

    if (id) fetchTrade();
  }, [id, backendUrl, router]);

  // Fetch strategies for the dropdown
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        if (!backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");

        const { data } = await axios.get<Strategy[]>(`${backendUrl}/strategies/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStrategies(data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Error fetching strategies:", error.response?.data || error.message);
          alert("Failed to load strategies.");
        } else {
          console.error("Unknown error:", error);
          alert("An unknown error occurred while fetching strategies.");
        }
      }
    };

    fetchStrategies();
  }, [backendUrl]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTrade({ ...trade, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      if (!backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");

      const payload = {
        ...trade,
        strategy_id: parseInt(trade.strategy_id.toString(), 10),
        price: parseFloat(trade.price.toString()),
        pnl: parseFloat(trade.pnl.toString()),
        units: parseFloat(trade.units.toString()),
        qty: parseFloat(trade.qty.toString()),
        current_price: parseFloat(trade.current_price.toString()),
        open_qty: parseFloat(trade.open_qty.toString()),
      };

      await axios.put(`${backendUrl}/trades/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Trade updated successfully!");
      router.push("/home");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Error updating trade:", error.response?.data || error.message);
        alert("Failed to update trade. Please check your data and try again.");
      } else {
        console.error("Unknown error:", error);
        alert("An unknown error occurred while updating the trade.");
      }
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    router.push("/trades");
  };

  if (!trade) return <p>Loading...</p>;

  return (
    <>
      <header style={{ backgroundColor: "#007bff", color: "white", padding: "10px 20px" }}>
        <h1>Trade Tracker</h1>
      </header>
      <div className="container">
        <form onSubmit={handleSubmit} className="trade-form">
          <h2>Edit Trade ID: {id}</h2>

          {/* Date of Trade */}
          <div className="form-group">
            <label htmlFor="date_of_trade">Date of Trade:</label>
            <input
              type="date"
              id="date_of_trade"
              name="date_of_trade"
              value={trade.date_of_trade}
              onChange={handleChange}
              required
            />
          </div>

          {/* Ticker */}
          <div className="form-group">
            <label htmlFor="ticker">Ticker:</label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={trade.ticker}
              onChange={handleChange}
              required
            />
          </div>

          {/* Strategy */}
          <div className="form-group">
            <label htmlFor="strategy_id">Strategy:</label>
            <select
              id="strategy_id"
              name="strategy_id"
              value={trade.strategy_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Strategy</option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
          </div>

          {/* Other Fields */}
          {[
            { label: "Price", name: "price", type: "number", value: trade.price },
            { label: "Units", name: "units", type: "number", value: trade.units },
            { label: "Qty", name: "qty", type: "number", value: trade.qty },
            { label: "Current Price", name: "current_price", type: "number", value: trade.current_price },
            { label: "Open Qty", name: "open_qty", type: "number", value: trade.open_qty },
            { label: "Matched Trade IDs", name: "matched_trade_ids", type: "text", value: trade.matched_trade_ids },
            { label: "PnL", name: "pnl", type: "number", value: trade.pnl },
            { label: "Realised PnL", name: "realised_pnl", type: "number", value: trade.realised_pnl },
            { label: "Unrealised PnL", name: "unrealised_pnl", type: "number", value: trade.unrealised_pnl },
          ].map(({ label, name, type, value }) => (
            <div key={name} className="form-group">
              <label htmlFor={name}>{label}:</label>
              <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                required={name !== "matched_trade_ids"}
              />
            </div>
          ))}

          {/* Buttons */}
          <div className="form-group button-group">
            <button type="submit">Update Trade</button>
            <button
              type="button"
              onClick={handleCancel}
              style={{ marginLeft: "10px", backgroundColor: "#dc3545", color: "white" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <footer style={{ backgroundColor: "#f8f9fa", color: "#212529", padding: "10px 20px", marginTop: "20px" }}>
        <p>&copy; {new Date().getFullYear()} Trade Tracker App</p>
      </footer>
    </>
  );
};

export default EditTradePage;
