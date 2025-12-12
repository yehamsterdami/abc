
let mappa = new Mappa('Leaflet'); // map library
let myMap;
let canvas;

let currentLongitude = 0;
let currentLatitude = 0;
let mapInit = false;

let artificialLongitude = 0;
let artificialLatitude = 0;

let moveStep = 1; // how much left/right moves 

let dpad = {
  x: 0,
  y: 0,
  size: 60,
};

let socket;
let otherPlayers = {};
let me;
let playerName = "";
let triggeredWith = {}; 
let conversationTriggered = false;
let lastTriggerTime = 0;
let meetingPoints = []; // array of {lat, lng, messages: []}
let interactingWith = {};
let hasMovedOnce = false;

let mailboxPopup;
let mailboxButton;

let mappa_options = {
  lat: 0,
  lng: 0,
  zoom: 3,
  style: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
};

class MyPoint {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.goalX = 0;
    this.goalY = 0;
    this.size = 14; 
    this.col = color(170, 240, 190); 
  }

  update() {
    this.x = lerp(this.x, this.goalX, 0.2);
    this.y = lerp(this.y, this.goalY, 0.2);
  }

  display() {
    push();
    translate(this.x, this.y);

    noStroke();
    for (let i = 1; i <= 5; i++) {
      let alpha = map(i, 1, 5, 50, 10); 
      let glowSize = this.size * i * 2;
      fill(red(this.col), green(this.col), blue(this.col), alpha);
      ellipse(0, 0, glowSize, glowSize);
    }

    stroke(255, 200);
    strokeWeight(2);
    fill(this.col);
    let dia = this.size + sin(frameCount * 0.1);
    circle(0, 0, dia);

    pop();
  }
}


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

mailboxButton = document.getElementById("mailbox-button");
mailboxPopup = document.getElementById("mailbox-popup");

mailboxButton.addEventListener("click", () => {
  mailboxOpen = !mailboxOpen; // toggle the sketch variable
  mailboxPopup.style.display = mailboxOpen ? "flex" : "none";
  mailboxPopup.style.flexDirection = "column";
  if (mailboxOpen) updateMailboxUI();
});


  me = new MyPoint();
  dpad.x = windowWidth / 2;
  dpad.y = windowHeight - 120;

  setupMailboxUI();

  // persistent user id
  let storedId = localStorage.getItem("userId");
  if (!storedId) {
    storedId = '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userId", storedId);
  }
  userId = storedId;

  // check if name exists
  let storedName = localStorage.getItem("playerName");
  if (storedName) {
    playerName = storedName;
    document.getElementById("entry-screen").style.display = "none";
    initSocketConnection();
  } else {
    // wait for user input
    document.getElementById("enter-btn").onclick = () => {
      const nameField = document.getElementById("name-input");
      if (nameField.value.trim() === "") return;

      playerName = nameField.value.trim();
      localStorage.setItem("playerName", playerName);
      document.getElementById("entry-screen").style.display = "none";

      initSocketConnection();
    };
  }

  function initSocketConnection() {
    socket = io();
    socket.emit("identify", { userId, name: playerName });

    socket.on("loadPlayerData", (data) => {
      if (data.lat && data.lng) {
        artificialLatitude = data.lat;
        artificialLongitude = data.lng;
        currentLatitude = data.lat;
        currentLongitude = data.lng;
      } else {
        currentLatitude = 31.2304;
        currentLongitude = 121.4737;
        artificialLatitude = currentLatitude;
        artificialLongitude = currentLongitude;
      }

      socket.on("meetingTriggered", (data) => {
        meetingPoints.push({
          lat: data.lat,
          lng: data.lng,
          messages: [{ from: data.from, text: data.message }]
        });
      });

      mappa_options.lat = currentLatitude;
      mappa_options.lng = currentLongitude;

      myMap = mappa.tileMap(mappa_options);
      myMap.overlay(canvas);
      myMap.onChange(updateMapContent);

      mapInit = true;
      updateMapContent();
    });

    socket.on("updateMeetingPoints", (points) => {
      meetingPoints = points;
      mailbox = [];
      for (let p of meetingPoints) {
        for (let msg of p.messages) {
          mailbox.push(`${msg.from}: ${msg.text}`);
          updateMailboxUI();
        }
      }
    });

    socket.on("currentPlayers", (data) => {
      for (let id in data) {
        if (id !== userId) {
          otherPlayers[id] = new OtherPlayer(data[id].lat, data[id].lng, data[id].name);
        }
      }
    });

    socket.on("playerMoved", (data) => {
      if (!otherPlayers[data.id]) {
        otherPlayers[data.id] = new OtherPlayer(data.lat, data.lng, data.name);
      } else {
        otherPlayers[data.id].setPosition(data.lat, data.lng, data.name);
      }
    });

    socket.on("playerLeft", (id) => {
      delete otherPlayers[id];
    });
  }
}


