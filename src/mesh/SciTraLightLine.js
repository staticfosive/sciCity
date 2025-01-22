import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';

class SciTraLightLine extends THREE.Mesh {
    constructor(path=[
        new THREE.Vector3( -10, 0, 0 ),
        new THREE.Vector3( -5, 0, 5 ),
        new THREE.Vector3( 0, 0, 10 ),
        new THREE.Vector3( 5, 0, 5 ),
        new THREE.Vector3( 10, 0, 0 )
    ]){
        super();
          // 创建曲线
        const curve=new THREE.CatmullRomCurve3(path);
        const points=curve.getPoints(50);
        this.curve=curve;

         // 创建参数化的几何体
         this.geometry=new ParametricGeometry( this.createParametricSurface.bind(this), 30, 30 );
         //加载纹理
         const texture = new THREE.TextureLoader().load( './texture/sci/sci_guiji3.png' );
         texture.center.set( 0.5, 0.5 );
         texture.rotation = Math.PI / 2;
         //先不重复
         texture.wrapS = THREE.ClampToEdgeWrapping;
         //后cho
         texture.wrapT = THREE.RepeatWrapping;
         texture.repeat.set(1,10)
 
         this.texture = texture;
 
         this.material = new THREE.MeshBasicMaterial( {
             map: texture,
             alphaMap: texture,
             side: THREE.DoubleSide,
             transparent: true,
             opacity: 0.5,
             blending: THREE.AdditiveBlending,
         } );
 
    }
         createParametricSurface(u,v,target){
            // 获取路径上的点
            var point=this.curve.getPoint(u);
             // 获取路径上的切线的方向
            var dir=this.curve.getTangent(u);
              // 计算切线的垂直向量
            var normal=new THREE.Vector3(dir.z,0,-dir.x)
            //宽度克隆出0.5
            var temp=point.add(normal.clone().multiplyScalar(v*0.5))
              // 设置目标点的位置
            target.set(temp.x,temp.y,temp.z);
         }
         update(delta){
            this.texture.offset.y += 1*delta;
        }
    }
    
    export default SciTraLightLine;