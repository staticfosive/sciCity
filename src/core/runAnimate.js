import * as THREE from 'three';
import scene from './scene';
import composer from './postprocessing';

let clock = new THREE.Clock();
let updateList = [];
function animate(){
    //两帧动画的时间差赋值给dalta
    let dalta=clock.getDelta();
    scene.userData.controls.update(dalta);
    updateList.forEach(function(element){
        element.update(dalta);
    })
    requestAnimationFrame(animate)
    composer.render();
    // scene.userData.renderer.render(scene, scene.userData.camera);
}
animate();

//监听窗口变化
window.addEventListener('resize', function() {
    scene.userData.camera.aspect = window.innerWidth / window.innerHeight;
    scene.userData.camera.updateProjectionMatrix();
    scene.userData.renderer.setSize(window.innerWidth, window.innerHeight);
});

export default updateList;