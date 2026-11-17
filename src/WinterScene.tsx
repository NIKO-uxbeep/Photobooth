import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type WinterSceneProps = {
  interactive?: boolean;
  onTreeClick?: () => void;
};

function addTree(scene: THREE.Scene, x: number, z: number, scale: number) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 1.15, 7),
    new THREE.MeshStandardMaterial({ color: '#674d3b', roughness: 1 }),
  );
  trunk.position.y = 0.48;
  tree.add(trunk);

  const greens = ['#1a453d', '#205348', '#2a6251'];
  for (let layer = 0; layer < 3; layer += 1) {
    const height = 1.65 - layer * 0.13;
    const radius = 1.08 - layer * 0.2;
    const base = 0.72 + layer * 0.75;
    const branches = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 8),
      new THREE.MeshStandardMaterial({ color: greens[layer], roughness: 0.94, flatShading: true }),
    );
    branches.position.y = base + height / 2;
    tree.add(branches);

    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.83, height * 0.42, 8),
      new THREE.MeshStandardMaterial({ color: '#d9e8dc', roughness: 1, flatShading: true }),
    );
    snow.position.y = base + height * 0.79;
    tree.add(snow);
  }

  scene.add(tree);
}

function addGift(scene: THREE.Scene, x: number, z: number, color: string, size: number) {
  const gift = new THREE.Group();
  gift.position.set(x, size / 2 - 0.02, z);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.76, flatShading: true }),
  );
  const ribbonMaterial = new THREE.MeshStandardMaterial({ color: '#e8c67d', roughness: 0.5, metalness: 0.2 });
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(size * 0.16, size * 1.01, size * 1.02), ribbonMaterial);
  const crossRibbon = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, size * 1.01, size * 0.16), ribbonMaterial);
  gift.add(box, ribbon, crossRibbon);
  scene.add(gift);
}

function addHeroTree(scene: THREE.Scene) {
  const tree = new THREE.Group();
  tree.position.set(0, 0, -2.2);
  tree.scale.setScalar(1.35);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.32, 1.35, 8),
    new THREE.MeshStandardMaterial({ color: '#765139', roughness: 1 }),
  );
  trunk.position.y = 0.62;
  tree.add(trunk);

  const branchColors = ['#176044', '#1d704e', '#238058', '#2a8e61'];
  for (let layer = 0; layer < 4; layer += 1) {
    const height = 2.15 - layer * 0.13;
    const radius = 2.05 - layer * 0.36;
    const base = 0.78 + layer * 0.92;
    const branch = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 9),
      new THREE.MeshStandardMaterial({ color: branchColors[layer], roughness: 0.9, flatShading: true }),
    );
    branch.position.y = base + height / 2;
    tree.add(branch);

    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.82, height * 0.3, 9),
      new THREE.MeshStandardMaterial({ color: '#e1ebe0', roughness: 1, flatShading: true }),
    );
    snow.position.y = base + height * 0.86;
    tree.add(snow);
  }

  const garlandPoints: THREE.Vector3[] = [];
  for (let index = 0; index <= 64; index += 1) {
    const progress = index / 64;
    const y = 1.12 + progress * 4.65;
    const radius = 1.85 - progress * 1.45;
    const angle = progress * Math.PI * 8;
    garlandPoints.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  const garland = new THREE.CatmullRomCurve3(garlandPoints);
  tree.add(new THREE.Mesh(
    new THREE.TubeGeometry(garland, 96, 0.035, 5, false),
    new THREE.MeshStandardMaterial({ color: '#d8b15b', roughness: 0.62, metalness: 0.22 }),
  ));

  const ornaments = ['#c64c3c', '#e3bc62', '#dce7dc', '#a8cfaa'];
  for (let index = 0; index < 24; index += 1) {
    const progress = (index + 0.5) / 24;
    const y = 1.05 + progress * 4.75;
    const radius = (1.72 - progress * 1.36) * 0.9;
    const angle = index * 2.399;
    const ornament = new THREE.Mesh(
      new THREE.SphereGeometry(index % 5 === 0 ? 0.15 : 0.105, 12, 10),
      new THREE.MeshStandardMaterial({ color: ornaments[index % ornaments.length], roughness: 0.28, metalness: 0.18 }),
    );
    ornament.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius + 0.08);
    tree.add(ornament);
  }

  const bulbs: THREE.Mesh[] = [];
  const bulbColors = ['#ffe6a1', '#e87860', '#b9dfb5'];
  for (let index = 0; index < 32; index += 1) {
    const point = garland.getPoint(index / 31);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color: bulbColors[index % bulbColors.length] }),
    );
    bulb.position.copy(point);
    tree.add(bulb);
    bulbs.push(bulb);
  }

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.34, 0),
    new THREE.MeshStandardMaterial({ color: '#f4d276', emissive: '#a87824', emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.25 }),
  );
  star.position.y = 6.15;
  tree.add(star);

  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(2.55, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }),
  );
  hitTarget.position.set(0, 3.05, 0.05);
  tree.add(hitTarget);
  scene.add(tree);
  return { tree, star, bulbs, hitTarget };
}

