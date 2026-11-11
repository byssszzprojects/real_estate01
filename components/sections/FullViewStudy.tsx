"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/site/Photo";

const STAGE_EVENT = "zara:stage";
const HANDOFF_EVENT = "zara:study-handoff";

const STAGES = [
  {
    id: "overview",
    title: "Full View",
    subtitle: "Complete building overview",
    nodes: [] as string[],
    material: "original",
  },
  {
    id: "walls",
    title: "Walls",
    subtitle: "Reinforced concrete shell",
    nodes: ["walls", "outerwalls"],
    material: "walls",
  },
  {
    id: "floor",
    title: "Floor",
    subtitle: "Honed Carrara white finish",
    nodes: ["floor"],
    material: "floor",
  },
  {
    id: "roof",
    title: "Roof",
    subtitle: "Insulated flat roof system",
    nodes: ["outerroof", "toproof", "floor"],
    material: "roof",
  },
  {
    id: "pillars",
    title: "Pillars",
    subtitle: "Structural load-bearing columns",
    nodes: ["pillers"],
    material: "pillars",
  },
  {
    id: "stairs",
    title: "Stairs",
    subtitle: "Oak-finished staircase",
    nodes: ["stairs", "stairmainframe", "stairsframe"],
    material: "stairs",
  },
  {
    id: "glazing",
    title: "Windows & Doors",
    subtitle: "Chrome-framed glazing",
    nodes: ["doorandwindowframe", "windowframe", "windowandroofglass"],
    material: "frames",
  },
] as const;

type StudyHandle = {
  setStage: (index: number) => void;
  nudge: (direction: number) => void;
};

type StudyItem = {
  mesh: import("three").Mesh;
  names: string[];
  original: import("three").Material | import("three").Material[];
  edges: import("three").LineSegments | null;
};

const ARCHITECTURAL_NODES = new Set([
  "floor",
  "outerroof",
  "toproof",
  "outerwalls",
  "walls",
  "pillers",
  "stairs",
  "stairmainframe",
  "stairsframe",
  "windowandroofglass",
  "windowframe",
  "doorandwindowframe",
]);

const STAGE_VIEWS = [
  { direction: [0.55, 0.18, 1], factor: 0.95, target: "full" },
  { direction: [0.62, 0.42, 1], factor: 1.0, target: "full" },
  { direction: [0.4, 0.68, 0.9], factor: 1.15, target: "full" },
  { direction: [0.4, 0.72, 0.9], factor: 1.08, target: "full" },
  { direction: [0.7, 0.3, 1], factor: 0.95, target: "full" },
  { direction: [0.62, 0.42, 1], factor: 0.8, target: "stairs" },
  { direction: [0.62, 0.42, 1], factor: 0.9, target: "full" },
] as const;

