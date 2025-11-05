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

// simple integer hash
float hash12(vec2 p){
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

// sample a cell-aligned value (sharp pixel blocks)
float cellValue(vec2 uv, float scale, float seed){
    vec2 cell = floor(uv * scale + seed);
    return hash12(cell);
}

// palette presets: woodland/desert/snow selector by mouse.x
vec3 paletteColor(int idx, int preset){
    if(preset==0){ // woodland-like greens
        if(idx==0) return vec3(0.06,0.16,0.07);
        if(idx==1) return vec3(0.18,0.33,0.16);
        if(idx==2) return vec3(0.40,0.36,0.18);
        return vec3(0.72,0.68,0.58);
    } else if(preset==1){ // desert tans
        if(idx==0) return vec3(0.78,0.73,0.62);
        if(idx==1) return vec3(0.56,0.48,0.32);
        if(idx==2) return vec3(0.38,0.33,0.22);
        return vec3(0.24,0.20,0.14);
    } else { // snow / arctic
        if(idx==0) return vec3(0.98,0.98,0.99);
        if(idx==1) return vec3(0.86,0.88,0.92);
        if(idx==2) return vec3(0.66,0.70,0.76);
        return vec3(0.36,0.38,0.40);
    }
}

// CADPAT-style procedural pattern as external function
// input: uv (0..1, already aspect-corrected)
// output: col (rgb)
vec3 camoCADPAT(vec2 uv, int preset){
    float S1 = 60.0; // fine speckles
    float S2 = 34.0; // medium blocks
    float S3 = 30.0; // larger mask shapes

    // seeds for variety
    float seed1 = 0.1;
    float seed2 = 7.3;
    float seed3 = 13.7;

    // compute cell values (0..1)
    float v1 = cellValue(uv, S1, seed1);
    float v2 = cellValue(uv, S2, seed2);
    float v3 = cellValue(uv, S3, seed3);

    // sharpen thresholds (tweak to taste)
    float t1 = 0.5; //0.55
    float t2 = 0.57; //0.47
    float t3 = 0.46; //0.5

    // masks from cells
    float m1 = step(t1, v1); // fine detail mask
    float m2 = step(t2, v2); // medium blocks
    float m3 = step(t3, v3); // large shapes

    // start with base color (index 0)
    vec3 col = paletteColor(0, preset);

    // medium blocks override some area
    if(m2 > 0.5){
        col = paletteColor(1, preset);
    }

    // large shapes override with another tone but keep some mixing for variety
    if(m3 > 0.5){
        float pick = hash12(floor(uv * S3 + seed3));
        if(pick < 0.5) col = mix(col, paletteColor(2, preset), 0.95);
        else col = mix(col, paletteColor(3, preset), 0.95);
    }

    // overlay fine speckles to break edges
    if(m1 > 0.5){
        float speckPick = hash12(floor(uv * S1 + seed1*2.0));
        vec3 speckCol = speckPick < 0.5 ? paletteColor(0,preset) : paletteColor(1,preset);
        col = mix(col, speckCol, 0.45);
    }

    // add slight pixel-grid accent (thin outlines) to emphasize digital look
    vec2 gcell = fract(uv * S2);
    float grid = step(0.02, min(gcell.x, gcell.y)); // thin inner area
    col *= mix(0.92, 1.0, grid);

    // micro-pixel accent (higher-frequency noise) to emphasize textile detail
    float micro = cellValue(uv, S1*2.0, seed1*3.0);
    float microMask = step(0.82, micro) * 0.12;
    col = mix(col, col * 0.6, microMask);

    // subtle gamma/tonal tweak
    col = pow(clamp(col, 0.0, 1.0), vec3(1.0/1.05));

    return col;
}

vec3 cubeproj(in vec3 p, int preset)
{
    vec3 x = vec3(camoCADPAT(p.zy/p.x, preset));
    vec3 y = vec3(camoCADPAT(p.xz/p.y, preset));
    vec3 z = vec3(camoCADPAT(p.xy/p.z, preset));
    
    p = abs(p);
    if (p.x > p.y && p.x > p.z) return x;
    else if (p.y > p.x && p.y > p.z) return y;
    else return z;
}

vec3 texhTriplanar(in vec3 p, in vec3 n, int preset)
{
    vec3 x = camoCADPAT(p.yz, preset);
    vec3 y = camoCADPAT(p.zx, preset);
    vec3 z = camoCADPAT(p.xy, preset);
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
    col= vec3(cubeproj(positionVec4.xyz, 0 ));
    //col= vec3(texhTriplanar(normalize(positionVec4.xyz)*2., vNormal, 0 ));
    //col= vec3(texhTriplanar(positionVec4.xyz*0.04, vNormal, 0 ));
       
    gl_FragColor = vec4(col, 1.0);
}



