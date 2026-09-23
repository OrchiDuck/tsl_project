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

## Ajouter un projet

Dupliquez `projects/01-sphere`, renommez le dossier (`02-mon-projet`), changez le champ `name` de son `package.json` avec le même nom, puis relancez `npm install` à la racine.
