/**
 * Sentivoy — AI-Powered Cybersecurity Platform Landing Page
 * Dependencies: react, three, recharts, lucide-react
 * Usage: import SentivoyLanding from './SentivoyLanding'
 */
import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as THREE from "three";
import {
  Shield, Activity, Globe, Zap, BarChart2, Lock,
  Play, Twitter, Linkedin, Github, ChevronRight,
  Eye, Bell, Database, Cpu, Search, Menu, X,
  ArrowRight, CheckCircle, Star,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─────────────────────────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────────────────────────── */
const C = {
  primary:   "#3B5BFF",
  navy:      "#0F172A",
  navyMid:   "#1E293B",
  lightBlue: "#EAF2FF",
  border:    "#E2EAF4",
  textMuted: "#64748B",
  white:     "#FFFFFF",
  orange:    "#FF8C42",
  red:       "#EF4444",
};

const FONT = "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif";

/* ─────────────────────────────────────────────────────────────────
   CHART DATA
───────────────────────────────────────────────────────────────── */
const eventsData = [
  { t: "Mon", events: 4200, threats: 12 },
  { t: "Tue", events: 5800, threats: 8 },
  { t: "Wed", events: 4400, threats: 19 },
  { t: "Thu", events: 7200, threats: 6 },
  { t: "Fri", events: 5900, threats: 24 },
  { t: "Sat", events: 6600, threats: 11 },
  { t: "Sun", events: 8400, threats: 15 },
];

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: ${FONT}; background: #fff; color: ${C.navy}; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 1; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
  @keyframes slide-x { from{transform:translateX(-6px);opacity:0} to{transform:translateX(0);opacity:1} }

  .sentivoy-page { font-family: ${FONT}; }

  .nav-link {
    color: ${C.navyMid};
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    padding: 6px 4px;
    transition: color .2s;
    cursor: pointer;
  }
  .nav-link:hover { color: ${C.primary}; }

  .btn-primary {
    background: ${C.primary};
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 600;
    font-family: ${FONT};
    cursor: pointer;
    transition: background .2s, transform .15s, box-shadow .2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    text-decoration: none;
  }
  .btn-primary:hover {
    background: #2a48e8;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(59,91,255,.35);
  }
  .btn-outline {
    background: transparent;
    color: ${C.navy};
    border: 1.5px solid ${C.border};
    border-radius: 10px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 600;
    font-family: ${FONT};
    cursor: pointer;
    transition: all .2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .btn-outline:hover {
    background: ${C.lightBlue};
    border-color: ${C.primary};
    color: ${C.primary};
    transform: translateY(-1px);
  }
  .btn-white {
    background: #fff;
    color: ${C.primary};
    border: none;
    border-radius: 10px;
    padding: 12px 26px;
    font-size: 14px;
    font-weight: 700;
    font-family: ${FONT};
    cursor: pointer;
    transition: all .2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,.12);
  }
  .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.18); }
  .btn-outline-white {
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,.5);
    border-radius: 10px;
    padding: 12px 26px;
    font-size: 14px;
    font-weight: 600;
    font-family: ${FONT};
    cursor: pointer;
    transition: all .2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-outline-white:hover { background: rgba(255,255,255,.15); border-color: #fff; }

  .feature-card {
    background: #fff;
    border: 1.5px solid ${C.border};
    border-radius: 20px;
    padding: 28px 28px 32px;
    transition: all .25s;
    cursor: default;
  }
  .feature-card:hover {
    border-color: ${C.primary};
    box-shadow: 0 12px 40px rgba(59,91,255,.12);
    transform: translateY(-4px);
  }
  .feature-icon {
    width: 48px; height: 48px;
    background: ${C.lightBlue};
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    transition: background .25s;
  }
  .feature-card:hover .feature-icon { background: ${C.primary}; }
  .feature-card:hover .feature-icon svg { color: #fff !important; }

  .testimonial-card {
    background: #fff;
    border: 1.5px solid ${C.border};
    border-radius: 20px;
    padding: 28px;
    transition: all .25s;
    flex-shrink: 0;
    width: 320px;
  }
  .testimonial-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.08); transform: translateY(-3px); }

  .stat-pill {
    display: flex; align-items: center; gap: 8px;
    background: #fff;
    border: 1.5px solid ${C.border};
    border-radius: 40px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    color: ${C.navy};
    box-shadow: 0 4px 16px rgba(0,0,0,.06);
    animation: float 4s ease-in-out infinite;
    white-space: nowrap;
  }

  .live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    position: relative;
  }
  .live-dot::after {
    content: '';
    position: absolute; inset: -3px;
    border-radius: 50%;
    background: rgba(34,197,94,.4);
    animation: pulse-ring 1.5s ease-out infinite;
  }

  .globe-card {
    position: absolute;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: none;
    border-radius: 14px;
    padding: 12px 16px;
    font-size: 12px;
    box-shadow: none;
    pointer-events: none;
  }

  .section-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${C.lightBlue};
    color: ${C.primary};
    border-radius: 40px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .footer-link {
    color: #94A3B8;
    text-decoration: none;
    font-size: 13px;
    transition: color .2s;
    display: block;
    margin-bottom: 10px;
  }
  .footer-link:hover { color: #fff; }

  .phone-mockup {
    background: #1E293B;
    border-radius: 36px;
    padding: 14px;
    box-shadow: 0 32px 80px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08);
    position: relative;
    overflow: hidden;
  }
  .phone-screen {
    background: #0F172A;
    border-radius: 26px;
    overflow: hidden;
  }
  .phone-notch {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    width: 80px; height: 22px;
    background: #1E293B;
    border-radius: 0 0 16px 16px;
    z-index: 10;
  }

  .risk-ring {
    position: relative;
    width: 120px; height: 120px;
    display: flex; align-items: center; justify-content: center;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${C.lightBlue};
    color: ${C.primary};
    border: 1px solid rgba(59,91,255,.2);
    border-radius: 40px;
    padding: 7px 16px 7px 10px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 24px;
    animation: fadeIn .6s ease;
  }

  .gradient-text {
    background: linear-gradient(135deg, ${C.primary} 0%, #7B5CE4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 768px) {
    .hero-grid { flex-direction: column !important; }
    .features-grid { grid-template-columns: 1fr 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .testimonial-card { width: 280px !important; }
    .hero-headline { font-size: 36px !important; }
  }
  @media (max-width: 480px) {
    .features-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
    .hero-headline { font-size: 28px !important; }
    .dashboard-grid { flex-direction: column !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   THREE.JS REALISTIC EARTH GLOBE
───────────────────────────────────────────────────────────────── */

const ATMOS_VS = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOS_FS = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
    gl_FragColor = vec4(0.40, 0.55, 1.0, 1.0) * intensity * 0.9;
  }
`;

function GlobeVisualization() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 520;
    const H = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.border = "none";
    renderer.domElement.style.outline = "none";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Earth sphere with real texture
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthTex = loader.load("/earth-map.jpg");
    earthTex.colorSpace = THREE.SRGBColorSpace;
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      bumpMap: loader.load("/earth-topo.png"),
      bumpScale: 0.015,
      specular: new THREE.Color(0x333333),
      shininess: 8,
    });
    group.add(new THREE.Mesh(earthGeo, earthMat));

    // Atmospheric glow shader
    const atmosGeo = new THREE.SphereGeometry(1.14, 32, 32);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: ATMOS_VS, fragmentShader: ATMOS_FS,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
      transparent: true, depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // lat/lng → Vec3
    const toVec3 = (lat: number, lng: number, r = 1.02) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta),
      );
    };

    // City markers
    const CITIES = [
      { lat: 51.5, lng: -0.1, type: 0 },
      { lat: 40.7, lng: -74.0, type: 0 },
      { lat: 35.7, lng: 139.7, type: 1 },
      { lat: 1.3, lng: 103.8, type: 0 },
      { lat: -33.9, lng: 18.4, type: 2 },
      { lat: 48.9, lng: 2.4, type: 1 },
      { lat: 55.8, lng: 37.6, type: 0 },
      { lat: -23.5, lng: -46.6, type: 1 },
      { lat: 28.6, lng: 77.2, type: 0 },
      { lat: 31.2, lng: 121.5, type: 2 },
      { lat: 19.4, lng: -99.1, type: 1 },
      { lat: -37.8, lng: 144.9, type: 0 },
    ];
    const NODE_COLORS = [0x3B5BFF, 0xFF8C42, 0xEF4444];

    const nodes = CITIES.map((c, i) => {
      const pos = toVec3(c.lat, c.lng);
      const color = NODE_COLORS[c.type];
      const dotGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      group.add(dot);

      const ringGeo = new THREE.RingGeometry(0.025, 0.04, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      group.add(ring);

      return { dot, ring, pos, type: c.type, phase: (i / CITIES.length) * Math.PI * 2 };
    });

    // Curved arcs between cities
    const ARC_PAIRS = [
      [0, 1], [1, 2], [2, 3], [0, 5], [6, 0],
      [3, 8], [7, 4], [9, 2], [10, 1], [5, 9],
    ];
    const arcs = ARC_PAIRS.map(([i, j]) => {
      const a = nodes[i], b = nodes[j];
      const mid = new THREE.Vector3()
        .addVectors(a.pos, b.pos).multiplyScalar(0.5)
        .normalize().multiplyScalar(1.35 + a.pos.distanceTo(b.pos) * 0.22);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 48; k++) {
        const t = k / 48;
        pts.push(new THREE.Vector3(
          (1 - t) * (1 - t) * a.pos.x + 2 * (1 - t) * t * mid.x + t * t * b.pos.x,
          (1 - t) * (1 - t) * a.pos.y + 2 * (1 - t) * t * mid.y + t * t * b.pos.y,
          (1 - t) * (1 - t) * a.pos.z + 2 * (1 - t) * t * mid.z + t * t * b.pos.z,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.003, 5, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: NODE_COLORS[Math.min(nodes[i].type, nodes[j].type)],
        transparent: true, opacity: 0.45,
      });
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(mesh);
      return { mesh, mat: tubeMat, phase: Math.random() * Math.PI * 2 };
    });

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const dL1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dL1.position.set(5, 3, 5);
    scene.add(dL1);
    const dL2 = new THREE.DirectionalLight(0x8888ff, 0.2);
    dL2.position.set(-3, -2, -3);
    scene.add(dL2);

    // Mouse parallax
    let tX = 0, tY = 0, cX = 0, cY = 0;
    const onMove = (e: MouseEvent) => {
      tX = ((e.clientY / window.innerHeight) - 0.5) * 0.4;
      tY = ((e.clientX / window.innerWidth) - 0.5) * -0.4;
    };
    window.addEventListener("mousemove", onMove);

    // Animation loop
    let raf: number;
    let t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.016;
      cX += (tX - cX) * 0.04;
      cY += (tY - cY) * 0.04;
      group.rotation.y = t * 0.08 + cY;
      group.rotation.x = 0.1 + cX;
      nodes.forEach((n) => {
        const s = 1 + 0.6 * Math.abs(Math.sin(t * 1.6 + n.phase));
        n.dot.scale.setScalar(s);
        n.ring.scale.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 1.2 + n.phase)));
        (n.ring.material as THREE.MeshBasicMaterial).opacity =
          0.15 + 0.35 * Math.abs(Math.sin(t * 1.2 + n.phase + Math.PI));
      });
      arcs.forEach((a) => {
        a.mat.opacity = 0.25 + 0.3 * Math.abs(Math.sin(t * 0.6 + a.phase));
      });
      renderer.render(scene, camera);
    };
    tick();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        maxWidth: 560,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        position: "relative",
        background: "transparent",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   RISK RING (SVG donut)
───────────────────────────────────────────────────────────────── */
function RiskRing({ score = 85, label = "High Risk", color = "#EF4444" }: { score?: number, label?: string, color?: string }) {
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PHONE MOCKUP
───────────────────────────────────────────────────────────────── */
function PhoneMockup({ variant = "alerts" }: { variant?: "alerts" | "map" }) {
  const isAlerts = variant === "alerts";
  return (
    <div
      className="phone-mockup"
      style={{
        width: 200,
        height: 390,
        flexShrink: 0,
        transform: isAlerts ? "rotate(-4deg)" : "rotate(3deg)",
      }}
    >
      <div className="phone-notch" />
      <div
        className="phone-screen"
        style={{ height: 362, overflow: "hidden", padding: "32px 12px 16px" }}
      >
        {isAlerts ? (
          <>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: ".06em" }}>
              ACTIVE ALERTS
            </div>
            {[
              { title: "Impossible Travel", sev: "High",   col: C.red    },
              { title: "Multiple Failed Logins", sev: "Med", col: C.orange },
              { title: "Unusual API Activity", sev: "Low", col: "#22C55E" },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,.06)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 8,
                  borderLeft: `3px solid ${a.col}`,
                }}
              >
                <div style={{ color: "#F1F5F9", fontSize: 11, fontWeight: 600 }}>{a.title}</div>
                <div style={{ color: a.col, fontSize: 10, fontWeight: 700, marginTop: 3 }}>{a.sev}</div>
              </div>
            ))}
            <button
              style={{
                width: "100%", marginTop: 12, background: C.primary,
                border: "none", borderRadius: 8, color: "#fff",
                fontSize: 11, fontWeight: 700, padding: "9px 0", cursor: "pointer",
              }}
            >
              View All
            </button>
          </>
        ) : (
          <>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: ".06em" }}>
              LIVE MAP
            </div>
            <div
              style={{
                background: "rgba(59,91,255,.15)",
                borderRadius: 10,
                height: 130,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(59,91,255,.3)",
              }}
            >
              <Globe size={28} style={{ color: C.primary, opacity: .7 }} />
            </div>
            <div style={{ color: "#CBD5E1", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Top Locations</div>
            {[["United States", "5.2K"], ["Germany", "2.1K"], ["Singapore", "1.8K"]].map(([c, n], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#94A3B8", fontSize: 10 }}>{c}</span>
                <span style={{ color: "#F1F5F9", fontSize: 10, fontWeight: 600 }}>{n}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────────────── */
export const Route = createFileRoute("/")({
  component: SentivoyLanding,
});

function SentivoyLanding() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [tIdx,     setTIdx]       = useState(0);
  const [liveCount, setLiveCount] = useState(12456);

  // Simulate live ingestion counter
  useEffect(() => {
    const id = setInterval(
      () => setLiveCount((n) => n + Math.floor(Math.random() * 40 + 5)),
      1400,
    );
    return () => clearInterval(id);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    const id = setInterval(() => setTIdx((i) => (i + 1) % 3), 5000);
    return () => clearInterval(id);
  }, []);

  const navLinks = [
    { label: "Product", id: "product" },
    { label: "Features", id: "features" },
    { label: "How it works", id: "how-it-works" },
    { label: "Pricing", id: "pricing" },
    { label: "Resources", id: "resources" }
  ];

  const features = [
    { icon: <Database size={22} />, title: "Real-time log monitoring",  desc: "Ingest logs from hundreds of sources simultaneously with sub-second latency and zero data loss." },
    { icon: <Cpu       size={22} />, title: "AI anomaly detection",     desc: "Detect unusual behaviour using advanced ML models trained on billions of security events." },
    { icon: <Globe     size={22} />, title: "Global threat intelligence", desc: "Correlate events with global threat feeds for smarter, faster contextual analysis." },
    { icon: <Zap       size={22} />, title: "Agentic response system",  desc: "Autonomous decision-making that prioritises and recommends actions in real time." },
    { icon: <BarChart2 size={22} />, title: "Interactive dashboards",   desc: "Visualise trends, threats, and insights with intuitive drag-and-drop dashboards." },
    { icon: <Lock      size={22} />, title: "Secure & scalable",        desc: "Enterprise-grade infrastructure built to handle petabyte-scale log volumes with SOC 2 compliance." },
  ];

  const testimonials = [
    { quote: "Sentivoy transformed how we detect and respond to threats. It's like having an elite security analyst on call 24/7.", name: "Arjun Mehta", role: "CTO, NetSecure", initials: "AM", color: C.primary },
    { quote: "The AI-driven insights helped us slash incident response time by 60%. Onboarding took less than a day.", name: "Priya Nair", role: "Head of Security, Cloudlytics", initials: "PN", color: "#7B5CE4" },
    { quote: "Easy to deploy, insanely powerful AI engine, and the support team is exceptional. Worth every dollar.", name: "David Lee", role: "Security Engineer, FinEdge", initials: "DL", color: C.orange },
  ];

  return (
    <div
      className="sentivoy-page"
      style={{ minHeight: "100vh", background: "#fff", overflowX: "hidden" }}
    >
      {/* inject styles once */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 999,
          background: "rgba(255,255,255,.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1160, margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img
              src="/favicon.png"
              alt="Sentivoy"
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }}
            />
            <span style={{ fontWeight: 800, fontSize: 17, color: C.navy, letterSpacing: "-.02em" }}>
              Sentivoy
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {navLinks.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="nav-link" style={{ display: window.innerWidth < 768 ? "none" : "block" }}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a onClick={() => navigate({ to: "/auth" })} className="nav-link" style={{ display: window.innerWidth < 520 ? "none" : "block" }}>
              Sign in
            </a>
            <button onClick={() => navigate({ to: "/auth" })} className="btn-primary">Get Started</button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        id="product"
        style={{
          background: `linear-gradient(155deg, #fff 45%, ${C.lightBlue} 100%)`,
          padding: "80px 24px 60px",
          overflow: "hidden",
        }}
      >
        <div
          className="hero-grid"
          style={{
            maxWidth: 1160, margin: "0 auto",
            display: "flex", alignItems: "center", gap: 48,
          }}
        >
          {/* Left — copy */}
          <div style={{ flex: 1, minWidth: 0, animation: "fadeUp .7s ease both" }}>
            <div className="hero-badge">
              <div
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: C.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Activity size={12} color="#fff" />
              </div>
              AI-Powered Security Intelligence
            </div>

            <h1
              className="hero-headline"
              style={{
                fontSize: 52, fontWeight: 900, lineHeight: 1.08,
                letterSpacing: "-.03em", color: C.navy,
                marginBottom: 20,
              }}
            >
              Smart security.
              <br />
              <span className="gradient-text">Stronger decisions.</span>
            </h1>

            <p
              style={{
                fontSize: 17, color: C.textMuted, lineHeight: 1.65,
                maxWidth: 440, marginBottom: 36,
              }}
            >
              Sentivoy monitors, detects, and responds to threats in real time
              using AI and behavioural analytics — so your team can act before
              damage is done.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button onClick={() => navigate({ to: "/auth" })} className="btn-primary" style={{ fontSize: 15, padding: "13px 26px" }}>
                Start Free Trial
                <ArrowRight size={16} />
              </button>
              <button className="btn-outline" style={{ fontSize: 15, padding: "13px 22px" }}>
                <Play size={14} style={{ color: C.primary }} />
                Watch Demo
              </button>
            </div>

            {/* Trust bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {["#3B5BFF","#7B5CE4","#FF8C42"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: c, border: "2px solid #fff",
                      marginLeft: i > 0 ? -10 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#fff",
                    }}
                  >
                    {["AM","PN","DL"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                  Trusted by{" "}
                  <span style={{ color: C.primary }}>2,500+</span> security teams
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>across the globe</div>
              </div>
            </div>
          </div>

          {/* Right — globe */}
          <div
            style={{
              flex: 1, minWidth: 0,
              position: "relative",
              height: 480,
              animation: "fadeIn .9s ease .2s both",
            }}
          >
            <GlobeVisualization />

            {/* Floating overlay cards */}
            <div
              className="globe-card"
              style={{ bottom: 60, left: 0, animation: "float 4s ease-in-out infinite" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div className="live-dot" />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>Live Ingestion</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, letterSpacing: "-.02em" }}>
                {liveCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                logs from 24 locations
              </div>
            </div>

            <div
              className="globe-card"
              style={{ top: 40, right: 0, animation: "float 5s ease-in-out .8s infinite" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>
                LEGEND
              </div>
              {[
                { color: C.primary,  label: "Ingestion Point" },
                { color: C.orange,   label: "Processing"      },
                { color: C.red,      label: "Threat Detected" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color }} />
                  <span style={{ fontSize: 12, color: C.navyMid, fontWeight: 500 }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ───────────────────────────────────── */}
      <section style={{ background: "#F8FAFC", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 24px" }}>
        <div
          style={{
            maxWidth: 1000, margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "12px 40px", flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", letterSpacing: ".08em", textTransform: "uppercase" }}>
            Trusted by teams at
          </span>
          {["NetSecure", "Cloudlytics", "FinEdge", "ArcShield", "VaultAI"].map((c) => (
            <span key={c} style={{ fontSize: 16, fontWeight: 800, color: "#CBD5E1", letterSpacing: "-.02em" }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-tag">
              <CheckCircle size={13} /> Features
            </div>
            <h2
              style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-.03em", color: C.navy, marginBottom: 14 }}
            >
              Built for modern security teams
            </h2>
            <p style={{ fontSize: 16, color: C.textMuted, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
              Everything you need to monitor, detect, and respond — in one
              intelligent, integrated platform.
            </p>
          </div>

          <div
            className="features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">
                  <span style={{ color: C.primary, display: "flex" }}>{f.icon}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ──────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          background: `linear-gradient(160deg, ${C.lightBlue} 0%, #fff 60%)`,
          padding: "96px 24px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div
            className="dashboard-grid"
            style={{ display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}
          >
            {/* Left copy */}
            <div style={{ flex: "0 0 320px", minWidth: 0 }}>
              <div className="section-tag">
                <BarChart2 size={13} /> Analytics
              </div>
              <h2
                style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-.03em", color: C.navy, lineHeight: 1.1, marginBottom: 16 }}
              >
                Understand threats
                <br />
                before they impact
              </h2>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.65, marginBottom: 28 }}>
                Sentivoy gives you full context into every event with
                behavioural insights and AI risk scoring — so you
                always know where to focus.
              </p>
              <button className="btn-primary">
                Explore Dashboard <ArrowRight size={15} />
              </button>
            </div>

            {/* Right — dashboard mockup */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  border: `1px solid ${C.border}`,
                  padding: 24,
                  boxShadow: "0 24px 80px rgba(0,0,0,.09)",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                  {/* Risk ring */}
                  <div
                    style={{
                      flex: "0 0 auto",
                      background: "#FAFBFF",
                      borderRadius: 16,
                      border: `1px solid ${C.border}`,
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, alignSelf: "flex-start" }}>
                      Risk Overview
                    </div>
                    <RiskRing score={85} label="High Risk" color="#EF4444" />
                    <div style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
                      ↑ +12% from last 7 days
                    </div>
                  </div>

                  {/* Events line chart */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                      style={{
                        background: "#FAFBFF",
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "16px 16px 8px",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Events Over Time</div>
                        <div
                          style={{
                            fontSize: 11, fontWeight: 600, color: C.textMuted,
                            background: "#F1F5F9", borderRadius: 6, padding: "3px 8px",
                          }}
                        >
                          This Week
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={eventsData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="t" tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                          />
                          <Line
                            type="monotone" dataKey="events"
                            stroke={C.primary} strokeWidth={2.5}
                            dot={{ r: 3, fill: C.primary }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Total Events", value: "24.8K", color: C.navy  },
                    { label: "Anomalies",    value: "1.2K",  color: C.red   },
                    { label: "Threats Blocked", value: "320", color: "#22C55E" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        flex: 1, minWidth: 90,
                        background: "#F8FAFF",
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1160, margin: "0 auto",
            display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap",
          }}
        >
          {/* Phone mockups */}
          <div
            style={{
              flex: 1, minWidth: 280,
              display: "flex", justifyContent: "center",
              gap: 20, alignItems: "flex-end",
              paddingBottom: 20,
            }}
          >
            <PhoneMockup variant="alerts" />
            <PhoneMockup variant="map"    />
          </div>

          {/* Copy */}
          <div style={{ flex: "0 0 340px", minWidth: 0 }}>
            <div className="section-tag">
              <Bell size={13} /> Mobile
            </div>
            <h2
              style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-.03em", color: C.navy, lineHeight: 1.1, marginBottom: 16 }}
            >
              Security, always
              <br />
              within reach
            </h2>
            <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.65, marginBottom: 28 }}>
              Stay informed and respond faster with real-time alerts and AI
              insights available on iOS and Android — wherever your team is.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary">Get the App <ArrowRight size={14} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section
        id="resources"
        style={{
          background: "#F8FAFC",
          borderTop: `1px solid ${C.border}`,
          padding: "96px 24px",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag">
              <Star size={13} /> Testimonials
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-.03em", color: C.navy }}>
              What our customers say
            </h2>
          </div>

          {/* Cards */}
          <div
            style={{
              display: "flex",
              gap: 20,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="testimonial-card"
                style={{ opacity: tIdx === i ? 1 : 0.55, transition: "opacity .4s" }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {[...Array(5)].map((_, k) => (
                    <Star key={k} size={14} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: C.navyMid, lineHeight: 1.7, marginBottom: 20 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: t.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setTIdx(i)}
                style={{
                  width: i === tIdx ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === tIdx ? C.primary : C.border,
                  border: "none",
                  cursor: "pointer",
                  transition: "all .3s",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${C.primary} 0%, #7B5CE4 100%)`,
              borderRadius: 28,
              padding: "72px 48px",
              textAlign: "center",
              boxShadow: "0 32px 80px rgba(59,91,255,.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute", top: -60, right: -60,
                width: 240, height: 240, borderRadius: "50%",
                background: "rgba(255,255,255,.06)", pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute", bottom: -80, left: -40,
                width: 280, height: 280, borderRadius: "50%",
                background: "rgba(255,255,255,.04)", pointerEvents: "none",
              }}
            />

            <div
              style={{
                width: 52, height: 52,
                background: "rgba(255,255,255,.15)",
                borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <Shield size={26} color="#fff" />
            </div>

            <h2
              style={{
                fontSize: 40, fontWeight: 900, color: "#fff",
                letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 16,
              }}
            >
              Ready to simplify your security?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.75)", marginBottom: 36, lineHeight: 1.6 }}>
              Join thousands of teams securing their digital world with Sentivoy.
              <br />No credit card required.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate({ to: "/auth" })} className="btn-white">Start Free Trial</button>
              <button onClick={() => navigate({ to: "/auth" })} className="btn-outline-white">
                <Play size={14} /> Book a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ background: C.navy, padding: "64px 24px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              gap: 32,
              marginBottom: 48,
              borderBottom: "1px solid rgba(255,255,255,.08)",
              paddingBottom: 40,
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    width: 32, height: 32, background: C.primary,
                    borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Shield size={16} color="#fff" />
                </div>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Sentivoy</span>
              </div>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
                AI-powered security intelligence platform for modern teams.
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
                {[<Twitter size={16} />, <Linkedin size={16} />, <Github size={16} />].map((ic, i) => (
                  <a
                    key={i}
                    href="#"
                    style={{
                      color: "#64748B", transition: "color .2s",
                      display: "flex", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                  >
                    {ic}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              { heading: "Product",   links: ["Features", "How it works", "Pricing", "Changelog"] },
              { heading: "Resources", links: ["Documentation", "Blog", "Guides", "Status"] },
              { heading: "Company",   links: ["About us", "Careers", "Contact", "Partners"] },
              { heading: "Legal",     links: ["Privacy Policy", "Terms of Service", "Security", "Cookies"] },
            ].map((col) => (
              <div key={col.heading}>
                <div
                  style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: ".03em" }}
                >
                  {col.heading}
                </div>
                {col.links.map((l) => (
                  <a key={l} href="#" className="footer-link">{l}</a>
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 12,
            }}
          >
            <p style={{ color: "#475569", fontSize: 13 }}>
              © 2024 Sentivoy. All rights reserved.
            </p>
            <p style={{ color: "#475569", fontSize: 13 }}>
              Built with ♥ for security teams worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
