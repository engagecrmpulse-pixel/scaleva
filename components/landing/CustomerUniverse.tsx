"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { disposeThreeScene, lerp } from "@/lib/three-utils";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";

interface CardSpec {
  name: string;
  biz: string;
  last: string;
  days: string;
  spend: string;
  pos: [number, number, number];
  speed: number;
  phase: number;
}

const CARDS: CardSpec[] = [
  { name: "Maria Chen",   biz: "Rosario's",    last: "Truffle Pasta",  days: "14 days",  spend: "$1,240",  pos: [-3,   1,   -2], speed: 0.8, phase: 0   },
  { name: "James Park",   biz: "Luxe Studio",  last: "Balayage",       days: "45 days",  spend: "$890",    pos: [ 3,   0.5, -3], speed: 0.6, phase: 1   },
  { name: "Mike Torres",  biz: "BuildRight",   last: "Kitchen Remodel",days: "62 days",  spend: "$18,600", pos: [-2,  -1,   -4], speed: 0.5, phase: 2   },
  { name: "Sarah Kim",    biz: "Fleet Feet",   last: "Nike Air Max",   days: "21 days",  spend: "$640",    pos: [ 2,   1.5, -1], speed: 0.7, phase: 0.5 },
  { name: "David Torres", biz: "Iron Club",    last: "HIIT Class",     days: "18 days",  spend: "$480",    pos: [ 0,   2,   -5], speed: 0.4, phase: 1.5 },
  { name: "Lisa Wong",    biz: "Bright Smile", last: "Dental Checkup", days: "90 days",  spend: "$320",    pos: [-3.5, 0,   -6], speed: 0.6, phase: 3   },
  { name: "Carlos Ruiz",  biz: "Amore Cafe",   last: "Espresso",       days: "3 days",   spend: "$180",    pos: [ 3.5,-0.5, -2], speed: 0.9, phase: 2   },
  { name: "Emma Wilson",  biz: "Gloss Nail",   last: "Manicure",       days: "28 days",  spend: "$560",    pos: [ 0,  -1.5, -3], speed: 0.5, phase: 0.8 },
];

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: CardSpec,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = "rgba(22, 22, 22, 0.97)";
  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(50, 50, 50, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Inter, system-ui, sans-serif";
  ctx.fillText(card.name, 18, 42);

  // Last purchase (blue)
  ctx.fillStyle = "#2563eb";
  ctx.font = "15px Inter, system-ui, sans-serif";
  ctx.fillText(card.last, 18, 68);

  // Divider
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, 84);
  ctx.lineTo(w - 18, 84);
  ctx.stroke();

  // Days ago
  ctx.fillStyle = "#888888";
  ctx.font = "13px Inter, system-ui, sans-serif";
  ctx.fillText(`${card.days} since visit`, 18, 106);

  // Spend
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Inter, system-ui, sans-serif";
  ctx.fillText(card.spend, 18, 132);
  ctx.fillStyle = "#444";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillText("lifetime spend", 18, 150);

  // Biz (bottom)
  ctx.fillStyle = "#444444";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillText(card.biz, 18, h - 14);
}

export default function CustomerUniverse() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLDivElement>(null);
  const frameRef   = useRef(0);
  const scrollRef  = useRef(0);

  useEffect(() => {
    const handler = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const visible = -rect.top;
      scrollRef.current = Math.max(0, Math.min(1, visible / (sectionH - window.innerHeight)));
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;
    if (!canvasRef.current) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c0c);
    scene.fog = new THREE.FogExp2(0x0c0c0c, 0.08);

    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 50);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    // Build card meshes
    const CW = 280, CH = 175;
    const clock = new THREE.Clock();
    const meshes: THREE.Mesh[] = [];
    const baseY: number[] = [];

    CARDS.forEach((card) => {
      const cvs = document.createElement("canvas");
      cvs.width  = CW;
      cvs.height = CH;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      drawCard(ctx, card, CW, CH);

      const texture = new THREE.CanvasTexture(cvs);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.FrontSide,
      });
      const geo  = new THREE.PlaneGeometry(2.4, 1.5);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...card.pos);
      baseY.push(card.pos[1]);
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Scroll-driven camera: z from 3 to -3
      const targetZ = lerp(3, -3, scrollRef.current);
      camera.position.z += (targetZ - camera.position.z) * 0.06;

      // Card float
      meshes.forEach((mesh, i) => {
        const card = CARDS[i];
        mesh.position.y = baseY[i] + Math.sin(elapsed * card.speed + card.phase) * 0.15;
        // Fade out cards that are behind the camera
        const dist = mesh.position.z - camera.position.z;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, Math.min(1, (dist + 1.5) / 2));
      });

      camera.lookAt(0, 0, camera.position.z - 4);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      disposeThreeScene(scene, renderer);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", height: "280vh", fontFamily: INTER }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Three.js canvas */}
        <div
          ref={canvasRef}
          className="hidden md:block"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        {/* Static mobile fallback */}
        <div
          className="md:hidden"
          style={{ position: "absolute", inset: 0, background: "#0c0c0c", zIndex: 0 }}
        />
        {/* Overlay text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.2 }}
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 10,
            pointerEvents: "none",
            width: "90%",
            maxWidth: 640,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 10,
            }}
          >
            What Scaleva knows
          </p>
          <p
            style={{
              fontSize: "clamp(14px,2vw,18px)",
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            Every customer. Every purchase. Every preference. All remembered.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
