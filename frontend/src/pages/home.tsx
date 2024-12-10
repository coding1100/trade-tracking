import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { useState, useEffect } from "react";
import StrategyTable from "../components/StrategyTable";
import TradeTable from "../components/TradeTable";
import { useRouter } from "next/router";

type Trade = {
  id: number;
  date_of_trade: string;
  ticker: string;
  strategy_id: number;
  time_horizon: string;
  price: number;
  units: number;
  open_qty: number;
  pnl: number;
  realised_pnl: number;
  unrealised_pnl: number;
  current_price: number;
  qty: number;
};

type Strategy = {
  id: number;
  name: string;
};

const Home = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<Record<string, Trade[]>>({});
  const [filters, setFilters] = useState({
    date: "",
    strategy: "",
    ticker: "",
  });
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false); // Loader state for the button
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  // Redirect to login if no token is found
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Home] No token found, redirecting to login...");
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.get<Trade[]>(`${backendUrl}/trades/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrades(data);
    } catch (error) {
      console.error("[Home] Error fetching trades:", error);
      alert("Failed to fetch trades. Redirecting to login...");
      router.replace("/login");
    }
  };

  // Update trades with loader
  const updateTrades = async () => {
    setButtonLoading(true); // Show loader
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.put(
        `${backendUrl}/trades/update_prices`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      await fetchTrades();
    } catch (error) {
      console.error("[Home] Error updating trades:", error);
      alert("Failed to update trades.");
    } finally {
      setButtonLoading(false); // Hide loader
    }
  };

  // Fetch strategies
  const fetchStrategies = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.get<Strategy[]>(`${backendUrl}/strategies/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStrategies(data);
    } catch (error) {
      console.error("[Home] Error fetching strategies:", error);
      alert("Failed to fetch strategies. Redirecting to login...");
      router.replace("/login");
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchStrategies();
      fetchTrades();
    }
  }, [backendUrl, loading, router]);

  // Apply filters to trades
  useEffect(() => {
    const applyFilters = () => {
      const filtered = trades.filter((trade) => {
        const dateMatch = filters.date ? trade.date_of_trade === filters.date : true;
        const strategyMatch = filters.strategy
          ? strategies.find((s) => s.name === filters.strategy)?.id === trade.strategy_id
          : true;
        const tickerMatch = filters.ticker ? trade.ticker.includes(filters.ticker) : true;
        return dateMatch && strategyMatch && tickerMatch;
      });

      const grouped = filtered.reduce((acc, trade) => {
        const groupKey = `${trade.date_of_trade}-${trade.strategy_id}-${trade.ticker}-${trade.time_horizon}`;
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(trade);
        return acc;
      }, {} as Record<string, Trade[]>);

      setGroupedTrades(grouped);
    };

    applyFilters();
  }, [filters, trades, strategies]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const getStrategyName = (strategyId: number) => {
    return strategies.find((s) => s.id === strategyId)?.name || "N/A";
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="centerAlign"><b>Trade Tracker</b></h1>
        <p className="centerAlign">Manage your strategies and track your trades efficiently.</p>

        <h2>Strategies</h2>
        <StrategyTable strategies={strategies} fetchStrategies={fetchStrategies} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0 }}>Trades</h1>
          <button
            onClick={updateTrades}
            style={{
              padding: "8px 16px",
              backgroundColor: buttonLoading ? "#d3d3d3" : "transparent",
              color: buttonLoading ? "#ffffff" : "#007BFF",
              border: "1px solid #007BFF",
              borderRadius: "4px",
              cursor: buttonLoading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "background-color 0.3s, color 0.3s",
            }}
            disabled={buttonLoading}
          >
            {buttonLoading ? "Updating..." : "Update Trade Current Prices & Un-realized PNL"}
          </button>
        </div>

        <TradeTable trades={trades} fetchTrades={fetchTrades} strategies={strategies} />

        <div style={{ marginBottom: "20px", padding: "10px" }}>
          <h1>Filter Grouped Trades</h1>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            placeholder="Filter by Date"
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <select
            name="strategy"
            value={filters.strategy}
            onChange={handleFilterChange}
            style={{ marginRight: "10px", padding: "5px" }}
          >
            <option value="">Filter by Strategy</option>
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.name}>
                {strategy.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="ticker"
            value={filters.ticker}
            onChange={handleFilterChange}
            placeholder="Filter by Ticker"
            style={{ padding: "5px" }}
          />
        </div>

        <div>
          <h1>Grouped Trades</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Strategy</th>
                <th>Ticker</th>
                <th>Time Horizon</th>
                <th>Open Qty</th>
                <th>Realised PnL</th>
                <th>Unrealised PnL</th>
                <th>Total PnL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedTrades).map(([key, group]) => {
                const totalOpenQty = group.reduce((acc, trade) => acc + trade.open_qty, 0);
                const totalRealisedPnL = group.reduce((acc, trade) => acc + trade.realised_pnl, 0);
                const totalUnrealisedPnL = group.reduce((acc, trade) => acc + trade.unrealised_pnl, 0);

                return (
                  <tr key={key}>
                    <td>{group[0].date_of_trade}</td>
                    <td>{getStrategyName(group[0].strategy_id)}</td>
                    <td>{group[0].ticker}</td>
                    <td>{group[0].time_horizon}</td>
                    <td>{totalOpenQty}</td>
                    <td>{totalRealisedPnL.toFixed(2)}</td>
                    <td>{totalUnrealisedPnL.toFixed(2)}</td>
                    <td>{(totalRealisedPnL + totalUnrealisedPnL).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
