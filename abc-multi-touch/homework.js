let totalTouches = 0; 
let particles = [];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

  // create a bunch of floating particles
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-1, 1),
      vy: random(-1, 1)
    });
  }
}

function draw() {
  background(20, 30, 60);

  // Draw particles and apply finger gravity
  for (let p of particles) {
    // gravity effect from each finger
    for (let t of touches) {
      let dx = t.x - p.x;
      let dy = t.y - p.y;
      let d = max(10, sqrt(dx*dx + dy*dy)); // distance
      let force = 50 / (d * d); // gravitational-like pull
      p.vx += force * dx / d;
      p.vy += force * dy / d;
    }

    // move particle
    p.x += p.vx;
    p.y += p.vy;

    // friction 
    p.vx *= 0.95;
    p.vy *= 0.95;

    // wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // draw particle
    fill(255);
    noStroke();
    circle(p.x, p.y, 4);
  }

  // HUD text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Current touches: " + touches.length, width/2, height - 60);
  text("Total touches: " + totalTouches, width/2, height - 40);
  text("Each finger = gravity source!", width/2, height - 20);
}

function touchStarted() {
  totalTouches++;
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}