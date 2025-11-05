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

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;          //screen coordinate
    vec2 mouse=u_mouse.xy/u_resolution.xy;
    mouse.y=1.0-mouse.y;

    float breathing=(exp(sin(u_time*2.0*3.14159/5.0)) - 0.36787944)*0.42545906412; 
    float value=mouseEffect(uv,mouse,0.03*breathing+0.22);

    vec3 col = texture2D(u_tex0, uv).rgb*value;
    col=vNormal;
    //col=normalize(positionVec4.xyz);
       
    gl_FragColor = vec4(col, 1.0);
}



