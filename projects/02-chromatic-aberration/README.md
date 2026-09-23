# 02 — Aberration chromatique

Post-process TSL : la scène est rendue dans une texture (`pass`), puis un nœud custom décale les canaux rouge / vert / bleu pour imiter les franges colorées d'une lentille.

```bash
npm install
npm run dev
```

- [src/ChromaticAberrationNode.js](src/ChromaticAberrationNode.js) : le nœud (`TempNode`). Il lit le rouge décalé vers l'extérieur, le vert à sa place et le bleu décalé vers l'intérieur ; le décalage grandit en s'éloignant du centre.
- [src/main.js](src/main.js) : scène, `RenderPipeline`, bloom sélectif via MRT (seuls les piliers écrivent `bloomIntensity`) et réglages lil-gui.

Docs : [TSL](https://threejs.org/docs/#manual/en/introduction/Three-Shading-Language) · [exemples WebGPU](https://threejs.org/examples/?q=webgpu)
