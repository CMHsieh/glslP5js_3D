let shaderOne;
let p5Model;

function preload(){
  shaderOne = loadShader('shader.vert', 'shader.frag');
  
  loadStrings('./data/CM_vert-xyz', (stringData) => {
    // 使用 parser 解析純數據
    const rawModel = parseProjectronData(stringData.join('\n'));

    // 在 p5 環境中初始化 p5Model
    p5Model = {
      vertices: [],
      colors: []
    };

    // 將純數字陣列轉換為 p5.Vector 物件
    for (const v of rawModel.vertices) {
      p5Model.vertices.push(createVector(v[0], v[1], v[2]));
    }

    // 設定顏色模式，然後將純數字陣列轉換為 p5.Color 物件
    // 這裡使用 RGB 0-1 模式，因為我們的原始數據就是這個範圍
    colorMode(RGB, 1); 
    for (const c of rawModel.colors) {
      p5Model.colors.push(color(c[0], c[1], c[2], c[3]));
    }

    console.log('p5 model created:', p5Model);
    console.log(p5Model.vertices.length / 3 + ' polygons loaded.');
  });
}


function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();

  colorMode(RGB, 1); // 使用 0-1 範圍的 RGB 模式

 // --- gl settings ---
  const gl = drawingContext;
  gl.disable(gl.DEPTH_TEST);
  // --- alpha blend ---
  blendMode(BLEND);
  // gl.enable(gl.BLEND)
	// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  // -----------------
}


function draw() {
  if (!p5Model) {
    background(0);
    // 可以顯示載入提示
    return;
  }

  background(0); 
  noLights();
  
  orbitControl(3, 3, 3);

  shader(shaderOne);
  shaderOne.setUniform('u_resolution', [width, height]);
  shaderOne.setUniform('u_mouse', [mouseX, mouseY]);
  shaderOne.setUniform('u_time', millis() / 1000.0);
  
  drawObjXYZ();
}

function drawObjXYZ() {
  if (!p5Model) return;

  push();
  beginShape(TRIANGLES);
  for (let i = 0; i < p5Model.vertices.length; i++) {
    fill(p5Model.colors[i]);
    const v = p5Model.vertices[i];
    vertex(v.x, v.y, v.z);
  }
  endShape();
  pop();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  hud.resizeCanvas(windowWidth, windowHeight);
}

function doubleClicked(){
  camera(0, 0, 800, 0, 0, -1, 0, 1, 0);
}