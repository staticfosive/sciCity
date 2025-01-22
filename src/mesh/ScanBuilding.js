import * as THREE from 'three';
import scene  from '../core/scene';
import * as SciNoiseShader from '../shader/sciNoisePlaneShader';
import * as sciSpreadPlaneShader from '../shader/sciSpreadPlaneShader';
import gsap from 'gsap';
import { Reflector } from './Reflector';

let oriental_pearl_building=null;

//导入gui设置裁剪高度
 let params={
    height:10
 }
//  const folder=scene.userData.gui.addFolder('裁剪平面');
//  folder.add(params,'height',-10,10).onChange(function(value){
//     planeClip1.constant=params.height;
//     planeClip2.constant=-params.height;
//     sciNoisePlane.position.y = params.height;
//     gShader.uniforms["paramsHeight"].value = params.height;
//  })
 let lightTexture = new THREE.TextureLoader().load('./texture/sci/sci_guiji3.png')
 //不让激光重复
 lightTexture.wrapS = THREE.ClampToEdgeWrapping;
 lightTexture.wrapT = THREE.ClampToEdgeWrapping;
 let gShader = null;
 //加载的第二个建筑形象
 scene.userData.gltfLoader.load(
    './model/tower.glb',function(gltf){
        let obj3d=new THREE.Group();
        obj3d.add(gltf.scene.children[0])
        oriental_pearl_building=obj3d;
        oriental_pearl_building.position.set(-3.8,0,-3.2);
        obj3d.children[0].material.onBeforeCompile=function(shader){
            shader.uniforms['lightTexture']={value:lightTexture}
            shader.uniforms['paramsHeight']={value:params.height}
            gShader = shader;
            //顶点着色器
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                varying vec3 vPosition;
                uniform float paramsHeight;
                `
            )
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                vec4 tPosition = modelMatrix * vec4(position, 1.0);
                vPosition = tPosition.xyz;
                vPosition.y = vPosition.y - paramsHeight;
                `
            )
            //片元着色器
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                uniform sampler2D lightTexture;
                varying vec3 vPosition;
                `
            )
           
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                vec4 lightTextureColor = texture2D(lightTexture,vec2(0.5,vPosition.y));
                vec3 fColor = mix(gl_FragColor.rgb,lightTextureColor.rgb,lightTextureColor.r);
                gl_FragColor = vec4(fColor,gl_FragColor.a);
                `
            )

        }
    })
    //两个裁剪面分给两个建筑
    let planeClip1 = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    let planeClip2 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    //射线获取，测试是否有点击物体的重要步骤
    const raycaster = new THREE.Raycaster();
    //获取鼠标点击位置
    const pointer = new THREE.Vector2();
    function onPointerDown(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer,scene.userData.camera);
        const intersects=raycaster.intersectObjects(scene.children);
        //判断是否点到第一个场景的建筑
        if(intersects.length>0&&intersects[0].object.name=='04-dongfangmingzhu_dongfangmingzhu_0'){
            console.log("点中东方明珠");
            //获取obj是第一个图建筑(最初始那个建筑)
            let obj=intersects[0].object;
            scene.userData.mainSceneChildren = scene.children;
            //将场景置空
            scene.children = [];
            //只添加自己想添加的物体
            scene.add(obj);
            scene.add(scene.userData.gridHelper)
            scene.add(scene.userData.axesHelper)
            //directionalLight直线光
            scene.add(scene.userData.directionalLight)
            //ambientLight环境光
            scene.add(scene.userData.ambientLight)
            scene.background = new THREE.Color(0x333333);
            scene.userData.controls.target.set(-4,0,-3)
            scene.userData.camera.lookAt(new THREE.Vector3(-4,0,-3))
            scene.add(oriental_pearl_building)
            // 创建裁剪平面
            //启用裁剪
            scene.userData.renderer.localClippingEnabled = true;
            obj.material.clippingPlanes=[planeClip1];
            //阴影
            obj.material.clipShadows = true;
            //东方明珠的裁剪平面为平面2
            oriental_pearl_building.children[0].material.clippingPlanes=[planeClip2];
            oriental_pearl_building.children[0].material.clipShadows = true;
            scene.add(sciNoisePlane)
            // scene.add(sciNoisePlane2)
            scene.add( verticalMirror );

            //让圆环由高到低,第二个建筑显现,gshader是第二个建筑.
            gsap.to(params,{
                height:0,
                duration:10,
                repeat:-1,
                ease:'linear',
                yoyo:true,
                onUpdate:function(){
                    planeClip1.constant = params.height;
                    planeClip2.constant = -params.height;
                    sciNoisePlane.position.y = params.height;
                    gShader.uniforms["paramsHeight"].value = params.height;
                }
            })

            
        }
    }

    // 点击场景的物体时，如果是东方明珠，就进入到建筑扫描特效的场景
    window.addEventListener('click',onPointerDown)

    // 扫描噪声平面
    let sciNoisePlaneGeometry = new THREE.PlaneGeometry(10,10);
    let sciNoiseMaterial = new THREE.ShaderMaterial({
    vertexShader:SciNoiseShader.vertexShader,
    fragmentShader:SciNoiseShader.fragmentShader,
    transparent:true,
    blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,
    uniforms:{
        uTime:{
            value:0
        }
    }
})
    let sciNoisePlane = new THREE.Mesh(
    sciNoisePlaneGeometry,
    sciNoiseMaterial
    )
    sciNoisePlane.position.set(-3.8,params.height,-3.2)
    sciNoisePlane.rotation.x = -Math.PI/2       
    gsap.to(sciNoiseMaterial.uniforms.uTime,{
        value:10,
        duration:10,
        repeat:-1,
        ease:'linear',
        yoyo:true
    })
  
    

// 扫描扩散平面
let noiseTexture = new THREE.TextureLoader().load('./texture/sci/noise.png');
let sciNoisePlaneGeometry2 = new THREE.PlaneGeometry(10,10);
let sciNoiseMaterial2 = new THREE.ShaderMaterial({
    vertexShader:sciSpreadPlaneShader.vertexShader,
    fragmentShader:sciSpreadPlaneShader.fragmentShader,
    transparent:true,
    blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,
    uniforms:{
        uTime:{
            value:0
        },
        noiseTexture:{
            value:noiseTexture
        }
    }
})
let sciNoisePlane2 = new THREE.Mesh(
    sciNoisePlaneGeometry2,
    sciNoiseMaterial2
)
sciNoisePlane2.position.set(-3.8,-1,-3.2)
sciNoisePlane2.rotation.x = -Math.PI/2

gsap.to(sciNoiseMaterial2.uniforms.uTime,{
    value:10,
    duration:10,
    repeat:-1,
    ease:'linear',
    yoyo:true
})

//镜像
let mirrorGeometry = new THREE.PlaneGeometry( 50, 50 );
let verticalMirror = new Reflector( mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xc1cbcb
} );
verticalMirror.rotation.x = - Math.PI / 2;
verticalMirror.position.set(-3.8,-1,-3.2)


gsap.to(verticalMirror.material.uniforms.uTime,{
    value:10,
    duration:10,
    repeat:-1,
    ease:'linear',
    yoyo:true
})