import * as THREE from 'three/webgpu'
import { color, Fn, instancedArray, instanceIndex, mix, positionLocal, time, uniform, varying, vec2, vec3 } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0b10')

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(9, 7, 9)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const gui = new GUI({ title: 'Instancing' })

/**
 * Instances
 */
const size = 100
const count = size * size
const spacing = 10 / size

const amplitude = uniform(0.6)
const frequency = uniform(1.5)
const speed = uniform(2)

const positions = instancedArray(count, 'vec3')

const updateCompute = Fn(() => {
  const index = instanceIndex.toFloat()

  // On transforme un numéro (0 → 9999) en case d'une grille 100 × 100
  // Exemple suivi ligne par ligne : le cube n°250

  // Colonne = reste de la division par 100 (0 → 99)
  // 250 % 100 = 50
  const column = index.mod(size)

  // Rangée = division entière par 100 (0 → 99)
  // floor(250 / 100) = floor(2.5) = 2
  const row = index.div(size).floor()

  // Centrage : on retire 49.5 pour que les cases aillent de -49.5 à +49.5
  // au lieu de 0 à 99, le centre de la grille est alors à l'origine (0, 0)
  // colonne : 50 - 49.5 = 0.5   |   rangée : 2 - 49.5 = -47.5
  const centeredColumn = column.sub((size - 1) / 2)
  const centeredRow = row.sub((size - 1) / 2)

  // Chaque case fait 0.1 de large,
  // donc la grille fait 10 unités (-4.95 → +4.95)
  // x : 0.5 × 0.1 = 0.05   |   z : -47.5 × 0.1 = -4.75
  const x = centeredColumn.mul(spacing)
  const z = centeredRow.mul(spacing)

  // Onde circulaire qui part du centre
  //
  // vec2(x, z).length() → distance entre le cube et l'origine (0, 0), qui est
  //   le centre de la grille grâce au .sub((size - 1) / 2) plus haut.
  // .mul(frequency)     → plus la fréquence est grande, plus les cercles sont serrés
  // .sub(time.mul(speed)) → on retire le temps qui avance
  // .sin()              → transforme tout ça en vague qui oscille entre -1 et 1
  const wave = vec2(x, z).length().mul(frequency).sub(time.mul(speed)).sin()

  const height = wave.add(1).mul(amplitude).add(0.05)

  positions.element(instanceIndex).assign(vec3(x, height, z))
})().compute(count)

const instancePosition = positions.element(instanceIndex)

const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 })

material.positionNode = positionLocal
  .mul(vec3(spacing * 0.8, instancePosition.y, spacing * 0.8)) // Scale the cube according to the spacing
  .add(vec3(instancePosition.x, 0, instancePosition.z))
material.colorNode = mix(color('#1466ff'), color('#e43b3b'), varying(instancePosition.y.div(amplitude.mul(2)))) // Varying pour lire la position cote vertex!

const geometry = new THREE.BoxGeometry(1, 1, 1)
geometry.translate(0, 0.5, 0)

const mesh = new THREE.Mesh(geometry, material)
mesh.count = count
mesh.frustumCulled = false
scene.add(mesh)

// Debug
gui.add(amplitude, 'value', 0, 2, 0.01).name('amplitude')
gui.add(frequency, 'value', 0, 5, 0.01).name('frequency')
gui.add(speed, 'value', 0, 10, 0.01).name('speed')

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(3, 4, 2)
scene.add(directionalLight)
scene.add(new THREE.AmbientLight('#6b7cff', 0.6))

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
  renderer.compute(updateCompute)
  renderer.render(scene, camera)
})
