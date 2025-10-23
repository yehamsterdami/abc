let socket;
let sound, filter;
let audioReady = false;
let ripples = [];
let bgShift = 0;

function preload() {
  sound = loadSound("/sounds/aurora.wav");
}

function setup() {
  createCanvas(windowWidth, windowHeight).parent("p5-canvas-container");
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(255);
  text("Tap to enable sound 🔊", width / 2, height / 2);

  filter = new p5.LowPass();
  sound.disconnect();
  sound.connect(filter);
  filter.freq(500);

  socket = io.connect(window.location.origin, { secure: true });

  // ✅ 接收 player 的触摸事件
  socket.on("", (data) => {
    console.log("🔊 Received viewerPlay:", data);
    if (!audioReady) return;

    filter.freq(data.freq || 800);
    if (!sound.isPlaying()) sound.loop();
    sound.setVolume(1, 0.2);

    // 生成动效（柔和波纹）
    ripples.push({
      x: data.x * windowWidth, // 确保手机触摸数据映射屏幕
      y: data.y * windowHeight,
      radius: 0,
      alpha: 255,
      hue: random(160, 220)
    });
  });

  socket.on("touchEnd", () => {
    console.log("🟡 Received touchEnd");
    sound.setVolume(0, 1); // 慢慢淡出
  });
}

// function mousePressed() {
//   if (!audioReady) {
//     userStartAudio();
//     audioReady = true;
//     background(0);
//     fill(120, 255, 200);
//     text("Sound enabled ✔️", width / 2, height / 2);
//   }
// }

function draw() {
  bgShift += 0.005;
  for (let y = 0; y < height; y += 2) {
    let c = color(15 + 10 * sin(y * 0.01 + bgShift), 20, 40 + 30 * sin(y * 0.02 + bgShift));
    stroke(c);
    line(0, y, width, y);
  }

  noFill();
  strokeWeight(2);

  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    stroke(r.hue, 200, 255, r.alpha);
    circle(r.x, r.y, r.radius);
    r.radius += 8;
    r.alpha -= 4;

    if (r.alpha <= 0) ripples.splice(i, 1);
  }
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
//   socket.on("viewerPlay", (data) => {
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


// // let socket;
// // let sound, filterNode;
// // let isReady = false;

// // function preload() {
// //   sound = loadSound("/sounds/aurora.wav");
// // }

// // function setup() {
// //   createCanvas(windowWidth, windowHeight).parent("canvas-container");
// //   textAlign(CENTER, CENTER);
// //   textSize(24);
// //   background(0);
// //   fill(255);
// //   text("Tap to enable sound 🔊", width / 2, height / 2);

// //   filterNode = new p5.LowPass();
// //   sound.disconnect();
// //   sound.connect(filterNode);

// //   socket = io.connect(window.location.origin, { secure: true });

// //   socket.on("viewerPlay", (data) => {
// //     if (!isReady) return;
// //     const freqValue = data.freq || 500;
// //     filterNode.freq(freqValue);
// //     if (!sound.isPlaying()) {
// //       sound.loop();
// //     }
// //     sound.setVolume(1);
// //   });

// //   socket.on("viewerStop", (data) => {
// //     if (isReady) {
// //       sound.setVolume(0, 0.5); 
// //     }
// //   });
// // }

// // function mousePressed() {
// //   if (!isReady) {
// //     userStartAudio();
// //     background(0);
// //     fill(100, 255, 200);
// //     text("Sound enabled", width / 2, height / 2);
// //     isReady = true;
// //   }
// // }


// // let socket;
// // let sound, filterNode;
// // let circles = [];
// // let audioReady = false;

// // function preload() {
// //   sound = loadSound("/sounds/aurora.wav"); // 使用你的声音
// // }

// // function setup() {
// //   createCanvas(windowWidth, windowHeight).parent("canvas-container");
// //   textAlign(CENTER, CENTER);
// //   textSize(24);
// //   background(0);
// //   fill(255);
// //   text('Tap to enable sound 🔊', width / 2, height / 2);

// //   socket = io.connect(window.location.origin, { secure: true });

// //   filter = new p5.LowPass();
// //   sound.disconnect();
// //   sound.connect(filter);
// //   filter.freq(500);

// //   sound.setVolume(0);

// //   socket.on("playTouchStart", (data) => {
// //     userStartAudio();
// //     sound.loop();
// //     started = true;
// //     console.log("Sound started once");
    
// //     circles.push({ y: data.y, alpha: 255 });
// // });

// //   // 声音音量控制
// //   socket.on("playerSoundControl", (val) => {
// //     if (audioReady) {
// //       sound.setVolume(val);
// //     }
// //   });
// // }

// // function mousePressed() {
// //   if (!audioReady) {
// //     userStartAudio(); // ✅ 用户手势解锁
// //     sound.loop();
// //     sound.setVolume(0);
// //     audioReady = true;

// //     background(0);
// //     fill(100, 255, 200);
// //     text('Sound enabled ✔️', width / 2, height / 2);
// //   }
// // }

// // function draw() {
// //   background(20, 30, 50, 50);

// //   noStroke();
// //   for (let i = circles.length - 1; i >= 0; i--) {
// //     let c = circles[i];
// //     fill(100, 200, 255, c.alpha);
// //     circle(width / 2, c.y, 50);
// //     c.alpha -= 5;
// //     if (c.alpha <= 0) circles.splice(i, 1);
// //   }
// // }

// // function windowResized() {
// //   resizeCanvas(windowWidth, windowHeight);
// // }
