<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const canvas = canvasRef.value!
  const renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5

  const controls = new OrbitControls(camera, renderer.domElement)

  const sunGeo = new THREE.SphereGeometry(1, 32, 32)
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  scene.add(sun)

  const earthGeo = new THREE.SphereGeometry(0.3, 32, 32)
  const earthMat = new THREE.MeshBasicMaterial({ color: 0x2266ff })
  const earth = new THREE.Mesh(earthGeo, earthMat)
  scene.add(earth)

  function animate() {
    requestAnimationFrame(animate)
    const t = Date.now() * 0.001
    earth.position.set(Math.cos(t) * 3, 0, Math.sin(t) * 3)
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
})
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>

<style scoped>
canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}
</style>
