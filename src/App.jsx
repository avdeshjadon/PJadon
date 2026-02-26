import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Gallery from "./pages/Gallery";
import Upload from "./pages/Upload";
import PrivatePassword from "./pages/PrivatePassword";
import PrivateGallery from "./pages/PrivateGallery";
import PrivateUpload from "./pages/PrivateUpload";

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
      <footer className="app-footer">
        Made with <span className="footer-heart">❤️</span> for Prachi
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Gallery />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Upload />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/private"
              element={
                <ProtectedRoute>
                  <PrivatePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/private/gallery"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PrivateGallery />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/private/upload"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PrivateUpload />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
