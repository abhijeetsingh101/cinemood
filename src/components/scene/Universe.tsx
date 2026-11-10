"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The CineMood universe: a single persistent WebGL scene that lives behind
 * every page. Navigation never remounts it — instead the camera glides to
 * a new pose per route, and the palette cross-fades to the selected moods.
 *
 * Budget: one draw call for the particle field, a handful of line/basic
 * materials, no lights, no shadows, no post-processing.
 */

export interface UniverseProps {
  colorA: string;
  colorB: string;
  route: string;
  /** "low" halves particles and pins DPR to 1 */
  quality: "low" | "high";
}

/* Deterministic PRNG keeps geometry identical between renders. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Camera poses: [position, lookAt] per top-level route ───────── */
type Pose = [THREE.Vector3Tuple, THREE.Vector3Tuple];
const POSES: Record<string, Pose> = {
  "/": [[0, 0.2, 7.2], [0, 0, 0]],
  "/mood": [[0, 0, 5.4], [0, 0, 0]],
  "/calibrate": [[4.2, 1.2, 5.6], [1.4, 0, 0]],
  "/results": [[-4.6, 2.4, 8.5], [-1.2, 0.4, 0]],
  "/movie": [[3.2, -1.6, 9.5], [1.6, 0.6, 0]],
  "/watchlist": [[0.5, 4.6, 8.2], [0, 0.6, 0]],
  "/profile": [[-5.2, -0.8, 6.4], [-1.6, 0, 0]],
};

function poseFor(route: string): Pose {
  const key = "/" + (route.split("/")[1] ?? "");
  return POSES[key] ?? POSES["/"];
}

function CameraRig({ route }: { route: string }) {
  const camera = useThree((s) => s.camera);
  const pointer = useRef({ x: 0, y: 0 });
  const look = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    const [pos, at] = poseFor(route);
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;
    target.current.set(
      pos[0] + pointer.current.x * 0.45,
      pos[1] - pointer.current.y * 0.3 - scroll * 0.0016,
      pos[2],
    );
    lookTarget.current.set(at[0], at[1] - scroll * 0.0008, at[2]);
    // Critically-damped ease: frame-rate independent "dolly" between pages.
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 1.7);
    camera.position.lerp(target.current, k);
    look.current.lerp(lookTarget.current, k);
    camera.lookAt(look.current);
  });
  return null;
}

/* ── Particle galaxy ────────────────────────────────────────────── */
const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  attribute float aMix;
  varying float vMix;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float a = uTime * 0.035 * (0.35 + aSeed);
    float c = cos(a), s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 0.35 + aSeed * 40.0) * 0.18;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.4 + aSeed) / max(0.1, -mv.z);
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + aSeed * 2.5) + aSeed * 100.0);
    vAlpha = smoothstep(42.0, 5.0, -mv.z) * (0.3 + 0.7 * fract(aSeed * 7.31)) * twinkle;
    vMix = aMix;
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vMix;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = pow(smoothstep(0.5, 0.0, d), 2.4);
    vec3 col = mix(uColorA, uColorB, vMix);
    col = mix(col, vec3(1.0), glow * 0.35);
    gl_FragColor = vec4(col, glow * vAlpha);
  }
`;

function buildParticles(count: number) {
  const rand = mulberry(1337);
  const position = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const mix = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = rand();
    if (r < 0.62) {
      // Spiral disc
      const radius = 2.4 + Math.pow(rand(), 0.7) * 16;
      const arm = Math.floor(rand() * 3) * ((Math.PI * 2) / 3);
      const angle = arm + radius * 0.32 + (rand() - 0.5) * 0.9;
      position[i * 3] = Math.cos(angle) * radius;
      position[i * 3 + 1] = (rand() - 0.5) * (1.8 + 10 / radius);
      position[i * 3 + 2] = Math.sin(angle) * radius;
      mix[i] = Math.min(1, radius / 16) * 0.8 + rand() * 0.2;
    } else {
      // Surrounding star shell
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const rad = 9 + rand() * 22;
      const s = Math.sqrt(1 - u * u);
      position[i * 3] = Math.cos(t) * s * rad;
      position[i * 3 + 1] = u * rad * 0.7;
      position[i * 3 + 2] = Math.sin(t) * s * rad;
      mix[i] = rand();
    }
    seed[i] = rand();
  }
  return { position, seed, mix };
}

function Particles({ count, a, b }: { count: number; a: THREE.Color; b: THREE.Color }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const data = useMemo(() => buildParticles(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 90 },
      uColorA: { value: new THREE.Color("#5ef2ff") },
      uColorB: { value: new THREE.Color("#8b5cff") },
    }),
    [],
  );
  const dpr = useThree((s) => s.viewport.dpr);

  useFrame((state, dt) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uSize.value = 90 * dpr;
    const k = 1 - Math.exp(-dt * 2);
    (m.uniforms.uColorA.value as THREE.Color).lerp(a, k);
    (m.uniforms.uColorB.value as THREE.Color).lerp(b, k);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
        <bufferAttribute attach="attributes-aMix" args={[data.mix, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Holographic core ───────────────────────────────────────────── */
const CORE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const CORE_FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.6);
    float band = 0.5 + 0.5 * sin(vNormal.y * 26.0 - uTime * 1.4);
    vec3 col = mix(uColorB, uColorA, fresnel);
    gl_FragColor = vec4(col, fresnel * (0.55 + 0.25 * band));
  }
`;

