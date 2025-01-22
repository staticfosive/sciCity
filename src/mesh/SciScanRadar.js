import * as THREE from 'three';

class SciScanRadar extends THREE.Mesh {
    constructor(){
        super()

        this.geometry = new THREE.PlaneGeometry(1,1);
        this.texture = new THREE.TextureLoader().load('./texture/sci/sci_scan_tri.png');
        this.texture.center.set(0.5,0.5);
        this.material = new THREE.MeshPhysicalMaterial({
            map:this.texture,
            transparent:true,
            //黑色会变成透明
            alphaMap:this.texture,
            blending:THREE.AdditiveBlending,
        })
    }

    update(delta){
        this.texture.rotation -= delta
    }

}

export default SciScanRadar