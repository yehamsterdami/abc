let sounds = [];
let totalTouches = 0;

const socket = io();  

function preload() {
  sounds.push(loadSound("/sounds/string1.wav"));
  sounds.push(loadSound("/sounds/string2.wav"));
  sounds.push(loadSound("/sounds/string3.wav"));
  sounds.push(loadSound("/sounds/string4.wav"));
  sounds.push(loadSound("/sounds/string5.wav"));
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  background(20);


  userStartAudio();
}

function draw() {
  background(20, 30, 60);
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("🎵 Touch the screen with multiple fingers!", width / 2, height / 2);
}

function touchStarted() {
  userStartAudio(); // resume audio context if blocked
  totalTouches = touches.length;
  document.querySelector("#count").innerText = totalTouches;

  console.log("Touches:", totalTouches);
  socket.emit("touchEvent", { touches: totalTouches });

  for (let i = 0; i < totalTouches && i < sounds.length; i++) {
    if (!sounds[i].isPlaying()) {
      sounds[i].play();
    }
  }
}

function touchEnded() {
  totalTouches = touches.length;
  document.querySelector("#count").innerText = totalTouches;
  socket.emit("touchEvent", { touches: totalTouches });

  // 若完全放开手指，淡出所有声音
  if (totalTouches === 0) {
    sounds.forEach(s => {
      if (s.isPlaying()) {
        s.amp(0, 1.5); // 在 1.5 秒内淡出音量到 0
        setTimeout(() => s.stop(), 1600); // 淡出结束后停止播放
      }
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
