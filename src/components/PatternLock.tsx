import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  RotateCcw,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface PatternLockProps {
  onPatternStatusChange: (status: {
    hasPattern: boolean;
    isVerified: boolean;
    statusLabel: string;
    dotsCount: number;
  }) => void;
  initialVerified?: boolean;
  initialHasPattern?: boolean;
}

interface Point {
  x: number;
  y: number;
  id: number;
}

export const PatternLock: React.FC<PatternLockProps> = ({
  onPatternStatusChange,
  initialVerified = false,
  initialHasPattern = false,
}) => {
  const [hasPattern, setHasPattern] = useState(initialHasPattern);
  const [patternSequence, setPatternSequence] = useState<number[]>([]);
  const [currentDragPoint, setCurrentDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySequence, setReplaySequence] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // 3x3 Grid Dots Coordinates (in viewBox 0 0 300 300)
  const dots: Point[] = [
    { id: 1, x: 50, y: 50 },
    { id: 2, x: 150, y: 50 },
    { id: 3, x: 250, y: 50 },
    { id: 4, x: 50, y: 150 },
    { id: 5, x: 150, y: 150 },
    { id: 6, x: 250, y: 150 },
    { id: 7, x: 50, y: 250 },
    { id: 8, x: 150, y: 250 },
    { id: 9, x: 250, y: 250 },
  ];

  // Helper to get touch or mouse coordinate relative to 300x300 SVG viewBox
  const getPointerCoord = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 300;
    const y = ((clientY - rect.top) / rect.height) * 300;
    return { x, y };
  };

  // Find if coordinate is within radius of any dot
  const findDotAt = (x: number, y: number, radius = 30) => {
    return dots.find((dot) => {
      const dist = Math.hypot(dot.x - x, dot.y - y);
      return dist <= radius;
    });
  };

  // Touch and Mouse Handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (isReplaying) return;
    const coord = getPointerCoord(clientX, clientY);
    if (!coord) return;

    const hitDot = findDotAt(coord.x, coord.y);
    if (hitDot) {
      setIsDrawing(true);
      setPatternSequence([hitDot.id]);
      setCurrentDragPoint(coord);
      setHasPattern(true);
      setIsVerified(false);
      setFeedbackMsg('پیٹرن بنایا جا رہا ہے...');
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawing || isReplaying) return;
    const coord = getPointerCoord(clientX, clientY);
    if (!coord) return;

    setCurrentDragPoint(coord);

    const hitDot = findDotAt(coord.x, coord.y);
    if (hitDot && !patternSequence.includes(hitDot.id)) {
      setPatternSequence((prev) => [...prev, hitDot.id]);
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentDragPoint(null);

    if (patternSequence.length < 2) {
      setPatternSequence([]);
      setHasPattern(false);
      setFeedbackMsg('');
      updateParentStatus(false, false, 'No Lock', 0);
    } else {
      setFeedbackMsg(`${patternSequence.length} ڈاٹس کا پیٹرن موصول ہوا۔ جانچ کے لیے Check Pattern دبائیں۔`);
      updateParentStatus(true, false, 'Lock Present (Unverified)', patternSequence.length);
    }
  };

  const updateParentStatus = (hasPat: boolean, verified: boolean, label: string, count: number) => {
    onPatternStatusChange({
      hasPattern: hasPat,
      isVerified: verified,
      statusLabel: label,
      dotsCount: count,
    });
  };

  // Verify Pattern in customer presence
  const handleCheckPattern = () => {
    if (patternSequence.length < 2) {
      alert('براہ کرم پہلے اسکرین پر پیٹرن ڈرا کریں۔');
      return;
    }

    setIsVerified(true);
    setFeedbackMsg('کسٹمر کی موجودگی میں پیٹرن لاک کی کامیاب تصدیق ہو چکی ہے۔ (Verified)');
    updateParentStatus(true, true, 'Lock Present & Verified', patternSequence.length);
  };

  // Clear / Reset
  const handleClear = () => {
    setPatternSequence([]);
    setCurrentDragPoint(null);
    setIsDrawing(false);
    setIsVerified(false);
    setHasPattern(false);
    setFeedbackMsg('پیٹرن کینوس صاف کر دیا گیا ہے۔');
    updateParentStatus(false, false, 'None', 0);
  };

  // Replay Pattern Animation
  const handleReplay = useCallback(() => {
    if (patternSequence.length === 0) return;
    setIsReplaying(true);
    setReplaySequence([]);
    setFeedbackMsg('پیٹرن اینیمیشن چل رہی ہے...');

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setReplaySequence(patternSequence.slice(0, step));
      if (step >= patternSequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsReplaying(false);
          setFeedbackMsg('اینیمیشن مکمل ہو گئی۔');
        }, 600);
      }
    }, 400);
  }, [patternSequence]);

  const activeSequence = isReplaying ? replaySequence : patternSequence;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0353a4]/40 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Mobile Pattern Lock Verification</span>
              <span className="font-serif text-[#d4af37] text-sm">موبائل اسکرین پیٹرن لاک</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              کسٹمر کی موجودگی میں 3×3 ڈاٹس پر پیٹرن لاک بنا کر ٹیسٹ کریں
            </p>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              isVerified
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500'
                : hasPattern
                ? 'bg-amber-950/60 text-amber-300 border-amber-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lock Verified (تصدیق شدہ)</span>
              </>
            ) : hasPattern ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Pattern Drawn (Unverified)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>No Lock / پیٹرن نہیں ہے</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Interactive 3x3 Canvas */}
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-[#020713] border-2 border-[#d4af37]/60 shadow-[0_0_30px_rgba(212,175,55,0.15)] touch-none select-none cursor-crosshair overflow-hidden"
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => {
              const t = e.touches[0];
              handleStart(t.clientX, t.clientY);
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              handleMove(t.clientX, t.clientY);
            }}
            onTouchEnd={handleEnd}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#0466c8" />
                </linearGradient>
                <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Lines */}
              {activeSequence.map((dotId, index) => {
                if (index === 0) return null;
                const prev = dots.find((d) => d.id === activeSequence[index - 1]);
                const curr = dots.find((d) => d.id === dotId);
                if (!prev || !curr) return null;

                return (
                  <line
                    key={`line-${index}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={curr.x}
                    y2={curr.y}
                    stroke="url(#lineGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]"
                  />
                );
              })}

              {/* Live Dragging Line to Cursor/Finger */}
              {isDrawing && currentDragPoint && activeSequence.length > 0 && (
                (() => {
                  const lastDot = dots.find((d) => d.id === activeSequence[activeSequence.length - 1]);
                  if (!lastDot) return null;
                  return (
                    <line
                      x1={lastDot.x}
                      y1={lastDot.y}
                      x2={currentDragPoint.x}
                      y2={currentDragPoint.y}
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                    />
                  );
                })()
              )}

              {/* 3x3 Dots */}
              {dots.map((dot) => {
                const isSelected = activeSequence.includes(dot.id);
                const orderIndex = activeSequence.indexOf(dot.id);

                return (
                  <g key={`dot-${dot.id}`}>
                    {/* Outer touch circle target */}
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={isSelected ? 22 : 18}
                      fill={isSelected ? '#0353a4' : '#0a192f'}
                      fillOpacity={isSelected ? 0.6 : 0.4}
                      stroke={isSelected ? '#d4af37' : '#334155'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200"
                    />
                    {/* Inner core dot */}
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={isSelected ? 9 : 6}
                      fill={isSelected ? '#ffe082' : '#94a3b8'}
                      filter={isSelected ? 'url(#dotGlow)' : undefined}
                      className="transition-all duration-200"
                    />
                    {/* Step order badge */}
                    {isSelected && (
                      <text
                        x={dot.x}
                        y={dot.y - 12}
                        textAnchor="middle"
                        fill="#d4af37"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {orderIndex + 1}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            {isDrawing ? 'Dragging pattern...' : 'Finger / Mouse Touch to Draw'}
          </p>
        </div>

        {/* Action Controls & Policy */}
        <div className="space-y-4 text-xs">
          {/* Feedback message */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium ${
                isVerified
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              {feedbackMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCheckPattern}
              disabled={patternSequence.length < 2 || isReplaying}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check Pattern (تصدیق)</span>
            </button>

            <button
              type="button"
              onClick={handleReplay}
              disabled={patternSequence.length < 2 || isReplaying}
              className="py-2.5 px-3 rounded-xl bg-[#0353a4] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <Play className="w-4 h-4 text-[#d4af37]" />
              <span>Replay Motion (دوبارہ دیکھیں)</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset / Clear (صاف کریں)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleClear();
                updateParentStatus(false, false, 'No Lock on Phone', 0);
                setFeedbackMsg('کسٹمر نے تصدیق کی کہ فون پر کوئی پیٹرن لاک نہیں ہے۔');
              }}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 font-semibold flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>No Lock (کوئی لاک نہیں)</span>
            </button>
          </div>

          {/* Privacy & Security Note (As requested) */}
          <div className="p-3.5 rounded-xl bg-[#030b1e] border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#d4af37] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>پرائیویسی و سیکیورٹی پالیسی (Privacy Safeguard)</span>
            </div>
            <p className="leading-relaxed">
              اصل خفیہ پیٹرن کو محفوظ، ویڈیو ریکارڈ یا کسی دوسرے ریکارڈ میں نہیں رکھا جاتا۔ اس کے بجائے صرف <strong>Pattern Lock Available</strong> اور <strong>Lock Verified</strong> کا اسٹیٹس محفوظ کیا جاتا ہے تاکہ کسٹمر کی موجودگی میں تسلی بخش ٹیسٹنگ کی جا سکے۔
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
