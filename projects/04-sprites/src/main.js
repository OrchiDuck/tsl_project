import * as THREE from 'three/webgpu'
import { color, mix, range, time, uniform, uv, varying, vec3 } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0b10')

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(8, 4, 8)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 1.5, 0)
controls.enableDamping = true

const gui = new GUI({ title: 'Sprites' })

// Sprites
const count = 20000

const floatAmplitude = uniform(0.2)
const floatSpeed = uniform(1)

const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const basePosition = range(vec3(-3, -3, -3), vec3(3, 6, 3))

const phase = range(0, Math.PI * 2)

const floating = time.mul(floatSpeed).add(phase).sin().mul(floatAmplitude)

material.positionNode = basePosition.add(vec3(0, floating, 0))

material.scaleNode = range(0.03, 0.12)

material.colorNode = mix(color('#1466ff'), color('#ff4fa3'), varying(basePosition.y.div(3)))

material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0)

const sprite = new THREE.Sprite(material)
sprite.count = count
sprite.frustumCulled = false
scene.add(sprite)

// Debug
gui.add(floatAmplitude, 'value', 0, 1, 0.01).name('floatAmplitude')
gui.add(floatSpeed, 'value', 0, 5, 0.01).name('floatSpeed')

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
