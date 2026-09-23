# 06 — Depth

Une piscine dont l'eau devient plus floue et plus colorée avec la profondeur, grâce à `linearDepth()` et `viewportLinearDepth`.

```bash
npm install
npm run dev
```

Tout est dans [src/main.js](src/main.js) :

- `linearDepth()` : profondeur de la surface de l'eau (le pixel qu'on est en train de dessiner), de 0 (near) à 1 (far).
- `viewportLinearDepth` : profondeur de ce qui a déjà été dessiné derrière (le fond, les objets opaques), lue dans le depth buffer.
- Leur différence × `(far - near)` = l'épaisseur d'eau traversée, en unités de la scène.
- `viewportMipTexture(screenUV, level)` : relit l'image de la scène opaque, avec un niveau de mipmap (donc de flou) qui dépend de cette épaisseur.
- Le menu `view` de lil-gui affiche chaque valeur en niveaux de gris.

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
