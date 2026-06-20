/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TShirtMockupProps {
  colorHex: string;
  text: string;
  fontStyle: string;
  textColor: string;
  scale?: number;
  showPrintArea?: boolean;
}

export default function TShirtMockup({
  colorHex,
  text,
  fontStyle,
  textColor,
  scale = 1,
  showPrintArea = false,
}: TShirtMockupProps) {
  // Determine font family from selected style
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'mono':
        return '"Fira Code", "Courier New", monospace';
      case 'serif':
        return '"Playfair Display", Georgia, "Times New Roman", serif';
      case 'script':
        return '"Brush Script MT", cursive, sans-serif';
      case 'modern':
      default:
        return '"Space Grotesk", "Inter", sans-serif';
    }
  };

  const getFontWeight = () => {
    switch (fontStyle) {
      case 'serif':
        return '600';
      case 'script':
        return 'normal';
      case 'mono':
        return '500';
      case 'modern':
      default:
        return '700';
    }
  };

  const getLetterSpacing = () => {
    switch (fontStyle) {
      case 'mono':
        return '0.05em';
      case 'serif':
        return '0.02em';
      case 'script':
        return 'normal';
      case 'modern':
      default:
        return '0.12em';
    }
  };

  // Split text by space to support neat double-line stacks
  const textWords = text.trim().split(/\s+/);
  const isMultiLine = textWords.length > 1 && text.length > 8;

  // Render text lines with responsive font sizing
  const renderText = () => {
    const maxChars = Math.max(...textWords.map(w => w.length), 6);
    // Base font size calculations driven by scale and word lengths
    const baseSize = isMultiLine ? 24 : 26;
    const calculatedFontSize = Math.min(baseSize, (240 / maxChars)) * scale;

    const styles: React.CSSProperties = {
      fontFamily: getFontFamily(),
      fontWeight: getFontWeight(),
      letterSpacing: getLetterSpacing(),
      textTransform: fontStyle === 'script' ? 'none' : 'uppercase',
      fill: textColor,
    };

    if (isMultiLine) {
      // Split into two parts for display
      const midPoint = Math.ceil(textWords.length / 2);
      const line1 = textWords.slice(0, midPoint).join(' ');
      const line2 = textWords.slice(midPoint).join(' ');

      return (
        <>
          <text
            x="250"
            y={220 - calculatedFontSize * 0.6}
            textAnchor="middle"
            style={{ ...styles, fontSize: `${calculatedFontSize}px` }}
            className="transition-all duration-300 select-none cursor-default"
          >
            {line1}
          </text>
          <text
            x="250"
            y={225 + calculatedFontSize * 0.6}
            textAnchor="middle"
            style={{ ...styles, fontSize: `${calculatedFontSize}px` }}
            className="transition-all duration-300 select-none cursor-default"
          >
            {line2}
          </text>
        </>
      );
    } else {
      return (
        <text
          x="250"
          y="230"
          textAnchor="middle"
          style={{ ...styles, fontSize: `${calculatedFontSize * 1.1}px` }}
          className="transition-all duration-300 select-none cursor-default"
        >
          {text}
        </text>
      );
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[480px] sm:max-w-full mx-auto drop-shadow-[0_25px_40px_rgba(0,0,0,0.12)] transition-transform duration-500 hover:scale-[1.01]">
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Shading gradients */}
          <linearGradient id="innerNeckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.05} />
          </linearGradient>

          <linearGradient id="shadowLeftGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#000" stopOpacity={0} />
          </linearGradient>

          <linearGradient id="shadowRightGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#000" stopOpacity={0} />
          </linearGradient>

          <linearGradient id="foldHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#FFF" stopOpacity={0} />
          </linearGradient>
          
          <linearGradient id="radialAmbientShadow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.12} />
          </linearGradient>
        </defs>

        {/* Ambient Drop Shadow underneath the shirt */}
        <ellipse cx="250" cy="460" rx="140" ry="20" fill="black" opacity="0.1" filter="blur(1px)" />

        {/* --- INNER COLLAR / BRAND LABEL AREA --- */}
        <path
          d="M175,90 Q250,135 325,90 Q250,75 175,90 Z"
          fill="#1e293b" // darker gray representing inner back shadow
          className="transition-colors duration-500"
        />
        {/* Inner shadow overlay */}
        <path
          d="M175,90 Q250,135 325,90 Q250,75 175,90 Z"
          fill="url(#innerNeckGrad)"
        />
        {/* Subtle Brand Logo inside neck */}
        <text
          x="250"
          y="110"
          fontSize="9"
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing="0.15em"
          fill="#94a3b8"
          opacity="0.4"
          textAnchor="middle"
        >
          id'afro
        </text>
        <text
          x="250"
          y="122"
          fontSize="6"
          fontFamily="monospace"
          fill="#94a3b8"
          opacity="0.3"
          textAnchor="middle"
        >
          M / 100% ORGANIC COTTON
        </text>

        {/* --- MAIN T-SHIRT FABRIC SHAPE --- */}
        <path
          id="tshirt-body"
          d="M175,90 
             Q250,135 325,90 
             L395,115 
             Q410,120 422,145
             L450,210 
             Q454,220 442,225
             L390,245 
             Q380,248 375,238
             L360,205 
             C360,250 355,360 365,445 
             Q250,465 135,445 
             C145,360 140,250 140,205 
             L125,238 
             Q120,248 110,245
             L58,225 
             Q46,220 50,210
             L78,145 
             Q90,120 105,115 
             Z"
          fill={colorHex}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="1.5"
          className="transition-colors duration-500"
        />

        {/* --- WRINKLES & HIGH-FIDELITY SHADING OVERLAYS --- */}
        {/* Ambient shadow gradient at bottom belt area */}
        <path
          d="M140,400 C150,420 145,435 135,445 Q250,465 365,445 C355,435 350,420 360,400 Z"
          fill="url(#radialAmbientShadow)"
          opacity="0.6"
        />

        {/* Fold Highlights - Left Sleeve */}
        <path
          d="M105,115 L125,200 L58,225 Z"
          fill="url(#foldHighlight)"
          opacity="0.3"
        />
        {/* Fold Highlights - Right Sleeve */}
        <path
          d="M395,115 L375,200 L442,225 Z"
          fill="url(#foldHighlight)"
          opacity="0.3"
        />

        {/* Sleeve Fold Crease Shadows */}
        {/* Left Armpit Crinkle */}
        <path
          d="M140,215 Q155,225 170,220"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.06"
        />
        {/* Right Armpit Crinkle */}
        <path
          d="M360,215 Q345,225 330,220"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.06"
        />

        {/* Subtle Drape Folds from Neck down */}
        <path
          d="M190,120 Q215,160 210,250"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.04"
        />
        <path
          d="M310,120 Q285,160 290,250"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.04"
        />

        {/* Bottom waist side shadow overlays */}
        <path
          d="M140,205 C140,250 145,360 135,445 L155,442 C162,360 158,250 155,205 Z"
          fill="url(#shadowLeftGrad)"
        />
        <path
          d="M360,205 C360,250 355,360 365,445 L345,442 C338,360 342,250 345,205 Z"
          fill="url(#shadowRightGrad)"
        />

        {/* --- FRONT HEM STITCH TRIMS --- */}
        {/* Crew Neck collar ribbing ring */}
        <path
          d="M175,90 Q250,135 325,90"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M174,88 Q250,137 326,88"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Sleeve Ribs Bottom Stitch Lines */}
        <path d="M58,225 L125,238" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
        <path d="M59,223 L126,236" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        <path d="M442,225 L390,245" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
        <path d="M441,223 L389,243" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* Dynamic Printable Grid Area (Only visible when customizing) */}
        {showPrintArea && (
          <g opacity="0.6">
            <rect
              x="160"
              y="150"
              width="180"
              height="160"
              rx="4"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            <text
              x="250"
              y="144"
              fontSize="8"
              fontFamily="sans-serif"
              fill="#6366f1"
              fontWeight="600"
              letterSpacing="0.05em"
              textAnchor="middle"
            >
              DRAG & PRINT BOUNDARY
            </text>
          </g>
        )}

        {/* --- RENDER PRINTED TEXT --- */}
        <g id="printed-design" className="transform origin-center">
          {renderText()}
        </g>

        {/* Subtle Screenprint texture overlay inside the text region */}
        <rect
          x="162"
          y="152"
          width="176"
          height="156"
          fill="white"
          opacity="0.015"
          style={{ mixBlendMode: 'overlay' }}
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}
