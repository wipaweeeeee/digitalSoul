var canvas = document.getElementById("main");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var gl = canvas.getContext('webgl');

var NUM_METABALLS = 2;
var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var soulCount = 0;
var metaballs = [];

function soulAdded() {

  NUM_METABALLS++;
  makeBall();
  console.log(metaballs.length);
  fragShader(NUM_METABALLS);
  socket.emit('soulAdded', null);

}

function soulLeft() {
  console.log('soul left');
  console.log(metaballs.length);
  metaballs.splice(0, 1);
  console.log(metaballs.length);
  if(NUM_METABALLS != 0){
  fragShader(NUM_METABALLS);
  }else{}
}

/*** Shaders ***/

function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }

    return shader;
}

var vertexShader = compileShader('\n\
attribute vec2 position;\n\
\n\
void main() {\n\
    // position specifies only x and y.\n\
    // We set z to be 0.0, and w to be 1.0\n\
    gl_Position = vec4(position, 0.0, 1.0);\n\
}\
', gl.VERTEX_SHADER);

var fragmentShader;

function fragShader(NUM_METABALLS) {
 fragmentShader = compileShader('\n\
  precision highp float;\n\
  uniform vec4 u_Color;\n\
  const int NUM_METABALLS = ' + NUM_METABALLS + ';\n\
  uniform vec3 metaballs[NUM_METABALLS];\n\
  const float WIDTH = ' + WIDTH + '.0;\n\
  const float HEIGHT = ' + HEIGHT + '.0;\n\
    void main(){\n\
      float x = gl_FragCoord.x;\n\
      float y = gl_FragCoord.y;\n\
      float v = 0.0;\n\
      for (int i = 0; i <  NUM_METABALLS ; i++) {\n\
          vec3 mb = metaballs[i];\n\
          float dx = mb.x - x;\n\
          float dy = mb.y - y;\n\
          float r = mb.z;\n\
          v += r*r/(dx*dx + dy*dy);\n\
      }\n\
          if (v > 1.0) {\n\
              gl_FragColor = vec4(y/HEIGHT, x/WIDTH, 1.0, 0.1);\n\
          } else {\n\
              gl_FragColor = vec4(x/WIDTH, y/HEIGHT, 1.0, 0.1);\n\
          }\n\
  }\n\
  ', gl.FRAGMENT_SHADER);
}

fragShader(50);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

var vertexData = new Float32Array([
    -1.0,  1.0, // top left
    -1.0, -1.0, // bottom left
     1.0,  1.0, // top right
     1.0, -1.0, // bottom right
]);
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

/*** Attribute setup ***/

function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
        throw 'Can not find attribute ' + name + '.';
    }
    return attributeLocation;
}

var positionHandle = getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle,
                       2, 
                       gl.FLOAT, 
                       gl.FALSE, 
                       2 * 4, 
                       0 
                       );

/*** Simulation setup ***/

function makeBalls() {
  var new_array = []
    for (var i = 0; i < NUM_METABALLS; i++) {
      var radius = 85;
      new_array.push({
        x: Math.random() * WIDTH/2,
        y: Math.random() * (HEIGHT - 2 * radius) + radius * 2,
        vx: Math.random() * Math.cos(30 * Math.PI / 180) * 2,
        vy: Math.random() * Math.sin(30 * Math.PI / 180) * 2,
        r: radius
      });
    }
    return new_array
}

var metaballs = makeBalls();

function makeBall() {
    var radius = Math.random() * 65;
    metaballs.push({
          x: Math.random() * WIDTH/2,
          y: Math.random() * (HEIGHT - 2 * radius) + radius * 2,
          vx: Math.random() * Math.cos(30 * Math.PI / 180) * 2,
          vy: Math.random() * Math.sin(30 * Math.PI / 180) * 2,
          r: radius
    });
}

/*** Uniform setup ***/

function getUniformLocation(program, name) {
    var uniformLocation = gl.getUniformLocation(program, name);
    if (uniformLocation === -1) {
        throw 'Can not find uniform ' + name + '.';
    }
    return uniformLocation;
}

var metaballsHandle = getUniformLocation(program, 'metaballs');
var u_colorLocation = gl.getUniformLocation(program, 'u_Color');


function step() {
  // Update positions and speeds

  for (var i = 0; i < metaballs.length; i++) {
    var mb = metaballs[i];
    
    mb.x += mb.vx;
    if (mb.x - mb.r < 0) {
      mb.x = mb.r + 1;
      mb.vx = Math.abs(mb.vx);
    } else if (mb.x + mb.r > WIDTH) {
      mb.x = WIDTH - mb.r;
      mb.vx = -Math.abs(mb.vx);
    }
    mb.y += mb.vy;
    if (mb.y - mb.r < 0) {
      mb.y = mb.r + 1;
      mb.vy = Math.abs(mb.vy);
    } else if (mb.y + mb.r > HEIGHT) {
      mb.y = HEIGHT - mb.r;
      mb.vy = -Math.abs(mb.vy);
    }
  }

  var dataToSendToGPU = new Float32Array(3 * NUM_METABALLS);
  for (var i = 0; i < metaballs.length; i++) {
    var baseIndex = 3 * i;
    var mb = metaballs[i];
    dataToSendToGPU[baseIndex + 0] = mb.x;
    dataToSendToGPU[baseIndex + 1] = mb.y;
    dataToSendToGPU[baseIndex + 2] = mb.r;
  }
  gl.uniform3fv(metaballsHandle, dataToSendToGPU);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(step);
};

step();
