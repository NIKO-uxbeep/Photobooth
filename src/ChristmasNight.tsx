import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { addGift, addHeroTree } from './WinterScene';

export default function ChristmasNight() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#10274b');
    scene.fog = new THREE.FogExp2('#182f58', 0.036);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 70);
    const cube = new THREE.BoxGeometry();
    const materials = new Map<string, THREE.Material>();
    function material(color: string, luminous = false) {
      const key = `${color}:${luminous}`;
      const existing = materials.get(key);
      if (existing) return existing;
      const value = luminous ? new THREE.MeshBasicMaterial({ color, toneMapped: false }) : new THREE.MeshStandardMaterial({ color, roughness: 0.84 });
      materials.set(key, value);
      return value;
    }
    function box(parent: THREE.Object3D, color: string, size: number[], position: number[], luminous = false) {
      const mesh = new THREE.Mesh(cube, material(color, luminous));
      mesh.scale.set(size[0], size[1], size[2]);
      mesh.position.set(position[0], position[1], position[2]);
      parent.add(mesh);
      return mesh;
    }

    scene.add(new THREE.HemisphereLight('#b7d6ff', '#547ba3', 2));
    const moonlight = new THREE.DirectionalLight('#b8d5ff', 2.35);
    moonlight.position.set(-5, 9, 3);
    scene.add(moonlight);
    box(scene, '#b8d3ec', [58, 0.24, 58], [0, -0.14, -5]);

    const hill = new THREE.SphereGeometry(1, 20, 12);
    for (const [x, z, width] of [[-12, -9, 9], [10, -11, 7], [0, -20, 12], [5, 4, 3], [-5, 3, 3]]) {
      const drift = new THREE.Mesh(hill, material('#b4cbe7'));
      drift.position.set(x, -0.48, z);
      drift.scale.set(width, z > 0 ? 0.84 : 1.85, width * 0.6);
      scene.add(drift);
    }

    const forestCone = new THREE.ConeGeometry(1, 1, 8);
    for (let index = 0; index < 23; index += 1) {
      const x = (index - 11) * 1.6;
      const z = -13 - index % 4 * 2;
      const height = 1.7 + index % 5 * 0.48;
      for (let layer = 0; layer < 3; layer += 1) {
        const fir = new THREE.Mesh(forestCone, material(layer === 2 ? '#749ab5' : '#214461'));
        const radius = height * (0.32 - layer * 0.063);
        fir.scale.set(radius, height * 0.61, radius);
        fir.position.set(x, 0.5 + height * (0.3 + layer * 0.16), z);
        scene.add(fir);
      }
    }

    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.99, 48), new THREE.MeshBasicMaterial({ color: '#cde9ff', fog: false }));
    moon.position.set(6.7, 7.9, -18);
    scene.add(moon);
    const craterGeometry = new THREE.CircleGeometry(1, 18);
    const craterMaterial = new THREE.MeshBasicMaterial({ color: '#99c4e5', fog: false });
    for (const [x, y, size] of [[-0.31, 0.28, 0.23], [0.26, 0.13, 0.16], [0.12, -0.36, 0.27], [-0.38, -0.22, 0.1]]) {
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.position.set(x, y, 0.012);
      crater.scale.set(size, size * 0.73, 1);
      moon.add(crater);
    }

    const chalet = new THREE.Group();
    chalet.position.set(2.45, 0, -4.25);
    scene.add(chalet);
    box(chalet, '#694134', [4.1, 2.4, 3.2], [0, 1.22, 0]);
    for (let log = 0; log < 11; log += 1) {
      const y = 0.17 + log * 0.216;
      const color = log % 2 ? '#8b563e' : '#75452f';
      box(chalet, color, [4.24, 0.19, 0.14], [0, y, 1.63]);
      for (const side of [-1, 1]) box(chalet, color, [0.13, 0.19, 3.2], [side * 2.07, y, 0]);
    }
    const gable = new THREE.Shape();
    gable.moveTo(-2.04, 0);
    gable.lineTo(2.04, 0);
    gable.lineTo(0, 1.59);
    gable.closePath();
    const gableMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 3.18, bevelEnabled: false }), material('#805136'));
    gableMesh.position.set(0, 2.39, -1.59);
    chalet.add(gableMesh);
    for (const side of [-1, 1]) {
      const roof = new THREE.Group();
      roof.position.set(side * 1.14, 3.23, 0);
      roof.rotation.z = -side * 0.66;
      chalet.add(roof);
      box(roof, '#4e3440', [2.93, 0.18, 3.83], [0, 0, 0]);
      box(roof, '#dcf0ff', [3.02, 0.18, 3.88], [0, 0.17, 0]);
    }
    box(chalet, '#463544', [0.54, 1.31, 0.65], [1.18, 3.43, -0.55]);
    box(chalet, '#ddeefa', [0.69, 0.12, 0.78], [1.18, 4.12, -0.55]);

    function windowAt(x: number, y: number, width: number, height: number) {
      box(chalet, '#46312b', [width + 0.18, height + 0.18, 0.14], [x, y, 1.72]);
      box(chalet, '#ffb84d', [width, height, 0.08], [x, y, 1.82], true);
      box(chalet, '#ffd38a', [0.064, height, 0.052], [x, y, 1.88]);
      box(chalet, '#ffd38a', [width, 0.064, 0.052], [x, y, 1.88]);
      box(chalet, '#ebdfd9', [width + 0.26, 0.086, 0.22], [x, y - height / 2 - 0.08, 1.8]);
    }
    windowAt(0, 2.98, 0.66, 0.67);
    windowAt(-1.22, 1.42, 0.81, 0.89);
    windowAt(1.22, 1.42, 0.81, 0.89);
    box(chalet, '#532e2a', [0.79, 1.53, 0.08], [0, 0.83, 1.76]);
    box(chalet, '#f2b768', [0.11, 0.09, 0.06], [0.26, 0.78, 1.82]);
    box(chalet, '#9a6d4c', [4.27, 0.17, 0.91], [0, 0.15, 2.05]);
    box(chalet, '#e1eff8', [4.3, 0.06, 0.91], [0, 0.26, 2.05]);
    for (let bulb = 0; bulb < 20; bulb += 1) {
      box(chalet, bulb % 2 ? '#ffe4a3' : '#ffae55', [0.075, 0.088, 0.07], [-1.96 + bulb * 0.206, 2.32, 1.78], true);
    }
    const warmLight = new THREE.PointLight('#ffad51', 18, 7);
    warmLight.position.set(0, 1.15, 2.48);
    chalet.add(warmLight);

    const tree = addHeroTree(scene);
    tree.bulbs.forEach((bulb, index) => {
      const light = bulb.material as THREE.MeshBasicMaterial;
      light.color.set(['#ffd172', '#ff665f', '#8dd8ff', '#a6ffb5'][index % 4]);
      light.toneMapped = false;
    });
    const gifts = new THREE.Group();
    scene.add(gifts);
    addGift(gifts, -0.6, 0.53, '#cc414a', 0.45);
    addGift(gifts, 0.08, 0.72, '#c2354a', 0.57);
    addGift(gifts, 0.73, 0.42, '#397b97', 0.38);
    addGift(gifts, 0.51, 0.96, '#c28e43', 0.3);
    const starShape = new THREE.Shape();
    for (let point = 0; point < 10; point += 1) {
      const angle = Math.PI / 2 + point * Math.PI / 5;
      const radius = point % 2 ? 0.19 : 0.48;
      if (point === 0) starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    starShape.closePath();
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.07, bevelEnabled: false }), material('#ffe0a0', true));
    star.position.copy(tree.star.position);
    tree.star.visible = false;
    tree.tree.add(star);

    const flakes = new Float32Array(680 * 3);
    for (let index = 0; index < flakes.length; index += 3) {
      flakes[index] = Math.random() * 33 - 16.5;
      flakes[index + 1] = Math.random() * 12;
      flakes[index + 2] = Math.random() * 28 - 21;
    }
    const snowGeometry = new THREE.BufferGeometry();
    const snow = new THREE.BufferAttribute(flakes, 3);
    snowGeometry.setAttribute('position', snow);
    const dot = document.createElement('canvas');
    dot.width = dot.height = 32;
    const paint = dot.getContext('2d');
    if (paint) {
      const gradient = paint.createRadialGradient(16, 16, 1, 16, 16, 15);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.45, '#ffffffe5');
      gradient.addColorStop(1, '#ffffff00');
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 32, 32);
    }
    const flakeTexture = new THREE.CanvasTexture(dot);
    scene.add(new THREE.Points(snowGeometry, new THREE.PointsMaterial({ color: '#eaf5ff', map: flakeTexture, size: 0.105, opacity: 0.92, transparent: true, depthWrite: false })));

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') pointer.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
    };
    function render() {
      camera.lookAt(0, 2.45, -3.2);
      renderer.render(scene, camera);
    }
    function resize() {
      if (!mount?.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.position.set(0, 2.65, 8.7);
      const portrait = camera.aspect < 0.88;
      const wide = THREE.MathUtils.clamp((camera.aspect - 0.88) / 0.68, 0, 1);
      tree.tree.position.set(THREE.MathUtils.lerp(-1.12, 0.92, wide), 0, -0.3);
      tree.tree.scale.setScalar(THREE.MathUtils.lerp(0.76, 0.74, wide));
      gifts.position.copy(tree.tree.position);
      chalet.position.x = THREE.MathUtils.lerp(1.05, 4.25, wide);
      chalet.scale.setScalar(THREE.MathUtils.lerp(0.74, 0.9, wide));
      moon.position.x = portrait ? 2 : 6.7;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
      render();
    }

    let previous = 0;
    function animate(now: number) {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const seconds = now / 1000;
      camera.position.x += (pointer.x * 0.65 - camera.position.x) * 0.055;
      camera.position.y += (2.65 - pointer.y * 0.29 - camera.position.y) * 0.055;
      for (let index = 0; index < snow.count; index += 1) {
        const y = snow.getY(index) - delta * (0.39 + index % 7 * 0.065);
        snow.setY(index, y < 0 ? 12 : y);
        snow.setX(index, snow.getX(index) + Math.sin(seconds + index) * delta * 0.13);
      }
      snow.needsUpdate = true;
      tree.bulbs.forEach((bulb, index) => bulb.scale.setScalar(1.15 + 0.32 * Math.sin(seconds * 2.3 + index)));
      star.rotation.y = Math.sin(seconds * 0.72) * 0.35;
      render();
    }
    const syncMotion = () => renderer.setAnimationLoop(motion.matches || document.hidden ? null : animate);
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    syncMotion();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', syncMotion);
    motion.addEventListener('change', syncMotion);

    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', syncMotion);
      motion.removeEventListener('change', syncMotion);
      renderer.setAnimationLoop(null);
      const geometries = new Set<THREE.BufferGeometry>();
      const usedMaterials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        const entries: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((entry) => usedMaterials.add(entry));
      });
      geometries.forEach((geometry) => geometry.dispose());
      usedMaterials.forEach((entry) => entry.dispose());
      flakeTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="booth-room" aria-hidden="true" />;
}