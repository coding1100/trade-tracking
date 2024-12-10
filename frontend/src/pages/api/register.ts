import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function register(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { name, email, password } = req.body;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
        { name, email, password }
      );
      res.status(200).json(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Registration API Error:", error.response?.data || error.message);
        res.status(400).json({
          error: error.response?.data?.detail || "Registration failed",
        });
      } else {
        console.error("Unknown error:", error);
        res.status(500).json({ error: "An unexpected error occurred." });
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
