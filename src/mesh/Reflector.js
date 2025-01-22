import {
	Color,
	Matrix4,
	Mesh,
	PerspectiveCamera,
	Plane,
	ShaderMaterial,
	UniformsUtils,
	Vector3,
	Vector4,
	WebGLRenderTarget,
	HalfFloatType
} from 'three';
import * as THREE from 'three';

class Reflector extends Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );

		this.isReflector = true;

		this.type = 'Reflector';
		this.camera = new PerspectiveCamera();

		const scope = this;

		const color = ( options.color !== undefined ) ? new Color( options.color ) : new Color( 0x7F7F7F );
		const textureWidth = options.textureWidth || 512;
		const textureHeight = options.textureHeight || 512;
		const clipBias = options.clipBias || 0;
		const shader = options.shader || Reflector.ReflectorShader;
		const multisample = ( options.multisample !== undefined ) ? options.multisample : 4;

		//

		const reflectorPlane = new Plane();
		const normal = new Vector3();
		const reflectorWorldPosition = new Vector3();
		const cameraWorldPosition = new Vector3();
		const rotationMatrix = new Matrix4();
		const lookAtPosition = new Vector3( 0, 0, - 1 );
		const clipPlane = new Vector4();

		const view = new Vector3();
		const target = new Vector3();
		const q = new Vector4();

		const textureMatrix = new Matrix4();
		const virtualCamera = this.camera;

		const renderTarget = new WebGLRenderTarget( textureWidth, textureHeight, { samples: multisample, type: HalfFloatType } );

		const material = new ShaderMaterial( {
			name: ( shader.name !== undefined ) ? shader.name : 'unspecified',
			uniforms: UniformsUtils.clone( shader.uniforms ),
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader
		} );

		material.uniforms[ 'tDiffuse' ].value = renderTarget.texture;
		material.uniforms[ 'color' ].value = color;
		material.uniforms[ 'textureMatrix' ].value = textureMatrix;

		this.material = material;

		this.onBeforeRender = function ( renderer, scene, camera ) {

			reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			view.subVectors( reflectorWorldPosition, cameraWorldPosition );

			// Avoid rendering when reflector is facing away

			if ( view.dot( normal ) > 0 ) return;

			view.reflect( normal ).negate();
			view.add( reflectorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, - 1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( reflectorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( reflectorWorldPosition );

			virtualCamera.position.copy( view );
			virtualCamera.up.set( 0, 1, 0 );
			virtualCamera.up.applyMatrix4( rotationMatrix );
			virtualCamera.up.reflect( normal );
			virtualCamera.lookAt( target );

			virtualCamera.far = camera.far; // Used in WebGLBackground

			virtualCamera.updateMatrixWorld();
			virtualCamera.projectionMatrix.copy( camera.projectionMatrix );

			// Update the texture matrix
			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);
			textureMatrix.multiply( virtualCamera.projectionMatrix );
			textureMatrix.multiply( virtualCamera.matrixWorldInverse );
			textureMatrix.multiply( scope.matrixWorld );

			// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
			// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
			reflectorPlane.setFromNormalAndCoplanarPoint( normal, reflectorWorldPosition );
			reflectorPlane.applyMatrix4( virtualCamera.matrixWorldInverse );

			clipPlane.set( reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant );

			const projectionMatrix = virtualCamera.projectionMatrix;

			q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
			q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
			q.z = - 1.0;
			q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

			// Calculate the scaled plane vector
			clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

			// Replacing the third row of the projection matrix
			projectionMatrix.elements[ 2 ] = clipPlane.x;
			projectionMatrix.elements[ 6 ] = clipPlane.y;
			projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
			projectionMatrix.elements[ 14 ] = clipPlane.w;

			// Render
			scope.visible = false;

			const currentRenderTarget = renderer.getRenderTarget();

			const currentXrEnabled = renderer.xr.enabled;
			const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

			renderer.xr.enabled = false; // Avoid camera modification
			renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

			renderer.setRenderTarget( renderTarget );

			renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897

			if ( renderer.autoClear === false ) renderer.clear();
			renderer.render( scene, virtualCamera );

			renderer.xr.enabled = currentXrEnabled;
			renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

			renderer.setRenderTarget( currentRenderTarget );

			// Restore viewport

			const viewport = camera.viewport;

			if ( viewport !== undefined ) {

				renderer.state.viewport( viewport );

			}

			scope.visible = true;

		};

		this.getRenderTarget = function () {

			return renderTarget;

		};

		this.dispose = function () {

			renderTarget.dispose();
			scope.material.dispose();

		};

	}

}
// 扫描扩散平面特效需要的纹理
let noiseTexture = new THREE.TextureLoader().load('./texture/sci/noise.png')
Reflector.ReflectorShader = {

	name: 'ReflectorShader',

	uniforms: {

		'color': {
			value: null
		},

		'tDiffuse': {
			value: null
		},

		'textureMatrix': {
			value: null
		},
		//添加
		uTime:{
            value:0
        },
        noiseTexture:{
            value:noiseTexture
        }


	},

	vertexShader: /* glsl */`
		uniform mat4 textureMatrix;
		varying vec4 vUv;
		//
		varying vec3 vPoistion;
		varying vec2 tUv;
		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {
			vPoistion = position;
    		tUv = uv;
			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,

		fragmentShader: /* glsl */`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;
		uniform float uTime;
		varying vec3 vPoistion;
		varying vec2 tUv;
		uniform sampler2D noiseTexture;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		#define tau 6.2831853
//sciSpreadPlaneShader的片元着色器特效代码片段

mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x ){return texture2D(noiseTexture, x*.01).x;}

float fbm(in vec2 p)
{	
	float z=2.;
	float rz = 0.;
	vec2 bp = p;
	for (float i= 1.;i < 6.;i++)
	{
		rz+= abs((noise(p)-0.5)*2.)/z;
		z = z*2.;
		p = p*2.;
	}
	return rz;
}

float dualfbm(in vec2 p,float time)
{
    //get two rotated fbm calls and displace the domain
	vec2 p2 = p*.7;
	vec2 basis = vec2(fbm(p2-time*1.6),fbm(p2+time*1.7));
	basis = (basis-.5)*.2;
	p += basis;
	
	//coloring
	return fbm(p*makem2(time*0.2));
}

float circ(vec2 p) 
{
	float r = length(p);
	r = log(sqrt(r));
	return abs(mod(r*4.,tau)-3.14)*3.+.2;

}
void main() {

	#include <logdepthbuf_fragment>

	vec2 auv = tUv-vec2(0.5,0.5);
float iTime = uTime;
float time = iTime*0.1;
vec2 p = auv;
p.x *= 1.0;
p*=4.;

float rz = dualfbm(vec2(tUv.x,tUv.y)*10.0,time);

//rings
p /= exp(mod(time*10.,3.14159));
rz *= pow(abs((0.1-circ(p))),.9);

//final color
vec3 col = vec3(.2,0.1,0.4)/rz;
col=pow(abs(col),vec3(.99));
vec4 finalColor = vec4(col,1.);

	vec4 base = texture2DProj( tDiffuse, vUv );
	vec4 mirrorColor = vec4( blendOverlay( base.rgb, color ), 1.0 );
			//sciSpreadPlaneShader与reflector特效混合
			gl_FragColor = mix(finalColor,mirrorColor,0.5);
			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`
};

export { Reflector };
