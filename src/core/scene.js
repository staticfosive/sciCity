import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js' ;
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'; 
//天空盒让模型紧贴地面
import{GroundedSkybox} from '../mesh/GroundedSkybox.js';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(40, 3, 7);
    camera.lookAt(0, 1.2, 0);

scene.userData.camera=camera;
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
scene.userData.renderer=renderer;


renderer.setSize(window.innerWidth, window.innerHeight);
//渲染器阴影开启
renderer.shadowMap.enabled = true;
renderer.toneMapping=THREE.ReinhardToneMapping;
renderer.toneMappingExposure=1;
document.body.appendChild(renderer.domElement);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
// scene.userData.axesHelper=axesHelper;
//添加网格辅助器
// const gridHelper = new THREE.GridHelper(10, 10);
// scene.add(gridHelper);
// scene.userData.gridHelper=gridHelper;
// gridHelper.material.opacity = 0.2;
// gridHelper.material.transparent = true;

//轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotateSpeed =0.1;
controls.autoRotate=true;
scene.userData.controls=controls;

const rgbeLoader=new RGBELoader();
scene.userData.rgbeLoader=rgbeLoader;
rgbeLoader.load('./texture/sky/NoEmotion-Dayhdr_Day_0016_4k.hdr',(envMap)=>{
    envMap.mapping=THREE.EquirectangularReflectionMapping;
    scene.background=envMap;
    scene.environment=envMap;
    scene.userData.envMap=envMap;
    scene.backgroundIntensity=6; 
    
    const params={
        height:0.1,
        radius:50,
        enabled:true
    }
    let skybox=new GroundedSkybox(envMap,params.height,params.radius);
    skybox.position.y=params.height-2;
    scene.add(skybox);
})

//gltf加载器
const gltfLoader = new GLTFLoader();
const dracoLoader=new DRACOLoader();
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader);
scene.userData.gltfLoader=gltfLoader;
//环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
scene.userData.ambientLight=ambientLight;
//平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
//相机阴影覆盖范围
directionalLight.castShadow = true;
directionalLight.shadow.camera.top=50;
directionalLight.shadow.camera.bottom=-50;
directionalLight.shadow.camera.left=-50;
directionalLight.shadow.camera.right=50;
directionalLight.shadow.camera.near=0.5;
directionalLight.shadow.camera.far=100
scene.add(directionalLight);
scene.userData.directionalLight=directionalLight;

//gui
/* const gui=new GUI();
scene.userData.gui=gui; */

export default scene;