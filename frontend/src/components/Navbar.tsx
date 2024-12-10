import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import jwt_decode from "jwt-decode";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(""); // Add state for user ID
  const router = useRouter(); // Use Next.js router for navigation

  useEffect(() => {
    // Extract email and user ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken: { sub: string; user_id: string } = jwt_decode(token);
        setUserEmail(decodedToken.sub); // Set email
        setUserId(decodedToken.user_id); // Set user ID
      } catch (error) {
        console.error("Invalid token:", error);
        setUserEmail("");
        setUserId(""); // Clear user ID if token is invalid
      }
    }
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    // Clear token and session data
    localStorage.removeItem("token");
    setUserEmail("");
    setUserId(""); // Clear user ID on logout
    router.push("/"); // Redirect to the login page
  };

  return (
    <nav
      style={{
        backgroundColor: "#1a73e8",
        color: "white",
        padding: "5px 0",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderBottom: "3px solid #155dbf",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href="/home" passHref>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
              color: "white",
              textDecoration: "none",
              cursor: "pointer",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#cce7ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
          >
            Trade Tracker
          </span>
        </Link>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            color: "white",
            cursor: "pointer",
          }}
        >
          {/* Display Logged-In User Email */}
          <span style={{ marginRight: "10px", fontWeight: "bold" }}>
            {userEmail ? `${userEmail} ( ${userId} )` : "Guest"}
          </span>
          <span
            onClick={toggleDropdown}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#155dbf")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            ▼
          </span>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                backgroundColor: "white",
                color: "#1a73e8",
                borderRadius: "5px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                padding: "5px 0",
                zIndex: 1000,
              }}
            >
              <Link href="/strategies" passHref>
                <div
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  Add Strategy
                </div>
              </Link>
              <Link href="/trades" passHref>
                <div
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  Add Trade
                </div>
              </Link>
              <div
                onClick={handleLogout}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                Log Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
