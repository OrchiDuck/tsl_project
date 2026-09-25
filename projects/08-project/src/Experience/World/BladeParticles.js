import * as THREE from 'three/webgpu'
import { color, deltaTime, float, Fn, hash, If, instancedArray, instanceIndex, mix, mrt, step, time, TWO_PI, uniform, uv, varying, vec3 } from 'three/tsl'

export default class BladeParticles {
  constructor({ scene, renderer, blade, colorEnd, gui }) {
    this.renderer = renderer
    this.blade = blade

    const count = 20000

    const positions = instancedArray(count, 'vec3')
    const velocities = instancedArray(count, 'vec3')
    const lives = instancedArray(count, 'float')

    const speed = uniform(0.6)
    const spread = uniform(0.3)
    const gravity = uniform(0)
    const lifetime = uniform(1)
    const size = uniform(0.06)
    const colorStart = uniform(color('#ffffff'))
    const bladeLength = uniform(8)

    const spawn = (position, velocity, seed) => {
      const angle = hash(seed).mul(TWO_PI)
      const radius = hash(seed.add(1)).sqrt().mul(spread)
      const upward = hash(seed.add(2)).mul(0.4).add(0.8).mul(speed)

      const height = hash(seed.add(3)).sub(0.5).mul(bladeLength)
      position.assign(vec3(0, height, 0))

      velocity.assign(vec3(angle.cos().mul(radius), upward, angle.sin().mul(radius)))
    }

    const initCompute = Fn(() => {
      positions.element(instanceIndex).assign(vec3(0))
      velocities.element(instanceIndex).assign(vec3(0))
      lives.element(instanceIndex).assign(hash(instanceIndex).negate())
    })().compute(count)

    renderer.computeAsync(initCompute)

    this.updateCompute = Fn(() => {
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

    material.mrtNode = mrt({ bloomIntensity: float(1), afterImageMask: float(0) })

    const sprite = new THREE.Sprite(material)
    sprite.count = count
    sprite.frustumCulled = false
    blade.add(sprite)

    const folder = gui.addFolder('Particles')
    folder.close()
    folder.add(speed, 'value', 0, 15, 0.1).name('speed')
    folder.add(spread, 'value', 0, 5, 0.01).name('spread')
    folder.add(gravity, 'value', 0, 20, 0.01).name('gravity')
    folder.add(lifetime, 'value', 0.5, 6, 0.01).name('lifetime')
    folder.add(size, 'value', 0.005, 0.15, 0.001).name('size')
    folder.addColor(colorStart, 'value').name('colorStart')
  }

  update() {
    this.renderer.compute(this.updateCompute)
  }
}
