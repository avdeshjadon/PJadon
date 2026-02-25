import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Images, Upload, LogOut, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="nav-title">Prachi's Gallery</span>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
          <Images size={18} />
          <span>Gallery</span>
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <Upload size={18} />
          <span>Upload</span>
        </NavLink>
      </div>

      <div className="nav-user">
        {/* Dark / Light toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="user-avatar">{currentUser?.email?.[0]?.toUpperCase() || "P"}</div>
        <button className="logout-btn" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
