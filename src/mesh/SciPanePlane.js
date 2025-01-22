import * as THREE from 'three';

class SciPanePlane extends THREE.Mesh {

	constructor( text ) {
        super()
		const canvas = document.createElement( 'canvas' );
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext( '2d' );
        this.context = ctx;
        let image = new Image();
        image.src = "./texture/sci/sci_frame.png"
        image.onload = () => {
            this.context.drawImage(image, 0, 0, canvas.width, canvas.height);

            this.context.textAlign = 'center';
            this.context.textBaseline = 'middle';
            this.context.font = 'bold 200px Arial';
            this.context.fillStyle = '#FFFFFF';
            this.context.fillText(text, canvas.width / 2, canvas.height / 2);


            let texture = new THREE.CanvasTexture(canvas);
            //创建平面
            this.geometry = new THREE.PlaneGeometry(1, 1);
            this.material = new THREE.MeshPhysicalMaterial({
                map: texture,
                transparent:true,
                //金属度
                metalness:0.9,
                //粗糙度
                roughness:0,
                //透明度，纹理
                alphaMap:texture,
            })
        }
	}
}


export default SciPanePlane;