"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/site/Photo";
import { ArrowUpRight } from "@/components/site/Icons";
import { lockScroll, unlockScroll } from "@/lib/scroll-control";

export type TourModel = "villa" | "apartment";

type TourConfig = {
  file: string;
  label: string;
  poster: "hero3" | "apartment-living";
  alt: string;
};

const MODELS: Record<TourModel, TourConfig> = {
  villa: {
    file: "/models/vill_draco.glb",
    label: "Residence 03 — Exterior",
    poster: "hero3",
    alt: "Interactive three-dimensional model of Residence 03, a two-storey villa with a colonnade.",
  },
  apartment: {
    file: "/models/apartment.glb",
    label: "Residence 02 — Plan",
    poster: "apartment-living",
    alt: "Interactive three-dimensional plan model of Residence 02, showing its walls, doors and windows.",
  },
};

type DoorState = {
  pivot: import("three").Object3D;
  label: string;
  open: boolean;
  locked: boolean;
  angle: number;
  openAngle: number;
  position: import("three").Vector3;
};

type DoorPrompt = {
  label: string;
  state: string;
  action: string;
  lockAction: string;
};

type WalkState = {
  camera: import("three").PerspectiveCamera;
  orbit: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  pointer: import("three/examples/jsm/controls/PointerLockControls.js").PointerLockControls;
  saved: {
    position: import("three").Vector3;
    quaternion: import("three").Quaternion;
    target: import("three").Vector3;
    autoRotate: boolean;
  };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  eyeHeight: number;
  speed: number;
  start: import("three").Vector3;
  keys: Set<string>;
  active: boolean;
  doors: DoorState[];
  collision: import("three").Object3D[];
  raycaster: import("three").Raycaster;
  nearestDoor: DoorState | null;
  promptKey: string;
  interactDoor: () => void;
  toggleLock: () => void;
  enter: () => void;
  exit: () => void;
};

type Props = {
  model: TourModel;
};

