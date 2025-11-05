
// // Get the position attribute of the geometry
// attribute vec3 aPosition;

// // Get the texture coordinate attribute from the geometry
// attribute vec2 aTexCoord;

// // When we use 3d geometry, we need to also use some builtin variables that p5 provides
// // Most 3d engines will provide these variables for you. They are 4x4 matrices that define
// // the camera position / rotation, and the geometry position / rotation / scale
// // There are actually 3 matrices, but two of them have already been combined into a single one
// // This pre combination is an optimization trick so that the vertex shader doesn't have to do as much work

// // uProjectionMatrix is used to convert the 3d world coordinates into screen coordinates
// uniform mat4 uProjectionMatrix;

// // uModelViewMatrix is a combination of the model matrix and the view matrix
// // The model matrix defines the object position / rotation / scale
// // Multiplying uModelMatrix * vec4(aPosition, 1.0) would move the object into it's world position

// // The view matrix defines attributes about the camera, such as focal length and camera position
// // Multiplying uModelViewMatrix * vec4(aPosition, 1.0) would move the object into its world position in front of the camera
// uniform mat4 uModelViewMatrix;

// varying vec2 vTexCoord;

// void main(){
  
  //   // copy the position data into a vec4, using 1.0 as the w component
  //   vec4 positionVec4=vec4(aPosition,1.);
  
  //   // Move our vertex positions into screen space
  //   // The order of multiplication is always projection * view * model * position
  //   // In this case model and view have been combined so we just do projection * modelView * position
  //   gl_Position=uProjectionMatrix*uModelViewMatrix*positionVec4;
  
  //   // Send the texture coordinates to the fragment shader
  //   vTexCoord=aTexCoord;
// }

#ifdef GL_ES
precision mediump float;
#endif

// --- from p5.js ---
attribute vec3 aPosition;
attribute vec4 aVertexColor;

// --- Uniforms ---
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

// --- Varyings (pass to fragment shader) ---
varying vec2 vTexCoord;
varying vec4 positionVec4;
varying vec4 vColor;// pass color to fragment shader

void main(){
  //將aPosition複製到一個vec4中
  vec4 pos=vec4(aPosition,1.);
  
  // --- 關鍵修正：在這裡直接修正模型座標 ---
  // 1. 將中心點從 (0.5, 0.5, 0.5) 移到原點 (0, 0, 0)
  pos.xyz-=.5;
  
  // 2. 放大 400 倍
  pos.xyz*=400.;
  
  // 3. 繞 X 軸旋轉 180 度 (等同於將 Y 和 Z 軸反轉)
  pos.y*=-1.;
  pos.z*=-1.;
  // -----------------------------------------
  
  // 後續的程式碼使用修正後的 pos，而不是 aPosition
  positionVec4=pos;
  
  vColor=aVertexColor;
  
  // 使用修正後的 pos 進行最終的投影計算
  gl_Position=uProjectionMatrix*uModelViewMatrix*positionVec4;
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
