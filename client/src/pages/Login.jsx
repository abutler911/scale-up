import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, verified } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (verified) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(pin);
      navigate("/");
    } catch {
      setError("Incorrect PIN.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎹</div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36,
              fontWeight: 600,
              color: "#f0f0f0",
              margin: 0,
            }}
          >
            ScaleUp!
          </h1>
          <p style={{ color: "#444", fontSize: 13, marginTop: 6 }}>
            Enter your PIN to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#1a1a1a",
            border: "1px solid #2e2e2e",
            borderRadius: 16,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label className="label">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              className="input"
              style={{
                textAlign: "center",
                fontSize: 20,
                letterSpacing: "0.3em",
              }}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p
              style={{
                color: "#f87171",
                fontSize: 13,
                textAlign: "center",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="btn-primary"
            style={{ width: "100%", opacity: loading || !pin ? 0.5 : 1 }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
