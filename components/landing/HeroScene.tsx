"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { disposeThreeScene, lerp } from "@/lib/three-utils";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";

const LINE1_WORDS = ["Every", "customer."];
const LINE2_WORDS = ["Personally", "remembered."];

const wordVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
};

export default function HeroScene() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLDivElement>(null);
  const frameRef    = useRef(0);
  const scrollRef   = useRef(0);
  const mouseRef    = useRef({ x: 0, y: 0 });
  const camRef      = useRef({ x: 0, y: 8, z: 12 });
  const [hasScrolled, setHasScrolled] = useState(false);

  // Framer scroll progress for fading overlay content
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Track raw scroll for Three.js camera
  useEffect(() => {
    const handler = () => {
      const section = sectionRef.current;
      if (!section) return;
      const sectionH = section.offsetHeight;
      const scrolled  = window.scrollY;
      scrollRef.current = Math.max(0, Math.min(1, scrolled / sectionH));
      if (scrolled > 20) setHasScrolled(true);
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
    scene.fog = new THREE.FogExp2(0x0c0c0c, 0.035);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-5, 10, 5);
    scene.add(dirLight);

    const heroPoint = new THREE.PointLight(0x2563eb, 6, 20);
    heroPoint.position.set(0, 9, 0);
    scene.add(heroPoint);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Hero (center) building
    const heroMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b3e,
      emissive: new THREE.Color(0x2563eb),
      emissiveIntensity: 0.35,
      roughness: 0.5,
      metalness: 0.1,
    });
    const heroMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6, 1.0), heroMat);
    heroMesh.position.set(0, 3, 0);
    scene.add(heroMesh);

    // Surrounding buildings
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Deterministic grid of buildings
    const gridPositions: [number, number][] = [];
    for (let gx = -6; gx <= 6; gx++) {
      for (let gz = -8; gz <= 3; gz++) {
        if (gx === 0 && gz === 0) continue; // hero building location
        gridPositions.push([gx * 1.5, gz * 1.5]);
      }
    }

    // Use a stable pseudo-random approach
    const seedH = (i: number) => {
      const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    gridPositions.forEach(([bx, bz], i) => {
      const h = 0.4 + seedH(i) * 3.0;
      const w = 0.4 + seedH(i + 100) * 0.7;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bldgMat);
      mesh.position.set(
        bx + (seedH(i + 200) - 0.5) * 0.6,
        h / 2,
        bz + (seedH(i + 300) - 0.5) * 0.6
      );
      scene.add(mesh);
    });

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const t = scrollRef.current;
      // Camera target: y 8→2, z 12→2 based on scroll
      camRef.current.y = lerp(8, 2, t);
      camRef.current.z = lerp(12, 2, t);

      // Lerp camera toward target (with mouse offset on x)
      const targetX = mouseRef.current.x * 0.8;
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (camRef.current.y - camera.position.y) * 0.05;
      camera.position.z += (camRef.current.z - camera.position.z) * 0.05;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Mouse parallax
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

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
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      disposeThreeScene(scene, renderer);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: "220vh",
        fontFamily: INTER,
      }}
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
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #0c0c0c 0%, #0d1020 100%)",
            zIndex: 0,
          }}
        />

        {/* Hero content */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            textAlign: "center",
            opacity: contentOpacity,
            willChange: "opacity",
          }}
        >
          {/* Pill label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 14px",
              background: "rgba(12,12,12,0.7)",
              border: "1px solid #2563eb",
              borderRadius: 20,
              marginBottom: 28,
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                letterSpacing: "0.01em",
              }}
            >
              AI-powered customer retention
            </span>
          </motion.div>

          {/* Headline — line 1 */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", gap: "0.35em", marginBottom: 8 }}
          >
            {LINE1_WORDS.map((w) => (
              <motion.span
                key={w}
                variants={wordVariants}
                style={{
                  display: "inline-block",
                  fontSize: "clamp(40px, 7vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: "#fff",
                  willChange: "transform",
                }}
              >
                {w}
              </motion.span>
            ))}
          </motion.div>

          {/* Headline — line 2 (blue) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", gap: "0.35em", marginBottom: 28 }}
          >
            {LINE2_WORDS.map((w) => (
              <motion.span
                key={w}
                variants={wordVariants}
                style={{
                  display: "inline-block",
                  fontSize: "clamp(40px, 7vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: "#2563eb",
                  willChange: "transform",
                }}
              >
                {w}
              </motion.span>
            ))}
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            style={{
              fontSize: "clamp(16px,2vw,19px)",
              color: "#666",
              maxWidth: 560,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Scaleva reads your customer data and writes a personal SMS for every
            single person — what they ordered, what they like, when they should
            come back. No templates. No blasting.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.35 }}
            style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}
          >
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 28px",
                background: "#fff",
                color: "#0c0c0c",
                fontFamily: INTER,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 6,
                textDecoration: "none",
                transition: "opacity 0.15s",
                willChange: "transform",
              }}
            >
              Get started free
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 28px",
                background: "transparent",
                color: "#fff",
                fontFamily: INTER,
                fontSize: 15,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        {!hasScrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
            style={{
              position: "absolute",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 11, color: "#444", letterSpacing: "0.06em" }}>
              SCROLL TO EXPLORE
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