function draw() {
  clear();
  drawDarkMap(); 
  drawDPad();
  drawPrompt();
  drawMeetingPoints();


  if(!mapInit && GPS_GRANTED && currentLongitude != 0){
    mappa_options.lat = currentLatitude;
    mappa_options.lng = currentLongitude;

    myMap = mappa.tileMap(mappa_options);
    myMap.overlay(canvas);
    myMap.onChange(updateMapContent);

    artificialLongitude = currentLongitude;
    artificialLatitude = currentLatitude;

    mapInit = true;

    updateMapContent();
  }

  if(mapInit){
    me.update();
    me.display();
  }

  for (let id in otherPlayers) {
    let p = otherPlayers[id];
    if (!myMap) continue;

    let pos = myMap.latLngToPixel(p.lat, p.lng);

    push();
    fill(255, 100, 200);
    stroke(255);
    circle(pos.x, pos.y, 15);
    pop();

    let myPos = myMap.latLngToPixel(artificialLatitude, artificialLongitude);
    let distance = dist(myPos.x, myPos.y, pos.x, pos.y);
    let now = millis(); 

    if (hasMovedOnce && !triggeredWith[id] && distance < 12 && now - lastTriggerTime > 2000) {
      triggeredWith[id] = true;
      lastTriggerTime = now;
      triggerInteraction(id);
    }

    if (distance > 80) {
      triggeredWith[id] = false;
    }
  }
}

function handleNewPosition(pos){
  let lonlat = fixForChineseMap(pos);
  currentLongitude = lonlat[0];
  currentLatitude = lonlat[1];

  if(mapInit === false){
    artificialLongitude = currentLongitude;
    artificialLatitude = currentLatitude;
  }

  if(mapInit){
    updateMapContent();
  }
}

function updateMapContent(){
  if(!myMap) return;
  let myPosOnCanvas = myMap.latLngToPixel(artificialLatitude, artificialLongitude);
  me.goalX = myPosOnCanvas.x;
  me.goalY = myPosOnCanvas.y;

  socket.emit("update_position", {
    userId,
    lat: artificialLatitude,
    lng: artificialLongitude
  });
}

function updateMailboxUI() {
  let box = document.getElementById("mailbox-messages");
  box.innerHTML = "";  

  for (let m of mailbox) {
    let div = document.createElement("div");
    div.style.marginBottom = "10px";
    div.innerHTML = m;
    box.appendChild(div);
  }
}


function drawPrompt() {
  push();
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(255, 255, 255, 200);
  stroke(0);
  strokeWeight(1);
  text("The world is all dark...", width / 2, 30);
  text("Run around and meet another lights!", width / 2, 60 );  
  pop();
}


function drawDPad() {
  push();
  translate(dpad.x, dpad.y);

  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  fill(255, 255, 255, 180);

  circle(0, -dpad.size, dpad.size); fill(0); text("↑", 0, -dpad.size);
  fill(255,255,255,180); circle(0, dpad.size, dpad.size); fill(0); text("↓", 0, dpad.size);
  fill(255,255,255,180); circle(-dpad.size,0,dpad.size); fill(0); text("←",-dpad.size,0);
  fill(255,255,255,180); circle(dpad.size,0,dpad.size); fill(0); text("→", dpad.size,0);

  pop();
}

let interactionActive = false;

function triggerInteraction(otherId) {
  if (interactionActive) return; 
  interactionActive = true;

  let message = prompt("You met another player! Leave a message for everyone here:");
  
  if (message) {
    let foundPoint = null;
    for (let p of meetingPoints) {
      let d = dist(myMap.latLngToPixel(p.lat, p.lng).x, myMap.latLngToPixel(p.lat, p.lng).y,
                   me.goalX, me.goalY);
      if (d < 20) {
        foundPoint = p;
        break;
      }
    }
    if (!foundPoint) {
      foundPoint = {lat: artificialLatitude, lng: artificialLongitude, messages: []};
      meetingPoints.push(foundPoint);
    }

    foundPoint.messages.push({ from: playerName, text: message });

    socket.emit("addMeetingPoint", {
      lat: artificialLatitude,
      lng: artificialLongitude,
      from: playerName,
      message: message
    });
  }

  setTimeout(() => { interactionActive = false }, 3000); 
}


let mailbox = [];

