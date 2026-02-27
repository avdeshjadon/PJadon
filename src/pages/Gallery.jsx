import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Play, Image, Video, Loader, RotateCw } from "lucide-react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY    = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;
const PAGE_SIZE  = 100;
const PRIVATE_TAG = "private_prachi";

/* ─── API helpers ─── */
function buildBasicAuth() {
  return "Basic " + btoa(`${API_KEY}:${API_SECRET}`);
}
async function fetchAllResources(resourceType = "image") {
  let all = [], cursor = null;
  do {
    const params = new URLSearchParams({ max_results: "500", tags: "true" });
    if (cursor) params.set("next_cursor", cursor);
    const res = await fetch(
      `/cloudinary-api/v1_1/${CLOUD_NAME}/resources/${resourceType}?${params}`,
      { headers: { Authorization: buildBasicAuth() } }
    );
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    all = all.concat(data.resources || []);
    cursor = data.next_cursor || null;
  } while (cursor);
  return all;
}
function getThumbUrl(item) {
  if (item.media_type === "image")
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_400/${item.public_id}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,du_2,w_400,h_300,c_fill,q_auto/${item.public_id}.jpg`;
}
function getFullUrl(item) {
  if (item.media_type === "image")
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_keep_iptc/${item.public_id}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${item.public_id}`;
}

