import { BRIDGE_PATH, GOLD_PATH } from "./brand-paths";

export function HeroArt() {
  return (
    <figure className="hero-art">
      <div className="art-corner top-left" />
      <div className="art-corner bottom-right" />
      <svg
        viewBox="0 0 760 640"
        className="hero-art-desktop"
        fill="none"
        role="img"
        aria-labelledby="hero-art-title hero-art-description"
      >
        <title id="hero-art-title">
          Four protocols. One shared Kervan core.
        </title>
        <desc id="hero-art-description">
          FTP and FTPS listeners, and the shared SFTP and SCP SSH listener,
          connect to a common authentication engine, virtual filesystem and
          audit pipeline. The core supports local, memory and S3 storage.
        </desc>
        <defs>
          <pattern
            id="art-grid"
            width="56"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0 56 16 28 32 0 16Z"
              stroke="var(--art-grid)"
              strokeWidth=".5"
            />
          </pattern>
          <linearGradient
            id="gold-top"
            x1="225"
            y1="245"
            x2="545"
            y2="365"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#edcf7c" />
            <stop offset="1" stopColor="#b68a32" />
          </linearGradient>
          <linearGradient
            id="gold-side"
            x1="227"
            y1="280"
            x2="540"
            y2="400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ad822d" />
            <stop offset="1" stopColor="#60471f" />
          </linearGradient>
          <linearGradient
            id="gold-face"
            x1="385"
            y1="300"
            x2="385"
            y2="435"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#dbb556" />
            <stop offset="1" stopColor="#94702d" />
          </linearGradient>
          <radialGradient id="core-halo">
            <stop stopColor="var(--brand-gold)" stopOpacity=".17" />
            <stop offset="1" stopColor="var(--brand-gold)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M0 120 380-80 760 120V520L380 720 0 520Z"
          fill="url(#art-grid)"
          opacity=".6"
        />
        <ellipse cx="390" cy="350" rx="270" ry="230" fill="url(#core-halo)" />
        <g stroke="var(--art-wire)" strokeWidth="1.5">
          <path id="ftp-flow" d="M133 185V258L278 341" />
          <path id="ftps-flow" d="M102 369 238 447 306 408" />
          <path id="ssh-flow" d="M624 174V257L501 329" />
          <path id="storage-flow" d="m502 406 109 64v66" />
        </g>
        <g
          stroke="var(--brand-gold)"
          strokeWidth="2"
          strokeDasharray="6 180"
          className="art-packets"
        >
          <path d="M133 185V258L278 341" />
          <path d="M102 369 238 447 306 408" />
          <path d="M624 174V257L501 329" />
          <path d="m502 406 109 64v66" />
        </g>
        <g className="core-platform">
          <path
            d="m201 409 184-106 184 106v24L385 539 201 433Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m201 409 184-106 184 106-184 106Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <path
            d="m225 408 160-92 160 92-160 92Z"
            stroke="var(--brand-gold)"
            opacity=".4"
          />
        </g>
        <g className="core-layer lower">
          <path
            d="m251 360 134-77 134 77v32l-134 78-134-78Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m251 360 134-77 134 77-134 78Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <path
            d="m269 393 83 48"
            stroke="var(--brand-gold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="495" cy="390" r="3" fill="var(--brand-gold)" />
        </g>
        <g className="core-layer middle">
          <path
            d="m251 318 134-77 134 77v32l-134 78-134-78Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m251 318 134-77 134 77-134 78Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <path
            d="m269 351 60 34"
            stroke="var(--brand-gold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="495" cy="348" r="3" fill="var(--brand-gold)" />
        </g>
        <g className="core-layer upper">
          <path
            d="m251 268 134-77 134 77v42l-134 78-134-78Z"
            fill="url(#gold-side)"
          />
          <path d="m385 346 134-78v42l-134 78Z" fill="url(#gold-face)" />
          <path
            d="m251 268 134-77 134 77-134 78Z"
            fill="url(#gold-top)"
            stroke="#f0d78e"
          />
          <path
            d="m269 305 82 47"
            stroke="#f3d88a"
            strokeWidth="2"
            opacity=".6"
          />
          <g transform="translate(311 235) scale(.53 .31)">
            <path d={GOLD_PATH} fill="#5e461d" fillRule="evenodd" />
            <path d={BRIDGE_PATH} fill="#fff5d5" fillRule="evenodd" />
          </g>
          <circle cx="496" cy="307" r="3" fill="#fff3c6" />
        </g>
        <g className="art-node">
          <path
            d="m74 135 59-34 59 34v49l-59 34-59-34Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m74 135 59-34 59 34-59 34Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <text
            x="133"
            y="142"
            textAnchor="middle"
            className="node-label"
            transform="rotate(-30 133 142)"
          >
            FTP
          </text>
          <circle cx="133" cy="201" r="3" fill="var(--brand-gold)" />
        </g>
        <g className="art-node">
          <path
            d="m43 316 59-34 59 34v49l-59 34-59-34Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m43 316 59-34 59 34-59 34Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <text
            x="102"
            y="323"
            textAnchor="middle"
            className="node-label"
            transform="rotate(-30 102 323)"
          >
            FTPS
          </text>
          <circle cx="102" cy="382" r="3" fill="var(--brand-gold)" />
        </g>
        <g className="art-node">
          <path
            d="m565 122 59-34 59 34v49l-59 34-59-34Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m565 122 59-34 59 34-59 34Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <text
            x="624"
            y="129"
            textAnchor="middle"
            className="node-label"
            transform="rotate(-30 624 129)"
          >
            SSH
          </text>
          <circle cx="624" cy="188" r="3" fill="var(--brand-gold)" />
        </g>
        <g className="art-labels" fill="var(--art-label)">
          <text x="133" y="246" textAnchor="middle">
            :2121
          </text>
          <text x="95" y="434" textAnchor="middle">
            TLS ENCRYPTED
          </text>
          <text x="624" y="234" textAnchor="middle">
            SFTP + SCP · :2222
          </text>
          <text x="611" y="562" textAnchor="middle">
            LOCAL / MEMORY / S3
          </text>
          <text x="385" y="581" textAnchor="middle" className="core-caption">
            ONE SHARED CORE.
          </text>
        </g>
        <g transform="translate(575 470)">
          <path
            d="m0 0 36-21 36 21v38L36 59 0 38Z"
            fill="var(--art-side)"
            stroke="var(--art-edge)"
          />
          <path
            d="m0 0 36-21 36 21-36 21Z"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <path
            d="m14 24 15 9m-15 0 15 9"
            stroke="var(--brand-gold)"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(245 75)">
          <rect
            width="176"
            height="29"
            rx="14.5"
            fill="var(--art-panel)"
            stroke="var(--art-edge)"
          />
          <circle cx="16" cy="14.5" r="3" fill="var(--green)" />
          <text x="29" y="18.5" className="art-labels" fill="var(--art-label)">
            PURE GO. ZERO CGO.
          </text>
        </g>
      </svg>
      <svg
        className="hero-art-compact"
        viewBox="0 0 340 350"
        fill="none"
        role="img"
        aria-labelledby="compact-art-title"
      >
        <title id="compact-art-title">
          FTP, FTPS, SFTP and SCP connect to one shared authentication, VFS and
          audit core.
        </title>
        <defs>
          <linearGradient
            id="compact-gold"
            x1="80"
            y1="150"
            x2="260"
            y2="240"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#edcf7c" />
            <stop offset="1" stopColor="#b68a32" />
          </linearGradient>
        </defs>
        <g stroke="var(--art-grid)" opacity=".35">
          <path d="M0 100H340M0 160H340M0 220H340M0 280H340M50 80V310M110 80V310M170 80V310M230 80V310M290 80V310" />
        </g>
        <g stroke="var(--art-wire)">
          <path d="M44 66V90L170 140M128 66V114L170 140M212 66V114L170 140M296 66V90L170 140" />
        </g>
        {["FTP", "FTPS", "SFTP", "SCP"].map((protocol, i) => (
          <g key={protocol} transform={`translate(${8 + i * 84} 24)`}>
            <rect
              width="72"
              height="42"
              rx="5"
              fill="var(--art-panel)"
              stroke="var(--art-edge)"
            />
            <text
              x="36"
              y="26"
              textAnchor="middle"
              fill="var(--gold)"
              fontSize="12"
              fontFamily="var(--mono)"
            >
              {protocol}
            </text>
          </g>
        ))}
        <path
          d="m70 230 100-50 100 50v16l-100 50-100-50Z"
          fill="var(--art-side)"
          stroke="var(--art-edge)"
        />
        <path
          d="m70 230 100-50 100 50-100 50Z"
          fill="var(--art-panel)"
          stroke="var(--art-edge)"
        />
        <path
          d="m90 191 80-40 80 40v35l-80 40-80-40Z"
          fill="var(--art-side)"
          stroke="var(--art-edge)"
        />
        <path
          d="m90 191 80-40 80 40-80 40Z"
          fill="var(--art-panel)"
          stroke="var(--art-edge)"
        />
        <path d="m90 157 80-40 80 40v35l-80 40-80-40Z" fill="#9a762d" />
        <path d="m170 197 80-40v35l-80 40Z" fill="#b9913c" />
        <path
          d="m90 157 80-40 80 40-80 40Z"
          fill="url(#compact-gold)"
          stroke="#f0d78e"
        />
        <g transform="translate(120 139) scale(.36 .25)">
          <path d={GOLD_PATH} fill="#5e461d" fillRule="evenodd" />
          <path d={BRIDGE_PATH} fill="#fff5d5" fillRule="evenodd" />
        </g>
        <text
          x="170"
          y="314"
          textAnchor="middle"
          fill="var(--gold)"
          fontSize="12"
          fontFamily="var(--mono)"
          letterSpacing="1"
        >
          ONE AUTH · ONE VFS · ONE AUDIT
        </text>
        <text
          x="170"
          y="337"
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="10"
          fontFamily="var(--mono)"
        >
          LOCAL DISK / MEMORY / S3
        </text>
      </svg>
      <figcaption>
        <span>
          <span className="figure-number">FIG. 01</span> Different paths. Same
          destination.
        </span>
        <span>BUILT TO CONNECT ↗</span>
      </figcaption>
    </figure>
  );
}
