import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

// Define the Trade interface
interface Trade {
  id: number | null;
  date_of_trade: string;
  ticker: string;
  strategy_id: number;
  time_horizon: string;
  price: number;
  units: number;
}

// Define the Strategy interface
interface Strategy {
  id: number;
  name: string;
}

// Define the props for AddTradeForm
interface AddTradeFormProps {
  tradeToUpdate?: Trade | null;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

const AddTradeForm: React.FC<AddTradeFormProps> = ({
  tradeToUpdate = null,
  onFormSubmit,
  onCancel,
}) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const router = useRouter();

  // Initial state for the trade form
  const [trade, setTrade] = useState<Trade>({
    id: tradeToUpdate?.id || null,
    date_of_trade: tradeToUpdate?.date_of_trade || new Date().toISOString().split("T")[0],
    ticker: tradeToUpdate?.ticker || "",
    strategy_id: tradeToUpdate?.strategy_id || 0,
    time_horizon: tradeToUpdate?.time_horizon || "Short",
    price: tradeToUpdate?.price || 0,
    units: tradeToUpdate?.units || 0,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // Fetch backend URL from environment variables

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/home"); // Redirect to home page
    }
  };

  // Fetch strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        if (!backendUrl) {
          throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const { data } = await axios.get<Strategy[]>(`${backendUrl}/strategies/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStrategies(data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Error fetching strategies:", error.response?.data || error.message);
          alert("Failed to load strategies. Please check your connection or server.");
        } else {
          console.error("Unknown error:", error);
          alert("An unknown error occurred while fetching strategies.");
        }
      }
    };
    fetchStrategies();
  }, [backendUrl]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const payload = {
        ...trade,
        strategy_id: parseInt(trade.strategy_id.toString(), 10),
        price: parseFloat(trade.price.toString()),
        units: parseFloat(trade.units.toString()),
      };

      if (trade.id) {
        await axios.put(`${backendUrl}/trades/${trade.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Trade updated successfully!");
      } else {
        await axios.post(`${backendUrl}/trades/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Trade added successfully!");
      }

      if (onFormSubmit) {
        onFormSubmit();
      }

      setTrade({
        id: null,
        date_of_trade: new Date().toISOString().split("T")[0],
        ticker: "",
        strategy_id: 0,
        time_horizon: "Short",
        price: 0,
        units: 0,
      });

      router.push("/home");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Submission Error:", error.response?.data || error.message);
        alert(`Error: ${error.response?.data?.detail || error.response?.data?.message || "Unknown error"}`);
      } else {
        console.error("Unknown error:", error);
        alert("An unknown error occurred during submission.");
      }
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTrade({ ...trade, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="trade-form">
        <h2>{trade.id ? "Update Trade" : "Add New Trade"}</h2>

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

        <div className="form-group">
          <label htmlFor="ticker">Ticker:</label>
          <input
            type="text"
            id="ticker"
            name="ticker"
            placeholder="Enter ticker"
            value={trade.ticker}
            onChange={handleChange}
            required
          />
        </div>

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

        <div className="form-group">
          <label htmlFor="time_horizon">Time Horizon:</label>
          <select
            id="time_horizon"
            name="time_horizon"
            value={trade.time_horizon}
            onChange={handleChange}
            required
          >
            <option value="Short">Short</option>
            <option value="Mid">Mid</option>
            <option value="Long">Long</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            name="price"
            placeholder="Enter price"
            value={trade.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="units">Units:</label>
          <input
            type="number"
            id="units"
            name="units"
            placeholder="Enter units"
            value={trade.units}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group button-group">
          <button type="submit">{trade.id ? "Update Trade" : "Add Trade"}</button>
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
  );
};

export default AddTradeForm;
