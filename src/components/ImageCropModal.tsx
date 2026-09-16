import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, X, Move, Circle, Square } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  aspectRatio?: 'circle' | 'square';
  title?: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropModal({
  imageSrc,
  aspectRatio = 'circle',
  title = 'Crop Image',
  onSave,
  onClose
}: ImageCropModalProps) {
  const [cropShape, setCropShape] = useState<'circle' | 'square'>(aspectRatio);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropAreaRef = useRef<HTMLDivElement | null>(null);

  // Reset transform state when new image loads
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  // Handle pointer drag (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(3.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  // Rotate controls
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Reset position and zoom
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Generate cropped output canvas
  const generateCroppedCanvas = useCallback((): HTMLCanvasElement | null => {
    const img = imageRef.current;
    const cropBox = cropAreaRef.current;
    if (!img || !cropBox) return null;

    const outputSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Crop box dimensions in screen pixels
    const cropRect = cropBox.getBoundingClientRect();
    const cropSize = cropRect.width;

    // Save context and setup transformations
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Map screen pan and scale to canvas coordinate system
    const canvasScaleRatio = outputSize / cropSize;
    const effectiveScale = scale * canvasScaleRatio;

    // Draw the image centered
    const imgNaturalW = img.naturalWidth || img.width;
    const imgNaturalH = img.naturalHeight || img.height;

    // Display aspect ratio of img element
    const displayedW = img.clientWidth || imgNaturalW;
    const displayedH = img.clientHeight || imgNaturalH;

    const renderW = displayedW * effectiveScale;
    const renderH = displayedH * effectiveScale;

    // Calculate displacement based on pan
    // Note: When rotated, coordinate axes rotate
    const rad = (-rotation * Math.PI) / 180;
    const unrotatedPanX = pan.x * Math.cos(rad) - pan.y * Math.sin(rad);
    const unrotatedPanY = pan.x * Math.sin(rad) + pan.y * Math.cos(rad);

    ctx.drawImage(
      img,
      unrotatedPanX * canvasScaleRatio - renderW / 2,
      unrotatedPanY * canvasScaleRatio - renderH / 2,
      renderW,
      renderH
    );

    ctx.restore();
    return canvas;
  }, [pan, scale, rotation]);

  // Update live preview thumbnail
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = generateCroppedCanvas();
      if (canvas) {
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [generateCroppedCanvas]);

  // Handle Save
  const handleSave = () => {
    const canvas = generateCroppedCanvas();
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
    onSave(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto select-none animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Move className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">{title}</h3>
              <p className="text-xs text-slate-400 font-mono">Drag to reposition, use slider to zoom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Crop Work Area */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 justify-center">
          
          {/* Interactive Crop Viewport */}
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center">
            
            {/* The Draggable / Zoomable / Rotatable Image */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute inset-0 flex items-center justify-center touch-none"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop Target"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Dark Mask Overlay with Cutout Aperture */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Circular Cutout or Square Cutout */}
              <div
                ref={cropAreaRef}
                className={`w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] border-2 border-dashed border-cyan-400 ${
                  cropShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                } shadow-[0_0_0_9999px_rgba(10,12,18,0.75)] transition-all duration-300 relative`}
              >
                {/* Subtle alignment crosshair grid */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-full h-px bg-cyan-400" />
                  <div className="h-full w-px bg-cyan-400 absolute" />
                </div>
              </div>
            </div>

            {/* Floating helper badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-1.5">
              <Move className="w-3 h-3 text-cyan-400" /> Drag to pan
            </div>
          </div>

          {/* Right Panel: Live Preview & Shape Switcher */}
          <div className="flex flex-col items-center sm:items-start gap-4 min-w-[160px]">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Live Preview
            </span>

            {/* Circular Preview (Facebook Style) */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-cyan-400/80 bg-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.2)] flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-600 font-mono text-xs">Loading...</div>
                )}
              </div>
              <span className="block text-center mt-1.5 text-[10px] font-mono text-slate-500">Avatar</span>
            </div>

            {/* Shape toggle */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl mt-2">
              <button
                type="button"
                onClick={() => setCropShape('circle')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  cropShape === 'circle'
                    ? 'bg-cyan-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Circle className="w-3.5 h-3.5" /> Circle
              </button>
              <button
                type="button"
                onClick={() => setCropShape('square')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  cropShape === 'square'
                    ? 'bg-cyan-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Square className="w-3.5 h-3.5" /> Square
              </button>
            </div>
          </div>

        </div>

        {/* Adjustment Controls Toolstrip */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={0.6}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-cyan-400 min-w-[40px] text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotate 90°
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reset
            </button>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-mono text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-bold text-xs font-mono shadow-[0_0_20px_rgba(0,243,255,0.3)] transition"
          >
            <Check className="w-4 h-4" /> Apply & Save Crop
          </button>
        </div>

      </div>
    </div>
  );
}
