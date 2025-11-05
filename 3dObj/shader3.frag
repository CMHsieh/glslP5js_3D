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

// expose previously hardcoded controls as uniforms for interactive tuning
int u_mode=0;       // 0=TW,1=AR,2=WO,3=MT
float u_scale=5.0;    // global scale (recommended 2.0..10.0)
float u_pixel=4.5;    // medium pixel/block size (recommended 6.0..20.0)
float u_seed=0.0;     // animation/variation seed (0..10)

// new uniforms for interactive mid multiplier and quantization thresholds
float u_midMult=1.25;  // multiply mid-scale contribution (default ~1.25)
float u_th0=0.1;      // threshold 0 -> level1 lower bound (default ~0.28)
float u_th1=0.4;      // threshold 1 -> level2 lower bound (default ~0.40)
float u_th2=0.43;      // threshold 2 -> level3 lower bound (default ~0.88)

#define PI 3.14159265359

// small helpers
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p + 1.2345)); }
vec2 fade2(vec2 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

// gradient noise (Perlin)
float perlin(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = fade2(f);
    vec2 g00 = vec2(cos(hash21(i+vec2(0.0,0.0))*6.2831), sin(hash21(i+vec2(0.0,0.0))*6.2831));
    vec2 g10 = vec2(cos(hash21(i+vec2(1.0,0.0))*6.2831), sin(hash21(i+vec2(1.0,0.0))*6.2831));
    vec2 g01 = vec2(cos(hash21(i+vec2(0.0,1.0))*6.2831), sin(hash21(i+vec2(0.0,1.0))*6.2831));
    vec2 g11 = vec2(cos(hash21(i+vec2(1.0,1.0))*6.2831), sin(hash21(i+vec2(1.0,1.0))*6.2831));
    float n00 = dot(g00, f - vec2(0.0,0.0));
    float n10 = dot(g10, f - vec2(1.0,0.0));
    float n01 = dot(g01, f - vec2(0.0,1.0));
    float n11 = dot(g11, f - vec2(1.0,1.0));
    return mix(mix(n00,n10,u.x), mix(n01,n11,u.x), u.y);
}

// normalized fbm (multi-scale)
float fbm(vec2 p){
    float amp = 0.55;
    float sum = 0.0;
    float w = 0.0;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for(int i=0;i<6;i++){
        sum += amp * perlin(p);
        w += amp;
        p = rot * p * 2.0;
        amp *= 0.5;
    }
    return sum / w * 0.5 + 0.5;
}

// small cellular-ish for angular digital blobs
float cell(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float best = 1.0;
    for(int y=-1;y<=1;y++){
        for(int x=-1;x<=1;x++){
            vec2 b = vec2(float(x), float(y));
            vec2 jitter = hash22(i + b);
            vec2 pos = b + jitter - f;
            float d = length(pos);
            best = min(best, d);
        }
    }
    return best;
}

// pixelation helper: create grid-aligned sampling coordinates
vec2 pixelate(vec2 uv, float px){
    return floor(uv * px + 0.5) / px;
}

// smooth min
float smin(float a, float b, float k){
    float h = clamp(0.5 + 0.5*(b-a)/k,0.0,1.0);
    return mix(b,a,h) - k*h*(1.0-h);
}

// palettes for presets
vec3 palette_pick(int mode, int level){
    // Four discrete tones per preset (approximate CADPAT style)
    if(mode==0){ // TW - temperate woodland (greens/browns)
/*      if(level==0) return vec3(0.86,0.79,0.66);
        if(level==1) return vec3(0.48,0.53,0.34);
        if(level==2) return vec3(0.22,0.35,0.18);
        return vec3(0.06,0.08,0.06);*/
        if(level==0) return vec3(0.22,0.35,0.18);
        if(level==1) return vec3(0.48,0.53,0.34);
        if(level==2) return vec3(0.06,0.08,0.06);
        return  vec3(0.86,0.79,0.66);
    } else if(mode==1){ // AR - arid / desert (tans)
        if(level==0) return vec3(0.96,0.93,0.84);
        if(level==1) return vec3(0.80,0.72,0.55);
        if(level==2) return vec3(0.58,0.46,0.30);
        return vec3(0.30,0.22,0.14);
    } else if(mode==2){ // WO - winter / snow (whites / grey)
        if(level==0) return vec3(0.99,0.99,1.00);
        if(level==1) return vec3(0.86,0.88,0.90);
        if(level==2) return vec3(0.66,0.69,0.72);
        return vec3(0.36,0.40,0.42);
    } else { // MT - multi-terrain (blue-green-neutral mix)
        if(level==0) return vec3(0.85,0.88,0.86);
        if(level==1) return vec3(0.45,0.58,0.50);
        if(level==2) return vec3(0.24,0.36,0.30);
        return vec3(0.09,0.12,0.11);
    }
}

// CADPAT-style procedural pattern as external function:
// input: uv (0..1), mode (0..3)
// output: color (vec3)
vec3 camoCADPAT(vec2 uv_in){
    // fallbacks for uniforms
    float scale = (u_scale==0.0) ? 5.5 : u_scale;
    float pixel = (u_pixel==0.0) ? 12.0 : u_pixel;
    float seed = (u_seed==0.0) ? 1.0 * 437.0 : u_seed * 437.0;

    float midMult = (u_midMult <= 0.0001) ? 1.25 : u_midMult;
    float th0 = (u_th0 <= 0.0001) ? 0.18 : u_th0;
    float th1 = (u_th1 <= 0.0001) ? 0.30 : u_th1;
    float th2 = (u_th2 <= 0.0001) ? 0.53 : u_th2;

    int mode = u_mode;

    // maintain aspect and convert uv to centered pos space
    vec2 pos = (uv_in - 0.5) * vec2(u_resolution.x/u_resolution.y, 1.0);

    // base coordinate with gentle motion
    vec2 p = pos * scale + vec2(seed*0.001, seed* -0.002) + vec2(u_time * 0.01, -u_time * 0.007);

    // LARGE organic blotches from low-freq fbm
    float large = fbm(p * 0.6 + vec2(12.3,7.1));

    // MEDIUM digital blocks: pixelate sampling of cellular noise / fbm to create squared pixels
    vec2 pm = p * 1.8 + vec2(4.2, -2.1);
    pm += vec2(0.6, -0.3) * fbm(pm * 0.9 + vec2(2.1));
    vec2 pm_pix = pixelate(pm, pixel);
    float mid = 1.0 - smoothstep(0.12, 0.5, cell(pm_pix * 1.6 + vec2(3.2)));
    // apply user-controlled mid-scale multiplier (increases proportion of level-2)
    mid *= midMult;
    mid = clamp(mid, 0.0, 1.0);

    // SMALL scale micro texture
    float small = fbm(p * 8.0 + vec2(9.1,4.7));

    // combine with smooth blending to retain layered look
    float mixLM = smin(large, mid * 0.95, 0.12);
    float combined = smin(mixLM, small * 0.8, 0.06);

    // quantize into 4 levels with slight dithering
    float dither = (hash21(floor((pos + seed*0.001)*300.0)) - 0.5) * 0.03;
    float tone = clamp(combined + dither, 0.0, 1.0);

    // use user-provided thresholds for mapping tone -> discrete level
    int level = 0;
    if (tone > th2) level = 3;
    else if (tone > th1) level = 2;
    else if (tone > th0) level = 1;
    else level = 0;

    // subtle variation per-patch
    float variation = fbm(p * 3.0 + vec2(7.0,2.3));

    // pick color and apply slight variation
    vec3 col = palette_pick(mode, level);
    col *= (0.92 + 0.16 * variation);

    // micro-pixel overlay: stronger, higher-density grid to emphasize micro-level pixels
    vec2 microDensity = vec2(180.0, 140.0);
    vec2 microUV = (pos + u_time * 0.01) * microDensity;
    vec2 microCell = floor(microUV) / microDensity;
    float microN = fbm(microCell * 80.0 + vec2(5.0));
    float microMask = smoothstep(0.58, 0.78, microN) * 0.18;

    vec2 mpos = fract(microUV);
    float mpx = step(0.5, mpos.x);
    float mpy = step(0.5, mpos.y);
    float block = mpx * mpy;

    float cellRnd = hash21(floor(microUV));
    float blockMask = mix(0.65, 1.0, cellRnd);

    float microOverlay = microMask * block * blockMask;

    col = mix(col, col * 0.45, microOverlay);
    col += (hash21(floor(pos * 1024.0)) - 0.5) * 0.05 * microMask;

    // final toning and clamp
    col = pow(clamp(col, 0.0, 1.0), vec3(1.5));

    return col;
}

vec3 cubeproj(in vec3 p, in float str)
{
    vec3 x = vec3(camoCADPAT(p.zy/p.x));
    vec3 y = vec3(camoCADPAT(p.xz/p.y));
    vec3 z = vec3(camoCADPAT(p.xy/p.z));
    
    p = abs(p);
    if (p.x > p.y && p.x > p.z) return x;
    else if (p.y > p.x && p.y > p.z) return y;
    else return z;
}

vec3 texhTriplanar(in vec3 p, in vec3 n, in float str)
{
    vec3 x = camoCADPAT(p.yz);
    vec3 y = camoCADPAT(p.zx);
    vec3 z = camoCADPAT(p.xy);
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
    col= vec3(cubeproj(positionVec4.xyz, 0.0 ));
    //col= vec3(texhTriplanar(normalize(positionVec4.xyz)*1.5, vNormal, 0.0));
       
    gl_FragColor = vec4(col, 1.0);
}



