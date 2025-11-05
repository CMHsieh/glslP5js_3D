
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

varying vec2 vTexCoord;
varying vec4 vColor;// from vertex shader

vec3 rgb2hsb(in vec3 c);
vec3 hsb2rgb(in vec3 c);

void main(){
    // 將傳入的 RGBA 顏色中的 RGB 部分轉換為 HSB
    vec3 hsb=rgb2hsb(vColor.rgb);
    
    // hsb.y*=1.2;
    hsb.z*=.7;
    hsb.z=pow(hsb.z,3.);
    
    float alpha=vColor.a;
    alpha=pow(alpha,2.);
    alpha=clamp(alpha,.3,.6);
    
    // 將修改後的 HSB 顏色轉換回 RGB
    vec3 finalRgb=hsb2rgb(hsb);
    
    // 輸出最終的 RGBA 顏色
    gl_FragColor=vec4(finalRgb,alpha);
}

/* === RGB to HSB === */

vec3 rgb2hsb( in vec3 c ){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
    vec4(c.gb, K.xy),
    step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
    vec4(c.r, p.yzx),
    step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
    d / (q.x + e),
q.x);
}

/* === HSB to RGB === */

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(in vec3 c){
vec3 rgb=clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),
6.)-3.)-1.,
0.,
1.);
rgb=rgb*rgb*(3.-2.*rgb);
return c.z*mix(vec3(1.),rgb,c.y);
}