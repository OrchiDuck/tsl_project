import * as THREE from 'three/webgpu'
import { output, mrt, pass, float, uniform } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'three/addons/libs/lil-gui.module.min.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js'
import World from './World/World.js'

export default class Experience {
  constructor(container) {
    this.container = container

    this.gui = new GUI()
    this.scene = new THREE.Scene()
    this.timer = new THREE.Timer()

    this.setCamera()
    this.setRenderer()
    this.setControls()
    this.setPostProcessing()

    this.world = new World({
      scene: this.scene,
      renderer: this.renderer,
      camera: this.camera,
      controls: this.controls,
      canvas: this.renderer.domElement,
      gui: this.gui
    })

    window.addEventListener('resize', () => this.resize())
    this.renderer.setAnimationLoop((timestamp) => this.update(timestamp))
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
    this.camera.position.set(0, 8, 14)
  }

  setRenderer() {
    this.renderer = new THREE.WebGPURenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.container.appendChild(this.renderer.domElement)
  }

  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  setPostProcessing() {
    this.renderPipeline = new THREE.RenderPipeline(this.renderer)

    const scenePass = pass(this.scene, this.camera)

    scenePass.setMRT(mrt({
      output: output,
      bloomIntensity: float(0),
      afterImageMask: float(0)
    }))

    const sceneOutput = scenePass.getTextureNode('output')
    const bloomIntensity = scenePass.getTextureNode('bloomIntensity').r
    const afterImageMask = scenePass.getTextureNode('afterImageMask').r

    const afterImageDamp = uniform(0.8)
    const afterImageEnabled = uniform(1)
    const lightOnly = sceneOutput.mul(afterImageMask)
    const afterImagePass = afterImage(lightOnly, afterImageDamp)

    const trail = afterImagePass.sub(lightOnly).max(0).mul(afterImageEnabled)

    const bloomPass = bloom(sceneOutput.mul(bloomIntensity).add(trail), 1, 0, 0)
    this.renderPipeline.outputNode = sceneOutput.add(trail).add(bloomPass)

    const bloomGui = this.gui.addFolder('Bloom')
    bloomGui.add(bloomPass.strength, 'value', 0, 3, 0.01).name('strength')
    bloomGui.add(bloomPass.radius, 'value', 0, 1, 0.01).name('radius')
    bloomGui.add(bloomPass.threshold, 'value', 0, 1, 0.01).name('threshold')

    const afterImageGui = this.gui.addFolder('After Image')
    afterImageGui.add(afterImageDamp, 'value', 0, 1, 0.001).name('damp')
    afterImageGui.add({ enable: true }, 'enable').onChange((v) => { afterImageEnabled.value = v ? 1 : 0 })
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  update(timestamp) {
    this.timer.update(timestamp)
    const dt = Math.min(this.timer.getDelta(), 0.1)

    this.world.update(dt)
    this.controls.update()
    this.renderPipeline.render()
  }
}
