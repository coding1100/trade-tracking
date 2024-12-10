import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    try {
      // Send login credentials to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        { email, password }
      );

      // Return token and user info to the client
      res.status(200).json(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Login error:", error.response?.data || error.message);
        res.status(400).json({
          error:
            error.response?.data?.detail ||
            "Credentials do not match. Please try again.",
        });
      } else {
        console.error("Unknown error:", error);
        res.status(500).json({ error: "An unexpected error occurred." });
      }
    }
  } else {
    // Handle unsupported HTTP methods
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
