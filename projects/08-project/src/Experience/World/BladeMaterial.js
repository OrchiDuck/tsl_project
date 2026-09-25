import * as THREE from 'three/webgpu'
import {
  color, mix, normalView, mrt, float, time, vec3, vec4, mx_noise_float,
  uniform, positionLocal, normalLocal, modelWorldMatrix
} from 'three/tsl'

export default class BladeMaterial extends THREE.MeshBasicNodeMaterial {
  constructor({ gui }) {
    super()

    this.noiseStrength = uniform(0.05)
    this.noiseScale = uniform(20)
    this.noiseSpeed = uniform(7)
    this.powerFresnel = uniform(0.4)
    this.pulseAmplitude = uniform(0.3)
    this.pulseSpeed = uniform(1.5)
    this.lightColor = uniform(new THREE.Color('#ff0000'))
    this.lightBloom = uniform(1)

    const worldPos = modelWorldMatrix.mul(vec4(positionLocal, 1)).xyz
    const noisePos = worldPos.mul(this.noiseScale).sub(vec3(0, time.mul(this.noiseSpeed), 0))
    const displacement = mx_noise_float(noisePos).mul(this.noiseStrength)

    const pulse = mx_noise_float(vec3(0, time.mul(this.pulseSpeed), 0))
    const animatedPower = this.powerFresnel.add(pulse.mul(this.pulseAmplitude)).max(0.01)
    const fresnel = normalView.z.oneMinus().pow(animatedPower)

    this.colorNode = mix(color('#ffffff'), this.lightColor, fresnel.add(displacement.mul(10)))
    this.positionNode = positionLocal.add(normalLocal.mul(displacement))

    this.mrtNode = mrt({ bloomIntensity: this.lightBloom, afterImageMask: float(1) })

    this.setGui(gui)
  }

  setGui(gui) {
    const folder = gui.addFolder('Light')
    folder.addColor(this.lightColor, 'value').name('Color')
    folder.add(this.lightBloom, 'value', 0, 2, 0.01).name('Bloom Intensity')
    folder.add(this.powerFresnel, 'value', 0, 5).name('Fresnel Power')
    folder.add(this.pulseAmplitude, 'value', 0, 2, 0.01).name('Fresnel Pulse Amp')
    folder.add(this.pulseSpeed, 'value', 0, 10, 0.01).name('Fresnel Pulse Speed')
    folder.add(this.noiseStrength, 'value', 0, 0.15, 0.001).name('Noise Strength')
    folder.add(this.noiseScale, 'value', 0, 20, 0.01).name('Noise Scale')
    folder.add(this.noiseSpeed, 'value', 0, 10, 0.01).name('Noise Speed')
  }
}
