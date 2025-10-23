let socket;
let sound, filter, ampEnv;
let activeTouches = {};
let started = false;
let currentVolume = 0;

function preload() {
  sound = loadSound("/sounds/aurora.wav");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

  socket = io.connect(window.location.origin, { secure: true });

  // 音效链
  filter = new p5.LowPass();
  sound.disconnect();
  sound.connect(filter);
  filter.freq(500);

  // 初始静音
  sound.setVolume(0);
}

function draw() {
  background(15, 20, 30);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("Touch & slide vertically to play sound", width / 2, height / 2);
  
  noStroke();
  for (let id in activeTouches) {
    const t = activeTouches[id];
    fill(120, 200, 255, 180);
    ellipse(t.x, t.y, 60, 60);
  }

  // 没有手指 → 缓慢淡出
  if (Object.keys(activeTouches).length === 0 && currentVolume > 0) {
    currentVolume = lerp(currentVolume, 0, 0.05);
    sound.setVolume(currentVolume);
  }
}

function touchStarted() {
  if (!started) {
    userStartAudio();
    sound.loop();
    started = true;
    console.log("🔊 Sound started once");
  }

  for (let t of touches) {
    activeTouches[t.id] = { x: t.x, y: t.y };
  }

  // 有触摸 → 慢慢淡入
  currentVolume = lerp(currentVolume, 1, 0.1);
  sound.setVolume(currentVolume);

  return false;
}

function touchMoved() {
  for (let t of touches) {
    activeTouches[t.id] = { x: t.x, y: t.y };
    const freq = map(t.y, height, 0, 150, 2000);
    filter.freq(freq);
    socket.emit("touchMove", { id: t.id, x: t.x, y: t.y, freq });
  }
  return false;
}

function touchEnded() {
  // 移除手指
  for (let t of touches) {
    delete activeTouches[t.id];
  }
  if (Object.keys(activeTouches).length === 0) {
    // 没有触摸 → 会在 draw() 中慢慢淡出
    socket.emit("touchEnd", { allReleased: true });
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// let socket;
// let sound, filter;
// let audioReady = false;
// let circles = [];

// function preload() {
//   sound = loadSound("/sounds/aurora.wav");
// }

// function setup() {
//   createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
//   textAlign(CENTER, CENTER);
//   textSize(24);
//   fill(255);
//   text("Tap to enable sound 🔊", width / 2, height / 2);

//   filter = new p5.LowPass();
//   sound.disconnect();
//   sound.connect(filter);

//   socket = io.connect(window.location.origin, { secure: true });

//   // ✅ 接收 player 的触摸事件
//   socket.on("touchMove", (data) => {
//     if (!audioReady) return;

//     filter.freq(data.freq); // 改变滤波频率
//     if (!sound.isPlaying()) sound.loop();
//     sound.setVolume(1);

//     circles.push({ x: data.x, y: data.y, alpha: 255 });
//   });

//   socket.on("touchEnd", () => {
//     sound.setVolume(0, 0.5); // 慢慢淡出
//   });
// }

// function mousePressed() {
//   if (!audioReady) {
//     userStartAudio();
//     audioReady = true;
//     background(0);
//     fill(100, 255, 200);
//     text("Sound enabled ✔️", width / 2, height / 2);
//   }
// }

// function draw() {
//   background(20, 30, 50, 50);

//   noStroke();
//   for (let i = circles.length - 1; i >= 0; i--) {
//     let c = circles[i];
//     fill(120, 200, 255, c.alpha);
//     circle(c.x, c.y, 50);
//     c.alpha -= 5;
//     if (c.alpha <= 0) circles.splice(i, 1);
//   }
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }


// let socket;
// let touchesData = {};

// socket = io();

// function setup() {
//   let canvas = createCanvas(windowWidth, windowHeight);
//   canvas.parent("p5-canvas-container");
//   background(0);
// }

// function draw() {
//   background(0, 20); 

//   fill(255, 100, 150, 150);
//   noStroke();
//   for (let id in touchesData) {
//     let y = touchesData[id].y;
//     let x = touchesData[id].x;
//     ellipse(x, y, 60);
//   }
// }

// window.addEventListener("touchstart", (e) => {
//   for (let touch of e.changedTouches) {
//     const id = touch.identifier;
//     touchesData[id] = { x: touch.clientX, y: touch.clientY };
//     socket.emit("playerTouchStart", { id, x: touch.clientX, y: touch.clientY });
//   }
// });

// window.addEventListener("touchmove", (e) => {
//   for (let touch of e.changedTouches) {
//     const id = touch.identifier;
//     if (touchesData[id]) {
//       touchesData[id].x = touch.clientX;
//       touchesData[id].y = touch.clientY;
//       socket.emit("playerTouchMove", { id, x: touch.clientX, y: touch.clientY });
//     }
//   }
// });

// window.addEventListener("touchend", (e) => {
//   for (let touch of e.changedTouches) {
//     const id = touch.identifier;
//     if (touchesData[id]) {
//       socket.emit("playerTouchEnd", { id });
//       delete touchesData[id];
//     }
//   }
// });

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }


// let socket;
// let sound, filter, ampEnv;
// let activeTouches = {};
// let started = false;
// let currentVolume = 0;

// function preload() {
//   sound = loadSound("/sounds/aurora.wav");
// }

// function setup() {
//   let canvas = createCanvas(windowWidth, windowHeight);
//   canvas.parent("p5-canvas-container");

//   socket = io.connect(window.location.origin, { secure: true });

//   // 音效链
//   filter = new p5.LowPass();
//   sound.disconnect();
//   sound.connect(filter);
//   filter.freq(500);

//   // 初始静音
//   sound.setVolume(0);
// }

// function draw() {
//   background(15, 20, 30);
//   fill(255);
//   textAlign(CENTER, CENTER);
//   textSize(18);
//   text("🖐️ Touch & slide vertically to play sound", width / 2, height / 2);
  
//   noStroke();
//   for (let id in activeTouches) {
//     const t = activeTouches[id];
//     fill(120, 200, 255, 180);
//     ellipse(t.x, t.y, 60, 60);
//   }

//   // 没有手指 → 缓慢淡出
//   if (Object.keys(activeTouches).length === 0 && currentVolume > 0) {
//     currentVolume = lerp(currentVolume, 0, 0.05);
//     sound.setVolume(currentVolume);
//   }
// }

// function touchStarted() {
//   if (!started) {
//     userStartAudio();
//     sound.loop();
//     started = true;
//     console.log("🔊 Sound started once");
//   }

//   for (let t of touches) {
//     activeTouches[t.id] = { x: t.x, y: t.y };
//   }

//   // 有触摸 → 慢慢淡入
//   currentVolume = lerp(currentVolume, 1, 0.1);
//   sound.setVolume(currentVolume);

//   return false;
// }

// function touchMoved() {
//   for (let t of touches) {
//     activeTouches[t.id] = { x: t.x, y: t.y };
//     const freq = map(t.y, height, 0, 150, 2000);
//     filter.freq(freq);
//     socket.emit("touchMove", { id: t.id, x: t.x, y: t.y, freq });
//   }
//   return false;
// }

// function touchEnded() {

//   for (let t of touches) {
//     delete activeTouches[t.id];
//   }
//   if (Object.keys(activeTouches).length === 0) {
//     socket.emit("touchEnd", { allReleased: true });
//   }
//   return false;
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }
