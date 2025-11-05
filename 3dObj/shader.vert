#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform sampler2D u_tex0;
uniform float u_time;
varying vec3 vNormal;
varying vec3 vEye;
varying vec2 vTexCoord;
varying vec4 positionVec4;

void main() {
  // copy the position data into a vec4, using 1.0 as the w component
  positionVec4 = vec4(aPosition, 1.0); //vec4(aPosition * 2.0 - 1.0, 1.0);

  vec2 st = fract( positionVec4.xy*0.15 + u_time*0.0 );
  //positionVec4.xyz += (texture2D(u_tex0, st).xyz*2.0-1.0)*1.8; //two-side offset 

  // We need to calculate the world space eye position, and the world space normal
  vEye = normalize( vec3(uModelViewMatrix * positionVec4));

  // Typically you would use uNormalMatrix instead of uModelViewMatrix but currently there is a bug in uNormalMatrix
  // uModelViewMatrix will work fine here unless you are doing some non-uniform scaling
  vNormal = normalize((uModelViewMatrix * vec4(aNormal, 0.0)).xyz);

  //gl_Position = vec4(aPosition * 2.0 - 1.0, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;

}

/*
//---@ Quartz Composer----
void main()
{
	//Transform vertex by modelview and projection matrices
	gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	
	//Forward current color and texture coordinates after applying texture matrix
	gl_FrontColor = gl_Color;
	gl_TexCoord[0] = gl_TextureMatrix[0] * gl_MultiTexCoord0;
}*/
