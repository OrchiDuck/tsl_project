import * as THREE from 'three/webgpu'
import { float, mrt, output, pass, uniform } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { chromaticAberration } from './ChromaticAberrationNode.js'

/**
 * Base
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0b10')

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(6, 3.5, 6)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const gui = new GUI({ title: 'Post-processing' })

/**
 * Objects
 */
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardNodeMaterial({ color: '#f5f5f5', roughness: 0.25, metalness: 0.1 })
)
scene.add(cube)

const pillarGeometry = new THREE.BoxGeometry(0.25, 2, 0.25)
const pillarMaterial = new THREE.MeshStandardNodeMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.4 })
const pillarBloom = uniform(1)
pillarMaterial.mrtNode = mrt({ bloomIntensity: pillarBloom })
const pillarCount = 16
for (let i = 0; i < pillarCount; i++) {
  const angle = (i / pillarCount) * Math.PI * 2
  const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
  pillar.position.set(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5)
  scene.add(pillar)
}

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(3, 4, 2)
scene.add(directionalLight)
scene.add(new THREE.AmbientLight('#6b7cff', 0.6))

/**
 * Post-processing
 */
const renderPipeline = new THREE.RenderPipeline(renderer)

const scenePass = pass(scene, camera)

scenePass.setMRT(mrt({
  output: output,
  bloomIntensity: float(0)
}))

const sceneOutput = scenePass.getTextureNode('output')
const bloomIntensity = scenePass.getTextureNode('bloomIntensity').r

// Bloom pass
const bloomPass = bloom(sceneOutput.mul(bloomIntensity), 0.5, 0.4, 0)
const bloomOutput = sceneOutput.add(bloomPass)

// Chromatic aberration pass
const strength = uniform(0.03)
const center = uniform(new THREE.Vector2(0.5, 0.5))
const falloff = uniform(1)

const chromaticAberrationPass = chromaticAberration(bloomOutput, strength, center, falloff)
renderPipeline.outputNode = chromaticAberrationPass

// Debug
const settings = { enabled: true }

const bloomGui = gui.addFolder('Bloom')
bloomGui.add(bloomPass.strength, 'value', 0, 3, 0.01).name('strength')
bloomGui.add(bloomPass.radius, 'value', 0, 1, 0.01).name('radius')
bloomGui.add(bloomPass.threshold, 'value', 0, 1, 0.01).name('threshold')
bloomGui.add(pillarBloom, 'value', 0, 2, 0.01).name('pillarIntensity')

const caGui = gui.addFolder('Chromatic aberration')
caGui.add(settings, 'enabled').onChange((enabled) => {
  renderPipeline.outputNode = enabled ? chromaticAberrationPass : bloomOutput
  renderPipeline.needsUpdate = true
})
caGui.add(strength, 'value', 0, 0.2, 0.001).name('strength')
caGui.add(center.value, 'x', 0, 1, 0.01).name('centerX')
caGui.add(center.value, 'y', 0, 1, 0.01).name('centerY')
caGui.add(falloff, 'value', 0, 4, 0.01).name('falloff')

/**
 * Resize & loop
 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const timer = new THREE.Timer()

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp)
  const elapsed = timer.getElapsed()

  cube.rotation.x = elapsed * 0.2
  cube.rotation.y = elapsed * 0.3

  controls.update()
  // renderer.render(scene, camera)
  renderPipeline.render()
})
