import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, X, ZoomIn, ZoomOut, Check, Loader2 } from "lucide-react";

// Adjust Profile Photo - a self-contained, dependency-free circular
// cropper (drag to reposition, slider to zoom, fixed 1:1 output),
// implemented with the Canvas API + pointer events rather than adding
// a third-party cropping library, per the "canvas + existing React
// capabilities is acceptable" guidance. Output is a real cropped
// square image (not just stored CSS coordinates) - see
// renderCroppedImage() below.

const CROP_SIZE = 280; // displayed circular viewport, in CSS px
const OUTPUT_SIZE = 512; // exported square image, in px
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AvatarCropModal({ file, onCancel, onSave, saving, error }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null); // { width, height }
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const imgRef = useRef(null);
  const dragState = useRef(null); // { startX, startY, startPanX, startPanY }

  // Load the picked file into an object URL for both the live preview
  // <img> and the final canvas render - freed on unmount/file change.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setNaturalSize(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // baseScale: the zoom=1 scale at which the image's SHORTER side
  // exactly fills the crop circle - this is what guarantees the circle
  // can never contain empty space, at any zoom/pan combination.
  const baseScale = naturalSize
    ? CROP_SIZE / Math.min(naturalSize.width, naturalSize.height)
    : 1;
  const displayScale = baseScale * zoom;
  const displayWidth = naturalSize ? naturalSize.width * displayScale : 0;
  const displayHeight = naturalSize ? naturalSize.height * displayScale : 0;

  const clampPan = useCallback(
    (nextPan, currentZoom) => {
      if (!naturalSize) return { x: 0, y: 0 };
      const scale = baseScale * currentZoom;
      const w = naturalSize.width * scale;
      const h = naturalSize.height * scale;
      const maxX = Math.max(0, (w - CROP_SIZE) / 2);
      const maxY = Math.max(0, (h - CROP_SIZE) / 2);
      return {
        x: clamp(nextPan.x, -maxX, maxX),
        y: clamp(nextPan.y, -maxY, maxY),
      };
    },
    [naturalSize, baseScale]
  );

  const handleZoomChange = (nextZoom) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev, clampedZoom));
  };

  const handlePointerDown = (e) => {
    if (!naturalSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan(
      clampPan(
        { x: dragState.current.startPanX + dx, y: dragState.current.startPanY + dy },
        zoom
      )
    );
  };

  const handlePointerUp = (e) => {
    dragState.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    handleZoomChange(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
  };

  // Maps the visible circular viewport back to source-image pixel
  // coordinates and draws exactly that region onto an OUTPUT_SIZE
  // square canvas - this IS the cropped, resized final image, not
  // just stored position/zoom numbers.
  const renderCroppedImage = () =>
    new Promise((resolve, reject) => {
      const img = imgRef.current;
      if (!img || !naturalSize) {
        reject(new Error("Image not ready"));
        return;
      }

      const scale = baseScale * zoom;
      const imgLeft = CROP_SIZE / 2 - (naturalSize.width * scale) / 2 + pan.x;
      const imgTop = CROP_SIZE / 2 - (naturalSize.height * scale) / 2 + pan.y;

      const sourceLeft = -imgLeft / scale;
      const sourceTop = -imgTop / scale;
      const sourceSize = CROP_SIZE / scale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sourceLeft,
        sourceTop,
        sourceSize,
        sourceSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not process image"));
            return;
          }
          const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          resolve(croppedFile);
        },
        "image/jpeg",
        0.92
      );
    });

  const handleSave = async () => {
    try {
      const croppedFile = await renderCroppedImage();
      onSave(croppedFile);
    } catch {
      /* onSave is not called - parent keeps the modal open with no crash */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0e1a] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Adjust Profile Photo</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Circular crop viewport */}
        <div className="flex justify-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="relative overflow-hidden rounded-full border border-white/10 bg-[#050816] touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
          >
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                style={{
                  width: displayWidth || undefined,
                  height: displayHeight || undefined,
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                  opacity: naturalSize ? 1 : 0,
                }}
              />
            )}

            {!naturalSize && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-gray-500 animate-spin" size={24} />
              </div>
            )}

            {/* Subtle ring so the circular boundary reads clearly against any photo */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15 pointer-events-none" />
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-3">
          Drag to reposition &bull; scroll or use the slider to zoom
        </p>

        {/* Zoom control */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.2)}
            disabled={!naturalSize}
            className="text-gray-400 hover:text-white transition disabled:opacity-40"
          >
            <ZoomOut size={18} />
          </button>

          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            disabled={!naturalSize}
            className="flex-1 accent-violet-500 disabled:opacity-40"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.2)}
            disabled={!naturalSize}
            className="text-gray-400 hover:text-white transition disabled:opacity-40"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={!naturalSize}
          className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition disabled:opacity-40"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !naturalSize}
            className="
              flex-1 py-3 rounded-xl
              bg-gradient-to-r from-violet-600 to-cyan-500
              text-white font-semibold hover:opacity-90 transition
              disabled:opacity-60 flex items-center justify-center gap-2
            "
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? "Saving..." : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
