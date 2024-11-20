<script setup>
const isNoModel = import.meta.env.MODE === 'nomodel' || import.meta.env.MODE === 'debug';
</script>

<template>
    <div class="three_renderer" v-if="!isNoModel"></div>
</template>

<script>

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ElNotification } from 'element-plus';
import { AnimationMixer, AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Clock, LoopRepeat } from 'three';
export default {
    methods: {
        playAnimate() {
            this.idleAction.loop = LoopRepeat
            this.idleAction.play()
            const clock = new Clock()
            var mixer = this.animateMixer
            function loop() {
                requestAnimationFrame(loop)
                mixer.update(clock.getDelta())
            }
            loop()
        }
    },
    data() {
        return {
            idleAction: null,
            obj3d: null,
            animateMixer: null
        }
    },
    mounted() {
        if(import.meta.env.MODE == 'nomodel') return
        const scene = new Scene()
        const camera = new PerspectiveCamera()
        camera.position.set(0, 3, 3)
        const renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        })
        renderer.setClearAlpha(0)
        scene.background = null
        scene.add(new AmbientLight(0xFFFFFF, 4))
        renderer.setSize((window.innerWidth - 70) / 2, (window.innerWidth - 70) / 2)
        function animate() {
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
        const loader = new GLTFLoader()
        loader.loadAsync("sugardontstop.glb").then(gltf => {
            console.log(gltf)
            this.obj3d = gltf.scene
            var mixer = new AnimationMixer(gltf.scene);
            this.animateMixer = mixer
            gltf.scene.rotateY(0.3)
            gltf.scene.scale.set(2.5, 2.5, 2.5)
            //gltf.scene.scale.set(3, 3, 3)
            this.idleAction = this.animateMixer.clipAction(gltf.animations[0]);
            scene.add(gltf.scene)
            this.idleAction.loop = LoopRepeat
            this.idleAction.play()
            const clock = new Clock()
            function loop() {
                requestAnimationFrame(loop)
                mixer.update(clock.getDelta())
            }
            loop()
            document.getElementsByClassName("three_renderer")[0].appendChild(renderer.domElement)
        }).catch(error=>{
            ElNotification({
                type: "error",
                title: "Failed when load the model.",
                message: error
            })
        })
    }
}
</script>