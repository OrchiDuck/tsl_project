# 03 — Instancing

Une grille de 10 000 cubes dessinée en **un seul draw call**, animée entièrement sur le GPU avec un compute shader TSL.

```bash
npm install
npm run dev
```

Tout est dans [src/main.js](src/main.js) :

- `instancedArray(maxCount, 'vec3')` : un buffer storage sur le GPU, une position par instance.
- `updateCompute` : un compute shader qui écrit chaque position à chaque frame (`instanceIndex` → case de la grille → hauteur d'une onde).
- `material.positionNode` : le vertex shader relit la position de son instance avec `positions.element(instanceIndex)`.
- `mesh.count` : nombre d'instances à dessiner avec ce seul mesh.

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
