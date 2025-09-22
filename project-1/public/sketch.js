let song;

let cols, rows, size = 10;
let d = [];
let max;
let colors = ["#f72585","#b5179e","#7209b7","#560bad","#480ca8",
              "#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0"];
let rings = 2;

function preload() {
  song = loadSound('assets/きゅびびびびずむ (1).mp3'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  
  song.loop();

  cols = width / size;
  rows = height / size;

  max = sqrt(pow(width/2, 2) + pow(height/2, 2));

  for (let i = 0; i < cols; i++) {
    d[i] = [];
    for (let j = 0; j < rows; j++) {
      let x = i * size + size/2;
      let y = j * size + size/2;
      d[i][j] = dist(x, y, width/2, height/2);
    }
  }

  angleMode(DEGREES);
}

function draw() {
  background(255);

  
  let alpha = rotationZ; 
  let beta = rotationX;  
  let gamma = rotationY; 

  // ---- audio ----
  // alpha - speed
  let playRate = map(alpha, 0, 360, 0.5, 2);
  song.rate(playRate);

  // beta - volume
  let vol = map(beta, -90, 90, 0, 1, true);
  song.setVolume(vol);

  // gamma - pitch 
  let pitchShift = map(gamma, -90, 90, 0.8, 1.2);
  song.rate(playRate * pitchShift);

  // visuals
  let amplitude = map(vol, 0, 1, 0, 15); 

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * size + size/2;
      let y = j * size + size/2;
      let index = floor(map(abs(d[i][j]), 0, max, 0, colors.length * rings));

      // gamma 
      let shiftIndex = floor(map(gamma, -90, 90, 0, colors.length));
      let c = colors[(index + shiftIndex) % colors.length];

      fill(c);
      strokeWeight(1);
      ellipse(x, y, size, size);

      d[i][j] -= amplitude;
    }
  }

  //text
  noStroke();
  fill(0);
  textSize(16);
  textAlign(CENTER);
  text("Alpha (Z): " + nf(alpha,1,1) + "°  → playspeed: " + nf(playRate,1,2) + "x", width/2, height-60);
  text("Beta (X): " + nf(beta,1,1) + "°  → volume: " + nf(vol,1,2), width/2, height-40);
  text("Gamma (Y): " + nf(gamma,1,1) + "°  → pitch", width/2, height-20);
}