function addToMailbox(content) {
  mailbox.push(content);
  updateMailboxUI();
}

function drawMeetingPoints() {
  if (!myMap) return;

  for (let p of meetingPoints) {
    let pos = myMap.latLngToPixel(p.lat, p.lng);

    push();
    translate(pos.x, pos.y);
    noStroke();
    fill(0, 150); 
    ellipse(0, 0, 50); 

    push();
    noFill();
    stroke(255, 200, 150, 80); 
    strokeWeight(4);
    ellipse(0, 0, 80); 
    pop();

    push();
    erase();
    ellipse(0, 0, 80); 
    noErase();
    pop();
    pop();
  }
}

let mailboxOpen = false;
let mailboxX, mailboxY, mailboxW, mailboxH;
let mailboxScroll = 0;
let lastTouchY = 0;

function setupMailboxUI() {
  mailboxX = width - 35;
  mailboxY = height - 35;
  mailboxW = 32;
  mailboxH = 32;
}



function drawMailboxPopup() {
  if (!mailboxOpen) return;

  let x = width - 300;
  let y = 50;
  let w = 250;
  let h = 400;

  push();
  fill(0, 150);
  rect(x, y, w, h, 10);

  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);

  let padding = 10;
  let yOffset = y + padding - mailboxScroll;

  for (let i = 0; i < mailbox.length; i++) {
    text(mailbox[i], x + padding, yOffset + i * 20);
  }

  if (mailbox.length * 20 > h - padding * 2) {
    let barH = (h / (mailbox.length * 20)) * h;
    let barY = y + (mailboxScroll / (mailbox.length * 20 - h + padding*2)) * (h - barH);
    fill(255, 100);
    rect(x + w - 6, barY, 6, barH, 3);
  }

  pop();
}

function mousePressed() {
  for (let p of meetingPoints) {
    let pos = myMap.latLngToPixel(p.lat, p.lng);
    if (dist(mouseX, mouseY, pos.x, pos.y) < 12) {
      let content = p.messages.map(m => `${m.from}: ${m.text}`).join("\n");
      alert("Messages at this spot:\n" + content);
      break;
    }
  }
}

function drawDarkMap() {
  if (!myMap) return;

  push();
  fill(0);
  noStroke();
  rect(0, 0, width, height);
  pop();
}

function touchStarted(){    
  if (dist(touches[0].x, touches[0].y, dpad.x, dpad.y - dpad.size) < dpad.size/2) { 
    hasMovedOnce = true;
    artificialLatitude += moveStep; 
    updateMapContent(); 
    return; 
  }
  if (dist(touches[0].x, touches[0].y, dpad.x, dpad.y + dpad.size) < dpad.size/2) { 
    hasMovedOnce = true;
    artificialLatitude -= moveStep; 
    updateMapContent(); 
    return; 
  }
  if (dist(touches[0].x, touches[0].y, dpad.x - dpad.size, dpad.y) < dpad.size/2) { 
    hasMovedOnce = true;
    artificialLongitude -= moveStep; 
    updateMapContent(); 
    return; 
  }
  if (dist(touches[0].x, touches[0].y, dpad.x + dpad.size, dpad.y) < dpad.size/2) { 
    hasMovedOnce = true;
    artificialLongitude += moveStep; 
    updateMapContent(); 
    return; 
  }

  if (meetingPoints.length > 0 && myMap) {
    for (let p of meetingPoints) {
      let pos = myMap.latLngToPixel(p.lat, p.lng);
      if (dist(touches[0].x, touches[0].y, pos.x, pos.y) < 18) {
        let content = p.messages.map(m => `${m.from}: ${m.text}`).join("\n");
        alert("Messages at this spot:\n" + content);
        return;
      }
    }
  }

  if (dist(touches[0].x, touches[0].y, mailboxX, mailboxY) < mailboxW) {
    mailboxOpen = !mailboxOpen;
    return;
  }

  if (mailboxOpen) {
    lastTouchY = touches[0].y;
  }
}

function touchMoved() {  
  if (!mailboxOpen) return;

  let dy = touches[0].y - lastTouchY;
  lastTouchY = touches[0].y;

  let maxScroll = Math.max(0, mailbox.length * 20 - 380);
  mailboxScroll -= dy; 
  mailboxScroll = constrain(mailboxScroll, 0, maxScroll);

  return false;
}

class OtherPlayer {
  constructor(lat, lng, name) {
    this.lat = lat;
    this.lng = lng;
    this.name = name || "Unknown";
  }

  setPosition(lat, lng, name) {
    this.lat = lat;
    this.lng = lng;
    if (name) this.name = name;
  }
}


