import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const StrategyForm = () => {
  const [name, setName] = useState("");
  const { authToken, user } = useAuth(); // Access the user and token
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !user?.user_id) {
      alert("User is not authenticated.");
      return;
    }

    if (name) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("NEXT_PUBLIC_BACKEND_URL is not set in the environment variables.");
        }

        await axios.post(
          `${backendUrl}/strategies/`,
          { name, user_id: user.user_id }, // Include user_id
          {
            headers: { Authorization: `Bearer ${authToken}` }, // Include token in headers
          }
        );

        setName("");
        alert("Strategy added successfully!");
        router.push("/home");
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Error adding strategy:", error.response?.data || error.message);
          alert("Failed to add strategy. Please check your connection or server.");
        } else {
          console.error("Unknown error:", error);
          alert("An unknown error occurred. Please try again.");
        }
      }
    } else {
      alert("Please enter a strategy name.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <input
        type="text"
        placeholder="Strategy Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 15px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Add Strategy
      </button>
    </form>
  );
};

export default StrategyForm;