const SITE_NODE_NAMES = new Set(["bushes", "Object_49", "Object_9"]);
const SITE_MATERIAL_NAMES = ["GRASS", "GOLDEN_BEIGE"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function FullViewStudy() {
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<StudyHandle | null>(null);
  const activeRef = useRef(0);
  const stageActiveRef = useRef(false);

  const [active, setActive] = useState(0);
  const [activated, setActivated] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState(0);

  const stage = STAGES[active];

  useEffect(() => {
    const target = stageRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const stageHeight = stageRef.current?.offsetHeight ?? window.innerHeight;
      const total = Math.max(1, wrap.offsetHeight - stageHeight);
      const rect = wrap.getBoundingClientRect();
      const scrolled = clamp(-rect.top, 0, total);
      const fraction = scrolled / total;
      const index = Math.min(
        STAGES.length - 1,
        Math.floor(fraction * STAGES.length),
      );

      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${fraction})`;
      }
      if (dotRef.current) {
        dotRef.current.style.left = `${fraction * 100}%`;
      }

      const isStageActive = rect.top <= 80 && rect.bottom > 80;
      if (isStageActive !== stageActiveRef.current) {
        stageActiveRef.current = isStageActive;
        window.dispatchEvent(
          new CustomEvent(STAGE_EVENT, {
            detail: { active: isStageActive },
          }),
        );
      }
    };

    const requestSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    void document.fonts?.ready.then(requestSync);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      if (stageActiveRef.current) {
        window.dispatchEvent(
          new CustomEvent(STAGE_EVENT, { detail: { active: false } }),
        );
      }
    };
  }, []);

  useEffect(() => {
    if (status === "ready") modelRef.current?.setStage(active);
  }, [active, status]);

  useEffect(() => {
    if (!activated) return;

    let cancelled = false;
    let frame = 0;
    let running = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null =
      null;
    let resizeObserver: ResizeObserver | null = null;
    let visibility: IntersectionObserver | null = null;
    let reduceMotion = false;
    let handle: StudyHandle | null = null;
    let handoffProgress = 0;

    // The scroll handoff publishes how far it has travelled; the camera reads
    // that once per frame while it is approaching.
    const onHandoff = (event: Event) => {
      const detail = (event as CustomEvent<{ progress?: number }>).detail;
      handoffProgress =
        typeof detail?.progress === "number"
          ? clamp(detail.progress, 0, 1)
          : 0;
    };
    window.addEventListener(HANDOFF_EVENT, onHandoff);

    const run = async () => {
      setStatus("loading");
      setProgress(0);

      try {
        const THREE = await import("three");
        const [{ OrbitControls }, { GLTFLoader }, { DRACOLoader }] =
          await Promise.all([
            import("three/examples/jsm/controls/OrbitControls.js"),
            import("three/examples/jsm/loaders/GLTFLoader.js"),
            import("three/examples/jsm/loaders/DRACOLoader.js"),
          ]);

        if (cancelled) return;
        const mount = mountRef.current;
        const stageNode = stageRef.current;
        if (!mount || !stageNode) return;

        reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.88;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        mount.replaceChildren(renderer.domElement);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100000);
        camera.position.set(4, 3, 6);

        const hemi = new THREE.HemisphereLight(0xdcefff, 0x30506a, 0.5);
        scene.add(hemi);

        const key = new THREE.DirectionalLight(0xfff4e4, 2.4);
        key.position.set(-8, 14, 9);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.bias = -0.0003;
        scene.add(key);

        const fill = new THREE.DirectionalLight(0xbddcf2, 0.55);
        fill.position.set(9, 5, -7);
        scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.7);
        rim.position.set(-3, 8, -12);
        scene.add(rim);

        // Use the supplied sky cube as image-based light; the CSS sky stays
        // behind the transparent canvas.
        let cube: import("three").CubeTexture | null = null;
        let pmrem: import("three").PMREMGenerator | null = null;
        let envTarget: import("three").WebGLRenderTarget | null = null;

        try {
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
          // The supplied sky cube is the visible background as well as the
          // light probe, so the stage shows a cloudy sky for one extra draw.
          scene.background = cube;
          pmrem = new THREE.PMREMGenerator(renderer);
          envTarget = pmrem.fromCubemap(cube);
          scene.environment = envTarget.texture;
          scene.environmentIntensity = 0.4;
        } catch {
          // Image-based light is optional; the three lights still carry it.
        }

        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        loader.setDRACOLoader(draco);

        const gltf = await loader.loadAsync("/models/vill_draco.glb", (event) => {
          if (cancelled) return;
          if (event.total > 0) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        if (cancelled) return;

        const root = gltf.scene;
        const items: StudyItem[] = [];
        const siteMeshes: import("three").Object3D[] = [];

        root.traverse((child) => {
          const mesh = child as import("three").Mesh;
          if (!mesh.isMesh) return;

          const names: string[] = [];
          let parent: import("three").Object3D | null = mesh;
          while (parent) {
            if (parent.name) names.push(parent.name);
            parent = parent.parent;
          }

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          const materialNames = materials.map((material) =>
            ((material as import("three").MeshStandardMaterial).name || "").toUpperCase(),
          );

          if (
            names.some((name) => SITE_NODE_NAMES.has(name)) ||
            materialNames.some((name) =>
              SITE_MATERIAL_NAMES.some((site) => name.includes(site)),
            )
          ) {
            siteMeshes.push(mesh);
            return;
          }

          materials.forEach((material) => {
            const standard = material as import("three").MeshStandardMaterial;
            const name = (standard?.name || "").toUpperCase();
            if (name.includes("VERMILION")) {
              standard.color.set(0x46545d);
              standard.needsUpdate = true;
            }
          });

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;

          const architectural = names.some((name) =>
            ARCHITECTURAL_NODES.has(name),
          );
          let edges: import("three").LineSegments | null = null;

          if (architectural) {
            edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(mesh.geometry, 28),
              new THREE.LineBasicMaterial({
                color: 0xeaf7ff,
                transparent: true,
                opacity: 0.16,
                depthWrite: false,
              }),
            );
            edges.visible = false;
            edges.renderOrder = 2;
            mesh.add(edges);
          }

          items.push({
            mesh,
            names,
            original: mesh.material,
            edges,
          });
        });

        siteMeshes.forEach((mesh) => mesh.removeFromParent());

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;
        scene.add(root);

        const targetY = size.y * 0.36;
        const fullTarget = new THREE.Vector3(0, targetY, 0);
        const radius = size.length() / 2;
        camera.fov = 35;
        camera.near = maxDim / 1000;
        camera.far = maxDim * 40;

        const fitDistance =
          radius / Math.sin((camera.fov * Math.PI) / 180 / 2);
        const aspect = mount.clientWidth / (mount.clientHeight || 1);
        const aspectScale =
          aspect < 0.8 ? 2 : aspect < 1.15 ? 1.55 : aspect < 1.5 ? 1.15 : 1;
        const direction = new THREE.Vector3(0.55, 0.18, 1).normalize();

        camera.position
          .copy(
            direction.multiplyScalar(
              fitDistance * STAGE_VIEWS[0].factor * aspectScale,
            ),
          )
          .add(fullTarget);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        key.position.set(-maxDim * 0.62, maxDim * 1.1, maxDim * 0.72);
        key.shadow.normalBias = maxDim * 0.0014;
        key.shadow.camera.left = -maxDim * 0.75;
        key.shadow.camera.right = maxDim * 0.75;
        key.shadow.camera.top = maxDim * 0.75;
        key.shadow.camera.bottom = -maxDim * 0.75;
        key.shadow.camera.near = maxDim * 0.01;
        key.shadow.camera.far = maxDim * 5;
        key.shadow.camera.updateProjectionMatrix();

        // A soft grounded shadow only for the complete overview; the layer
        // studies float over the sky like a drawing.
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        const context = shadowCanvas.getContext("2d");
        let shadow: import("three").Mesh | null = null;
        if (context) {
          const gradient = context.createRadialGradient(
            256,
            256,
            12,
            256,
            256,
            250,
          );
          gradient.addColorStop(0, "rgba(5, 26, 43, 1)");
          gradient.addColorStop(0.55, "rgba(5, 26, 43, 0.34)");
          gradient.addColorStop(1, "rgba(5, 26, 43, 0)");
          context.fillStyle = gradient;
          context.fillRect(0, 0, 512, 512);
          shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(size.x * 1.3, size.z * 1.3),
            new THREE.MeshBasicMaterial({
              map: new THREE.CanvasTexture(shadowCanvas),
              transparent: true,
              depthWrite: false,
              opacity: 0.25,
            }),
          );
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = -maxDim * 0.001;
          shadow.renderOrder = 1;
          scene.add(shadow);
        }

        const ghostMaterial = new THREE.MeshBasicMaterial({
          color: 0xd8edf9,
          transparent: true,
          opacity: 0.05,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const ghostEdgeMaterial = new THREE.LineBasicMaterial({
          color: 0xdaf1ff,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        });
        const modelEdgeMaterial = new THREE.LineBasicMaterial({
          color: 0x6d889b,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        });
        const highlightEdgeMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
        });

        const materials = {
          walls: new THREE.MeshStandardMaterial({
            color: 0xd3e1ea,
            roughness: 0.92,
            metalness: 0,
            transparent: true,
            opacity: 0.78,
            depthWrite: true,
            side: THREE.DoubleSide,
          }),
          floor: new THREE.MeshStandardMaterial({
            color: 0xf4f0e7,
            roughness: 0.86,
            metalness: 0,
          }),
          roof: new THREE.MeshStandardMaterial({
            color: 0xbea78d,
            roughness: 0.94,
            metalness: 0,
          }),
          pillars: new THREE.MeshStandardMaterial({
            color: 0xc09a67,
            roughness: 0.86,
            metalness: 0,
          }),
          stairs: new THREE.MeshStandardMaterial({
            color: 0xb56f36,
            roughness: 0.78,
            metalness: 0,
            emissive: 0x2a1406,
            emissiveIntensity: 0.3,
          }),
          frames: new THREE.MeshStandardMaterial({
            color: 0x3e4549,
            roughness: 0.5,
            metalness: 0.35,
          }),
          glass: new THREE.MeshPhysicalMaterial({
            color: 0xbad8e6,
            roughness: 0.08,
            metalness: 0,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        };

        const applyStage = (index: number) => {
          const current = STAGES[index];
          const layer = index > 0;

          items.forEach((item) => {
            item.mesh.castShadow = !layer;
            item.mesh.receiveShadow = !layer;

            if (!layer) {
              item.mesh.visible = true;
              item.mesh.material = item.original;
              if (item.edges) {
                item.edges.visible = true;
                item.edges.material = modelEdgeMaterial;
              }
              return;
            }

            const selected = current.nodes.some((name) =>
              item.names.includes(name),
            );

            item.mesh.visible = true;
            if (item.edges) item.edges.visible = true;

            if (selected) {
              item.mesh.material =
                current.material === "frames" &&
                item.names.includes("windowandroofglass")
                  ? materials.glass
                  : materials[current.material as keyof typeof materials];
              if (item.edges) item.edges.material = highlightEdgeMaterial;
            } else {
              item.mesh.material = ghostMaterial;
              if (item.edges) item.edges.material = ghostEdgeMaterial;
            }
          });

          if (shadow) {
            // The grounding disc belongs to the full overview only; the layer
            // studies read as x-ray drawings and stay free of it.
            const disc = shadow.material as import("three").MeshBasicMaterial;
            disc.opacity = layer ? 0 : 0.25;
            shadow.visible = !layer;
          }
        };

        const placedBox = new THREE.Box3().setFromObject(root);
        const stageBoxes = STAGES.map((item) => {
          if (item.nodes.length === 0) return placedBox.clone();
          const stageBox = new THREE.Box3();
          items.forEach((entry) => {
            if (item.nodes.some((name) => entry.names.includes(name))) {
              stageBox.expandByObject(entry.mesh);
            }
          });
          return stageBox.isEmpty() ? placedBox.clone() : stageBox;
        });
        const stairTarget = stageBoxes[5].getCenter(new THREE.Vector3());

        let cameraTween: {
          fromPosition: import("three").Vector3;
          toPosition: import("three").Vector3;
          fromTarget: import("three").Vector3;
          toTarget: import("three").Vector3;
          start: number;
          duration: number;
        } | null = null;

        controls = new OrbitControls(camera, renderer.domElement);
        // OrbitControls disables touch actions when it connects; restore vertical
        // page scrolling so the pinned section never becomes a touch trap.
        renderer.domElement.style.touchAction = "pan-y";
        controls.cursorStyle = "grab";
        controls.target.copy(fullTarget);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minPolarAngle = 0.2;
        controls.maxPolarAngle = Math.PI / 2 - 0.03;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.34;
        controls.rotateSpeed = 0.55;
        controls.update();

        const frameStage = (index: number, immediate = false) => {
          if (!camera || !controls) return;
          const view = STAGE_VIEWS[index];
          const target =
            view.target === "stairs"
              ? fullTarget.clone().lerp(stairTarget, 0.45)
              : fullTarget.clone();
          const viewDirection = new THREE.Vector3(...view.direction).normalize();
          const position = target
            .clone()
            .add(
              viewDirection.multiplyScalar(
                fitDistance * view.factor * aspectScale,
              ),
            );

          if (immediate || reduceMotion) {
            camera.position.copy(position);
            controls.target.copy(target);
            controls.update();
            cameraTween = null;
            return;
          }

          cameraTween = {
            fromPosition: camera.position.clone(),
            toPosition: position,
            fromTarget: controls.target.clone(),
            toTarget: target,
            start: performance.now(),
            duration: 900,
          };
          controls.autoRotate = false;
        };

        handle = {
          setStage: (index: number) => {
            const next = clamp(index, 0, STAGES.length - 1);
            applyStage(next);
            frameStage(next);
          },
          nudge: (direction: number) => {
            if (!controls || !camera) return;
            cameraTween = null;
            const offset = camera.position.clone().sub(controls.target);
            const spherical = new THREE.Spherical().setFromVector3(offset);
            spherical.theta += direction * (Math.PI / 18);
            offset.setFromSpherical(spherical);
            camera.position.copy(controls.target).add(offset);
            controls.autoRotate = false;
            controls.update();
          },
        };
        modelRef.current = handle;
        applyStage(activeRef.current);
        frameStage(activeRef.current, true);

        const resize = () => {
          if (!renderer || !mount || !camera) return;
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
          cameraTween = null;
          if (controls) controls.autoRotate = false;
        });

        const clock = new THREE.Clock();
        const tick = () => {
          if (cancelled || !renderer || !scene || !camera || !running) return;
          clock.getDelta();

          if (cameraTween && controls) {
            const elapsed = (performance.now() - cameraTween.start) / cameraTween.duration;
            const t = clamp(elapsed, 0, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            camera.position.lerpVectors(
              cameraTween.fromPosition,
              cameraTween.toPosition,
              eased,
            );
            controls.target.lerpVectors(
              cameraTween.fromTarget,
              cameraTween.toTarget,
              eased,
            );
            if (t >= 1) {
              cameraTween = null;
              if (!reduceMotion) controls.autoRotate = true;
            }
          }

          controls?.update();

          // The scroll handoff nudges the camera toward the model. The offset
          // is applied for this frame only, so OrbitControls and the stage
          // tweens never see it and cannot drift.
          const restingPosition =
            handoffProgress > 0 && !cameraTween
              ? camera.position.clone()
              : null;
          if (restingPosition && controls) {
            camera.position.lerp(controls.target, 0.045 * handoffProgress);
          }

          renderer.render(scene, camera);

          if (restingPosition) camera.position.copy(restingPosition);
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

        visibility = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) startLoop();
            else stopLoop();
          },
          { rootMargin: "200px 0px" },
        );
        visibility.observe(stageNode);

        startLoop();
        setStatus("ready");
      } catch (error) {
        console.error("Full view study failed to load", error);
        if (!cancelled) setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener(HANDOFF_EVENT, onHandoff);
      resizeObserver?.disconnect();
      visibility?.disconnect();
      controls?.dispose();
      modelRef.current = null;

      if (handle) {
        // Handles hold no GPU resources themselves; the scene traversal below
        // disposes every geometry and material actually used.
      }

      const geometries = new Set<import("three").BufferGeometry>();
      const materials = new Set<import("three").Material>();
      scene?.traverse((object) => {
        const mesh = object as import("three").Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => materials.add(item));
        else if (material) materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());

      scene = null;
      camera = null;
      controls = null;
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      renderer = null;
    };
  }, [activated]);

  const goToStage = (index: number) => {
    const wrap = wrapRef.current;
    const stageNode = stageRef.current;
    if (!wrap || !stageNode) return;

    const total = Math.max(1, wrap.offsetHeight - stageNode.offsetHeight);
    // Aim just inside the requested stage so the index resolves correctly.
    const top = wrap.offsetTop + (index / STAGES.length) * total + 2;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!modelRef.current) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      modelRef.current.nudge(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      modelRef.current.nudge(1);
    }
  };

  return (
    <section
      id="full-view"
      ref={wrapRef}
      aria-labelledby="fullview-title"
      className="relative bg-[#0d3049] text-white"
      style={{ height: "calc(100svh + 6 * 62svh)" }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] overflow-hidden"
      >
        <div aria-hidden="true" className="stage-sky absolute inset-0" />

        <div data-study-canvas className="absolute inset-0">
          <div
            ref={mountRef}
            tabIndex={0}
            role="group"
            aria-roledescription="3D model"
            aria-label="Villa structure study. Drag to rotate, or use the arrow keys. Scroll to move through walls, floor, roof, pillars, stairs, and glazing."
            onKeyDown={onKeyDown}
            className={`absolute inset-0 cursor-grab outline-offset-[-6px] transition-opacity duration-700 ${
              status === "ready" ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* A quiet vignette keeps the labels legible over the sky. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,transparent_30%,rgba(4,24,39,0.28)_100%)]"
        />

        <div className="pointer-events-auto absolute right-4 top-1/2 z-10 -translate-y-1/2 md:right-8">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20"
          />
          <div className="relative flex flex-col items-center gap-1 md:gap-3">
            {STAGES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStage(index)}
                aria-label={`Show ${item.title}`}
                aria-pressed={index === active}
                className="group relative flex h-8 w-8 items-center justify-center rounded-full md:h-5 md:w-5"
              >
                <span
                  className={`block rounded-full border transition-all duration-300 ${
                    index === active
                      ? "h-2.5 w-2.5 border-white bg-white"
                      : "h-1.5 w-1.5 border-white/35 bg-[#0d3049]/40 group-hover:border-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 md:p-8 lg:p-10">
          <div className="flex items-end justify-between gap-6">
            <div key={stage.id} className="stage-label min-w-0">
              <p className="type-micro mb-2 text-white/65">Structure</p>
              <h2
                id="fullview-title"
                className="max-w-[12ch] text-balance text-[clamp(2.35rem,5.4vw,4.9rem)] font-medium leading-[0.92] tracking-[-0.045em]"
              >
                {stage.title}
              </h2>
              <p className="type-micro mt-3 max-w-[44ch] text-white/70">
                {stage.subtitle}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[clamp(4rem,10.5vw,9.5rem)] font-medium leading-[0.72] tracking-[-0.07em]">
                {String(active + 1).padStart(2, "0")}
              </p>
              <p className="type-micro mt-3 text-white/60">of 07</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 md:mt-8">
            <div className="relative h-px flex-1 bg-white/25">
              <div
                ref={fillRef}
                className="absolute inset-0 origin-left bg-white/85"
                style={{ transform: "scaleX(0)" }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 flex justify-between"
              >
                {STAGES.map((item) => (
                  <span key={item.id} className="h-2 w-px bg-white/30" />
                ))}
              </div>
              <div
                ref={dotRef}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.12)]"
                style={{ left: "0%" }}
              />
            </div>
            <p className="type-micro hidden shrink-0 text-white/60 sm:block">
              Scroll to inspect
            </p>
          </div>

          <p className="type-micro mt-4 flex items-center gap-2 text-white/60 sm:hidden">
            <img
              src="/svg/rotate-hint-icon.svg"
              alt=""
              className="h-3.5 w-3.5 invert"
            />
            Drag to rotate
          </p>
        </div>

        <div
          aria-live="polite"
          aria-hidden={status === "ready"}
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
            status === "ready" ? "opacity-0" : "opacity-100"
          }`}
        >
          {status === "error" ? (
            <div className="pointer-events-auto relative w-full max-w-[420px] overflow-hidden rounded-lg bg-[#0d3049]/70 px-6 py-8 text-center backdrop-blur-sm">
              <div className="absolute inset-0 -z-10 opacity-20">
                <Photo
                  name="patio-front-clean"
                  alt=""
                  sizes="420px"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="font-serif text-[2.2rem] leading-[1.02]">
                The model is resting.
              </p>
              <p className="mt-3 text-[14px] leading-6 text-white/75">
                This connection could not load the structure. The photography
                below tells the same story.
              </p>
              <a href="#architecture" className="link-under mt-5 text-[13px] text-white">
                Continue in photographs
              </a>
            </div>
          ) : (
            <div className="w-[210px] text-center text-[#17384f]">
              <p className="type-micro opacity-70">Residence 03</p>
              <p className="mt-3 font-serif text-[1.8rem] leading-none">
                Preparing the structure
              </p>
              <div className="mx-auto mt-5 h-px w-full bg-[#17384f]/20">
                <div
                  className="h-px bg-[#17384f]/70 transition-[width] duration-300"
                  style={{ width: `${Math.max(progress, 4)}%` }}
                />
              </div>
              <p className="type-micro mt-3 opacity-60">
                {status === "idle" ? "Queued" : `${progress}%`}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
