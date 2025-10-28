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
// let sound, filter;
// let audioReady = false;
// let ripples = [];
// let bgShift = 0;

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
//   filter.freq(500);

//   socket = io.connect(window.location.origin, { secure: true });

//   // ✅ 接收 player 的触摸事件
//   socket.on("", (data) => {
//     console.log("🔊 Received viewerPlay:", data);
//     if (!audioReady) return;

//     filter.freq(data.freq || 800);
//     if (!sound.isPlaying()) sound.loop();
//     sound.setVolume(1, 0.2);

//     // 生成动效（柔和波纹）
//     ripples.push({
//       x: data.x * windowWidth, // 确保手机触摸数据映射屏幕
//       y: data.y * windowHeight,
//       radius: 0,
//       alpha: 255,
//       hue: random(160, 220)
//     });
//   });

//   socket.on("touchEnd", () => {
//     console.log("🟡 Received touchEnd");
//     sound.setVolume(0, 1); // 慢慢淡出
//   });
// }

// // function mousePressed() {
// //   if (!audioReady) {
// //     userStartAudio();
// //     audioReady = true;
// //     background(0);
// //     fill(120, 255, 200);
// //     text("Sound enabled ✔️", width / 2, height / 2);
// //   }
// // }

// function draw() {
//   bgShift += 0.005;
//   for (let y = 0; y < height; y += 2) {
//     let c = color(15 + 10 * sin(y * 0.01 + bgShift), 20, 40 + 30 * sin(y * 0.02 + bgShift));
//     stroke(c);
//     line(0, y, width, y);
//   }

//   noFill();
//   strokeWeight(2);

//   for (let i = ripples.length - 1; i >= 0; i--) {
//     let r = ripples[i];
//     stroke(r.hue, 200, 255, r.alpha);
//     circle(r.x, r.y, r.radius);
//     r.radius += 8;
//     r.alpha -= 4;

//     if (r.alpha <= 0) ripples.splice(i, 1);
//   }
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
// //   socket.on("viewerPlay", (data) => {
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


// // // let socket;
// // // let sound, filterNode;
// // // let isReady = false;

// // // function preload() {
// // //   sound = loadSound("/sounds/aurora.wav");
// // // }

// // // function setup() {
// // //   createCanvas(windowWidth, windowHeight).parent("canvas-container");
// // //   textAlign(CENTER, CENTER);
// // //   textSize(24);
// // //   background(0);
// // //   fill(255);
// // //   text("Tap to enable sound 🔊", width / 2, height / 2);

// // //   filterNode = new p5.LowPass();
// // //   sound.disconnect();
// // //   sound.connect(filterNode);

// // //   socket = io.connect(window.location.origin, { secure: true });

// // //   socket.on("viewerPlay", (data) => {
// // //     if (!isReady) return;
// // //     const freqValue = data.freq || 500;
// // //     filterNode.freq(freqValue);
// // //     if (!sound.isPlaying()) {
// // //       sound.loop();
// // //     }
// // //     sound.setVolume(1);
// // //   });

// // //   socket.on("viewerStop", (data) => {
// // //     if (isReady) {
// // //       sound.setVolume(0, 0.5); 
// // //     }
// // //   });
// // // }

// // // function mousePressed() {
// // //   if (!isReady) {
// // //     userStartAudio();
// // //     background(0);
// // //     fill(100, 255, 200);
// // //     text("Sound enabled", width / 2, height / 2);
// // //     isReady = true;
// // //   }
// // // }


// // // let socket;
// // // let sound, filterNode;
// // // let circles = [];
// // // let audioReady = false;

// // // function preload() {
// // //   sound = loadSound("/sounds/aurora.wav"); // 使用你的声音
// // // }

// // // function setup() {
// // //   createCanvas(windowWidth, windowHeight).parent("canvas-container");
// // //   textAlign(CENTER, CENTER);
// // //   textSize(24);
// // //   background(0);
// // //   fill(255);
// // //   text('Tap to enable sound 🔊', width / 2, height / 2);

// // //   socket = io.connect(window.location.origin, { secure: true });

// // //   filter = new p5.LowPass();
// // //   sound.disconnect();
// // //   sound.connect(filter);
// // //   filter.freq(500);

// // //   sound.setVolume(0);

// // //   socket.on("playTouchStart", (data) => {
// // //     userStartAudio();
// // //     sound.loop();
// // //     started = true;
// // //     console.log("Sound started once");
    
// // //     circles.push({ y: data.y, alpha: 255 });
// // // });

// // //   // 声音音量控制
// // //   socket.on("playerSoundControl", (val) => {
// // //     if (audioReady) {
// // //       sound.setVolume(val);
// // //     }
// // //   });
// // // }

// // // function mousePressed() {
// // //   if (!audioReady) {
// // //     userStartAudio(); // ✅ 用户手势解锁
// // //     sound.loop();
// // //     sound.setVolume(0);
// // //     audioReady = true;

// // //     background(0);
// // //     fill(100, 255, 200);
// // //     text('Sound enabled ✔️', width / 2, height / 2);
// // //   }
// // // }

// // // function draw() {
// // //   background(20, 30, 50, 50);

// // //   noStroke();
// // //   for (let i = circles.length - 1; i >= 0; i--) {
// // //     let c = circles[i];
// // //     fill(100, 200, 255, c.alpha);
// // //     circle(width / 2, c.y, 50);
// // //     c.alpha -= 5;
// // //     if (c.alpha <= 0) circles.splice(i, 1);
// // //   }
// // // }

// // // function windowResized() {
// // //   resizeCanvas(windowWidth, windowHeight);
// // // }
