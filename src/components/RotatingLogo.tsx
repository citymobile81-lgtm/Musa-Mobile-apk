import React, { useState, useEffect } from 'react';

interface RotatingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
  className?: string;
  customLogoUrl?: string;
  disableRotation?: boolean;
}

export const RotatingLogo: React.FC<RotatingLogoProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
  customLogoUrl,
  disableRotation = false,
}) => {
  // Support custom uploaded logo from props or localStorage
  const [activeLogoUrl, setActiveLogoUrl] = useState<string | null>(customLogoUrl || null);

  useEffect(() => {
    if (customLogoUrl) {
      setActiveLogoUrl(customLogoUrl);
    } else {
      try {
        const stored = localStorage.getItem('musa_custom_official_logo');
        if (stored) {
          setActiveLogoUrl(stored);
        } else {
          setActiveLogoUrl(null);
        }
      } catch {
        // ignore
      }
    }
  }, [customLogoUrl]);

  // Real-time synchronization whenever logo is updated/removed in Settings
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem('musa_custom_official_logo');
        setActiveLogoUrl(stored || null);
      } catch {
        // ignore
      }
    };
    window.addEventListener('musa-logo-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('musa-logo-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    '2xl': 'w-48 h-48 sm:w-56 sm:h-56',
  };

  const svgPixelMap = {
    xs: 32,
    sm: 44,
    md: 56,
    lg: 96,
    xl: 144,
    '2xl': 224,
  };

  const pixelSize = svgPixelMap[size];

  return (
    <div className={`perspective-1000 inline-block select-none ${className}`}>
      <div
        className={`relative ${sizeMap[size]} rounded-full overflow-hidden flex items-center justify-center transition-all ${
          disableRotation ? '' : 'rotate-3d-logo'
        } ${
          showGlow
            ? 'shadow-[0_0_40px_rgba(212,175,55,0.45),0_0_15px_rgba(56,189,248,0.3)] ring-2 ring-[#d4af37]/80 border-2 border-[#d4af37]'
            : 'border-2 border-[#d4af37]/70 shadow-lg'
        } bg-[#030b1e]`}
        title="MUSA MOBILE REPAIRING CENTER - Official Round Logo"
      >
        {activeLogoUrl ? (
          <div className="w-full h-full rounded-full overflow-hidden bg-[#030b1e] flex items-center justify-center">
            <img
              src={activeLogoUrl}
              alt="Musa Mobile Repairing Center Official Logo"
              className="w-full h-full object-cover rounded-full select-none pointer-events-none"
            />
          </div>
        ) : (
          /* Official Circular Emblem SVG Vector */
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]"
          >
            <defs>
              <linearGradient id="goldOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff5b8" />
                <stop offset="35%" stopColor="#d4af37" />
                <stop offset="70%" stopColor="#997819" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>

              <linearGradient id="goldInnerGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe58f" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#7a5c12" />
              </linearGradient>

              <radialGradient id="centerNavyRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0c2d6b" />
                <stop offset="60%" stopColor="#030b1e" />
                <stop offset="100%" stopColor="#020713" />
              </radialGradient>

              <linearGradient id="cyanTechGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              <path id="topLogoArc" d="M 75 250 A 175 175 0 0 1 425 250" fill="none" />
              <path id="bottomLogoArc" d="M 425 250 A 175 175 0 0 1 75 250" fill="none" />
            </defs>

            {/* Outer Circular Edge */}
            <circle cx="250" cy="250" r="242" fill="#020713" stroke="url(#goldOuterGrad)" strokeWidth="7" />

            {/* Outer Beaded Dotted Gold Ring */}
            <circle cx="250" cy="250" r="230" fill="none" stroke="url(#goldInnerGrad)" strokeWidth="2.5" strokeDasharray="5 5" />

            {/* Dark Navy Ribbon Track for Text */}
            <circle cx="250" cy="250" r="198" fill="#030b1e" stroke="url(#goldOuterGrad)" strokeWidth="5.5" />

            {/* Circular Text: Top Arc (English Name) */}
            <text
              fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
              fontSize="21"
              fontWeight="900"
              fill="url(#goldOuterGrad)"
              letterSpacing="3"
            >
              <textPath href="#topLogoArc" startOffset="50%" textAnchor="middle">
                ★ MUSA MOBILE REPAIRING CENTER ★
              </textPath>
            </text>

            {/* Circular Text: Bottom Arc (Phone & City) */}
            <text
              fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
              fontSize="19"
              fontWeight="800"
              fill="#ffffff"
              letterSpacing="3.5"
            >
              <textPath href="#bottomLogoArc" startOffset="50%" textAnchor="middle">
                ★ 03006861765 ★ MUZAFFARGARH ★
              </textPath>
            </text>

            {/* Inner Gold Beveled Ring */}
            <circle cx="250" cy="250" r="158" fill="url(#centerNavyRadial)" stroke="url(#goldOuterGrad)" strokeWidth="4.5" />
            <circle cx="250" cy="250" r="148" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />

            {/* Urdu Title in Core */}
            <g transform="translate(250, 136)">
              <text
                textAnchor="middle"
                fontFamily="'Noto Nastaliq Urdu', serif"
                fontSize="21"
                fontWeight="bold"
                fill="#ffe58f"
              >
                موسی موبائل ریپیئرنگ سینٹر
              </text>
              <text
                y="21"
                textAnchor="middle"
                fontFamily="'Noto Nastaliq Urdu', serif"
                fontSize="12"
                fontWeight="bold"
                fill="#94a3b8"
              >
                میاں اظہر قریشی • 03006861765
              </text>
            </g>

            {/* Circuit Traces */}
            <g stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
              <path d="M 165 225 H 195 L 210 240" fill="none" />
              <circle cx="165" cy="225" r="3" fill="#38bdf8" />
              <path d="M 335 225 H 305 L 290 240" fill="none" />
              <circle cx="335" cy="225" r="3" fill="#38bdf8" />
              <path d="M 165 275 H 195 L 210 260" fill="none" />
              <circle cx="165" cy="275" r="3" fill="#38bdf8" />
              <path d="M 335 275 H 305 L 290 260" fill="none" />
              <circle cx="335" cy="275" r="3" fill="#38bdf8" />
            </g>

            {/* Central High-Tech Smartphone */}
            <rect
              x="204"
              y="176"
              width="92"
              height="150"
              rx="16"
              fill="#020817"
              stroke="url(#goldOuterGrad)"
              strokeWidth="4"
            />
            <rect
              x="212"
              y="190"
              width="76"
              height="122"
              rx="9"
              fill="#04122d"
              stroke="#0052a3"
              strokeWidth="1.5"
            />
            {/* Ear Speaker & Camera */}
            <rect x="238" y="181" width="24" height="3" rx="1.5" fill="#e2e8f0" />
            <circle cx="230" cy="182.5" r="1.5" fill="#38bdf8" />

            {/* Diagnostics Gear in Core */}
            <g transform="translate(250, 251)">
              <circle
                cx="0"
                cy="0"
                r="28"
                stroke="url(#cyanTechGlow)"
                strokeWidth="3.2"
                fill="none"
                strokeDasharray="7 5"
              />
              <circle cx="0" cy="0" r="16" stroke="url(#goldOuterGrad)" strokeWidth="2" fill="none" />
              <circle cx="0" cy="0" r="6" fill="#d4af37" />
            </g>

            {/* Crossed Screwdriver & Wrench */}
            <g transform="translate(250, 251) rotate(45)">
              <path d="M -56 0 L 56 0" stroke="#f8fafc" strokeWidth="5.5" strokeLinecap="round" />
              <rect
                x="18"
                y="-6"
                width="38"
                height="12"
                rx="3"
                fill="url(#goldOuterGrad)"
                stroke="#7a5c12"
                strokeWidth="1.5"
              />
              <path d="M -63 -3.5 L -56 0 L -63 3.5 Z" fill="#94a3b8" />
            </g>
            <g transform="translate(250, 251) rotate(-45)">
              <path d="M -52 0 L 52 0" stroke="url(#goldOuterGrad)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="-42" cy="0" r="11" fill="#030b1e" stroke="url(#goldOuterGrad)" strokeWidth="3.5" />
              <circle cx="42" cy="0" r="11" fill="#030b1e" stroke="url(#goldOuterGrad)" strokeWidth="3.5" />
            </g>

            {/* Bottom 20 Years Service Ribbon */}
            <g transform="translate(250, 355)">
              <path
                d="M -115 -13 L 115 -13 L 105 13 L -105 13 Z"
                fill="#020817"
                stroke="url(#goldOuterGrad)"
                strokeWidth="2"
              />
              <text
                y="5"
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                fontSize="11"
                fontWeight="900"
                fill="#ffe58f"
                letterSpacing="1.5"
              >
                20 YEARS SERVICE • ORIGINAL PARTS
              </text>
            </g>

            {/* Bottom Urdu Tagline */}
            <g transform="translate(250, 385)">
              <text
                textAnchor="middle"
                fontFamily="'Noto Nastaliq Urdu', serif"
                fontSize="12"
                fontWeight="bold"
                fill="#38bdf8"
              >
                موبائل ریپیئرنگ • ہول سیل پارٹس • ایکسیسریز
              </text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
