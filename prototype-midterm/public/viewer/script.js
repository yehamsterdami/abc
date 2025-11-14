let socket;
let flashAlpha = 0; 
let flashColor;
let sound;
let audioReady = false;

let auroraBands = [];
let lightBursts = [];
let waveRipples = [];
let beams = [];
let bgOffset = 0;

function preload() {
  sound = loadSound("/sounds/bgm.wav"); 
}

function setup() {
  createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(255);
  text("Tap to enable sound 🔊", width / 2, height / 2);

  socket = io.connect(window.location.origin, { secure: true });

  socket.on("viewerFlash", (data) => {
    triggerFlash(data.acc);
  });
}

function mousePressed() {
  if (!audioReady) {
    userStartAudio();
    sound.loop();
    sound.setVolume(0.5);
    audioReady = true;

    background(0);
    fill(100, 255, 200);
    text("Sound enabled", width / 2, height / 2);
  }
}

// 在 viewer.js 中加入

let blueLight = [];
let lastFlash = 0;


function draw() {
  background(0, 0, 30); // 深蓝背景，更梦幻

  // 绘制蓝光粒子
  for (let i = blueLight.length - 1; i >= 0; i--) {
    let b = blueLight[i];
    noStroke();
    fill(100, 180, 255, b.alpha);
    ellipse(b.x, b.y, b.r);

    // 扩散和淡出
    b.r += 3;
    b.alpha -= 6;

    if (b.alpha <= 0) blueLight.splice(i, 1);
  }

  // 额外加一个中心脉冲光
  if (millis() - lastFlash < 500) {
    let pulse = sin((millis() - lastFlash) / 80) * 100;
    noStroke();
    fill(120, 200, 255, 100 - abs(pulse));
    ellipse(width / 2, height / 2, 400 + pulse);
  }
}


function triggerFlash(strength) {

  flashAlpha = map(strength, 10, 30, 150, 255, true);
  flashColor = color(
    random(100, 200),
    random(150, 255),
    random(255),
    flashAlpha
  );

  sound.setVolume(0.5 + random(0.1, 0.3));
}

