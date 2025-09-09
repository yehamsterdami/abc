let totalTouches = 0; // Add this line

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");
}

function draw() {
  background(90, 200, 190);
  fill(255, 150);
  noStroke();
  circle(width/2, height/2, 300); 

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Touch the screen!", width/2, height/2);

  fill(0);
  textSize(16);
  text("Current touches: " + touches.length, width/2, height/2 + 40);
  text("Total touches: " + totalTouches, width/2, height/2 + 70);

}

// P5 touch events: https://p5js.org/reference/#Touch

function touchStarted() {
   totalTouches++;
  console.log("Total touches: " + totalTouches);
}

function touchMoved() {
}

function touchEnded() {
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}


