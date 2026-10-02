"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Tube, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobalContext } from '@/store/globalContext';

// ─── Static well trajectory data ─────────────────────────────────────────────
const ACTIVE_TRAJECTORY = [
  [0, 0, 0], [10, -50, -500], [50, -100, -1500], [80, -120, -2750],
];
const OFFSET_TRAJECTORY = [
  [1800, 500, 0], [1810, 480, -1000], [1830, 460, -2000],
  [1850, 440, -2840], [1860, 435, -3100],
];

// ─── Formation planes ─────────────────────────────────────────────────────────
interface FormationProps { depth_avg: number; color: string; }

function FormationsPlanes({ formations }: { formations: FormationProps[] }) {
  return (
    <group>
      {formations.map((f, i) => (
        <mesh key={i} position={[0, -f.depth_avg, 0]}>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial
            color={f.color}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Wellbore tubes ───────────────────────────────────────────────────────────
function WellboreTube({ points, color, radius = 5, opacity = 1 }: {
  points: number[][];
  color: string;
  radius?: number;
  opacity?: number;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2]))),
    [points],
  );
  return (
    <Tube args={[curve, 100, radius, 12, false]}>
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </Tube>
  );
}

// ─── Dynamic drill-bit + alert cylinder (NO setState inside useFrame) ─────────
function DynamicElements({ lookaheadWindow, offsetHazards, alertOverlayRef }: {
  lookaheadWindow: number;
  offsetHazards: { tvd: number }[];
  alertOverlayRef: React.RefObject<HTMLDivElement | null>;
}) {
  const bitRef   = useRef<THREE.Mesh>(null);
  const alertRef = useRef<THREE.Group>(null);
  const lastVisible = useRef(false);

  useFrame(() => {
    const depth = useGlobalContext.getState().liveBitDepthTVDSS;

    // --- Bit position (imperative, no React state) ---
    if (bitRef.current) {
      bitRef.current.position.z = -depth;
    }

    // --- Alert cylinder position + visibility ---
    if (alertRef.current) {
      alertRef.current.position.y = -depth - lookaheadWindow / 2;

      const target = depth + lookaheadWindow;
      const hit    = offsetHazards.some(h => h.tvd >= depth && h.tvd <= target);

      alertRef.current.visible = hit;

      // Only touch the DOM when the value actually changes
      if (hit !== lastVisible.current) {
        lastVisible.current = hit;
        if (alertOverlayRef.current) {
          alertOverlayRef.current.style.display = hit ? 'block' : 'none';
        }
      }
    }
  });

  return (
    <>
      {/* Glowing drill bit */}
      <mesh ref={bitRef} position={[80, -120, -2750]}>
        <sphereGeometry args={[25]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.8} />
      </mesh>

      {/* Lookahead hazard cylinder */}
      <group ref={alertRef} position={[0, -2750 - lookaheadWindow / 2, 0]} visible={false}>
        <mesh>
          <cylinderGeometry args={[60, 60, lookaheadWindow, 32, 1, true]} />
          <meshStandardMaterial
            color="#ff0044"
            emissive="#ff0044"
            emissiveIntensity={0.4}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}

// ─── Legend overlay ───────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, zIndex: 10,
      background: 'rgba(11,15,25,0.85)', border: '1px solid #2a3654',
      borderRadius: 6, padding: '10px 14px', fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace", color: '#94a3b8',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 6, background: '#00ffcc', borderRadius: 2 }} />
        <span>Active Wellbore (NH-12)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 6, background: '#606065', borderRadius: 2 }} />
        <span>Offset Wellbore</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, background: '#00ffcc', borderRadius: '50%' }} />
        <span>Active Drill Bit (live)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, background: 'rgba(255,0,68,0.5)', border: '1px solid #ff0044', borderRadius: 3 }} />
        <span>Lookahead Hazard Zone</span>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Nwis3DMap({ lookaheadWindow = 200, formations = [], offsetHazards = [] }: {
  lookaheadWindow?: number;
  formations?: FormationProps[];
  offsetHazards?: { tvd: number }[];
}) {
  const [mounted, setMounted] = useState(false);
  // Plain DOM ref for the alert overlay — never stored in React state
  const alertOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 500,
        background: '#101015', border: '1px solid #2a3654', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#64748b',
      }}>
        Initialising 3D renderer…
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      minHeight: 500, background: '#101015',
      borderRadius: 4, overflow: 'hidden', border: '1px solid #2a3654',
    }}>

      {/* Alert overlay — shown/hidden imperatively via alertOverlayRef, never setState */}
      <div
        ref={alertOverlayRef}
        style={{
          display: 'none', position: 'absolute',
          top: 16, right: 16, zIndex: 10,
          background: 'rgba(200,0,40,0.92)', color: '#fff',
          padding: '12px 16px', borderRadius: 6,
          minWidth: 220, fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          border: '1px solid #ff4d79', lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⚠ LOOKAHEAD ALERT</div>
        <div>Lost Circulation precedent <strong>35 m</strong> ahead.</div>
        <div style={{ color: '#fca5a5', marginTop: 4 }}>Ref: NH-14 — 140 bbls @ 2,840 m TVDSS</div>
      </div>

      <Legend />

      <Canvas
        camera={{ position: [2000, 1000, 2000], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#101015']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2000, 2000, 1000]} intensity={1.2} />
        <pointLight position={[0, 0, -3000]} intensity={0.5} color="#10b981" />

        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Grid
            args={[10000, 10000]}
            sectionColor="#1e2a3a"
            cellColor="#161e2e"
            position={[0, 0, -1]}
          />

          <FormationsPlanes formations={formations} />

          <WellboreTube points={ACTIVE_TRAJECTORY} color="#00ffcc" radius={12} />
          <WellboreTube points={OFFSET_TRAJECTORY} color="#4a5568" radius={9} opacity={0.75} />

          <DynamicElements
            lookaheadWindow={lookaheadWindow}
            offsetHazards={offsetHazards}
            alertOverlayRef={alertOverlayRef}
          />
        </group>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={500}
          maxDistance={8000}
        />
      </Canvas>
    </div>
  );
}
