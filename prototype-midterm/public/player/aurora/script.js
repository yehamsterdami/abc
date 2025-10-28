let socket;
let sound, filter;
let activeTouches = {};
let started = false;
let currentVolume = 0;
let particles = []; // 存储光粒子

function preload() {
  sound = loadSound("/sounds/aurora.wav");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

  socket = io.connect(window.location.origin, { secure: true });

  // 音效链：低通滤波器
  filter = new p5.LowPass();
  sound.disconnect();
  sound.connect(filter);
  filter.freq(500);

  sound.setVolume(0);
  noStroke();
}

function draw() {
  // 背景带渐变和微微流动的蓝光
  setGradient(0, 0, width, height, color(10, 15, 25), color(20, 40, 80), 1);
  drawAurora();

  // 绘制粒子效果
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    fill(p.col);
    ellipse(p.x, p.y, p.size);
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 5;
    p.col.setAlpha(p.alpha);
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // 绘制手指触摸点
  for (let id in activeTouches) {
    const t = activeTouches[id];
    let pulse = sin(frameCount * 0.2) * 20 + 60;
    fill(100, 200, 255, 180);
    ellipse(t.x, t.y, pulse);

    // 每帧生成一些粒子
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: t.x,
        y: t.y,
        vx: random(-1, 1),
        vy: random(-1, 1),
        size: random(10, 25),
        alpha: 255,
        col: color(100, random(180, 255), 255, 255),
      });
    }
  }

  // 没有触摸时音量慢慢减小
  if (Object.keys(activeTouches).length === 0 && currentVolume > 0) {
    currentVolume = lerp(currentVolume, 0, 0.05);
    sound.setVolume(currentVolume);
  }

  // 提示文字
  fill(255, 240);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("🖐️ Touch & slide to paint with sound", width / 2, height - 40);
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
  for (let t of touches) {
    delete activeTouches[t.id];
  }
  if (Object.keys(activeTouches).length === 0) {
    socket.emit("touchEnd", { allReleased: true });
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 渐变背景函数
function setGradient(x, y, w, h, c1, c2, axis) {
  noFill();
  if (axis === 1) { // 从上到下
    for (let i = y; i <= y + h; i++) {
      let inter = map(i, y, y + h, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x + w, i);
    }
  }
}

// 动态极光带效果
function drawAurora() {
  noStroke();
  for (let i = 0; i < 3; i++) {
    let y = height / 3 + sin(frameCount * 0.02 + i) * 80;
    fill(80, 150 + i * 30, 255, 30);
    beginShape();
    for (let x = 0; x <= width; x += 20) {
      let waveY = y + sin(x * 0.01 + frameCount * 0.02 + i) * 50;
      vertex(x, waveY);
    }
    vertex(width, height);
    vertex(0, height);
    endShape(CLOSE);
  }
}

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

//   filter = new p5.LowPass();
//   sound.disconnect();
//   sound.connect(filter);
//   filter.freq(500);

//   sound.setVolume(0);
// }

// function draw() {
//   background(15, 20, 30);
//   fill(255);
//   textAlign(CENTER, CENTER);
//   textSize(18);
//   text("Touch & slide vertically to play sound", width / 2, height / 2);
  
//   noStroke();
//   for (let id in activeTouches) {
//     const t = activeTouches[id];
//     fill(120, 200, 255, 180);
//     ellipse(t.x, t.y, 60, 60);
//   }

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


// // let socket;
// // let sound, filter;
// // let audioReady = false;
// // let circles = [];

// // function preload() {
// //   sound = loadSound("/sounds/aurora.wav");
// // }

// // function setup() {
// //   createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
// //   textAlign(CENTER, CENTER);
// //   textSize(24);
// //   fill(255);
// //   text("Tap to enable sound 🔊", width / 2, height / 2);

// //   filter = new p5.LowPass();
// //   sound.disconnect();
// //   sound.connect(filter);

// //   socket = io.connect(window.location.origin, { secure: true });

// //   // ✅ 接收 player 的触摸事件
// //   socket.on("touchMove", (data) => {
// //     if (!audioReady) return;

// //     filter.freq(data.freq); // 改变滤波频率
// //     if (!sound.isPlaying()) sound.loop();
// //     sound.setVolume(1);

// //     circles.push({ x: data.x, y: data.y, alpha: 255 });
// //   });

// //   socket.on("touchEnd", () => {
// //     sound.setVolume(0, 0.5); // 慢慢淡出
// //   });
// // }

// // function mousePressed() {
// //   if (!audioReady) {
// //     userStartAudio();
// //     audioReady = true;
// //     background(0);
// //     fill(100, 255, 200);
// //     text("Sound enabled ✔️", width / 2, height / 2);
// //   }
// // }

// // function draw() {
// //   background(20, 30, 50, 50);

// //   noStroke();
// //   for (let i = circles.length - 1; i >= 0; i--) {
// //     let c = circles[i];
// //     fill(120, 200, 255, c.alpha);
// //     circle(c.x, c.y, 50);
// //     c.alpha -= 5;
// //     if (c.alpha <= 0) circles.splice(i, 1);
// //   }
// // }

// // function windowResized() {
// //   resizeCanvas(windowWidth, windowHeight);
// // }


// // let socket;
// // let touchesData = {};

// // socket = io();

// // function setup() {
// //   let canvas = createCanvas(windowWidth, windowHeight);
// //   canvas.parent("p5-canvas-container");
// //   background(0);
// // }

// // function draw() {
// //   background(0, 20); 

// //   fill(255, 100, 150, 150);
// //   noStroke();
// //   for (let id in touchesData) {
// //     let y = touchesData[id].y;
// //     let x = touchesData[id].x;
// //     ellipse(x, y, 60);
// //   }
// // }

// // window.addEventListener("touchstart", (e) => {
// //   for (let touch of e.changedTouches) {
// //     const id = touch.identifier;
// //     touchesData[id] = { x: touch.clientX, y: touch.clientY };
// //     socket.emit("playerTouchStart", { id, x: touch.clientX, y: touch.clientY });
// //   }
// // });

// // window.addEventListener("touchmove", (e) => {
// //   for (let touch of e.changedTouches) {
// //     const id = touch.identifier;
// //     if (touchesData[id]) {
// //       touchesData[id].x = touch.clientX;
// //       touchesData[id].y = touch.clientY;
// //       socket.emit("playerTouchMove", { id, x: touch.clientX, y: touch.clientY });
// //     }
// //   }
// // });

// // window.addEventListener("touchend", (e) => {
// //   for (let touch of e.changedTouches) {
// //     const id = touch.identifier;
// //     if (touchesData[id]) {
// //       socket.emit("playerTouchEnd", { id });
// //       delete touchesData[id];
// //     }
// //   }
// // });

// // function windowResized() {
// //   resizeCanvas(windowWidth, windowHeight);
// // }


// // let socket;
// // let sound, filter, ampEnv;
// // let activeTouches = {};
// // let started = false;
// // let currentVolume = 0;

// // function preload() {
// //   sound = loadSound("/sounds/aurora.wav");
// // }

// // function setup() {
// //   let canvas = createCanvas(windowWidth, windowHeight);
// //   canvas.parent("p5-canvas-container");

// //   socket = io.connect(window.location.origin, { secure: true });

// //   // 音效链
// //   filter = new p5.LowPass();
// //   sound.disconnect();
// //   sound.connect(filter);
// //   filter.freq(500);

// //   // 初始静音
// //   sound.setVolume(0);
// // }

// // function draw() {
// //   background(15, 20, 30);
// //   fill(255);
// //   textAlign(CENTER, CENTER);
// //   textSize(18);
// //   text("🖐️ Touch & slide vertically to play sound", width / 2, height / 2);
  
// //   noStroke();
// //   for (let id in activeTouches) {
// //     const t = activeTouches[id];
// //     fill(120, 200, 255, 180);
// //     ellipse(t.x, t.y, 60, 60);
// //   }

// //   // 没有手指 → 缓慢淡出
// //   if (Object.keys(activeTouches).length === 0 && currentVolume > 0) {
// //     currentVolume = lerp(currentVolume, 0, 0.05);
// //     sound.setVolume(currentVolume);
// //   }
// // }

// // function touchStarted() {
// //   if (!started) {
// //     userStartAudio();
// //     sound.loop();
// //     started = true;
// //     console.log("🔊 Sound started once");
// //   }

// //   for (let t of touches) {
// //     activeTouches[t.id] = { x: t.x, y: t.y };
// //   }

// //   // 有触摸 → 慢慢淡入
// //   currentVolume = lerp(currentVolume, 1, 0.1);
// //   sound.setVolume(currentVolume);

// //   return false;
// // }

// // function touchMoved() {
// //   for (let t of touches) {
// //     activeTouches[t.id] = { x: t.x, y: t.y };
// //     const freq = map(t.y, height, 0, 150, 2000);
// //     filter.freq(freq);
// //     socket.emit("touchMove", { id: t.id, x: t.x, y: t.y, freq });
// //   }
// //   return false;
// // }

// // function touchEnded() {

// //   for (let t of touches) {
// //     delete activeTouches[t.id];
// //   }
// //   if (Object.keys(activeTouches).length === 0) {
// //     socket.emit("touchEnd", { allReleased: true });
// //   }
// //   return false;
// // }

// // function windowResized() {
// //   resizeCanvas(windowWidth, windowHeight);
// // }
