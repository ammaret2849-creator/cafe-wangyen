import React from 'react';

interface CollegeLogoProps {
  className?: string;
  size?: number;
  customUrl?: string;
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  className = '',
  size = 48,
  customUrl,
}) => {
  if (customUrl) {
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={customUrl}
          alt="ตราวิทยาลัยเทคนิควังน้ำเย็น"
          className="w-full h-full object-cover rounded-full shadow-xs border border-[#8B1A22]"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      title="ตราสัญลักษณ์ วิทยาลัยเทคนิควังน้ำเย็น"
    >
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Top text arc: Sweeps over the top half of circle */}
          <path
            id="arc-top-thai"
            d="M 34,150 A 116,116 0 0,1 266,150"
            fill="none"
          />

          {/* Bottom text arc: Sweeps along bottom half, reading correctly from left to right */}
          <path
            id="arc-bottom-eng"
            d="M 38,152 A 114,114 0 0,0 262,152"
            fill="none"
          />

          {/* Golden metallic gradient */}
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="35%" stopColor="#F5C538" />
            <stop offset="70%" stopColor="#D89A14" />
            <stop offset="100%" stopColor="#9E6B04" />
          </linearGradient>

          {/* Maroon depth gradient */}
          <radialGradient id="maroonRadial" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#8C1822" />
            <stop offset="70%" stopColor="#690C14" />
            <stop offset="100%" stopColor="#400308" />
          </radialGradient>
        </defs>

        {/* 1. Outer Black Base Circle */}
        <circle cx="150" cy="150" r="147" fill="#1C0507" />

        {/* 2. Outer Maroon Ring */}
        <circle cx="150" cy="150" r="143" fill="#75131C" stroke="#3A080D" strokeWidth="2" />

        {/* 3. Off-white / Cream Ring for Clear Text Legibility */}
        <circle cx="150" cy="150" r="137" fill="#FFFFFF" stroke="#1C0507" strokeWidth="2" />

        {/* 4. Inner Ring Border */}
        <circle cx="150" cy="150" r="95" fill="none" stroke="#1C0507" strokeWidth="2" />

        {/* 5. Left & Right Dividing Florets */}
        <g transform="translate(30, 150)">
          <circle cx="0" cy="0" r="6" fill="#75131C" />
          <circle cx="0" cy="0" r="2.5" fill="#F5C538" />
        </g>
        <g transform="translate(270, 150)">
          <circle cx="0" cy="0" r="6" fill="#75131C" />
          <circle cx="0" cy="0" r="2.5" fill="#F5C538" />
        </g>

        {/* 6. Top Curved Text (Thai: วิทยาลัยเทคนิควังน้ำเย็น) */}
        <text
          fill="#1C0507"
          fontFamily="'Prompt', 'Noto Sans Thai', 'TH Sarabun New', sans-serif"
          fontSize="18"
          fontWeight="800"
          letterSpacing="0.8"
        >
          <textPath href="#arc-top-thai" startOffset="50%" textAnchor="middle">
            วิทยาลัยเทคนิควังน้ำเย็น
          </textPath>
        </text>

        {/* 7. Bottom Curved Text (English: WANGNAMYEN TECHNICAL COLLEGE) */}
        <text
          fill="#1C0507"
          fontFamily="'Plus Jakarta Sans', 'Arial Black', sans-serif"
          fontSize="10.8"
          fontWeight="800"
          letterSpacing="0.6"
        >
          <textPath href="#arc-bottom-eng" startOffset="50%" textAnchor="middle">
            WANGNAMYEN TECHNICAL COLLEGE
          </textPath>
        </text>

        {/* 8. Center Maroon Disc */}
        <circle cx="150" cy="150" r="93" fill="url(#maroonRadial)" stroke="url(#goldMetallic)" strokeWidth="2" />

        {/* 9. Center Vocational Education Emblem (Golden Dhammacakka Wheel & Kranok Crest) */}
        <g id="center-emblem" transform="translate(150, 142)">
          {/* Left Kranok Flame */}
          <path
            d="M -18,25 C -35,18 -48,0 -44,-22 C -42,-34 -30,-45 -24,-30 C -27,-15 -18,0 -10,8 C -22,-8 -25,-28 -18,-40 C -15,-43 -12,-41 -11,-37 C -10,-20 -5,-5 0,6 Z"
            fill="url(#goldMetallic)"
            stroke="#502E02"
            strokeWidth="0.6"
          />

          {/* Right Kranok Flame */}
          <path
            d="M 18,25 C 35,18 48,0 44,-22 C 42,-34 30,-45 24,-30 C 27,-15 18,0 10,8 C 22,-8 25,-28 18,-40 C 15,-43 12,-41 11,-37 C 10,-20 5,-5 0,6 Z"
            fill="url(#goldMetallic)"
            stroke="#502E02"
            strokeWidth="0.6"
          />

          {/* Pedestal Base */}
          <path
            d="M -22,28 C -16,22 -8,20 0,20 C 8,20 16,22 22,28 C 18,34 10,36 0,36 C -10,36 -18,34 -22,28 Z"
            fill="url(#goldMetallic)"
            stroke="#502E02"
            strokeWidth="0.6"
          />

          {/* Central Pillar */}
          <path
            d="M -12,20 C -10,5 -8,-5 -14,-16 C -9,-12 -6,0 -3,10 L 3,10 C 6,0 9,-12 14,-16 C 8,-5 10,5 12,20 Z"
            fill="url(#goldMetallic)"
            stroke="#502E02"
            strokeWidth="0.6"
          />

          {/* Dhammacakka (Wheel of Law) */}
          <g transform="translate(0, -28)">
            {/* Outer Rim */}
            <circle cx="0" cy="0" r="16" fill="none" stroke="url(#goldMetallic)" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="12" fill="#75131C" stroke="url(#goldMetallic)" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="4.5" fill="url(#goldMetallic)" />
            {/* 8 Spokes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1="0"
                y1="0"
                x2={12 * Math.cos((angle * Math.PI) / 180)}
                y2={12 * Math.sin((angle * Math.PI) / 180)}
                stroke="url(#goldMetallic)"
                strokeWidth="1.5"
              />
            ))}
          </g>

          {/* Flame Finial on Top of Wheel */}
          <path
            d="M -5,-44 C -8,-55 0,-65 0,-68 C 0,-65 8,-55 5,-44 C 3,-48 0,-52 0,-52 C 0,-52 -3,-48 -5,-44 Z"
            fill="url(#goldMetallic)"
            stroke="#502E02"
            strokeWidth="0.5"
          />
        </g>

        {/* 10. Center Initials: ท. ส. น. ม. */}
        <text
          x="150"
          y="222"
          textAnchor="middle"
          fontFamily="'Prompt', 'Noto Sans Thai', sans-serif"
          fontSize="14"
          fontWeight="900"
          fill="url(#goldMetallic)"
          stroke="#380408"
          strokeWidth="0.5"
          letterSpacing="1.5"
        >
          ท. ส. น. ม.
        </text>
      </svg>
    </div>
  );
};
