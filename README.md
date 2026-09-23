# Gobelins — Day 2

Une série de mini-projets [Three.js](https://threejs.org) utilisant le `WebGPURenderer` et TSL (Three Shading Language). Chaque dossier de `projects/` est un projet Vite autonome.

## Prérequis

- Node.js 20 ou plus (`nvm use` si vous utilisez nvm)
- Un navigateur récent (Chrome / Edge / Safari 26+ pour WebGPU ; sinon fallback WebGL 2 automatique)

## Démarrer

```bash
git clone <url-du-repo>
cd gobelin-day-2
npm install           # installe les dépendances de tous les projets
npm run dev 01-sphere # lance un projet
```

Ou, depuis le dossier d'un projet :

```bash
cd projects/01-sphere
npm run dev
```

## Projets

| Dossier | Contenu |
| --- | --- |
| [01-sphere](projects/01-sphere) | Template de base : `WebGPURenderer` + sphère avec un matériau TSL |
| [02-chromatic-aberration](projects/02-chromatic-aberration) | Post-process : aberration chromatique custom (`TempNode`) réglable avec lil-gui |
| [03-instancing](projects/03-instancing) | Instancing : grille de cubes animée par un compute shader (`instancedArray` + `instanceIndex`) |
| [04-sprites](projects/04-sprites) | Sprites : nuage de particules flottantes (`SpriteNodeMaterial` + `range`) |
| [05-gpgpu](projects/05-gpgpu) | GPGPU : fontaine de particules (buffers position/vitesse/vie, compute d'init + d'update, respawn) |
| [06-depth](projects/06-depth) | Profondeur : eau floue et teintée selon l'épaisseur (`linearDepth` vs `viewportLinearDepth`) |

## Ajouter un projet

Dupliquez `projects/01-sphere`, renommez le dossier (`02-mon-projet`), changez le champ `name` de son `package.json` avec le même nom, puis relancez `npm install` à la racine.