export default function WinterScene({ interactive = false, onTreeClick }: WinterSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({ interactive, onTreeClick });
  interactionRef.current = { interactive, onTreeClick };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#102622');
    scene.fog = new THREE.FogExp2('#102622', 0.025);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 70);
    camera.position.set(0, 4.2, 17);
    camera.lookAt(0, 2.2, -2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      mount.classList.add('winter-world-static');
      return () => mount.classList.remove('winter-world-static');
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#d9eee8', '#1b342c', 2.1));
    const moonlight = new THREE.DirectionalLight('#c6e2e8', 2.2);
    moonlight.position.set(-5, 9, 6);
    scene.add(moonlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: '#c7d9ce', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.04, -8);
    scene.add(ground);

    const heroTree = addHeroTree(scene);

    [
      [-5.1, -3.2, 2.05], [-3.6, -5.7, 1.42], [-7.1, -7, 1.35],
      [5.1, -3.4, 2.1], [3.7, -5.8, 1.48], [7, -7.3, 1.4],
      [-9.2, -2.4, 1.8], [9.1, -2.6, 1.85],
    ].forEach(([x, z, scale]) => addTree(scene, x, z, scale));

    addGift(scene, -2.2, -0.2, '#a63b32', 0.65);
    addGift(scene, 2.15, -0.45, '#d1a64f', 0.52);
    addGift(scene, 3.05, -0.8, '#315d4a', 0.44);

    const garlandPoints = [
      new THREE.Vector3(-5.4, 2.9, -3.1),
      new THREE.Vector3(-3.2, 2.4, -3),
      new THREE.Vector3(-1, 2.85, -3),
      new THREE.Vector3(1.2, 2.42, -3),
      new THREE.Vector3(3.35, 2.82, -3),
      new THREE.Vector3(5.35, 2.4, -3),
    ];
    const garland = new THREE.CatmullRomCurve3(garlandPoints);
    const garlandLine = new THREE.Mesh(
      new THREE.TubeGeometry(garland, 48, 0.035, 5, false),
      new THREE.MeshStandardMaterial({ color: '#a8804b', roughness: 0.8 }),
    );
    scene.add(garlandLine);

    const bulbs: THREE.Mesh[] = [];
    const bulbColors = ['#e7b958', '#d9634e', '#81b99a', '#ecd8a2'];
    for (let index = 0; index < 17; index += 1) {
      const position = garland.getPoint(index / 16);
      const material = new THREE.MeshBasicMaterial({ color: bulbColors[index % bulbColors.length] });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material);
      bulb.position.copy(position);
      bulb.position.y -= index % 2 === 0 ? 0.04 : 0.12;
      scene.add(bulb);
      bulbs.push(bulb);
    }

    const snowCount = 520;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    for (let index = 0; index < snowCount; index += 1) {
      snowPositions[index * 3] = (Math.random() - 0.5) * 28;
      snowPositions[index * 3 + 1] = Math.random() * 14 - 1;
      snowPositions[index * 3 + 2] = (Math.random() - 0.5) * 20 - 1;
      snowSpeeds[index] = 0.006 + Math.random() * 0.014;
    }
    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snow = new THREE.Points(
      snowGeometry,
      new THREE.PointsMaterial({ color: '#f1f5e9', size: 0.055, transparent: true, opacity: 0.76, sizeAttenuation: true }),
    );
    scene.add(snow);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const treePointer = new THREE.Vector2();
    const ignoreTreeClick = (target: EventTarget | null) =>
      target instanceof Element && target.closest('button, a, input, .tree-copy, .topbar, .footer-note, .tree-edition-mark');
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!interactionRef.current.interactive || ignoreTreeClick(event.target)) {
        document.body.style.cursor = '';
        return;
      }
      treePointer.set(pointer.x, -pointer.y);
      raycaster.setFromCamera(treePointer, camera);
      document.body.style.cursor = raycaster.intersectObject(heroTree.hitTarget, false).length ? 'pointer' : '';
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!interactionRef.current.interactive || event.button !== 0) return;
      if (ignoreTreeClick(event.target)) return;
      treePointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(treePointer, camera);
      if (raycaster.intersectObject(heroTree.hitTarget, false).length) interactionRef.current.onTreeClick?.();
    };
    const resizeScene = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(mount);
    window.addEventListener('resize', resizeScene);

    let animationFrame = 0;
    let time = 0;
    const render = () => {
      animationFrame = window.requestAnimationFrame(render);
      time += 1;
      camera.position.x += (pointer.x * 0.26 - camera.position.x) * 0.012;
      camera.position.y += (4.2 + pointer.y * -0.12 - camera.position.y) * 0.012;
      camera.lookAt(pointer.x * 0.12, 2.2, -2);
      heroTree.tree.rotation.y = Math.sin(time * 0.004) * 0.14;
      heroTree.star.rotation.y = time * 0.012;
      heroTree.star.rotation.z = Math.sin(time * 0.016) * 0.11;
      heroTree.bulbs.forEach((bulb, index) => {
        const material = bulb.material as THREE.MeshBasicMaterial;
        material.color.setHex(Math.floor(time / 28 + index) % 4 === 0 ? 0xffffff : [0xffe6a1, 0xe87860, 0xb9dfb5][index % 3]);
      });
      for (let index = 0; index < bulbs.length; index += 1) {
        const material = bulbs[index].material as THREE.MeshBasicMaterial;
        material.color.setHex((Math.floor(time / 34) + index) % 4 === 0 ? 0xffe6a1 : [0xe7b958, 0xd9634e, 0x81b99a, 0xecd8a2][index % 4]);
      }
      const positions = snowGeometry.attributes.position as THREE.BufferAttribute;
      for (let index = 0; index < snowCount; index += 1) {
        const y = positions.getY(index) - snowSpeeds[index];
        positions.setY(index, y < -1 ? 12 + Math.random() * 3 : y);
        positions.setX(index, positions.getX(index) + Math.sin((time + index) * 0.006) * 0.002);
      }
      positions.needsUpdate = true;
      renderer.render(scene, camera);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    if (reducedMotion) renderer.render(scene, camera);
    else render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', resizeScene);
      document.body.style.cursor = '';
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="winter-world" ref={mountRef} aria-hidden="true" />;
}