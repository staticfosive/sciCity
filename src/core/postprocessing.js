import {
    EffectComposer,
    RenderPass,
    SelectiveBloomEffect,
    BlendFunction,
    EffectPass,
    SMAAEffect,
    SSAOEffect,
    NormalPass,
    GodRaysEffect
} from 'postprocessing'
import scene from './scene'


// 实例化后期处理效果
const composer = new EffectComposer(scene.userData.renderer, {
    //为设置抗锯齿，浏览器能力，最高支持4倍采样
    multisampling:Math.max(4, scene.userData.renderer.capabilities.maxSamples)
})

const renderPass = new RenderPass(scene, scene.userData.camera)
//发光
const bloomEffect = new SelectiveBloomEffect(scene, scene.userData.camera, {
    blendFunction: BlendFunction.ADD,
    luminanceThreshold: 0.999,
    luminanceSmoothing: 0.025,
    intensity: 1.5
})
//抗锯齿
const smaaEffect = new SMAAEffect();


// 环境光遮蔽
const normalPass = new NormalPass(scene, scene.userData.camera);

const ssaoEffect = new SSAOEffect(scene.userData.camera, normalPass.texture, {
    blendFunction: BlendFunction.MULTIPLY,
    samples: 16,
    rings: 4,
    luminanceInfluence:1,
    radius:0.01,
    bias:0.01,
    intensity:0.2
})


// 创建效果通道
const effectPass = new EffectPass(
    scene.userData.camera, 
    // bloomEffect, 
    smaaEffect, 
    ssaoEffect
)

composer.addPass(renderPass)
composer.addPass(effectPass)

export default composer
