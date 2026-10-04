"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobalContext } from '@/store/globalContext';

const SCALE = 100; // 1 3D unit = 100m

// ─── Formation planes ─────────────────────────────────────────────────────────
interface FormationProps { depth_avg: number; color: string; }

function FormationsPlanes({ formations }: { formations: FormationProps[] }) {
  // We'll draw horizons similar to nwis-dashboard stratigraphy wireframes
  return (
    <group>
      {formations.map((f, i) => {
        const yTop = -(f.depth_avg / SCALE);
        return (
          <group key={i} position={[0, yTop, 0]}>
            {/* Main semi-transparent plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial
                color={f.color}
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            
            {/* Wireframe plane (the nice grids) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[100, 100, 10, 10]} />
              <meshBasicMaterial color={f.color} wireframe transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Wellbore tubes ───────────────────────────────────────────────────────────
function TrajectoryTube({ points, color, radius = 0.05, opacity = 1 }: {
  points: THREE.Vector3[];
  color: string;
  radius?: number;
  opacity?: number;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 100, radius, 12, false]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.2}
        transparent={opacity < 1} 
        opacity={opacity} 
      />
    </mesh>
  );
}

// ─── Dynamic drill-bit + alert cylinder ─────────
function DynamicElements({ 
  lookaheadWindow, 
  offsetHazards,
  distanceRef,
  hazardLabelRef,
  mainAlertRef,
  alertTextRef,
  containerRef
}: {
  lookaheadWindow: number;
  offsetHazards: { tvd: number }[];
  distanceRef: React.RefObject<HTMLDivElement | null>;
  hazardLabelRef: React.RefObject<HTMLDivElement | null>;
  mainAlertRef: React.RefObject<HTMLDivElement | null>;
  alertTextRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const bitRef = useRef<THREE.Group>(null);
  const lookaheadRef = useRef<THREE.Group>(null);
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);
  const lastHit = useRef(false);

  // Generate Trajectory Points for Active Well (curved)
  const activePoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 4000; i += 50) {
      const y = -(i / SCALE);
      const x = Math.sin(y * 0.1) * 2;
      const z = Math.cos(y * 0.1) * 2 - 2;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const getPositionAtDepth = (depth: number) => {
    const y = -(depth / SCALE);
    const x = Math.sin(y * 0.1) * 2;
    const z = Math.cos(y * 0.1) * 2 - 2;
    return new THREE.Vector3(x, y, z);
  };

  // Generate Offset Well NH-14
  const nh14Points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 4000; i += 50) {
      const y = -(i / SCALE);
      const x = 18 + Math.sin(y * 0.2) * 1;
      const z = 5 + Math.cos(y * 0.2) * 1;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const getNH14PosAtDepth = (depth: number) => {
    const y = -(depth / SCALE);
    return new THREE.Vector3(18 + Math.sin(y * 0.2) * 1, y, 5 + Math.cos(y * 0.2) * 1);
  };

  useFrame(({ camera }) => {
    const depth = useGlobalContext.getState().liveBitDepthTVDSS;
    
    const bitPos = getPositionAtDepth(depth);
    const lookaheadPos = getPositionAtDepth(depth + lookaheadWindow);
    
    if (bitRef.current) bitRef.current.position.copy(bitPos);

    if (lookaheadRef.current) {
      const direction = new THREE.Vector3().subVectors(lookaheadPos, bitPos).normalize();
      const coneLength = bitPos.distanceTo(lookaheadPos);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      lookaheadRef.current.position.copy(bitPos.clone().add(direction.clone().multiplyScalar(coneLength / 2)));
      lookaheadRef.current.quaternion.copy(quaternion);
      lookaheadRef.current.scale.set(1, coneLength, 1);
    }

    const nearestNH14 = getNH14PosAtDepth(depth);
    const distanceToNH14 = (bitPos.distanceTo(nearestNH14) * SCALE).toFixed(0); // real meters
    
    if (lineGeometryRef.current) {
      lineGeometryRef.current.setFromPoints([bitPos, nearestNH14]);
    }

    // Custom 3D to 2D projection for DOM elements to bypass buggy <Html> components
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      // Project Proximity Label
      if (distanceRef.current) {
        const midPoint = new THREE.Vector3().lerpVectors(bitPos, nearestNH14, 0.5);
        midPoint.project(camera);
        if (midPoint.z < 1) {
          const x = (midPoint.x * 0.5 + 0.5) * w;
          const y = (-(midPoint.y * 0.5) + 0.5) * h;
          distanceRef.current.style.display = 'block';
          distanceRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          if (distanceRef.current.firstChild) {
            (distanceRef.current.firstChild as HTMLElement).innerText = `${distanceToNH14}m clearance`;
          }
        } else {
          distanceRef.current.style.display = 'none';
        }
      }

      // Project Hazard Node Label
      if (hazardLabelRef.current) {
        const hazardPos = getNH14PosAtDepth(2840);
        hazardPos.project(camera);
        if (hazardPos.z < 1) {
          const x = (hazardPos.x * 0.5 + 0.5) * w;
          const y = (-(hazardPos.y * 0.5) + 0.5) * h;
          hazardLabelRef.current.style.display = 'block';
          hazardLabelRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        } else {
          hazardLabelRef.current.style.display = 'none';
        }
      }
    }

    // Check hazard and trigger main alert
    const target = depth + lookaheadWindow;
    const hit = offsetHazards.some(h => h.tvd >= depth && h.tvd <= target) || (depth > 2640 && depth < 2840);
    
    if (hit !== lastHit.current) {
      lastHit.current = hit;
      if (mainAlertRef.current) {
        mainAlertRef.current.style.display = hit ? 'block' : 'none';
      }
    }
    
    if (hit && alertTextRef.current) {
      alertTextRef.current.innerText = `⚠ LOOKAHEAD ALERT: Lost Circulation precedent ${(2840 - depth).toFixed(0)}m ahead.`;
    }
  });

  return (
    <group>
      <TrajectoryTube points={activePoints} color="#00ffcc" opacity={0.3} radius={0.1} />
      <TrajectoryTube points={nh14Points} color="#4a5568" radius={0.1} />
      
      <group ref={bitRef}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={2} />
        </mesh>
        <pointLight color="#00f2fe" intensity={5} distance={10} />
      </group>

      <group ref={lookaheadRef}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.1, 1, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} wireframe />
        </mesh>
      </group>

      <group position={getNH14PosAtDepth(2840)}>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={1} />
        </mesh>
      </group>

      <line>
        <bufferGeometry ref={lineGeometryRef} attach="geometry" />
        <lineDashedMaterial attach="material" color="#4facfe" dashSize={0.5} gapSize={0.5} opacity={0.5} transparent />
      </line>
    </group>
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
        <span>Offset Wellbore (NH-14)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, background: '#00ffcc', borderRadius: '50%' }} />
        <span>Active Drill Bit (live)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, background: 'rgba(255,158,11,0.3)', border: '1px solid #f59e0b', borderRadius: 3 }} />
        <span>Lookahead Trajectory Cone</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, background: '#ff0055', borderRadius: '50%' }} />
        <span>Offset Hazard Node</span>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef<HTMLDivElement>(null);
  const hazardLabelRef = useRef<HTMLDivElement>(null);
  const mainAlertRef = useRef<HTMLDivElement>(null);
  const alertTextRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} style={{
      width: '100%', height: '100%', position: 'relative',
      minHeight: 500, background: '#101015',
      borderRadius: 4, overflow: 'hidden', border: '1px solid #2a3654',
    }}>
      <Legend />

      {/* 3D-projected DOM Overlays (completely bypasses buggy <Html> inside Canvas) */}
      <div ref={distanceRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'none', zIndex: 5 }}>
        <div className="text-[#00ffcc] text-[10px] font-mono bg-black/50 px-1 rounded">0m clearance</div>
      </div>
      
      <div ref={hazardLabelRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'none', zIndex: 5 }}>
        <div className="bg-[#ff0044]/20 border border-[#ff0044] text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap backdrop-blur-md">
          NH-14 Hazard: 2840m
        </div>
      </div>

      {/* Main Alert HUD */}
      <div
        ref={mainAlertRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: '20px', right: '20px', zIndex: 10,
          background: 'rgba(200,0,40,0.92)', color: '#fff',
          padding: '12px 16px', borderRadius: 6,
          minWidth: 260, fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          border: '1px solid #ff4d79', lineHeight: 1.6,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⚠ LOOKAHEAD ALERT</div>
        <div ref={alertTextRef}></div>
        <div style={{ color: '#fca5a5', marginTop: 4 }}>Ref: NH-14 — 140 bbls @ 2,840 m TVDSS</div>
      </div>

      <Canvas
        camera={{ position: [40, -10, 40], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#101015']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[0, 0, -10]} intensity={0.5} color="#10b981" />

        <FormationsPlanes formations={formations} />

        <DynamicElements
          lookaheadWindow={lookaheadWindow}
          offsetHazards={offsetHazards}
          distanceRef={distanceRef}
          hazardLabelRef={hazardLabelRef}
          mainAlertRef={mainAlertRef}
          alertTextRef={alertTextRef}
          containerRef={containerRef}
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          makeDefault
          dampingFactor={0.05}
          target={[0, -25, 0]} 
        />
        
        {/* Adds subtle background fog similar to nwis-dashboard */}
        <fog attach="fog" args={['#101015', 30, 150]} />
      </Canvas>
    </div>
  );
}
