import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import BladeMaterial from './BladeMaterial.js'
import SaberDrag from './SaberDrag.js'
import BladeParticles from './BladeParticles.js'

const HILT_LENGTH = 3.5
const BLADE_LENGTH = 8

export default class Lightsaber {
  constructor({ scene, renderer, camera, controls, canvas, gui }) {
    this.material = new BladeMaterial({ gui })

    this.rig = new THREE.Group()
    this.rig.position.set(0, -3.5 - HILT_LENGTH / 2, 0)
    scene.add(this.rig)

    this.setHilt()
    this.setBlade()
    this.setLight(gui)

    this.particles = new BladeParticles({ scene, renderer, blade: this.blade, colorEnd: this.material.lightColor, gui })

    this.drag = new SaberDrag({
      camera, controls, canvas, rig: this.rig, target: this.hilt,
      onClick: () => this.toggle(),
    })

    this.ignition = { progress: 0, open: false, duration: 0.55 }
    const ignitionFolder = gui.addFolder('Ignition')
    ignitionFolder.close()
    ignitionFolder.add(this.ignition, 'duration', 0.05, 2, 0.01)

    this.tilt = { strength: 0.15, max: 1, smoothing: 5 }
    const tiltFolder = gui.addFolder('Tilt')
    tiltFolder.close()
    tiltFolder.add(this.tilt, 'strength', 0, 0.5, 0.001)
    tiltFolder.add(this.tilt, 'max', 0, Math.PI / 2, 0.01)
    tiltFolder.add(this.tilt, 'smoothing', 1, 30, 0.1)
  }

  setHilt() {
    this.hilt = new THREE.Group()
    this.hilt.position.set(0, HILT_LENGTH / 2, 0)
    this.rig.add(this.hilt)

    new GLTFLoader().load('/models/lightsaber.glb', (gltf) => {
      const model = gltf.scene

      model.rotation.z = Math.PI / 2
      model.rotation.y = -Math.PI / 2
      model.updateMatrixWorld(true)

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      model.position.set(-center.x, -box.max.y, -center.z)

      this.hilt.scale.setScalar(HILT_LENGTH / size.y)
      this.hilt.add(model)
    })
  }

  setBlade() {
    this.bladePivot = new THREE.Group()
    this.bladePivot.position.y = 3.5 + HILT_LENGTH / 2 - BLADE_LENGTH / 2
    this.bladePivot.scale.y = 0
    this.bladePivot.visible = false
    this.rig.add(this.bladePivot)

    this.blade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, BLADE_LENGTH, 64, 64, true), this.material)
    this.blade.position.y = BLADE_LENGTH / 2
    this.bladePivot.add(this.blade)

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.material)
    tip.position.y = BLADE_LENGTH / 2
    this.blade.add(tip)
  }

  setLight(gui) {
    this.light = new THREE.PointLight(this.material.lightColor.value, 0, 0, 2)
    this.light.position.y = this.bladePivot.position.y + BLADE_LENGTH / 2
    this.rig.add(this.light)

    this.lightSettings = { intensity: 300, flicker: 0.08 }
    const folder = gui.addFolder('Saber Light')
    folder.close()
    folder.add(this.lightSettings, 'intensity', 0, 2000, 1)
    folder.add(this.lightSettings, 'flicker', 0, 0.5, 0.001)
    folder.add(this.light, 'decay', 0, 3, 0.01)
  }

  updateLight(eased) {
    const flicker = 1 + (Math.random() * 2 - 1) * this.lightSettings.flicker
    this.light.color.copy(this.material.lightColor.value)
    this.light.intensity = this.lightSettings.intensity * eased * flicker
  }

  toggle() {
    this.ignition.open = !this.ignition.open
  }

  updateIgnition(dt) {
    const step = dt / this.ignition.duration
    const target = this.ignition.open ? 1 : 0
    this.ignition.progress = THREE.MathUtils.clamp(this.ignition.progress + Math.sign(target - this.ignition.progress) * step, 0, 1)

    const eased = 1 - Math.pow(1 - this.ignition.progress, 3)
    this.bladePivot.scale.y = eased
    this.bladePivot.visible = eased > 0.001
    this.updateLight(eased)
  }

  update(dt) {
    const previousX = this.rig.position.x
    const k = 1 - Math.exp(-this.tilt.smoothing * dt)
    this.rig.position.x += (this.drag.targetX - this.rig.position.x) * k
    const velocityX = dt > 0 ? (this.rig.position.x - previousX) / dt : 0
    const targetTilt = THREE.MathUtils.clamp(velocityX * this.tilt.strength, -this.tilt.max, this.tilt.max)
    this.rig.rotation.z += (targetTilt - this.rig.rotation.z) * k

    this.updateIgnition(dt)
    this.particles.update()
  }
}
