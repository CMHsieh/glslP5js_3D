let shaderOne;
let img;
let mesh;
//let pass1;

function preload(){
  shaderOne = loadShader('shader.vert', 'shader.frag');
  img = loadImage('rgb-perlin-seamless-512.png');
  mesh = loadModel('Snowastronaut.obj', true); //true is key!
}


function setup() {
  pixelDensity(1); //important!!!
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight, WEBGL); //createCanvas(windowWidth, windowHeight);
  noStroke();

  // initialize the createGraphics layers
  //pass1 = createGraphics(windowWidth, windowHeight, WEBGL);
  //pass1.noStroke();  
}

function draw() {
  background(125); //refresh
  //drag to move the world.
  orbitControl();

  // set the shader for our first pass 
  shader(shaderOne);          //pass1.shader(shaderOne);
  shaderOne.setUniform('u_tex0', img);
  shaderOne.setUniform('u_resolution', [width, height]);
  shaderOne.setUniform('u_mouse', [mouseX, mouseY]);
  shaderOne.setUniform('u_time', millis() / 1000.0);
  
  // we need to make sure that we draw the rect inside of pass1
  //rect(0,0,width, height);    //pass1.rect(0,0,width, height);
  //rect(width * -0.5, height * -0.5, width, height);
  
  // draw the pass to the screen
  //image(pass1, 0,0, width, height);

  // Draw some geometry to the screen
  push();
  //translate(0, 0, 220);
  rotateY(-1.57);
  scale(3.0, -3.0, 3.0);
  model(mesh);
  pop();

  translate(0, 0, -800);
  //sphere(width / 8, 200, 200);
  box(width / 1.);
  //cylinder(width / 10, width / 5, 24, 24, true, true);
  
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

