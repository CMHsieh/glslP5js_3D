// Author:CMH
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0; //perlin noise
varying vec3 vNormal;
varying vec3 vEye;
varying vec2 vTexCoord;
varying vec4 positionVec4;


float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return smoothstep(size*1.9, size, dist);  //size
    //return pow(dist, 0.5);
}

vec2 hash2( vec2 x )           //亂數範圍 [0,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [0,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );   
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                     dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                     dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(in vec2 uv)       //äº‚æ•¸ç¯„åœ [-1,1]
{
    float f;                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*gnoise( uv ); uv = m*uv;         
    f += 0.2500*gnoise( uv ); uv = m*uv;
    f += 0.1250*gnoise( uv ); uv = m*uv;
    f += 0.0625*gnoise( uv ); uv = m*uv;
    return f;
}

//hatching
float texh(in vec2 p, in float str)
{
    float rz= 1.0;
    int j=10;
    for (int i=0;i<10;i++){
        float pas=float(i)/float(j);
        float g = gnoise(vec2(1., 80.)*p); //亂數範圍 [0,1]
        g=smoothstep(0.17*(1.0-pas), 0.35*(1.0-pas), g);
        p.xy = p.yx;
        p += 0.07;
        p*= 1.2;
        rz = min(1.-g,rz);
        if ( 1.0-pas < str) break;     
    }
    return rz;
}

vec3 cubeproj(in vec3 p, in float str)
{
    vec3 x = vec3(texh(p.zy/p.x,str));
    vec3 y = vec3(texh(p.xz/p.y,str));
    vec3 z = vec3(texh(p.xy/p.z,str));
    
    p = abs(p);
    if (p.x > p.y && p.x > p.z) return x;
    else if (p.y > p.x && p.y > p.z) return y;
    else return z;
}

float texhTriplanar(in vec3 p, in vec3 n, in float str)
{
    float x = texh(p.yz,str);
    float y = texh(p.zx,str);
    float z = texh(p.xy,str);
    n *= n;
    return x*abs(n.x) + y*abs(n.y) + z*abs(n.z);
}


void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;          //screen coordinate
    vec2 mouse=u_mouse.xy/u_resolution.xy;
    mouse.y=1.0-mouse.y;

    float breathing=(exp(sin(u_time*2.0*3.14159/5.0)) - 0.36787944)*0.42545906412; 
    float value=mouseEffect(uv,mouse,0.03*breathing+0.22);

    vec3 col = texture2D(u_tex0, uv).rgb*value;
    col=vNormal;
    //col=normalize(positionVec4.xyz);
    //col=vec3(pow(dot(vNormal,-vEye),5.0));
    //col= vec3(cubeproj(normalize(positionVec4.xyz)*0.5, pow(dot(vNormal,-vEye),5.0) ));
    col= vec3(texhTriplanar(normalize(positionVec4.xyz)*1.5, vNormal, pow(dot(vNormal,-vEye),8.0) ));
       
    gl_FragColor = vec4(col, 1.0);
}