/* ────────────────────────────────────────────
   MediaGrid
──────────────────────────────────────────── */
function MediaGrid({ items, onOpen }) {
  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <div key={item.public_id} className="gallery-card" onClick={() => onOpen(item)}>
          <div className="card-img-wrap">
            <img src={getThumbUrl(item)} alt="" loading="lazy" className="card-img" />
            {item.media_type === "video" && (
              <div className="play-overlay"><Play size={22} fill="white" /></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Paginator
──────────────────────────────────────────── */
function Paginator({ page, total, onPrev, onNext }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="paginator">
      <button className="page-btn" onClick={onPrev} disabled={page === 0}><ChevronLeft size={18} /></button>
      <span className="page-info">{page + 1} / {totalPages}</span>
      <button className="page-btn" onClick={onNext} disabled={page >= totalPages - 1}><ChevronRight size={18} /></button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Lightbox with swipe + rotate
──────────────────────────────────────────── */
function Lightbox({ item, list, idx, onClose, onPrev, onNext }) {
  const pointerStart = useRef(null);
  const lbRef = useRef(null);
  const [slideDir, setSlideDir] = useState(null);
  const [rotation, setRotation] = useState(0);

  /* Reset rotation when image changes */
  useEffect(() => { setRotation(0); }, [item.public_id]);

  /* Keyboard nav */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape")     onClose();
      if (e.key === "r" || e.key === "R") rotate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idx, rotation]);

  /* Lock scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function goPrev() {
    setSlideDir("right");
    setTimeout(() => { onPrev(); setSlideDir(null); }, 240);
  }
  function goNext() {
    setSlideDir("left");
    setTimeout(() => { onNext(); setSlideDir(null); }, 240);
  }
  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  /* Swipe */
  function onPointerDown(e) { pointerStart.current = e.clientX; }
  function onPointerUp(e) {
    if (pointerStart.current === null) return;
    const delta = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext(); else goPrev();
  }

  const isRotated = rotation === 90 || rotation === 270;

  return (
    <div className="lightbox" onClick={onClose}>
      <div
        className="lightbox-inner"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        ref={lbRef}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <button className="lb-close" onClick={onClose}><X size={20} /></button>
        {list.length > 1 && (
          <>
            <button className="lb-prev" onClick={(e) => { e.stopPropagation(); goPrev(); }}><ChevronLeft size={24} /></button>
            <button className="lb-next" onClick={(e) => { e.stopPropagation(); goNext(); }}><ChevronRight size={24} /></button>
          </>
        )}

        {/* Rotate button — only for images */}
        {item.media_type === "image" && (
          <button
            className="lb-rotate-top lb-hidden"
            style={{ display: "none" }}
          />
        )}

        <div className={`lb-media ${slideDir === "left" ? "lb-slide-left" : slideDir === "right" ? "lb-slide-right" : ""}`}>
          {item.media_type === "image" ? (
            <img
              key={item.public_id}
              src={getFullUrl(item)}
              alt=""
              className="lb-img"
              draggable={false}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
                maxHeight: isRotated ? "70vw" : "82vh",
                maxWidth: isRotated ? "82vh" : "100%",
              }}
            />
          ) : (
            <video
              key={item.public_id}
              src={getFullUrl(item)}
              controls autoPlay playsInline
              className="lb-video"
            />
          )}
        </div>

        <div className="lb-caption">
          {/* Left: Rotate text button (images only) */}
          <span className="lb-caption-left">
            {item.media_type === "image" ? (
              <button
                className="lb-rotate-text"
                onClick={(e) => { e.stopPropagation(); rotate(); }}
                title="Rotate (R)"
              >
                ↻ Rotate
              </button>
            ) : <span />}
          </span>
          {/* Center: counter */}
          <span className="lb-counter">{idx + 1} / {list.length}</span>
          {/* Right: swipe hint (touch only) */}
          <span className="lb-hint">← swipe →</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Gallery
──────────────────────────────────────────── */
export default function Gallery() {
  const [allImages, setAllImages] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState("all");
  const [imgPage, setImgPage]     = useState(0);
  const [vidPage, setVidPage]     = useState(0);
  const [lb, setLb]               = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [imgs, vids] = await Promise.all([
        fetchAllResources("image"),
        fetchAllResources("video"),
      ]);
      // Filter out private tagged resources
      const filterPublic = (arr, type) =>
        arr
          .filter((r) => !r.tags || !r.tags.includes(PRIVATE_TAG))
          .map((r) => ({ ...r, media_type: type }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllImages(filterPublic(imgs, "image"));
      setAllVideos(filterPublic(vids, "video"));
    } catch { setError("Could not load gallery."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const h = () => loadAll();
    window.addEventListener("gallery-refresh", h);
    return () => window.removeEventListener("gallery-refresh", h);
  }, [loadAll]);

  useEffect(() => { setImgPage(0); setVidPage(0); }, [filter]);

  const pagedImages = allImages.slice(imgPage * PAGE_SIZE, (imgPage + 1) * PAGE_SIZE);
  const pagedVideos = allVideos.slice(vidPage * PAGE_SIZE, (vidPage + 1) * PAGE_SIZE);
  const scroll2top  = () => window.scrollTo({ top: 0, behavior: "smooth" });

  function openLightbox(item, list) {
    const idx = list.findIndex((i) => i.public_id === item.public_id);
    setLb({ list, idx });
  }

  return (
    <div className="gallery-page">

      {/* ── Header ── */}
      <div className="gallery-header">
        <div className="heading-wrap">
          <h2 className="gallery-heading">
            My Collection
          </h2>
          <p className="gallery-sub">{allImages.length} photos · {allVideos.length} videos</p>
        </div>
        <div className="filter-tabs">
          {[
            { id: "all",   label: "All" },
            { id: "image", label: "Photos", icon: <Image size={14} /> },
            { id: "video", label: "Videos", icon: <Video size={14} /> },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`filter-tab ${filter === f.id ? "active" : ""}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="gallery-loading">
          <Loader size={32} className="spin" /><p>Loading your gallery…</p>
        </div>
      )}
      {error && <div className="gallery-error">{error}</div>}
      {!loading && !error && allImages.length === 0 && allVideos.length === 0 && (
        <div className="gallery-empty">
          <div className="empty-icon">📷</div>
          <p>No media found. Upload some photos or videos!</p>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && (
        <>
          {(filter === "all" || filter === "image") && allImages.length > 0 && (
            <section className="media-section">
              {filter === "all" && (
                <div className="section-heading">
                  <Image size={17} /><span>Photos</span>
                  <span className="section-count">{allImages.length}</span>
                </div>
              )}
              <MediaGrid items={pagedImages} onOpen={(item) => openLightbox(item, allImages)} />
              <Paginator page={imgPage} total={allImages.length}
                onPrev={() => { setImgPage((p) => p - 1); scroll2top(); }}
                onNext={() => { setImgPage((p) => p + 1); scroll2top(); }}
              />
            </section>
          )}

          {filter === "all" && allImages.length > 0 && allVideos.length > 0 && (
            <div className="section-divider" />
          )}

          {(filter === "all" || filter === "video") && allVideos.length > 0 && (
            <section className="media-section">
              {filter === "all" && (
                <div className="section-heading">
                  <Video size={17} /><span>Videos</span>
                  <span className="section-count">{allVideos.length}</span>
                </div>
              )}
              <MediaGrid items={pagedVideos} onOpen={(item) => openLightbox(item, allVideos)} />
              <Paginator page={vidPage} total={allVideos.length}
                onPrev={() => { setVidPage((p) => p - 1); scroll2top(); }}
                onNext={() => { setVidPage((p) => p + 1); scroll2top(); }}
              />
            </section>
          )}
        </>
      )}

      {/* ── Lightbox ── */}
      {lb && (
        <Lightbox
          item={lb.list[lb.idx]}
          list={lb.list}
          idx={lb.idx}
          onClose={() => setLb(null)}
          onPrev={() => setLb((l) => ({ ...l, idx: l.idx > 0 ? l.idx - 1 : l.list.length - 1 }))}
          onNext={() => setLb((l) => ({ ...l, idx: l.idx < l.list.length - 1 ? l.idx + 1 : 0 }))}
        />
      )}
    </div>
  );
}
