let socket;
    let soundFiles = [
      "/sounds/note1.wav",
      "/sounds/note2.wav",
      "/sounds/note3.wav",
      "/sounds/note4.wav",
      "/sounds/note5.wav",
      "/sounds/note6.wav",
      "/sounds/note7.wav",
      "/sounds/note8.wav"
    ];

    let audioPlayers = [];
    let lastTriggerTime = 0;
    const triggerCooldown = 1000;
    const threshold = 10;
    let permissionGranted = false;
    let falls = [];

    // 初始化
    function setup() {
      createCanvas(windowWidth, windowHeight);
      textAlign(CENTER, CENTER);
      textSize(20);
      noStroke();
      socket = io();
      socket.emit("playerJoin");

      for (let file of soundFiles) {
        let a = new Audio(file);
        a.volume = 0.5;
        audioPlayers.push(a);
      }
    }

    function draw() {
      background(10, 10, 15, 80);

      for (let i = 0; i < 40; i++) {
        let x = (frameCount * 0.5 + i * 40) % width;
        fill(150 + i * 2, 180, 255, 20);
        ellipse(x, sin(frameCount * 0.01 + i) * height / 3 + height / 2, 5, 5);
      }

      drawFalls();

      // UI
      fill(180, 200, 255);
      textSize(36);
      text("🌊 Chrome Falls", width / 2, height / 4);

      fill(200);
      textSize(16);
      text("Move your device to create sound and light", width / 2, height / 4 + 40);

      if (!permissionGranted) {
        fill(100, 150, 255);
        rectMode(CENTER);
        rect(width / 2, height / 2, 200, 50, 15);
        fill(255);
        textSize(18);
        text("Tap to Start", width / 2, height / 2);
      }

      // Debug UI
      if (permissionGranted) {
        fill(180);
        textSize(14);
        textAlign(LEFT);
        text("Move your phone ↔️ ↕️", 20, height - 30);
      }
    }

    function triggerFall() {
      for (let i = 0; i < 8; i++) {
        falls.push({
          x: random(width),
          y: -20,
          len: random(50, 150),
          speed: random(5, 10),
          alpha: 255
        });
      }
    }

    function drawFalls() {
      for (let i = falls.length - 1; i >= 0; i--) {
        let f = falls[i];
        stroke(150, 200, 255, f.alpha);
        strokeWeight(2);
        line(f.x, f.y, f.x, f.y + f.len);
        f.y += f.speed;
        f.alpha -= 6;
        if (f.alpha <= 0 || f.y > height) falls.splice(i, 1);
      }
      noStroke();
    }

    // 允许声音
    function mousePressed() {
      if (!permissionGranted) {
        getAudioPermission();
      }
    }

    // function getAudioPermission() {
    //   if (typeof DeviceMotionEvent.requestPermission === "function") {
    //     DeviceMotionEvent.requestPermission().then((response) => {
    //       if (response === "granted") {
    //         permissionGranted = true;
    //         window.addEventListener("devicemotion", handleMotion);
    //       }
    //     });
    //   } else {
    //     permissionGranted = true;
    //     window.addEventListener("devicemotion", handleMotion);
    //   }
    // }

    function handleMotion(event) {
      const acc = event.acceleration;
      if (!acc) return;

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 0;
      const totalAcc = Math.sqrt(ax * ax + ay * ay + az * az);
      const now = millis();

      if (totalAcc > threshold && now - lastTriggerTime > triggerCooldown) {
        lastTriggerTime = now;
        const idx = floor(random(audioPlayers.length));
        const audio = audioPlayers[idx];

        audio.volume = constrain((totalAcc - threshold) / 10, 0.2, 1);
        audio.currentTime = 0;
        audio.play().catch(e => console.warn("play blocked", e));

        triggerFall();

        console.log(`🎵 Trigger ${soundFiles[idx]} | volume: ${audio.volume.toFixed(2)}`);
        socket.emit("motionSound", { file: soundFiles[idx], acc: totalAcc });
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
    