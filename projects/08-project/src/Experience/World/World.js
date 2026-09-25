import Lightsaber from './Lightsaber.js'
import * as THREE from 'three/webgpu'

export default class World {
  constructor({ scene, renderer, camera, controls, canvas, gui }) {
    this.lightsaber = new Lightsaber({ scene, renderer, camera, controls, canvas, gui })

    scene.add(new THREE.HemisphereLight('#ffffff', '#444444', 2))

    this.directionalLight = new THREE.DirectionalLight('#ffffff', 3)
    this.directionalLight.position.set(5, 5, 5)
    scene.add(this.directionalLight)
  }

  update(dt) {
    this.lightsaber.update(dt)
  }
}
