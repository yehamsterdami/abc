let sounds = [];
let totalTouches = 0;

const socket = io();  

function preload() {
  // ✅ load your own sounds
  sounds.push(loadSound("sounds/note1.wav"));
  sounds.push(loadSound("sounds/note2.wav"));
  sounds.push(loadSound("sounds/note3.wav"));
  sounds.push(loadSound("sounds/note4.wav"));
  sounds.push(loadSound("sounds/note5.wav"));
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  background(20);


  // 防止浏览器阻止声音
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

  // 播放对应数量的音
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

  // 如果所有手指都离开 -> 停止所有声音
  if (totalTouches === 0) {
    sounds.forEach(s => s.stop());
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
