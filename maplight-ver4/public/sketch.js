let mappa = new Mappa('Leaflet');
let myMap, canvas;
let currentLongitude = 0;
let currentLatitude = 0;
let mapInit = false;
let me;

let playerName = "";
let teamColor = "";
let joinedTeam = false;

let teammates = {};
let allPlayers = {};
let blocks = []; // will come from server

if (location.hostname.toLowerCase().startsWith('browsercircus')) {
  socket = io({ path: "/YOURPATH-and-PORT/socket.io" });
} else {
  socket = io();
}

let mappa_options = {
  lat: 0,
  lng: 0,
  zoom: 16,
  style: 'https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}',
};

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");
  me = new MyPoint();

  document.getElementById("joinTeamButton").addEventListener("click", () => {
    const nameInput = document.getElementById("playerName").value.trim();
    const teamInput = document.getElementById("teamSelect").value;
    if (nameInput === "") {
      alert("Please enter your name!");
      return;
    }

    playerName = nameInput;
    teamColor = teamInput;
    joinedTeam = true;

    document.getElementById("team-join-container").style.display = "none";
    socket.emit("playerJoin", { name: playerName, team: teamColor });
  });

  socket.on("playersUpdate", (players) => {
    allPlayers = players;
    if (joinedTeam) {
      teammates = {};
      for (let id in players) {
        if (players[id].team === teamColor) teammates[id] = players[id];
      }
      updateTeamDisplay();
    }
  });

  // receive territory info from server
  socket.on("territoriesInit", (serverBlocks) => {
    blocks = serverBlocks;
    for (let block of blocks) {
      block.color = color(255, 255, 255, 40);
    }
  });

  socket.on("territoriesUpdate", (updated) => {
    for (let i = 0; i < blocks.length; i++) {
      const b = updated[blocks[i].name];
      if (!b) continue;
      if (b.owner) {
        switch (b.owner) {
          case "red": blocks[i].color = color(255, 0, 0, 80); break;
          case "blue": blocks[i].color = color(0, 0, 255, 80); break;
          case "green": blocks[i].color = color(0, 255, 0, 80); break;
          case "yellow": blocks[i].color = color(255, 255, 0, 80); break;
        }
        blocks[i].cooldownEnd = b.cooldownEnd || 0;
      }
    }
  });
}

function updateTeamDisplay() {
  if (!joinedTeam) return;
  const teamDisplay = document.getElementById("team-display");
  teamDisplay.style.display = "flex";
  teamDisplay.style.backgroundColor = teamColor;
  document.getElementById("my-team-name").innerText = `Team ${capitalize(teamColor)}: `;
  document.getElementById("team-members").innerText =
  Object.values(teammates).map(p => p.name).join(", ");
}
// displaying team members joining



function mapDistanceToPixels(distanceLatLon, lat) {
  let latPixel = myMap.latLngToPixel(lat, 0);
  let latPixelPlus = myMap.latLngToPixel(lat + distanceLatLon, 0);
  return abs(latPixelPlus.y - latPixel.y);
}

function draw() {
  clear();
  if (!mapInit && GPS_GRANTED && currentLongitude != 0) {
    mappa_options.lat = currentLatitude;
    mappa_options.lng = currentLongitude;
    myMap = mappa.tileMap(mappa_options);
    myMap.overlay(canvas);
    myMap.onChange(updateMapContent);
    mapInit = true;
  }
  if (!mapInit) return;

  for (let block of blocks) {
    drawBlock(block);
    drawTrigger(block);
  }

  for (let id in allPlayers) {
    const player = allPlayers[id];
    if (!player.lat || !player.lon) continue;
    let pos = myMap.latLngToPixel(player.lat, player.lon);
    push();
    strokeWeight(player.team === teamColor ? 3 : 1);
    stroke(255);
    fill(player.team);
    circle(pos.x, pos.y, player.team === teamColor ? 20 : 14);
    if (player.team === teamColor) {
      noStroke();
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(player.name, pos.x, pos.y - 15);
    }
    pop();
  }
}

function drawTrigger(block) {
  if (!myMap) return;
  let triggerPos = myMap.latLngToPixel(block.trigger.lat, block.trigger.lon);
  // let radiusPixels = mapDistanceToPixels(block.triggerRadius, block.trigger.lat);
  push();
  noFill();
  let glow = sin(frameCount * 0.08) * 40 + 120;
  // stroke(150, 0, 200, 150);
  // strokeWeight(2);
  // circle(triggerPos.x, triggerPos.y, radiusPixels * 2);
  noStroke();
  fill(180, 0, 255, 180);
  circle(triggerPos.x, triggerPos.y, 8 + sin(frameCount * 0.15) * 2);
  pop();
}

function drawBlock(block) {
  if (!myMap) return;
  let blockPixels = block.corners.map(corner => myMap.latLngToPixel(corner.lat, corner.lon));
  push();
  fill(block.color);
  stroke(block.color);
  strokeWeight(2);
  beginShape();
  for (let p of blockPixels) vertex(p.x, p.y);
  endShape(CLOSE);
  pop();

  if (block.cooldownEnd && block.cooldownEnd > Date.now()) {
    let remaining = (block.cooldownEnd - Date.now()) / 1000;
    let triggerPos = myMap.latLngToPixel(block.trigger.lat, block.trigger.lon);
    fill(block.color);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    textStyle(BOLD);
    text(ceil(remaining) + "s", triggerPos.x, triggerPos.y - 35);
  }
}

function handleNewPosition(pos) {
  let lonlat = fixForChineseMap(pos);
  currentLongitude = lonlat[0];
  currentLatitude = lonlat[1];
  if (mapInit) updateMapContent();
  if (joinedTeam)
    socket.emit("playerPosition", { lat: currentLatitude, lon: currentLongitude });
}

function updateMapContent() {
  let myPosOnCanvas = myMap.latLngToPixel(currentLatitude, currentLongitude);
  me.goalX = myPosOnCanvas.x;
  me.goalY = myPosOnCanvas.y;
}

class MyPoint {
  constructor() { this.x = 0; this.y = 0; 
    this.goalX = 0; this.goalY = 0; 
    this.size = 14; this.col = color(170, 240, 190);
   }
  update() { this.x = lerp(this.x, this.goalX, 0.2);
    this.y = lerp(this.y, this.goalY, 0.2); }
  display() { push(); translate(this.x, this.y); fill(this.col); 
    stroke("pink"); strokeWeight(3); circle(0, 0, this.size + sin(frameCount * 0.1)); pop(); }
}
