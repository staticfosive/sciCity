export let vertexShader = /* glsl */ `
varying vec3 vPoistion;
varying vec2 tUv;

void main() {
    vPoistion = position;
    tUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export let fragmentShader = /* glsl */ `
uniform float uTime;
varying vec3 vPoistion;
varying vec2 tUv;
uniform sampler2D noiseTexture;
// Noise animation - Electric
// by nimitz (stormoid.com) (twitter: @stormoid)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

//The domain is displaced by two fbm calls one for each axis.
//Turbulent fbm (aka ridged) is used for better effect.

// #define time iTime*0.15
#define tau 6.2831853

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

void main(){
    // vec2 uv = (fragCoord*2.-iResolution.xy)/iResolution.y;
    vec2 auv = tUv-vec2(0.5,0.5);
    float iTime = uTime;
    //这里time修改特效运转速度
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
    gl_FragColor = finalColor;
}
`