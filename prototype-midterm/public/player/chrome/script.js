const socket = io();

socket.emit("playerJoin");


const soundFiles = [
  "/sounds/note1.wav",
  "/sounds/note2.wav",
  "/sounds/note3.wav",
  "/sounds/note4.wav",
  "/sounds/note5.wav",
  "/sounds/note6.wav",
  "/sounds/note7.wav",
  "/sounds/note8.wav"
];

let falls = [];

function triggerFall() {
  for (let i = 0; i < 8; i++) {
    falls.push({
      x: random(width),
      y: -50,
      len: random(50, 150),
      speed: random(5, 10),
      alpha: 255
    });
  }
}

function drawFalls() {
  for (let i = falls.length - 1; i >= 0; i--) {
    let f = falls[i];
    stroke(160, 190, 255, f.alpha);
    strokeWeight(2);
    line(f.x, f.y, f.x, f.y + f.len);
    f.y += f.speed;
    f.alpha -= 6;
    if (f.alpha <= 0 || f.y > height) falls.splice(i, 1);
  }
}

const audioPlayers = soundFiles.map(file => {
  const audio = new Audio(file);
  audio.volume = 0.5; 
  return audio;
});

let lastTriggerTime = 0;
const triggerCooldown = 1000;
const threshold = 10; 
function updateUI(ax, ay, az, total) {
  document.querySelector("#accelerationX").innerText = "acc x: " + ax.toFixed(2);
  document.querySelector("#accelerationY").innerText = "acc y: " + ay.toFixed(2);
  document.querySelector("#accelerationZ").innerText = "acc z: " + az.toFixed(2);
  document.querySelector("#totalAcc").innerText = "total: " + total.toFixed(2);
}

function handleMotion(event) {
  const acc = event.acceleration;
  if (!acc) return;

  const ax = acc.x || 0;
  const ay = acc.y || 0;
  const az = acc.z || 0;
  const totalAcc = Math.sqrt(ax*ax + ay*ay + az*az);

  updateUI(ax, ay, az, totalAcc);

  const now = Date.now();
  if (totalAcc > threshold && now - lastTriggerTime > triggerCooldown) {
    lastTriggerTime = now;

  
    const idx = Math.floor(Math.random() * audioPlayers.length);
    const audio = audioPlayers[idx];


    audio.volume = Math.min(1, Math.max(0.2, (totalAcc - threshold) / 10));

    audio.currentTime = 0;
    audio.play();
    triggerFall();

    console.log(`🎵 Triggered ${soundFiles[idx]} | volume ${audio.volume.toFixed(2)}`);
    socket.emit("motionSound", { file: soundFiles[idx], acc: totalAcc });
  }
}


window.addEventListener("devicemotion", handleMotion);


