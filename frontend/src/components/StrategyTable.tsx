import axios from "axios";
import { FC } from "react";

interface Strategy {
  id: number;
  name: string;
}

interface StrategyTableProps {
  strategies: Strategy[];
  fetchStrategies: () => void; // Function to refetch strategies after deletion
}

const StrategyTable: FC<StrategyTableProps> = ({ strategies, fetchStrategies }) => {
  // Delete a strategy by ID
  const deleteStrategy = async (id: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      console.log(`Deleting strategy with ID ${id} using token:`, token);

      await axios.delete(`${backendUrl}/strategies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Strategy with ID ${id} deleted successfully.`);
      fetchStrategies(); // Refresh strategies after deletion
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Error deleting strategy:", error.response?.data || error.message);
        if (error.response?.status === 400) {
          alert("This strategy is associated with an existing trade and cannot be deleted.");
        } else if (error.response?.status === 401) {
          alert("Unauthorized. Please log in again.");
        } else {
          alert("Failed to delete strategy. Please check your connection or server.");
        }
      } else {
        console.error("Unknown error:", error);
        alert("An unknown error occurred while deleting the strategy.");
      }
    }
  };

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {strategies.length > 0 ? (
            strategies.map((strategy) => (
              <tr key={strategy.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{strategy.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{strategy.name}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      fontSize: "14px",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "10px" }}>
                No strategies available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StrategyTable;
