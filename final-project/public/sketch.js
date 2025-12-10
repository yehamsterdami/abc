let mappa = new Mappa('Leaflet');
let myMap;
let canvas;

let currentLongitude = 0;
let currentLatitude = 0;
let mapInit = false;
let me;

let myFlag = null;
let touchStartTime;
let startX, startY;

let allUserFlags = {};   // store all flags from server: { socketId: {lat,lng}, ... }
let globalMidpoint = null;
let lastMidpointUpdate = 0;
let MIDPOINT_INTERVAL = 5000; // 5 seconds

let socket = io();

socket.on("allFlagsUpdate", (users) => {
  allUserFlags = {};  // reset

  for (let id in users) {
    if (users[id].flag) {
      allUserFlags[id] = {
        lat: users[id].flag.lat,
        lng: users[id].flag.lng
      };
    }
  }
});

  socket.on("midpointUpdate", midpoint => {
    globalMidpoint = midpoint;

    if (!mapInit) return;  

    myMap.map.setView([globalMidpoint.lat, globalMidpoint.lng], myMap.map.getZoom());
});


let mappa_options = {
  lat: 0,
  lng: 0,
  zoom: 3,
  style: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
};

// Cartesian conversion for midpoint
function latLngToCartesian(lat, lng) {
  const latRad = radians(lat);
  const lngRad = radians(lng);
  return {
    x: cos(latRad) * cos(lngRad),
    y: cos(latRad) * sin(lngRad),
    z: sin(latRad)
  };
}

function cartesianToLatLng(x, y, z) {
  const hyp = Math.sqrt(x*x + y*y);
  return {
    lat: degrees(Math.atan2(z, hyp)),
    lng: degrees(Math.atan2(y, x))
  };
}

function computeCentroid(list) {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  let X = 0, Y = 0, Z = 0;
  list.forEach(p => {
    let c = latLngToCartesian(p.lat, p.lng);
    X += c.x; Y += c.y; Z += c.z;
  });

  X /= list.length;
  Y /= list.length;
  Z /= list.length;

  return cartesianToLatLng(X, Y, Z);
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");
  me = new MyPoint();
}

function draw() {
  clear();

  // initialize map (default location if no GPS yet)
  if (!mapInit) {
    console.log("starting map");
    mappa_options.lat = currentLatitude || 0;
    mappa_options.lng = currentLongitude || 0;

    myMap = mappa.tileMap(mappa_options);
    myMap.overlay(canvas);
    myMap.onChange(updateMapContent);

    mapInit = true;
  }

  if (mapInit) {
    // update and draw user's dot
    me.update();
    me.display();
  }

  // draw my flag
  if (myFlag && mapInit) {
    const pos = myMap.latLngToPixel(myFlag.lat, myFlag.lng);
    push();
    translate(pos.x, pos.y);
    fill(255, 0, 0);
    noStroke();
    triangle(0, 0, 12, -6, 12, 6);
    pop();
  }

  // draw other users' flags
  for (let id in allUserFlags) {
    if (id === socket.id) continue; // skip self
    let f = allUserFlags[id];
    if (f.lat != null && f.lng != null) {
      const fpos = myMap.latLngToPixel(f.lat, f.lng);
      push();
      translate(fpos.x, fpos.y);
      fill(255, 200, 0);
      noStroke();
      triangle(0, 0, 12, -6, 12, 6);
      pop();
    }
  }


  // draw midpoint
  if (globalMidpoint && myMap) {
    const pos = myMap.latLngToPixel(globalMidpoint.lat, globalMidpoint.lng);

    push();
    translate(pos.x, pos.y);
    fill(0,150,255);
    stroke(255);
    strokeWeight(2);
    ellipse(0, 0, 18, 18);
    pop();
 }

}

function touchStarted() {
  if (touches.length === 1) {
    touchStartTime = millis();
    startX = touches[0].x;
    startY = touches[0].y;
  }
}

function touchEnded() {
  if (touches.length > 0) return;
  if (!touchStartTime) return;

  let dt = millis() - touchStartTime;
  let dx = abs(startX - mouseX);
  let dy = abs(startY - mouseY);

  if (dt < 200 && dx < 10 && dy < 10) {
    placeFlagAt(mouseX, mouseY);
  }
  touchStartTime = null;
}

function mousePressed() {
  if (!touches.length) placeFlagAt(mouseX, mouseY);
}

function placeFlagAt(px, py) {
  if (!mapInit) return;

  const latLng = myMap.pixelToLatLng(px, py);
  myFlag = { lat: latLng.lat, lng: latLng.lng };

  // update local store for midpoint calculation
  allUserFlags[socket.id] = myFlag;

  socket.emit("myFlagUpdate", myFlag);
}

function handleNewPosition(pos) {
  let lonlat = fixForChineseMap(pos);
  currentLongitude = lonlat[0];
  currentLatitude = lonlat[1];

  socket.emit("locationFromClient", {
    lat: currentLatitude,
    lon: currentLongitude
  });

  socket.emit("myData", {
    lat: currentLatitude,
    lon: currentLongitude,
    flag: myFlag
  });

  if (mapInit) updateMapContent();
}

function updateMapContent() {
  let p = myMap.latLngToPixel(currentLatitude, currentLongitude);
  me.goalX = p.x;
  me.goalY = p.y;

  if (globalMidpoint) {
    const pos = myMap.latLngToPixel(globalMidpoint.lat, globalMidpoint.lng);
    console.log("Midpoint pixel:", pos);   // debug
}

}

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
    fill(this.col);
    stroke("pink");
    strokeWeight(3);
    circle(0, 0, this.size + sin(frameCount * 0.1));
    pop();
  }
}

