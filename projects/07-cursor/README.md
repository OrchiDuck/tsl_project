# 07 — Cursor

Une traînée de 5 000 particules émises là où se trouve le curseur, simulées sur le GPU et dessinées en sprites.

```bash
npm install
npm run dev
```

Tout est dans [src/main.js](src/main.js) :

- `cursorPosition` : un `uniform` vec3 mis à jour à chaque frame en JS, avec un raycast de la souris sur le plan z = 0.
- `updateCompute` : quand une particule arrive en fin de vie, elle renaît autour de `cursorPosition`, puis dérive avec un vent (`mx_noise_vec3`) et monte doucement.
- `randomSphericalPosition` : un `Fn` avec des paramètres typés (`{ seed: 'uint', return: 'vec3' }`), qui devient une vraie fonction WGSL.
- `growAndShrink` : la taille apparaît puis disparaît avec la vie de la particule.

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