export function TourViewer({ model }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const nudgeRef = useRef<((direction: number) => void) | null>(null);
  const walkRef = useRef<WalkState | null>(null);
  const [walkActive, setWalkActive] = useState(false);
  const [doorPrompt, setDoorPrompt] = useState<DoorPrompt | null>(null);
  const [activated, setActivated] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState(0);

  const config = MODELS[model];

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activated) return;

    setWalkActive(false);
    setDoorPrompt(null);

    let cancelled = false;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null =
      null;
    let pointerControls:
      | import("three/examples/jsm/controls/PointerLockControls.js").PointerLockControls
      | null = null;
    let walkKeyDown: ((event: KeyboardEvent) => void) | null = null;
    let walkKeyUp: ((event: KeyboardEvent) => void) | null = null;
    let walkBlur: (() => void) | null = null;
    let pointerLockErrorHandler: (() => void) | null = null;
    let scene: import("three").Scene | null = null;
    let pmrem: import("three").PMREMGenerator | null = null;
    let envTarget: import("three").WebGLRenderTarget | null = null;
    let cube: import("three").CubeTexture | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let visibility: IntersectionObserver | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let reduceMotion = false;

    const run = async () => {
      setStatus("loading");
      setProgress(0);

      try {
        const THREE = await import("three");
        const [
          { OrbitControls },
          { PointerLockControls },
          { GLTFLoader },
          { DRACOLoader },
        ] = await Promise.all([
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/controls/PointerLockControls.js"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/loaders/DRACOLoader.js"),
        ]);

        if (cancelled) return;
        const mount = mountRef.current;
        if (!mount) return;

        reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.98;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        mount.replaceChildren(renderer.domElement);

        scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 500);
        camera.position.set(4, 3, 6);

        const hemi = new THREE.HemisphereLight(0xfff3e0, 0x8c806d, 0.34);
        scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xffe2bb, 3.2);
        sun.position.set(7, 12, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0004;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0xd9e6f2, 0.35);
        fill.position.set(-8, 5, -6);
        scene.add(fill);

        // Sky cube from the supplied reference pack, used for image-based light.
        cube = await new THREE.CubeTextureLoader().loadAsync([
          "/skybox/px.png",
          "/skybox/nx.png",
          "/skybox/py.png",
          "/skybox/ny.png",
          "/skybox/pz.png",
          "/skybox/nz.png",
        ]);
        if (cancelled) return;
        cube.colorSpace = THREE.SRGBColorSpace;
        pmrem = new THREE.PMREMGenerator(renderer);
        envTarget = pmrem.fromCubemap(cube);
        scene.environment = envTarget.texture;
        scene.environmentIntensity = 0.6;

        // Soft warm ground.
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(60, 96),
          new THREE.MeshStandardMaterial({
            color: 0xd7cdbc,
            roughness: 1,
            metalness: 0,
          }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        ground.receiveShadow = true;
        scene.add(ground);

        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        loader.setDRACOLoader(draco);

        const gltf = await loader.loadAsync(config.file, (event) => {
          if (cancelled) return;
          if (event.total > 0) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        if (cancelled) return;

        const root = gltf.scene;
        const isInternal = model === "apartment";
        const stageAspect = mount.clientWidth / (mount.clientHeight || 1);
        const narrowStage = stageAspect < 1.5;
        const restyled = new Set<string>();
        const removed: import("three").Object3D[] = [];

        root.traverse((child) => {
          const mesh = child as import("three").Mesh;
          if (!mesh.isMesh) return;

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          const materialNames = materials.map((material) =>
            ((material as import("three").MeshStandardMaterial).name || "").toUpperCase(),
          );

          // The villa file carries its whole plot: a large marble site slab
          // and the landscaping on top of it. Both flatten the composition and
          // make the building read small, so the building sits on the page's
          // own warm ground instead.
          const isSite = !isInternal && materialNames.some(
            (name) =>
              name.includes("MARBLE_CARRARA_WHITE") ||
              name.includes("GOLDEN_BEIGE"),
          );
          const isLandscape = materialNames.some((name) => name.includes("GRASS"));
          if (isSite || isLandscape) {
            removed.push(mesh);
            return;
          }

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;

          materials.forEach((material) => {
            const standard = material as import("three").MeshStandardMaterial;
            if (!standard || restyled.has(standard.uuid)) return;
            restyled.add(standard.uuid);
            const name = (standard.name || "").toUpperCase();

            // Mute the model's vermilion car so the only saturated accent on
            // the page stays the brand green.
            if (name.includes("VERMILION")) {
              standard.color.set(0x5d6459);
              standard.needsUpdate = true;
            }

            // The plan model's floor is near-black in the source file. Lift it
            // to the same warm stone so the rooms stay legible.
            if (isInternal && name === "FLOOR") {
              standard.map = null;
              standard.color.set(0xcdc3b2);
              standard.roughness = 1;
              standard.needsUpdate = true;
            }

            // Warm the plan model's concrete-grey walls to match the page.
            if (isInternal && name === "WALLS") {
              standard.color.set(0xe7dfd1);
              standard.roughness = 0.95;
              standard.needsUpdate = true;
            }
          });
        });

        removed.forEach((object) => object.removeFromParent());

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;
        root.scale.setScalar(0.96);
        scene.add(root);

        const doors: DoorState[] = [];
        const collision: import("three").Object3D[] = [];

        if (isInternal) {
          const furnish = new THREE.Group();
          furnish.name = "apartment-furnishings";
          root.add(furnish);

          const wood = new THREE.MeshStandardMaterial({ color: 0x76553d, roughness: 0.72 });
          const darkWood = new THREE.MeshStandardMaterial({ color: 0x3d3028, roughness: 0.78 });
          const linen = new THREE.MeshStandardMaterial({ color: 0xd8cebd, roughness: 0.95 });
          const whiteLinen = new THREE.MeshStandardMaterial({ color: 0xeee5d5, roughness: 0.96 });
          const stone = new THREE.MeshStandardMaterial({ color: 0xa59a89, roughness: 0.88 });
          const paleStone = new THREE.MeshStandardMaterial({ color: 0xcfc4b3, roughness: 0.9 });
          const charcoal = new THREE.MeshStandardMaterial({ color: 0x34312d, roughness: 0.86 });
          const brass = new THREE.MeshStandardMaterial({ color: 0x9a7a4d, roughness: 0.4, metalness: 0.55 });
          const rug = new THREE.MeshStandardMaterial({ color: 0xb7a58e, roughness: 1 });
          const leaf = new THREE.MeshStandardMaterial({ color: 0x59654f, roughness: 0.9 });
          const water = new THREE.MeshStandardMaterial({ color: 0x6e9290, roughness: 0.18, metalness: 0.1 });

          const box = (
            parent: import("three").Object3D,
            w: number,
            h: number,
            d: number,
            material: import("three").Material,
            x: number,
            y: number,
            z: number,
            ry = 0,
          ) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
            mesh.position.set(x, y, z);
            mesh.rotation.y = ry;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            parent.add(mesh);
            return mesh;
          };

          const cylinder = (
            parent: import("three").Object3D,
            radius: number,
            height: number,
            material: import("three").Material,
            x: number,
            y: number,
            z: number,
          ) => {
            const mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(radius, radius, height, 20),
              material,
            );
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            parent.add(mesh);
            return mesh;
          };

          const bed = (x: number, z: number) => {
            const group = new THREE.Group();
            group.position.set(x, 0, z);
            furnish.add(group);
            box(group, 2.05, 0.18, 1.62, wood, 0, 0.14, 0);
            box(group, 1.95, 0.24, 1.52, whiteLinen, 0, 0.34, 0);
            box(group, 1.92, 0.08, 1.46, linen, 0, 0.49, 0.03);
            box(group, 0.11, 0.92, 1.62, wood, 1.0, 0.52, 0);
            box(group, 0.52, 0.15, 0.34, whiteLinen, -0.52, 0.58, -0.37);
            box(group, 0.52, 0.15, 0.34, whiteLinen, -0.52, 0.58, 0.37);
            box(group, 2.28, 0.015, 1.9, rug, 0, 0.02, 0);
          };

          // Two clear bedrooms on the right-hand side of the plan.
          bed(3.35, 1.4);
          bed(3.35, 4.22);
          for (const z of [0.45, 2.35]) {
            box(furnish, 0.46, 0.44, 0.44, darkWood, 4.34, 0.22, z);
            box(furnish, 0.28, 0.03, 0.28, brass, 4.34, 0.46, z);
          }
          for (const z of [3.27, 5.17]) {
            box(furnish, 0.46, 0.44, 0.44, darkWood, 4.34, 0.22, z);
            box(furnish, 0.28, 0.03, 0.28, brass, 4.34, 0.46, z);
          }
          box(furnish, 0.7, 1.9, 1.82, darkWood, 1.05, 0.95, 1.4);
          box(furnish, 0.7, 1.9, 1.82, darkWood, 1.05, 0.95, 4.22);

          // Kitchen along the top wall, with an island and stools.
          box(furnish, 4.2, 0.88, 0.62, charcoal, 1.0, 0.44, -2.94);
          box(furnish, 4.3, 0.06, 0.72, paleStone, 1.0, 0.91, -2.94);
          box(furnish, 0.82, 0.055, 0.46, charcoal, 0.18, 0.95, -2.94);
          box(furnish, 0.5, 0.045, 0.36, paleStone, 1.66, 0.95, -2.94);
          box(furnish, 0.7, 2.02, 0.7, charcoal, 3.1, 1.01, -2.94);
          box(furnish, 2.25, 0.88, 0.9, charcoal, 1.15, 0.44, -1.7);
          box(furnish, 2.35, 0.06, 1.0, paleStone, 1.15, 0.91, -1.7);
          for (const x of [0.45, 1.15, 1.85]) {
            cylinder(furnish, 0.2, 0.62, wood, x, 0.31, -1.12);
            cylinder(furnish, 0.24, 0.05, linen, x, 0.64, -1.12);
          }
          box(furnish, 2.8, 0.045, 0.52, brass, 1.0, 1.46, -2.94);
          box(furnish, 0.16, 0.24, 0.16, charcoal, 0.0, 1.58, -2.94);
          box(furnish, 0.16, 0.24, 0.16, charcoal, 0.55, 1.58, -2.94);

          // Living room: sofa, coffee table, rug and a pair of lamps.
          box(furnish, 3.0, 0.018, 2.4, rug, -2.15, 0.02, -1.55);
          box(furnish, 2.45, 0.38, 0.92, linen, -2.15, 0.22, -2.12);
          box(furnish, 2.45, 0.55, 0.2, linen, -2.15, 0.56, -2.55);
          box(furnish, 0.18, 0.5, 0.92, linen, -3.35, 0.3, -2.12);
          box(furnish, 0.18, 0.5, 0.92, linen, -0.95, 0.3, -2.12);
          box(furnish, 1.25, 0.34, 0.65, wood, -2.15, 0.19, -1.15);
          box(furnish, 0.42, 0.5, 0.42, paleStone, -3.15, 0.25, -1.0);
          box(furnish, 0.42, 0.5, 0.42, paleStone, -1.15, 0.25, -1.0);
          for (const x of [-2.15, -1.15]) {
            cylinder(furnish, 0.025, 1.7, brass, x, 1.2, -0.85);
            cylinder(furnish, 0.18, 0.2, linen, x, 2.06, -0.85);
          }

          // Compact bathroom in the small left-hand room.
          box(furnish, 1.18, 0.035, 0.86, paleStone, -1.95, 0.02, 1.5);
          box(furnish, 0.54, 0.42, 0.36, whiteLinen, -2.35, 0.21, 1.94);
          cylinder(furnish, 0.26, 0.42, whiteLinen, -2.35, 0.21, 2.28);
          box(furnish, 0.52, 0.14, 0.4, paleStone, -1.55, 0.8, 1.52);
          cylinder(furnish, 0.08, 0.72, brass, -1.55, 0.4, 1.52);

          // Outdoor terrace, reached through the perimeter doors.
          box(furnish, 6.5, 0.06, 3.2, wood, 0.6, 0.03, 7.15);
          box(furnish, 2.0, 0.045, 4.0, stone, 0.6, 0.02, 9.55);
          for (const x of [-2.0, 3.2]) {
            box(furnish, 0.7, 0.45, 0.7, charcoal, x, 0.23, 7.0);
            box(furnish, 0.53, 0.08, 0.53, linen, x, 0.49, 7.0);
            box(furnish, 0.08, 0.55, 0.55, charcoal, x, 0.52, 7.35);
          }
          box(furnish, 1.1, 0.08, 0.7, stone, 0.6, 0.42, 7.0);
          cylinder(furnish, 0.05, 0.38, brass, 0.6, 0.2, 7.0);
          for (const x of [-2.8, 4.0]) {
            box(furnish, 0.7, 0.55, 0.7, paleStone, x, 0.28, 8.35);
            box(furnish, 0.55, 0.45, 0.55, leaf, x, 0.75, 8.35);
          }
          box(furnish, 3.2, 0.1, 1.8, water, 0.6, 0.05, 8.7);

          for (const [x, z] of [
            [-2.1, -2.2],
            [1.2, -2.2],
            [3.1, 1.4],
            [3.1, 4.2],
            [-1.9, 1.5],
          ]) {
            const light = new THREE.PointLight(0xffdfb8, 1.6, 4.5, 1.7);
            light.position.set(x, 2.35, z);
            furnish.add(light);
          }

          const wallMesh = root.getObjectByName("walls_Walls_0") as
            | import("three").Mesh
            | null;
          if (wallMesh) {
            const materials = Array.isArray(wallMesh.material)
              ? wallMesh.material
              : [wallMesh.material];
            materials.forEach((material) => {
              material.side = THREE.DoubleSide;
              material.needsUpdate = true;
            });
            collision.push(wallMesh);
          }

          root.updateMatrixWorld(true);
          const doorGroups: import("three").Object3D[] = [];
          root.traverse((object) => {
            if (/^Door/i.test(object.name) && object.children.length) {
              doorGroups.push(object);
            }
          });

          doorGroups.forEach((group, index) => {
            const parent = group.parent;
            if (!parent) return;
            const bounds = new THREE.Box3().setFromObject(group);
            const doorSize = bounds.getSize(new THREE.Vector3());
            const alongX = doorSize.x >= doorSize.z;
            const hinge = new THREE.Vector3(
              alongX ? bounds.min.x : (bounds.min.x + bounds.max.x) / 2,
              bounds.min.y,
              alongX ? (bounds.min.z + bounds.max.z) / 2 : bounds.min.z,
            );
            parent.updateMatrixWorld(true);
            const pivot = new THREE.Group();
            pivot.name = `door-pivot-${index}`;
            parent.add(pivot);
            pivot.position.copy(parent.worldToLocal(hinge.clone()));
            pivot.updateMatrixWorld(true);
            pivot.attach(group);
            const openAngle = (index % 2 === 0 ? 1 : -1) * 1.28;
            pivot.rotation.y = openAngle;
            const state: DoorState = {
              pivot,
              label:
                index === 0
                  ? "entrance door"
                  : index < 3
                    ? "bedroom door"
                    : "interior door",
              open: true,
              locked: false,
              angle: openAngle,
              openAngle,
              position: new THREE.Vector3(),
            };
            doors.push(state);
            group.traverse((child) => {
              const mesh = child as import("three").Mesh;
              if (!mesh.isMesh) return;
              const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];
              materials.forEach((material) => {
                material.side = THREE.DoubleSide;
                material.needsUpdate = true;
              });
              collision.push(mesh);
            });
          });
          root.updateMatrixWorld(true);
        }

        const targetY = size.y * (isInternal ? 0.08 : 0.3);

        camera.fov = 40;
        camera.aspect = stageAspect;
        camera.near = maxDim / 500;
        camera.far = maxDim * 40;

        // Frame the complete model from a stable isometric direction rather
        // than a hard-coded distance; both assets differ in scale.
        const radius = size.length() / 2;
        const fitDistance =
          radius / Math.sin((camera.fov * Math.PI) / 180 / 2);
        const direction = new THREE.Vector3(
          isInternal ? 0.45 : 0.7,
          isInternal ? 1.15 : 0.34,
          isInternal ? 0.75 : 1.02,
        ).normalize();
        const fitFactor = isInternal
          ? narrowStage
            ? 1.32
            : 1.02
          : narrowStage
            ? 0.96
            : 0.82;
        camera.position
          .copy(direction.multiplyScalar(fitDistance * fitFactor))
          .add(new THREE.Vector3(0, targetY, 0));
        camera.updateProjectionMatrix();

        // Fade the base into the page colour instead of ending on a hard edge.
        scene.fog = new THREE.Fog(0xded5c6, fitDistance * 0.9, fitDistance * 3.4);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, targetY, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.enableZoom = false;
        // Let vertical swipes scroll the page on touch screens; horizontal
        // drags still orbit the model.
        renderer.domElement.style.touchAction = "pan-y";
        controls.minPolarAngle = 0.12;
        controls.maxPolarAngle = isInternal ? 1.52 : Math.PI / 2 - 0.02;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.45;
        controls.target.set(0, targetY, 0);
        controls.update();

        if (isInternal) {
          pointerControls = new PointerLockControls(camera, renderer.domElement);
          pointerControls.enabled = false;
          pointerControls.minPolarAngle = 0.35;
          pointerControls.maxPolarAngle = Math.PI - 0.35;

          const orbit = controls;
          const outdoor = maxDim * 2.5;
          const walkBounds = {
            minX: -outdoor,
            maxX: outdoor,
            minZ: -outdoor,
            maxZ: outdoor,
          };
          const eyeHeight = size.y * 0.56;
          // Start in the open middle of the plan, facing the kitchen and
          // living room. The large bounds cover the terrace and garden too.
          const start = new THREE.Vector3(
            root.position.x - 0.2 * root.scale.x,
            eyeHeight,
            root.position.z - 1.4 * root.scale.z,
          );

          const walk: WalkState = {
            camera,
            orbit,
            pointer: pointerControls,
            saved: {
              position: camera.position.clone(),
              quaternion: camera.quaternion.clone(),
              target: orbit.target.clone(),
              autoRotate: orbit.autoRotate,
            },
            bounds: walkBounds,
            eyeHeight,
            speed: Math.max(1, maxDim * 0.12),
            start,
            keys: new Set<string>(),
            active: false,
            doors,
            collision,
            raycaster: new THREE.Raycaster(),
            nearestDoor: null,
            promptKey: "",
            interactDoor: () => {
              const door = walk.nearestDoor;
              if (!door) return;
              if (door.locked) {
                door.locked = false;
                door.open = true;
              } else {
                door.open = !door.open;
              }
            },
            toggleLock: () => {
              const door = walk.nearestDoor;
              if (!door) return;
              if (door.locked) {
                door.locked = false;
              } else {
                door.locked = true;
                door.open = false;
              }
            },
            enter: () => {
              if (walk.active) return;
              walk.saved = {
                position: camera.position.clone(),
                quaternion: camera.quaternion.clone(),
                target: orbit.target.clone(),
                autoRotate: orbit.autoRotate,
              };
              walk.keys.clear();
              orbit.enabled = false;
              orbit.autoRotate = false;
              walk.pointer.enabled = true;
              camera.position.copy(walk.start);
              camera.lookAt(
                root.position.x - 2.15 * root.scale.x,
                eyeHeight,
                root.position.z - 1.55 * root.scale.z,
              );
              walk.pointer.lock();
            },
            exit: () => {
              if (walk.active) walk.pointer.unlock();
              else unlockScroll();
            },
          };

          const restoreOrbit = () => {
            walk.active = false;
            walk.keys.clear();
            walk.pointer.enabled = false;
            orbit.enabled = true;
            orbit.autoRotate = walk.saved.autoRotate && !reduceMotion;
            camera.position.copy(walk.saved.position);
            camera.quaternion.copy(walk.saved.quaternion);
            orbit.target.copy(walk.saved.target);
            orbit.update();
            walk.nearestDoor = null;
            walk.promptKey = "";
            unlockScroll();
            setDoorPrompt(null);
            setWalkActive(false);
          };

          pointerControls.addEventListener("lock", () => {
            walk.active = true;
            walk.keys.clear();
            lockScroll();
            setWalkActive(true);
          });
          pointerControls.addEventListener("unlock", restoreOrbit);

          pointerLockErrorHandler = restoreOrbit;
          document.addEventListener("pointerlockerror", pointerLockErrorHandler);

          walkKeyDown = (event: KeyboardEvent) => {
            if (!walk.active) return;
            if (event.code === "Escape") {
              event.preventDefault();
              walk.exit();
              return;
            }
            if (event.code === "KeyE") {
              event.preventDefault();
              walk.interactDoor();
              return;
            }
            if (event.code === "KeyL") {
              event.preventDefault();
              walk.toggleLock();
              return;
            }
            const moveKeys = [
              "KeyW",
              "KeyA",
              "KeyS",
              "KeyD",
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
            ];
            if (!moveKeys.includes(event.code)) return;
            event.preventDefault();
            walk.keys.add(event.code);
          };
          walkKeyUp = (event: KeyboardEvent) => {
            if (!walk.active) return;
            walk.keys.delete(event.code);
          };
          walkBlur = () => walk.keys.clear();
          document.addEventListener("keydown", walkKeyDown);
          document.addEventListener("keyup", walkKeyUp);
          window.addEventListener("blur", walkBlur);

          walkRef.current = walk;
          Object.assign(window, {
            __zaraTourDebug: { THREE, camera, controls: orbit, scene, root, doors },
          });
          if (wrapRef.current) {
            wrapRef.current.dataset.doors = String(doors.length);
            wrapRef.current.dataset.doorPositions = doors
              .map((door) => {
                door.pivot.getWorldPosition(door.position);
                return door.position.toArray().map((value) => value.toFixed(2)).join(",");
              })
              .join(";");
          }
        }

        nudgeRef.current = (direction: number) => {
          if (!camera || walkRef.current?.active) return;
          const offset = camera.position.clone().sub(controls!.target);
          const spherical = new THREE.Spherical().setFromVector3(offset);
          spherical.theta += direction * (Math.PI / 18);
          offset.setFromSpherical(spherical);
          camera.position.copy(controls!.target).add(offset);
          controls!.autoRotate = false;
          controls!.update();
        };

        sun.position.set(-maxDim * 1.15, maxDim * 1.8, maxDim * 0.95);
        sun.shadow.normalBias = maxDim * 0.002;
        sun.shadow.camera.left = -maxDim;
        sun.shadow.camera.right = maxDim;
        sun.shadow.camera.top = maxDim;
        sun.shadow.camera.bottom = -maxDim;
        sun.shadow.camera.near = 0.1;
        sun.shadow.camera.far = maxDim * 12;
        sun.shadow.camera.updateProjectionMatrix();

        ground.scale.setScalar(maxDim / 8);
        ground.position.y = -maxDim * 0.002;

        // Soft contact shadow to sit the model on the plinth.
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        const context = shadowCanvas.getContext("2d");
        if (context) {
          const gradient = context.createRadialGradient(
            256,
            256,
            10,
            256,
            256,
            250,
          );
          gradient.addColorStop(0, "rgba(42,39,37,0.34)");
          gradient.addColorStop(0.6, "rgba(42,39,37,0.14)");
          gradient.addColorStop(1, "rgba(42,39,37,0)");
          context.fillStyle = gradient;
          context.fillRect(0, 0, 512, 512);
          const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
          const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(maxDim * 1.55, maxDim * 1.4),
            new THREE.MeshBasicMaterial({
              map: shadowTexture,
              transparent: true,
              depthWrite: false,
              opacity: 0.75,
            }),
          );
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = 0.01;
          scene.add(shadow);
        }

        const resize = () => {
          if (!renderer || !mount) return;
          const width = mount.clientWidth;
          const height = mount.clientHeight;
          if (width === 0 || height === 0) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);

        controls.addEventListener("start", () => {
          if (controls) controls.autoRotate = false;
          if (resumeTimer) clearTimeout(resumeTimer);
        });
        controls.addEventListener("end", () => {
          if (resumeTimer) clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => {
            if (controls && !reduceMotion) controls.autoRotate = true;
          }, 6000);
        });        const clock = new THREE.Clock();
        const walkForward = new THREE.Vector3();
        const walkRight = new THREE.Vector3();
        let running = false;
        const tick = () => {
          if (cancelled || !renderer || !scene || !running) return;
          const delta = Math.min(clock.getDelta(), 0.05);
          if (!reduceMotion && root.scale.x < 1) {
            const next = Math.min(1, root.scale.x + delta * 0.28);
            root.scale.setScalar(next);
          }

          const walk = walkRef.current;
          if (walk?.active) {
            const keys = walk.keys;
            let forwardAmount = 0;
            let rightAmount = 0;
            if (keys.has("KeyW") || keys.has("ArrowUp")) forwardAmount += 1;
            if (keys.has("KeyS") || keys.has("ArrowDown")) forwardAmount -= 1;
            if (keys.has("KeyD") || keys.has("ArrowRight")) rightAmount += 1;
            if (keys.has("KeyA") || keys.has("ArrowLeft")) rightAmount -= 1;

            if (forwardAmount !== 0 || rightAmount !== 0) {
              camera.getWorldDirection(walkForward);
              walkForward.y = 0;
              walkForward.normalize();
              walkRight.crossVectors(walkForward, camera.up).normalize();
              const length = Math.hypot(forwardAmount, rightAmount) || 1;
              const distance = (walk.speed * delta) / length;
              const moveX =
                (walkForward.x * forwardAmount + walkRight.x * rightAmount) *
                distance;
              const moveZ =
                (walkForward.z * forwardAmount + walkRight.z * rightAmount) *
                distance;

              const canMove = (dx: number, dz: number) => {
                const moveLength = Math.hypot(dx, dz);
                if (moveLength < 0.0001 || walk.collision.length === 0) {
                  return true;
                }
                const direction = new THREE.Vector3(dx, 0, dz).normalize();
                walk.raycaster.set(camera.position, direction);
                walk.raycaster.far = moveLength + 0.16;
                return (
                  walk.raycaster.intersectObjects(walk.collision, true)
                    .length === 0
                );
              };

              if (canMove(moveX, moveZ)) {
                camera.position.x += moveX;
                camera.position.z += moveZ;
              } else if (canMove(moveX, 0)) {
                camera.position.x += moveX;
              } else if (canMove(0, moveZ)) {
                camera.position.z += moveZ;
              }
            }

            walk.doors.forEach((door) => {
              const target = door.open ? door.openAngle : 0;
              door.angle += (target - door.angle) * Math.min(1, delta * 8);
              door.pivot.rotation.y = door.angle;
            });

            let nearestDoor: DoorState | null = null;
            let nearestDistance = 3.2;
            walk.doors.forEach((door) => {
              door.pivot.getWorldPosition(door.position);
              const distance = camera.position.distanceTo(door.position);
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestDoor = door;
              }
            });
            const activeDoor = nearestDoor as DoorState | null;
            walk.nearestDoor = activeDoor;

            const promptKey = activeDoor
              ? `${activeDoor.label}-${activeDoor.locked}-${activeDoor.open}`
              : "none";
            if (promptKey !== walk.promptKey) {
              walk.promptKey = promptKey;
              setDoorPrompt(
                activeDoor
                  ? {
                      label: activeDoor.label,
                      state: activeDoor.locked
                        ? "Locked"
                        : activeDoor.open
                          ? "Open"
                          : "Closed",
                      action: activeDoor.locked
                        ? "Unlock"
                        : activeDoor.open
                          ? "Close"
                          : "Open",
                      lockAction: activeDoor.locked
                        ? "Unlock"
                        : activeDoor.open
                          ? "Close & lock"
                          : "Lock",
                    }
                  : null,
              );
            }

            camera.position.x = Math.min(
              walk.bounds.maxX,
              Math.max(walk.bounds.minX, camera.position.x),
            );
            camera.position.z = Math.min(
              walk.bounds.maxZ,
              Math.max(walk.bounds.minZ, camera.position.z),
            );
            camera.position.y = walk.eyeHeight;
          } else {
            controls?.update();
          }

          if (wrapRef.current) {
            wrapRef.current.dataset.cameraPosition = camera.position
              .toArray()
              .map((value) => value.toFixed(3))
              .join(",");
          }

          renderer.render(scene, camera);
          frame = requestAnimationFrame(tick);
        };
        const startLoop = () => {
          if (running || cancelled) return;
          running = true;
          clock.getDelta();
          frame = requestAnimationFrame(tick);
        };
        const stopLoop = () => {
          running = false;
          cancelAnimationFrame(frame);
        };

        // Keep the canvas idle while the tour is offscreen.
        visibility = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) startLoop();
            else stopLoop();
          },
          { rootMargin: "200px 0px" },
        );
        visibility.observe(mount);

        controls.update();
        startLoop();
        setStatus("ready");
      } catch (error) {
        console.error("3D tour failed to load", error);
        if (!cancelled) setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (resumeTimer) clearTimeout(resumeTimer);
      resizeObserver?.disconnect();
      visibility?.disconnect();
      if (walkKeyDown) document.removeEventListener("keydown", walkKeyDown);
      if (walkKeyUp) document.removeEventListener("keyup", walkKeyUp);
      if (walkBlur) window.removeEventListener("blur", walkBlur);
      if (pointerLockErrorHandler) {
        document.removeEventListener("pointerlockerror", pointerLockErrorHandler);
      }
      if (pointerControls?.isLocked) pointerControls.unlock();
      pointerControls?.dispose();
      pointerControls = null;
      walkRef.current = null;
      unlockScroll();
      controls?.dispose();
      nudgeRef.current = null;
      scene?.traverse((object) => {
        const mesh = object as import("three").Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      envTarget?.dispose();
      pmrem?.dispose();
      cube?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      renderer = null;
      scene = null;
      controls = null;
    };
  }, [activated, config.file, model]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!nudgeRef.current || walkRef.current?.active) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeRef.current(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeRef.current(1);
    }
  };

  const backToSite = () => {
    walkRef.current?.exit();
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      ref={wrapRef}
      data-status={status}
      data-model={model}
      data-walkthrough-active={walkActive ? "true" : undefined}
      tabIndex={0}
      role="group"
      aria-roledescription="3D model viewer"
      aria-label={`${config.alt} Drag to rotate, or use the arrow keys.`}
      onKeyDown={onKeyDown}
      className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#ded5c6] outline-offset-4 sm:aspect-[16/10] lg:aspect-[16/9]"
    >
      <Photo
        name={config.poster}
        alt=""
        sizes="(min-width: 1440px) 1360px, 100vw"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          status === "ready" ? "opacity-0" : "opacity-90"
        }`}
      />
      <div className="absolute inset-0 bg-[#e8e0d2]/35" />

      <div ref={mountRef} className="absolute inset-0" />

      {/* Crisp vignette so the warm palette holds together over the render. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(42,39,37,0.18)]"
      />

      {model === "apartment" && status === "ready" && !walkActive && (
        <div
          data-walkthrough-overlay
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#2a2725]/10 p-5"
        >
          <div className="max-w-[340px] rounded-[20px] border border-[#2a2725]/15 bg-[#f5f0e6]/95 px-5 py-5 text-center shadow-[0_24px_70px_rgba(42,39,37,0.24)] backdrop-blur-md">
            <p className="type-micro text-[#2a2725]/55">
              Residence 02 · Interior
            </p>
            <p className="mt-2 font-serif text-[2rem] leading-none text-[#2a2725]">
              Step inside.
            </p>
            <button
              type="button"
              data-walkthrough-start
              onClick={() => walkRef.current?.enter()}
              className="pointer-events-auto mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2a2725] px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-[#ede6d6] transition-colors duration-300 hover:bg-[#413c38]"
            >
              Click to look around
            </button>
            <p className="mt-3 text-[12px] leading-5 text-[#2a2725]/65">
              Living room, kitchen, two bedrooms and the terrace.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[#2a2725]/50">
              WASD / arrow keys to move · E doors · L lock · ESC unlock
            </p>
            <button
              type="button"
              data-walkthrough-back
              onClick={backToSite}
              className="pointer-events-auto mt-3 text-[11px] uppercase tracking-[0.12em] text-[#2a2725]/55 underline decoration-[#2a2725]/25 underline-offset-4 transition-colors hover:text-[#2a2725]"
            >
              Back to site
            </button>
          </div>
        </div>
      )}

      {model === "apartment" && status === "ready" && walkActive && (
        <>
          <div
            data-walkthrough-crosshair
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f0e6] shadow-[0_0_0_1px_rgba(42,39,37,0.45)]"
          />
          <div
            data-walkthrough-hint
            className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-[#2a2725]/70 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#ede6d6] backdrop-blur-md"
          >
            Press ESC to unlock cursor
          </div>
          <div
            data-walkthrough-controls
            aria-live="polite"
            className="pointer-events-none absolute bottom-20 left-1/2 z-30 w-[min(92%,380px)] -translate-x-1/2 rounded-[16px] border border-white/20 bg-[#2a2725]/78 px-4 py-3 text-center text-[#ede6d6] backdrop-blur-md"
          >
            {doorPrompt ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#ede6d6]/60">
                  {doorPrompt.state} · {doorPrompt.label}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.1em]">
                  <kbd className="rounded border border-white/30 px-1.5 py-0.5">E</kbd>{" "}
                  {doorPrompt.action}{" "}
                  <span className="px-1 text-white/35">/</span>{" "}
                  <kbd className="rounded border border-white/30 px-1.5 py-0.5">L</kbd>{" "}
                  {doorPrompt.lockAction}
                </p>
              </>
            ) : (
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#ede6d6]/75">
                WASD / arrows to move · E doors · L lock
              </p>
            )}
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 md:p-6">
        <span className="rounded-full border border-[#2a2725]/15 bg-[#f5f0e6]/80 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[#2a2725] backdrop-blur-md">
          {config.label}
        </span>
        <span className="hidden rounded-full border border-[#2a2725]/15 bg-[#f5f0e6]/80 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[#2a2725] backdrop-blur-md sm:block">
          1:100 study model · drag to explore
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-6">
        <div className="hidden flex-wrap gap-2 sm:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2725]/15 bg-[#f5f0e6]/85 px-3 py-2 text-[11px] uppercase tracking-[0.1em] text-[#2a2725] backdrop-blur-md">
            {/* Provided reference hint icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/svg/rotate-hint-icon.svg"
              alt=""
              className="h-3.5 w-3.5"
            />
            Drag to rotate
          </span>
        </div>
        <a
          href="#enquire"
          className="pointer-events-auto ml-auto inline-flex items-center gap-2 rounded-full bg-[#2a2725] px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-[#ede6d6] transition-colors duration-300 hover:bg-[#413c38]"
        >
          Enquire
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-[#e6ded0]/90 transition-opacity duration-500 ${
          status === "ready" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-live="polite"
        aria-hidden={status === "ready"}
      >
        {status === "error" ? (
          <div className="max-w-[320px] px-6 text-center">
            <p className="font-serif text-[2rem] leading-tight">
              The model is resting.
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[#2a2725]/70">
              The 3D tour could not load on this connection. The photography
              tells the same story.
            </p>
            <a href="#interiors" className="link-under mt-4 text-[14px]">
              Continue in pictures
            </a>
          </div>
        ) : (
          <div className="w-[220px] text-center">
            <p className="type-micro text-[#2a2725]/60">
              {config.label}
            </p>
            <p className="mt-3 font-serif text-[1.9rem] leading-none">
              Preparing the model
            </p>
            <div className="mx-auto mt-5 h-px w-full bg-[#2a2725]/15">
              <div
                className="h-px bg-[#3fa85b] transition-[width] duration-300"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[#2a2725]/50">
              {status === "idle" ? "Queued" : `${progress}%`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
