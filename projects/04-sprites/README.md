# 04 — Sprites

Un nuage de 2 000 particules qui flottent, dessiné en **un seul draw call** avec `SpriteNodeMaterial`.

```bash
npm install
npm run dev
```

Tout est dans [src/main.js](src/main.js) :

- `SpriteNodeMaterial` + `THREE.Sprite` : des carrés toujours tournés vers la caméra.
- `sprite.count` : nombre de sprites à dessiner, comme `mesh.count` pour l'instancing.
- `range(min, max)` : une valeur aléatoire par instance (position, taille, décalage de l'animation).
- `positionNode` (centre du sprite), `scaleNode` (taille), `colorNode` et `opacityNode` (disque flou).

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