function draw() {
  background(20, 30, 50, 40);

  // 发光层
  if (flashAlpha > 0) {
    noStroke();
    fill(flashColor);
    circle(width / 2, height / 2, width * 0.6);
    flashAlpha -= 5; 
  }

  // 环境粒子（让画面有呼吸感）
  for (let i = 0; i < 5; i++) {
    stroke(255, random(50, 150));
    point(random(width), random(height));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// let socket;
// let circles = [];
// let auroraBands = [];

// function setup() {
//   createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
//   noStroke();
//   socket = io.connect(window.location.origin, { secure: true });

//   // 初始化极光波层
//   for (let i = 0; i < 3; i++) {
//     auroraBands.push({
//       offset: random(1000),
//       color: color(80, 150 + i * 30, 255, 25),
//     });
//   }

//   // 接收 player 的触摸数据
//   socket.on("viewerEffect", (data) => {
//     // 新光点
//     circles.push({
//       x: data.x,
//       y: data.y,
//       alpha: 255,
//       size: random(40, 80),
//       col: color(100, random(200, 255), 255, 255),
//     });
//   });

//   // player 触摸结束 → 慢慢淡出画面
//   socket.on("viewerStop", () => {
//     for (let c of circles) {
//       c.alpha = min(c.alpha, 80);
//     }
//   });
// }

// function draw() {
//   // 背景带流动渐变
//   setGradient(0, 0, width, height, color(10, 15, 25), color(25, 40, 90), 1);

//   // 绘制流动极光层
//   drawAurora();

//   // 绘制所有光点
//   for (let i = circles.length - 1; i >= 0; i--) {
//     let c = circles[i];
//     fill(c.col);
//     ellipse(c.x, c.y, c.size);
//     c.alpha -= 4;
//     c.size += sin(frameCount * 0.1) * 1.5;
//     c.col.setAlpha(c.alpha);
//     if (c.alpha <= 0) circles.splice(i, 1);
//   }
// }

// // 动态极光层
// function drawAurora() {
//   noStroke();
//   for (let i = 0; i < auroraBands.length; i++) {
//     let band = auroraBands[i];
//     fill(band.color);
//     beginShape();
//     for (let x = 0; x <= width; x += 20) {
//       let waveY =
//         height / 3 +
//         sin(x * 0.01 + frameCount * 0.02 + band.offset) * 80 +
//         i * 60;
//       vertex(x, waveY);
//     }
//     vertex(width, height);
//     vertex(0, height);
//     endShape(CLOSE);
//   }
// }

// // 背景渐变
// function setGradient(x, y, w, h, c1, c2, axis) {
//   noFill();
//   if (axis === 1) {
//     for (let i = y; i <= y + h; i++) {
//       let inter = map(i, y, y + h, 0, 1);
//       let c = lerpColor(c1, c2, inter);
//       stroke(c);
//       line(x, i, x + w, i);
//     }
//   }
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }


// let pulseAlpha = 0;
// let pulseColor;
// let pulseDecay = 0.95; // 衰减速度（越低越久）
// let lastTouches = 0;

// const socket = io();

// function setup() {
//   createCanvas(windowWidth, windowHeight);
//   noStroke();
//   pulseColor = color(80, 160, 255, 200); // 柔和蓝光
//   textFont("monospace");
// }

// function draw() {
//   // 背景渐变 + 残影
//   background(10, 20, 40, 40);

//   // 发光层（中心脉冲）
//   if (pulseAlpha > 1) {
//     fill(red(pulseColor), green(pulseColor), blue(pulseColor), pulseAlpha);
//     ellipse(width / 2, height / 2, width * 0.8, height * 0.8);
//     pulseAlpha *= pulseDecay;
//   }

//   // 文本信息
//   fill(255);
//   textSize(20);
//   textAlign(CENTER, CENTER);
//   text("🎧 Viewer Mode", width / 2, height / 2 - 40);
//   text(`Active Touches: ${lastTouches}`, width / 2, height / 2 + 20);
// }

// // 🔹 当接收到 strings 端触发的触摸事件
// socket.on("touchEvent", (data) => {
//   lastTouches = data.touches;

//   // 每次触摸都会触发视觉脉冲
//   pulseAlpha = map(data.touches, 0, 5, 0, 200, true); // 根据触摸数量控制亮度
//   pulseColor = color(80, 160 + data.touches * 10, 255 - data.touches * 20, 200);
//   console.log(`🎵 Viewer received touch: ${data.touches}`);
// });

// // 🔹 接收到 motion 或声音触发事件（来自 strings 或其他设备）
// socket.on("viewerFlash", (data) => {
//   console.log("✨ viewerFlash received:", data);
//   pulseAlpha = 255;
//   pulseColor = color(100 + data.acc * 10, 180, 255, 230);
// });

// // 🔹 调整大小
// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }

// let flashAlpha = 0; 
// let flashColor;
// let sound;
// let audioReady = false;
// let socket = io();

// let rippleEffects = [];
// let bgColor;


// let auroraBands = [];
// let lightBursts = [];
// let waveRipples = [];
// let beams = [];
// let bgOffset = 0;

// function preload() {
//   sound = loadSound("/sounds/bgm.wav"); 
// }

// function setup() {
//   createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
//   textAlign(CENTER, CENTER);
//   textSize(24);
//   fill(255);
//     bgColor = color(20, 30, 60);

//   text("Tap to enable sound 🔊", width / 2, height / 2);

//   socket = io.connect(window.location.origin, { secure: true });

//   socket.on("viewerFlash", (data) => {
//     triggerFlash(data.acc);
//   });
// }
//  socket.on("touchMove", (data) => {
//   console.log("📩 Received touchMove:", data);

//   let mappedX = map(data.x, 0, window.innerWidth, 0, width);
//   let mappedY = map(data.y, 0, window.innerHeight, 0, height);

//   blueLight.push({
//     x: mappedX,
//     y: mappedY,
//     r: 20,
//     alpha: 255
//   });

//   sound.setVolume(map(data.freq, 150, 2000, 0.2, 0.8, true));
// });

// socket.on("touchEvent", data => {
//   console.log("Received from player:", data);

//   const touchCount = data.touches || 1;

//   for (let i = 0; i < touchCount; i++) {
//     rippleEffects.push({
//       x: random(width * 0.2, width * 0.8),
//       y: random(height * 0.3, height * 0.7),
//       size: 30,
//       alpha: 220
//     });
//   }

//   bgColor = color(30 + random(30), 40 + random(40), 80 + random(80));
// });

// function mousePressed() {
//   if (!audioReady) {
//     userStartAudio();
//     sound.loop();
//     sound.setVolume(0.5);
//     audioReady = true;

//     background(0);
//     fill(100, 255, 200);
//     text("Sound enabled", width / 2, height / 2);
//   }
// }

// // 在 viewer.js 中加入

// let blueLight = [];
// let lastFlash = 0;


// function draw() {
//   background(0, 0, 30); // 深蓝背景，更梦幻

//   // 绘制蓝光粒子
//   for (let i = blueLight.length - 1; i >= 0; i--) {
//     let b = blueLight[i];
//     noStroke();
//     fill(100, 180, 255, b.alpha);
//     ellipse(b.x, b.y, b.r);

//     // 扩散和淡出
//     b.r += 3;
//     b.alpha -= 6;

//     if (b.alpha <= 0) blueLight.splice(i, 1);
//   }

//   // 额外加一个中心脉冲光
//   if (millis() - lastFlash < 500) {
//     let pulse = sin((millis() - lastFlash) / 80) * 100;
//     noStroke();
//     fill(120, 200, 255, 100 - abs(pulse));
//     ellipse(width / 2, height / 2, 400 + pulse);
//   }
// }


// function triggerFlash(strength) {

//   flashAlpha = map(strength, 10, 30, 150, 255, true);
//   flashColor = color(
//     random(100, 200),
//     random(150, 255),
//     random(255),
//     flashAlpha
//   );

//   sound.setVolume(0.5 + random(0.1, 0.3));
// }

// function draw() {
//   background(20, 30, 50, 40);

//   // 发光层
//   if (flashAlpha > 0) {
//     noStroke();
//     fill(flashColor);
//     circle(width / 2, height / 2, width * 0.6);
//     flashAlpha -= 5; 
//   }

//   // 环境粒子（让画面有呼吸感）
//   for (let i = 0; i < 5; i++) {
//     stroke(255, random(50, 150));
//     point(random(width), random(height));
//   }
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }



