import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRIVATE_PASSWORD = "prachijadon";

export default function PrivatePassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem("privateAccess");
    if (authStatus === "granted") {
      setIsAuthenticated(true);
      navigate("/private/gallery");
    }
  }, [navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password === PRIVATE_PASSWORD) {
      sessionStorage.setItem("privateAccess", "granted");
      setIsAuthenticated(true);
      navigate("/private/gallery");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="private-password-page">
      <div className="private-password-bg">
        <div className="private-blob blob-1"></div>
        <div className="private-blob blob-2"></div>
      </div>

      <div className="private-password-card">
        <div className="private-lock-icon">
          <Lock size={28} />
        </div>

        <h2 className="private-password-title">Private Gallery</h2>
        <p className="private-password-subtitle">
          Enter the password to access your private collection
        </p>

        {error && <div className="private-password-error">{error}</div>}

        <form onSubmit={handleSubmit} className="private-password-form">
          <div className="private-password-field">
            <div className="private-password-input-wrapper">
              <Lock size={18} className="private-password-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="private-password-input"
                autoFocus
              />
              <button
                type="button"
                className="private-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="private-password-btn"
            disabled={!password.trim()}
          >
            <span>Access Private Gallery</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
