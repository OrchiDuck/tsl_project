import * as THREE from 'three/webgpu'
import { color, deltaTime, Fn, hash, If, instancedArray, instanceIndex, min, mix, mx_noise_vec3, range, time, TWO_PI, uniform, uv, varying, vec3 } from 'three/tsl'
import GUI from 'lil-gui'

/**
 * Base
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0b10')

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 6)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const gui = new GUI({ title: 'Cursor' })

// Cursor
const raycaster = new THREE.Raycaster()
const cursor = new THREE.Vector2()
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const cursorPosition = uniform(new THREE.Vector3())

window.addEventListener('pointermove', (event) => {
  cursor.x = (event.clientX / window.innerWidth) * 2 - 1
  cursor.y = -(event.clientY / window.innerHeight) * 2 + 1
})

/**
 * Particles
 */
const count = 5000

const offsets = instancedArray(count, 'vec3')
const positions = instancedArray(count, 'vec3')
const progresses = instancedArray(count, 'float')

const radius = uniform(0.3)
const lifeSpeed = uniform(0.6)
const windStrength = uniform(0.6)
const windFrequency = uniform(1.5)
const rise = uniform(0.4)
const size = uniform(0.06)
const colorYoung = uniform(color('#ffcda3'))
const colorOld = uniform(color('#ff142c'))

const randomSphericalPosition = Fn(([seed]) => {
  const theta = hash(seed).mul(TWO_PI)
  const phi = hash(seed.add(123).mul(2)).remap(0, 1, -1, 1).acos()

  return vec3(theta.sin().mul(phi.sin()), phi.cos(), theta.cos().mul(phi.sin()))
}, { seed: 'uint', return: 'vec3' })

const initCompute = Fn(() => {
  const offset = offsets.element(instanceIndex)

  offset.assign(randomSphericalPosition(instanceIndex))
  positions.element(instanceIndex).assign(offset.mul(radius).add(cursorPosition))
  progresses.element(instanceIndex).assign(hash(instanceIndex.mul(3)))
})().compute(count)

renderer.computeAsync(initCompute)

const updateCompute = Fn(() => {
  const offset = offsets.element(instanceIndex)
  const position = positions.element(instanceIndex)
  const progress = progresses.element(instanceIndex)
  const dt = deltaTime.min(1 / 30)

  progress.addAssign(dt.mul(lifeSpeed))

  If(progress.greaterThan(1), () => {
    progress.assign(progress.fract())
    position.assign(offset.mul(radius).add(cursorPosition))
  })

  const wind = mx_noise_vec3(position.mul(windFrequency).add(time.mul(0.3))).mul(windStrength)
  position.addAssign(wind.add(vec3(0, rise, 0)).mul(dt))
})().compute(count)

const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const progress = progresses.element(instanceIndex)
const growAndShrink = min(progress.remap(0, 0.1), progress.remap(1, 0.5)).clamp(0, 1)

material.positionNode = positions.element(instanceIndex)
material.scaleNode = size.mul(range(0.5, 1)).mul(growAndShrink)
material.colorNode = mix(colorYoung, colorOld, varying(progress))
material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0)

const sprite = new THREE.Sprite(material)
sprite.count = count
sprite.frustumCulled = false
scene.add(sprite)

// Debug
gui.add(radius, 'value', 0, 1, 0.001).name('radius')
gui.add(lifeSpeed, 'value', 0.1, 2, 0.01).name('lifeSpeed')
gui.add(windStrength, 'value', 0, 3, 0.01).name('windStrength')
gui.add(windFrequency, 'value', 0, 5, 0.01).name('windFrequency')
gui.add(rise, 'value', -1, 2, 0.01).name('rise')
gui.add(size, 'value', 0.005, 0.2, 0.001).name('size')
gui.addColor(colorYoung, 'value').name('colorYoung')
gui.addColor(colorOld, 'value').name('colorOld')

/**
 * Resize & loop
 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  raycaster.setFromCamera(cursor, camera)
  raycaster.ray.intersectPlane(plane, cursorPosition.value)

  renderer.compute(updateCompute)
  renderer.render(scene, camera)
})
