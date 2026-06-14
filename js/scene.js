// ─── Three.js Scene: ONE renderer, particle wave ──────────────────────────────
// Rule: ONE WebGLRenderer. ONE scene. Never create a second renderer.

const isMobile = window.matchMedia('(max-width: 1023px)').matches
  || window.matchMedia('(pointer: coarse)').matches;

function initScene() {
  if (isMobile) return;

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(0x000000, 0);

  // ── Scene & Camera ────────────────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 4);

  // ── Particles ─────────────────────────────────────────────────────────────
  const PARTICLE_COUNT = 150;
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const baseY      = new Float32Array(PARTICLE_COUNT); // store original y for animation

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const x = (i / PARTICLE_COUNT) * 16 - 8;          // -8 to 8
    const y = Math.sin(x * 0.8) * 1.2;                // sinusoidal wave
    const z = (Math.random() - 0.5) * 0.5;            // slight z scatter

    positions[i3]     = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    baseY[i]          = y;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xFF3B5C,
    size: 0.05,
    transparent: true,
    opacity: 0.12,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);

  // ── Connecting Lines ──────────────────────────────────────────────────────
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0xFF3B5C,
      transparent: true,
      opacity: 0.05,
    })
  );
  scene.add(lineMaterial);

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const mouse = { x: 0, y: 0 };
  const mouse3D = new THREE.Vector3();

  document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    // Map to scene coordinates
    mouse3D.set(mouse.x * 8, mouse.y * 4, 0);
  });

  // ── Animation loop ────────────────────────────────────────────────────────
  let rafId = null;
  let lastTime = 0;
  const MAX_CONNECTIONS = 80;

  function animate(time) {
    rafId = requestAnimationFrame(animate);
    const t = time * 0.001;

    // Animate particle y positions: breathing wave
    const pos = particles.geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3  = i * 3;
      const x   = pos.getX(i);
      // Combine base y with time-based oscillation
      const wave = Math.sin(x * 0.8 + t * 0.8) * 1.2;
      const bob  = Math.sin(t * 0.5 + i * 0.1) * 0.12;

      // Mouse repulsion
      const dx = pos.getX(i) - mouse3D.x;
      const dy = pos.getY(i) - mouse3D.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repulsion = dist < 1.5 ? (1.5 - dist) * 0.3 : 0;
      const repX = dist > 0 ? (dx / dist) * repulsion : 0;
      const repY = dist > 0 ? (dy / dist) * repulsion : 0;

      pos.setXYZ(i, x, wave + bob + repY, pos.getZ(i) + repX * 0.01);
    }
    pos.needsUpdate = true;

    // Update connecting lines (only check nearest neighbors for performance)
    const lp = lineMaterial.geometry.attributes.position;
    let lineIdx = 0;
    const CONNECT_DIST_SQ = 1.5 * 1.5;

    for (let i = 0; i < PARTICLE_COUNT && lineIdx < MAX_CONNECTIONS; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineIdx < MAX_CONNECTIONS; j++) {
        const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
        const bx = pos.getX(j), by = pos.getY(j), bz = pos.getZ(j);
        const d = (ax-bx)*(ax-bx) + (ay-by)*(ay-by);
        if (d < CONNECT_DIST_SQ) {
          const base = lineIdx * 6;
          lp.array[base]     = ax; lp.array[base+1] = ay; lp.array[base+2] = az;
          lp.array[base+3]   = bx; lp.array[base+4] = by; lp.array[base+5] = bz;
          lineIdx++;
        }
      }
    }
    // Zero out unused line slots
    for (let k = lineIdx * 6; k < lp.array.length; k++) lp.array[k] = 0;
    lp.needsUpdate = true;
    lineMaterial.geometry.setDrawRange(0, lineIdx * 2);

    renderer.render(scene, camera);
  }

  // ── Visibility & focus control ────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }
  });

  // ── Resize ────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Reduced motion: single frame only ────────────────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    renderer.render(scene, camera);
    return;
  }

  // ── Start ────────────────────────────────────────────────────────────────
  rafId = requestAnimationFrame(animate);
}
