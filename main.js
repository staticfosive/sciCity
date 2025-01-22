import * as THREE from 'three';
import scene from './core/scene'
import updateList from './core/runAnimate';
import SciTraLightLine from './mesh/SciTraLightLine';
import SciPanePlane from './mesh/SciPanePlane';
import SciScanRadar from './mesh/SciScanRadar';
import './mesh/ScanBuilding'
//初始化场景，three。js的频繁使用核心模型
//动画模块，每一帧进行修改动画的
//后期处理模块，对渲染画面进行一些处理
import {Water} from 'three/examples/jsm/objects/Water2.js'
scene.userData.gltfLoader.load(
    './model/city_01.glb',
    (gltf)=>{
        gltf.scene.traverse(
            (child)=>{
                if(child.isMesh){
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                if(child.isMesh&&child.name=="Shanghai-08-River_River_0"){
                    child.rotation.x = -Math.PI/2;
                    const params = {
                        color:'#ffffff',
                        scale:4,
                        flowX:1,
                        flowY:1
                    }
                    let water=new Water(child.geometry,{
                        color:params.color,
                        scale:params.scale,
                        flowDirection:new THREE.Vector2(params.flowX,params.flowY),
                        textureWidth:1024,
                        textureHeight:1024
                    })
                water.position.y=0.2
                water.rotation.x=-Math.PI/2
                scene.add(water)
                }
            }
        )
        scene.add(gltf.scene);
    }
)

//河流上的航道小图标
let sciPanePlane = new SciPanePlane('航道正常');
sciPanePlane.position.set(-6,1.5,25);
scene.add(sciPanePlane);

// 创建轨迹
// let sciTraLightLine = new SciTraLightLine()
// scene.add(sciTraLightLine)
// sciTraLightLine.position.y = 5;
// updateList.push(sciTraLightLine)


//建模软件把轨迹创建并加载
scene.userData.gltfLoader.load(
    "./model/line.glb",
    (gltf) => {
        let path = [];
        gltf.scene.children.forEach((child)=>{
            path.push(child.position)
        })
        let sciTraLightLine = new SciTraLightLine(path)
        scene.add(sciTraLightLine)
        sciTraLightLine.position.y = 1;
        updateList.push(sciTraLightLine)

    }
)

scene.userData.gltfLoader.load(
    "./model/line2.glb",
    (gltf) => {
        let path = [];
        gltf.scene.children.forEach((child)=>{
            path.push(child.position)
        })
        let sciTraLightLine = new SciTraLightLine(path)
        scene.add(sciTraLightLine)
        sciTraLightLine.position.y = 1;
        updateList.push(sciTraLightLine)

    }
)

scene.userData.gltfLoader.load(
    "./model/line3.glb",
    (gltf) => {
        let path = [];
        gltf.scene.children.forEach((child)=>{
            path.push(child.position)
        })
        let sciTraLightLine = new SciTraLightLine(path)
        scene.add(sciTraLightLine)
        sciTraLightLine.position.y = 1;
        updateList.push(sciTraLightLine)

    }
)
// 示例雷达扫描
let sciScanRadar = new SciScanRadar()
sciScanRadar.scale.set(20,20,20)
sciScanRadar.position.set(-4,1,-3)
sciScanRadar.rotation.x = -Math.PI/2
scene.add(sciScanRadar)
updateList.push(sciScanRadar)