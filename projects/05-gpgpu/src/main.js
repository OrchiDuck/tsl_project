import * as THREE from 'three/webgpu'
import { color, deltaTime, Fn, hash, If, instancedArray, instanceIndex, mix, step, time, TWO_PI, uniform, uv, varying, vec3 } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0b10')

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(8, 5, 8)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 2, 0)
controls.enableDamping = true

const gui = new GUI({ title: 'GPGPU' })

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(6, 64),
  new THREE.MeshBasicNodeMaterial({ color: '#16161f' })
)
floor.rotation.x = -Math.PI * 0.5
floor.position.y = -0.05
scene.add(floor)

// Particles
const count = 20000

const positions = instancedArray(count, 'vec3')
const velocities = instancedArray(count, 'vec3')
const lives = instancedArray(count, 'float')

const speed = uniform(7)
const spread = uniform(1.2)
const gravity = uniform(9.81)
const lifetime = uniform(2.5)
const bounce = uniform(0.4)
const size = uniform(0.04)
const colorStart = uniform(color('#bfe6ff'))
const colorEnd = uniform(color('#1466ff'))

const spawn = (position, velocity, seed) => {
  const angle = hash(seed).mul(TWO_PI)
  const radius = hash(seed.add(1)).sqrt().mul(spread)
  const upward = hash(seed.add(2)).mul(0.4).add(0.8).mul(speed)

  position.assign(vec3(0))
  // Point aléatoire sur un disque (cos/sin de l'angle × rayon) en x/z, poussée vers le haut en y
  velocity.assign(vec3(angle.cos().mul(radius), upward, angle.sin().mul(radius)))
}

const initCompute = Fn(() => {
  positions.element(instanceIndex).assign(vec3(0))
  velocities.element(instanceIndex).assign(vec3(0))
  lives.element(instanceIndex).assign(hash(instanceIndex).negate())
})().compute(count)

renderer.computeAsync(initCompute)

const updateCompute = Fn(() => {
  const position = positions.element(instanceIndex)
  const velocity = velocities.element(instanceIndex)
  const life = lives.element(instanceIndex)
  const dt = deltaTime.min(1 / 30)

  life.addAssign(dt.div(lifetime))

  If(life.greaterThanEqual(1), () => {
    const seed = instanceIndex.add(time.mul(1000).toUint().mul(3))
    spawn(position, velocity, seed)
    life.assign(0)
  })

  If(life.greaterThan(0), () => {
    velocity.y.subAssign(gravity.mul(dt))
    position.addAssign(velocity.mul(dt))

    If(position.y.lessThan(0), () => {
      position.y.assign(0)
      velocity.mulAssign(vec3(0.8, bounce.negate(), 0.8))
    })
  })
})().compute(count)

const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const life = lives.element(instanceIndex)

material.positionNode = positions.element(instanceIndex)
material.scaleNode = size.mul(step(0, life)).mul(life.oneMinus())
material.colorNode = mix(colorStart, colorEnd, varying(life))
material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0)

const sprite = new THREE.Sprite(material)
sprite.count = count
sprite.frustumCulled = false
scene.add(sprite)

// Debug
gui.add(speed, 'value', 0, 15, 0.1).name('speed')
gui.add(spread, 'value', 0, 5, 0.01).name('spread')
gui.add(gravity, 'value', 0, 20, 0.01).name('gravity')
gui.add(lifetime, 'value', 0.5, 6, 0.01).name('lifetime')
gui.add(bounce, 'value', 0, 1, 0.01).name('bounce')
gui.add(size, 'value', 0.005, 0.15, 0.001).name('size')
gui.addColor(colorStart, 'value').name('colorStart')
gui.addColor(colorEnd, 'value').name('colorEnd')

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
