import * as THREE from 'three/webgpu'
import {
  cameraFar,
  cameraNear,
  color,
  linearDepth,
  mix,
  positionWorld,
  screenUV,
  select,
  smoothstep,
  uniform,
  vec3,
  viewportLinearDepth,
  viewportMipTexture,
} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
const skyColor = new THREE.Color('#bfe3f0')

const scene = new THREE.Scene()
scene.background = skyColor
scene.fog = new THREE.Fog(skyColor, 18, 38)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 40)
camera.position.set(9, 5, 11)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, -0.5, 0)
controls.maxPolarAngle = Math.PI * 0.46
controls.enableDamping = true

const gui = new GUI({ title: 'Depth' })

/**
 * Terrain
 */
const getHeight = (x, z) => {
  const distance = Math.hypot(x, z)
  return 5.1 * Math.exp(-((distance / 5) ** 2)) - 4
}

const terrainGeometry = new THREE.PlaneGeometry(40, 40, 128, 128)
terrainGeometry.rotateX(-Math.PI * 0.5)
const terrainPositions = terrainGeometry.attributes.position
for (let i = 0; i < terrainPositions.count; i++) {
  terrainPositions.setY(i, getHeight(terrainPositions.getX(i), terrainPositions.getZ(i)))
}
terrainGeometry.computeVertexNormals()

const height = positionWorld.y
const sand = mix(color('#7d6a4f'), color('#f1d9a8'), smoothstep(-3.5, -0.1, height))
const grass = color('#7fae4e')

const terrainMaterial = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 })
terrainMaterial.colorNode = mix(sand, grass, smoothstep(0.45, 0.6, height))

scene.add(new THREE.Mesh(terrainGeometry, terrainMaterial))

/**
 * Rocks
 */
const rockMaterial = new THREE.MeshStandardNodeMaterial({ color: '#8a8f99', roughness: 0.9, flatShading: true })
const rockGeometry = new THREE.IcosahedronGeometry(1, 0)
for (let i = 0; i < 9; i++) {
  const angle = i * 2.4 + 0.5
  const distance = 3 + (i % 4) * 1.4
  const x = Math.cos(angle) * distance
  const z = Math.sin(angle) * distance
  const rock = new THREE.Mesh(rockGeometry, rockMaterial)
  rock.scale.set(0.5 + (i % 3) * 0.25, 0.4 + (i % 2) * 0.5, 0.6)
  rock.rotation.set(i, i * 0.7, 0)
  rock.position.set(x, getHeight(x, z) + 0.1, z)
  scene.add(rock)
}

/**
 * Water
 */
const maxDepth = uniform(3)
const blur = uniform(5)
const absorption = uniform(0.8)
const shallowColor = uniform(color('#3fd6c9'))
const deepColor = uniform(color('#0b3f63'))
const debugView = uniform(0, 'int')

// linearDepth() → profondeur du pixel qu'on est en train de dessiner, ici la surface de l'eau.
// Calculée depuis la position du fragment, puis rendue linéaire : 0 au plan near, 1 au plan far.
const surfaceDepth = linearDepth()

// viewportLinearDepth → profondeur de ce qui est DÉJÀ dessiné derrière l'eau (fond, rochers),
// lue dans le depth buffer puis rendue linéaire (0 → 1) comme linearDepth().
const sceneDepth = viewportLinearDepth

// Fond - surface = quantité d'eau traversée, en fraction de (far - near).
// × (far - near) → on repasse en unités de la scène (1 = 1 mètre d'eau).
// .max(0) → évite une épaisseur négative due aux imprécisions du depth buffer au contact des objets.
const thickness = sceneDepth.sub(surfaceDepth).mul(cameraFar.sub(cameraNear)).max(0)

// Épaisseur ramenée entre 0 (pas d'eau) et 1 (maxDepth mètres d'eau ou plus) : pilote tout l'effet
const depthFactor = thickness.div(maxDepth).clamp(0, 1)

// viewportMipTexture → copie de l'image déjà rendue (la scène opaque), avec ses mipmaps :
// des versions de plus en plus petites, donc de plus en plus floues, de cette image.
// screenUV → on lit le pixel qui est juste derrière l'eau à l'écran.
// Le 2e paramètre choisit le niveau de mipmap : plus l'eau est épaisse, plus on lit un niveau flou.
const backdrop = viewportMipTexture(screenUV, depthFactor.mul(blur)).rgb

// Couleur de l'eau : turquoise en eau peu profonde, bleu foncé en eau profonde
const tint = mix(shallowColor, deepColor, depthFactor)

// Le fond flou, légèrement teinté en turquoise, disparaît peu à peu dans la couleur de l'eau avec la profondeur
const waterFinal = mix(backdrop.mul(mix(vec3(1), shallowColor, 0.5)), tint, depthFactor.mul(absorption))

// transparent: true → l'eau est dessinée après les objets opaques, sinon depth buffer et image seraient vides
const waterMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true })

// Menu "view" de lil-gui : affiche une étape du calcul en niveaux de gris, ou le rendu final
waterMaterial.colorNode = select(
  debugView.equal(1),
  vec3(surfaceDepth),
  select(
    debugView.equal(2),
    vec3(sceneDepth),
    select(debugView.equal(3), vec3(depthFactor), waterFinal)
  )
)

const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), waterMaterial)
water.rotation.x = -Math.PI * 0.5
scene.add(water)

// Debug
gui.add(debugView, 'value', { final: 0, linearDepth: 1, viewportLinearDepth: 2, depthFactor: 3 }).name('view')
gui.add(maxDepth, 'value', 0.1, 10, 0.01).name('maxDepth')
gui.add(blur, 'value', 0, 10, 0.01).name('blur')
gui.add(absorption, 'value', 0, 1, 0.01).name('absorption')
gui.addColor(shallowColor, 'value').name('shallowColor')
gui.addColor(deepColor, 'value').name('deepColor')

/**
 * Lights
 */
const sun = new THREE.DirectionalLight('#fff1d6', 3)
sun.position.set(6, 8, 3)
scene.add(sun)
scene.add(new THREE.HemisphereLight(skyColor, '#6b5a3a', 1.2))

/**
 * Resize & loop
 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
