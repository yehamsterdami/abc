let imgs = [];
let mergedCanvas;
let running = false;
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  mergedCanvas = createGraphics(600, 600);
  mergedCanvas.pixelDensity(1);

  document.getElementById("imgUpload").addEventListener("change", handleFiles);

  noLoop();
}

function mergeAllImages() {
  let g = createGraphics(600, 600);
  g.pixelDensity(1);
  g.background(0);

  // draw each image with fading opacity
  for (let i = 0; i < imgs.length; i++) {
    let img = imgs[i];
    img.resize(600, 0);

    g.tint(255, 150 / (i + 1));  // stack with decreasing alpha
    g.image(img, 0, 0);
  }

  g.noTint();
  return g;
}


function handleFiles(e) {
  let files = e.target.files;
  imgs = [];
  t = 0;

  mergedCanvas.clear();
  background(0);

  for (let f of files) {
    let img = loadImage(URL.createObjectURL(f), () => {
      if (imgs.length === files.length - 1) {
        // All images loaded
        let merged = mergeAllImages();
        startDistortion(merged);
        loop();
      }
    });
    imgs.push(img);
  }
}


function draw() {
  background(0);
  drawDistortion();
}



/* -----------------------------------------------------------
   DISTORTION ENGINE (paste at bottom of sketch.js)
----------------------------------------------------------- */

class DistortedImage {
  constructor(inputImg, tileSize = 20) {
    this.original = inputImg;
    this.tileSize = tileSize;

    this.img = inputImg.get(); 
    this.img.resize(600, 0);

    this.cols = floor(this.img.width / tileSize);
    this.rows = floor(this.img.height / tileSize);

    this.tiles = [];
    for (let i = 0; i < this.cols; i++) {
      this.tiles[i] = [];
      for (let j = 0; j < this.rows; j++) {
        this.tiles[i][j] = this.img.get(
          i * tileSize,
          j * tileSize,
          tileSize,
          tileSize
        );
      }
    }

    this.timer = 0;
    this.distortionLevel = 0; 
  }

  update() {
    this.timer++;
    if (this.timer % 30 === 0) {
      this.distortionLevel += 1;
    }
  }

  draw(x, y) {
    push();
    translate(x, y);
    background(0);

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {

        let tx = i * this.tileSize;
        let ty = j * this.tileSize;

        push();
        translate(tx, ty);

        let p = constrain(this.distortionLevel * 0.02, 0, 0.8);

        if (random() < p) {
          this.applyRandomDistortion(this.tiles[i][j]);
        } else {
          image(this.tiles[i][j], 0, 0);
        }

        pop();
      }
    }

    pop();
  }

  applyRandomDistortion(tile) {
    let r = floor(random(5));

    switch (r) {
      case 0:
        this.flipH(tile);
        break;
      case 1:
        this.flipV(tile);
        break;
      case 2:
        this.rotateTile(tile);
        break;
      case 3:
        this.pixelate(tile);
        break;
      case 4:
        this.colorShift(tile);
        break;
    }

    image(tile, 0, 0);
  }

  flipH(tile) {
    push();
    scale(-1, 1);
    image(tile, -this.tileSize, 0);
    pop();
  }

  flipV(tile) {
    push();
    scale(1, -1);
    image(tile, 0, -this.tileSize);
    pop();
  }

  rotateTile(tile) {
    push();
    translate(this.tileSize / 2, this.tileSize / 2);
    rotate(floor(random(4)) * HALF_PI);
    image(tile, -this.tileSize / 2, -this.tileSize / 2);
    pop();
  }

  pixelate(tile) {
    tile.loadPixels();
    for (let i = 0; i < tile.width; i += 4) {
      for (let j = 0; j < tile.height; j += 4) {
        let c = tile.get(i, j);
        for (let dx = 0; dx < 4; dx++) {
          for (let dy = 0; dy < 4; dy++) {
            if (i + dx < tile.width && j + dy < tile.height) {
              tile.set(i + dx, j + dy, c);
            }
          }
        }
      }
    }
    tile.updatePixels();
  }

  colorShift(tile) {
    tile.loadPixels();
    for (let i = 0; i < tile.pixels.length; i += 4) {
      tile.pixels[i] += random(-20, 20);
      tile.pixels[i+1] += random(-20, 20);
      tile.pixels[i+2] += random(-20, 20);
    }
    tile.updatePixels();
  }
}

// --- Global instance ---
let distortedImg = null;

function startDistortion(p5Image) {
  distortedImg = new DistortedImage(p5Image, 20);
}

function drawDistortion() {
  if (distortedImg) {
    distortedImg.update();
    distortedImg.draw(0, 0);
  }
}
