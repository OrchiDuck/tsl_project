# 01 — Sphère TSL

Point de départ : une scène Three.js rendue avec `WebGPURenderer` et une sphère dont la couleur est écrite en TSL.

```bash
npm install
npm run dev
```

Tout se passe dans [src/main.js](src/main.js) : la couleur est définie par `material.colorNode`, un graphe de nœuds TSL (ici un dégradé animé avec `time` + un effet fresnel via `normalView`).

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