function Core({ a, b, shards }: { a: THREE.Color; b: THREE.Color; shards: number }) {
  const group = useRef<THREE.Group>(null);
  const cage = useRef<THREE.LineSegments>(null);
  const rings = useRef<THREE.Group>(null);
  const swarm = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.ShaderMaterial>(null);
  const cageMat = useRef<THREE.LineBasicMaterial>(null);
  const swarmMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.3, 1)), []);
  const glowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color("#5ef2ff") },
      uColorB: { value: new THREE.Color("#8b5cff") },
    }),
    [],
  );

  useEffect(() => () => edges.dispose(), [edges]);

  // Scatter the shard swarm once.
  useEffect(() => {
    const mesh = swarm.current;
    if (!mesh) return;
    const rand = mulberry(77);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < shards; i++) {
      const radius = 2.6 + rand() * 4.2;
      const theta = rand() * Math.PI * 2;
      const y = (rand() - 0.5) * 3.4;
      dummy.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      dummy.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      dummy.scale.setScalar(0.05 + rand() * 0.11);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [shards]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 2);
    if (group.current) group.current.position.y = Math.sin(t * 0.5) * 0.12;
    if (cage.current) {
      cage.current.rotation.y = t * 0.12;
      cage.current.rotation.x = Math.sin(t * 0.2) * 0.25;
    }
    if (rings.current) {
      rings.current.children.forEach((ring, i) => {
        ring.rotation.z = t * (0.1 + i * 0.05) * (i % 2 ? -1 : 1);
      });
    }
    if (swarm.current) swarm.current.rotation.y = -t * 0.04;
    if (glow.current) {
      glow.current.uniforms.uTime.value = t;
      (glow.current.uniforms.uColorA.value as THREE.Color).lerp(a, k);
      (glow.current.uniforms.uColorB.value as THREE.Color).lerp(b, k);
    }
    cageMat.current?.color.lerp(a, k);
    swarmMat.current?.color.lerp(b, k);
    ringMats.current.forEach((m, i) => m?.color.lerp(i % 2 ? b : a, k));
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.92, 48, 48]} />
        <shaderMaterial
          ref={glow}
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <lineSegments ref={cage} geometry={edges}>
        <lineBasicMaterial ref={cageMat} color="#5ef2ff" transparent opacity={0.5} />
      </lineSegments>

      <group ref={rings}>
        {[
          { r: 1.9, tilt: [1.2, 0.2, 0] },
          { r: 2.3, tilt: [1.45, -0.5, 0] },
          { r: 2.9, tilt: [1.7, 0.35, 0] },
        ].map((ring, i) => (
          <group key={ring.r} rotation={ring.tilt as THREE.Vector3Tuple}>
            <mesh>
              <torusGeometry args={[ring.r, 0.006, 6, 160]} />
              <meshBasicMaterial
                ref={(m) => {
                  ringMats.current[i] = m;
                }}
                color="#8b5cff"
                transparent
                opacity={0.55 - i * 0.12}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      <instancedMesh ref={swarm} args={[undefined, undefined, shards]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial ref={swarmMat} color="#8b5cff" wireframe transparent opacity={0.55} />
      </instancedMesh>
    </group>
  );
}

export default function Universe({ colorA, colorB, route, quality }: UniverseProps) {
  // Colour targets are stable objects mutated on prop change, read each frame.
  const a = useMemo(() => new THREE.Color(), []);
  const b = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    a.set(colorA);
    b.set(colorB);
  }, [a, b, colorA, colorB]);

  const low = quality === "low";

  return (
    <Canvas
      aria-hidden
      dpr={low ? 1 : [1, 1.75]}
      camera={{ position: [0, 0.2, 11], fov: 55, near: 0.1, far: 80 }}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance", stencil: false }}
      // Full strength on the homepage; dimmed behind reading surfaces elsewhere.
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: route === "/" ? 1 : 0.5,
        transition: "opacity 1.2s ease",
      }}
    >
      <CameraRig route={route} />
      <Particles count={low ? 2600 : 7000} a={a} b={b} />
      <Core a={a} b={b} shards={low ? 18 : 42} />
    </Canvas>
  );
}
