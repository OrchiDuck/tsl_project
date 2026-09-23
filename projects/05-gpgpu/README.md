# 05 — GPGPU

Une fontaine de 20 000 particules simulées entièrement sur le GPU (GPGPU) et dessinées en sprites.

```bash
npm install
npm run dev
```

Tout est dans [src/main.js](src/main.js) :

- `positions`, `velocities`, `lives` : trois `instancedArray` qui gardent l'état des particules d'une frame à l'autre.
- `initCompute` : lancé une seule fois, donne à chaque particule une vie négative aléatoire pour étaler les naissances.
- `updateCompute` : à chaque frame, la vie avance avec `deltaTime`. À 1, la particule renaît à la source (`If` + `hash` re-tiré), sinon gravité → vitesse → position, avec un rebond au sol.
- Le `SpriteNodeMaterial` relit les buffers : position, taille qui diminue avec la vie, couleur selon la vie.

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