// // let socket;
// // let sound, filter;
// // let audioReady = false;
// // let ripples = [];
// // let bgShift = 0;

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
// //   filter.freq(500);

// //   socket = io.connect(window.location.origin, { secure: true });

// //   // ✅ 接收 player 的触摸事件
// //   socket.on("", (data) => {
// //     console.log("🔊 Received viewerPlay:", data);
// //     if (!audioReady) return;

// //     filter.freq(data.freq || 800);
// //     if (!sound.isPlaying()) sound.loop();
// //     sound.setVolume(1, 0.2);

// //     // 生成动效（柔和波纹）
// //     ripples.push({
// //       x: data.x * windowWidth, // 确保手机触摸数据映射屏幕
// //       y: data.y * windowHeight,
// //       radius: 0,
// //       alpha: 255,
// //       hue: random(160, 220)
// //     });
// //   });

// //   socket.on("touchEnd", () => {
// //     console.log("🟡 Received touchEnd");
// //     sound.setVolume(0, 1); // 慢慢淡出
// //   });
// // }

// // // function mousePressed() {
// // //   if (!audioReady) {
// // //     userStartAudio();
// // //     audioReady = true;
// // //     background(0);
// // //     fill(120, 255, 200);
// // //     text("Sound enabled ✔️", width / 2, height / 2);
// // //   }
// // // }

// // function draw() {
// //   bgShift += 0.005;
// //   for (let y = 0; y < height; y += 2) {
// //     let c = color(15 + 10 * sin(y * 0.01 + bgShift), 20, 40 + 30 * sin(y * 0.02 + bgShift));
// //     stroke(c);
// //     line(0, y, width, y);
// //   }

// //   noFill();
// //   strokeWeight(2);

// //   for (let i = ripples.length - 1; i >= 0; i--) {
// //     let r = ripples[i];
// //     stroke(r.hue, 200, 255, r.alpha);
// //     circle(r.x, r.y, r.radius);
// //     r.radius += 8;
// //     r.alpha -= 4;

// //     if (r.alpha <= 0) ripples.splice(i, 1);
// //   }
// // }

// // function windowResized() {
// //   resizeCanvas(windowWidth, windowHeight);
// // }

// // // let socket;
// // // let sound, filter;
// // // let audioReady = false;
// // // let circles = [];

// // // function preload() {
// // //   sound = loadSound("/sounds/aurora.wav");
// // // }

// // // function setup() {
// // //   createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
// // //   textAlign(CENTER, CENTER);
// // //   textSize(24);
// // //   fill(255);
// // //   text("Tap to enable sound 🔊", width / 2, height / 2);

// // //   filter = new p5.LowPass();
// // //   sound.disconnect();
// // //   sound.connect(filter);

// // //   socket = io.connect(window.location.origin, { secure: true });

// // //   // ✅ 接收 player 的触摸事件
// // //   socket.on("viewerPlay", (data) => {
// // //     if (!audioReady) return;

// // //     filter.freq(data.freq); // 改变滤波频率
// // //     if (!sound.isPlaying()) sound.loop();
// // //     sound.setVolume(1);

// // //     circles.push({ x: data.x, y: data.y, alpha: 255 });
// // //   });

// // //   socket.on("touchEnd", () => {
// // //     sound.setVolume(0, 0.5); // 慢慢淡出
// // //   });
// // // }

// // // function mousePressed() {
// // //   if (!audioReady) {
// // //     userStartAudio();
// // //     audioReady = true;
// // //     background(0);
// // //     fill(100, 255, 200);
// // //     text("Sound enabled ✔️", width / 2, height / 2);
// // //   }
// // // }

// // // function draw() {
// // //   background(20, 30, 50, 50);

// // //   noStroke();
// // //   for (let i = circles.length - 1; i >= 0; i--) {
// // //     let c = circles[i];
// // //     fill(120, 200, 255, c.alpha);
// // //     circle(c.x, c.y, 50);
// // //     c.alpha -= 5;
// // //     if (c.alpha <= 0) circles.splice(i, 1);
// // //   }
// // // }

// // // function windowResized() {
// // //   resizeCanvas(windowWidth, windowHeight);
// // // }


