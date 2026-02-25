import React, { useEffect, useRef, useState } from "react";
import { Upload as UploadIcon, CheckCircle, Loader } from "lucide-react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

// Generate SHA-1 signature for signed Cloudinary uploads (no preset needed)
async function generateSignature(callback, paramsToSign) {
  const sortedStr =
    Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&") + API_SECRET;

  const msgBuffer = new TextEncoder().encode(sortedStr);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  callback(signature);
}

export default function Upload() {
  const widgetRef = useRef(null);
  const [uploaded, setUploaded] = useState([]);
  const [widgetReady, setWidgetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.cloudinary) {
      initWidget();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => initWidget();
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  function initWidget() {
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        uploadSignature: generateSignature, // signed — no preset required
        multiple: true,
        maxFileSize: 104857600, // 100MB
        resourceType: "auto",
        sources: ["local", "camera", "url", "dropbox", "google_drive"],
        styles: {
          palette: {
            window: "#0a0a0a",
            windowBorder: "#1a1a1a",
            tabIcon: "#e8c5a0",
            menuIcons: "#aaaaaa",
            textDark: "#ffffff",
            textLight: "#ffffff",
            link: "#e8c5a0",
            action: "#e8c5a0",
            inactiveTabIcon: "#555555",
            error: "#F44235",
            inProgress: "#e8c5a0",
            complete: "#20B832",
            sourceBg: "#111111",
          },
          fonts: {
            default: null,
            "'Inter', sans-serif": {
              url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
              active: true,
            },
          },
        },
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          return;
        }
        if (result.event === "queues-start") setLoading(true);
        if (result.event === "success") {
          setUploaded((prev) => [result.info, ...prev]);
        }
        if (result.event === "queues-end") {
          setLoading(false);
          window.dispatchEvent(new CustomEvent("gallery-refresh"));
        }
      }
    );
    setWidgetReady(true);
  }

  function openWidget() {
    if (widgetRef.current) widgetRef.current.open();
  }

  return (
    <div className="upload-page">
      <div className="upload-hero">
        <div className="upload-icon-wrap">
          <UploadIcon size={40} strokeWidth={1.5} />
        </div>
        <h2 className="upload-heading">Upload Media</h2>
        <p className="upload-sub">
          Add your photos and videos to your personal gallery. Supports JPG, PNG, WEBP, GIF, MP4, MOV, and more.
        </p>
        <button
          className="upload-btn"
          onClick={openWidget}
          disabled={!widgetReady || loading}
        >
          {loading ? (
            <><Loader size={18} className="spin" /> Uploading…</>
          ) : (
            <><UploadIcon size={18} /> Choose Files</>
          )}
        </button>
        <p className="upload-hint">or drag and drop in the widget • Max 100MB per file</p>
      </div>

      {uploaded.length > 0 && (
        <div className="upload-results">
          <h3 className="results-heading">
            <CheckCircle size={18} className="check-icon" />
            Uploaded this session ({uploaded.length})
          </h3>
          <div className="results-grid">
            {uploaded.map((info) => (
              <div key={info.public_id} className="result-card">
                {info.resource_type === "image" ? (
                  <img
                    src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_200,h_150,q_auto,f_auto/${info.public_id}`}
                    alt={info.public_id}
                    className="result-img"
                  />
                ) : (
                  <video
                    src={`https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_200,h_150,c_fill,q_auto/${info.public_id}`}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="result-img"
                  />
                )}
                <div className="result-label">
                  <CheckCircle size={12} className="check-icon" />
                  <span>{info.original_filename || info.public_id.split("/").pop()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
