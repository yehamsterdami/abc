let mappa = new Mappa('Leaflet'); // Map library
let myMap;
let canvas;
let currentLongitude = 0; 
let currentLatitude = 0; 
let mapInit = false; // Flag to check if the map has been initialized
let me; // Our own location point object

let otherPlayers = {}; // Dictionary to store other players: {socketID: OtherPlayerPoint}
let clearedAreas = []; // List of discovered (cleared) locations (for global clearing)

// --- SOCKET & DEBOUNCE VARIABLES ---
let socket;
if(location.hostname.toLowerCase().startsWith('browsercircus')){
  socket = io({path: "/YOURPATH-and-PORT/socket.io"}); 
}else{
  socket = io(); 
}

let lastEmitTime = 0; 
const EMIT_INTERVAL = 1000; // 1 second interval for sending location

// --- GAME & SCALING VARIABLES ---
const PERSONAL_CLEAR_RADIUS_METERS = 50; // The player's light radius in meters (Fixed real-world size)
let personalClearRadiusPixels = 150; // Variable to store the calculated pixel size (Updates every draw)
const MEETING_THRESHOLD = 30; // Distance in meters for proximity check

let mappa_options = {
  // Using 0, 0 as the initial default, map setup is deferred to draw()
  lat: 0, 
  lng: 0, 
  zoom: 16, 
  // Chinese map tile style
  style: 'https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}',
}


// ==========================================================
// SOCKET HANDLER FUNCTION DEFINITIONS
// ==========================================================

function handleOtherLocation(data) {
  if (!otherPlayers[data.socketID]) {
    otherPlayers[data.socketID] = new OtherPlayerPoint(data.socketID);
  }
  otherPlayers[data.socketID].lat = data.lat;
  otherPlayers[data.socketID].lon = data.lon;
  checkForMeeting(data.lat, data.lon, data.socketID);
  if(mapInit) {
    updateOtherPlayerContent(data.socketID);
  }
}

function handleClearedAreas(areas) {
    clearedAreas = areas;
    console.log("Received initial cleared areas:", clearedAreas.length);
}

function handleNewMeetingArea(data) {
    clearedAreas.push(data);
    console.log("New meeting area added at:", data.lat, data.lon, "Radius:", data.radiusMeters + "m");
}


// ==========================================================
// P5JS LIFECYCLE FUNCTIONS
// ==========================================================

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");
  me = new MyPoint();
  
  // NOTE: Map Initialization is intentionally omitted here and moved to draw()
}

function draw() {
  clear();

  // 1. Initialize map when we have the FIRST valid GPS data point.
  if(!mapInit && currentLongitude !== 0 && currentLatitude !== 0){
    console.log("starting map at real location");
    
    // Update map options with the first received coordinates
    mappa_options.lat = currentLatitude;
    mappa_options.lng = currentLongitude;
    
    myMap = mappa.tileMap(mappa_options); 
    myMap.overlay(canvas);
    myMap.onChange(updateMapContent);
    mapInit = true; 
    
    // Explicitly snap the map to the real location
    myMap.map.setView([currentLatitude, currentLongitude], mappa_options.zoom);
  }

  if(mapInit){
    // Draw the entire fog layer (which calculates light scaling)
    drawFog();
    
    // Draw all other players
    drawOtherPlayers();
    
    // Draw and update our point on top
    me.update();
    me.display();
    
    // Continuously center the map on the player's location
    if (currentLatitude !== 0 || currentLongitude !== 0) {
        myMap.map.panTo([currentLatitude, currentLongitude]); 
    }
  }
}


// ==========================================================
// GAME & UTILITY FUNCTIONS
// ==========================================================

function checkForMeeting(otherLat, otherLon, otherID) {
    if (currentLatitude !== 0 && currentLongitude !== 0) {
        let distanceMeters = getDistance(currentLatitude, currentLongitude, otherLat, otherLon);
        
        if (distanceMeters < MEETING_THRESHOLD) {
            socket.emit("meetingOccurred", { 
                otherID: otherID
            });
        }
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}


/**
 * Renders the fog layer, dynamically calculates light size, and cuts out clear areas.
 */
function drawFog() {
    push();
    
    // *** LIGHT SCALING FIX: Calculate current pixel radius for the personal light source ***
    // This calculation ensures the cleared area (light) covers a constant 50 meters
    if (currentLatitude !== 0) {
        // Calculate a point 50 meters away (north) using a rough conversion (1 degree lat = 111111m)
        let edgeLat = currentLatitude + (PERSONAL_CLEAR_RADIUS_METERS / 111111); 
        
        let centerPos = myMap.latLngToPixel(currentLatitude, currentLongitude);
        let edgePos = myMap.latLngToPixel(edgeLat, currentLongitude);

        // Calculate the actual distance in pixels between these two points on the current zoom level
        personalClearRadiusPixels = dist(centerPos.x, centerPos.y, edgePos.x, edgePos.y);
    }
    
    // 1. Draw the initial semi-transparent black fog layer (Dark and opaque)
    fill(0, 0, 0, 240); 
    rect(0, 0, width, height); 
    
    // 2. Use blend mode to 'cut out' clear areas
    blendMode(REMOVE);

    // Cut out the personal cleared area (using the calculated pixel radius)
    let myPos = myMap.latLngToPixel(currentLatitude, currentLongitude);
    ellipse(myPos.x, myPos.y, personalClearRadiusPixels * 2);

    // Cut out the globally cleared areas
    clearedAreas.forEach(area => {
        let center = myMap.latLngToPixel(area.lat, area.lon);
        // Recalculate pixel radius for global clear areas based on their stored meter radius
        let centerToEdgeLat = area.lat + (area.radiusMeters / 111111); 
        let edgePos = myMap.latLngToPixel(centerToEdgeLat, area.lon);
        let pixelRadius = dist(center.x, center.y, edgePos.x, edgePos.y);

        ellipse(center.x, center.y, pixelRadius * 2);
    });

    blendMode(BLEND); // Reset blend mode
    pop();
}

function drawOtherPlayers() {
    for (let id in otherPlayers) {
        let other = otherPlayers[id];
        
        if (other.lat === 0 && other.lon === 0) continue; 

        let distToMe = getDistance(currentLatitude, currentLongitude, other.lat, other.lon);
        
        // Visibility check is based on meters
        let isVisibleByLight = distToMe < PERSONAL_CLEAR_RADIUS_METERS; 
        
        let isGloballyClear = clearedAreas.some(area => {
            let distanceMeters = getDistance(area.lat, area.lon, other.lat, other.lon);
            return distanceMeters < area.radiusMeters;
        });
        
        if (isVisibleByLight || isGloballyClear) {
             other.update();
             other.display();
        }
    }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

// Placeholder for the necessary coordinate fix
function fixForChineseMap(pos) {
    // You MUST ensure your coordinate conversion function is included here
    // or loaded via an external JS file before sketch.js.
    
    // FALLBACK: Using raw coordinates (May cause map offset)
    return [pos.coords.longitude, pos.coords.latitude];
}


function handleNewPosition(pos){
  // Apply Chinese map fix (or fallback)
  let lonlat = fixForChineseMap(pos);
  currentLongitude = lonlat[0];
  currentLatitude = lonlat[1];
  console.log("GPS received:", currentLatitude, currentLongitude);

  // --- DEBOUNCE LOCATION EMISSION ---
  if (millis() - lastEmitTime > EMIT_INTERVAL) {
      console.log("EMITTING location to server.");
      let locForServer = {
        lat: currentLatitude,
        lon: currentLongitude
      }
      socket.emit("locationFromClient", locForServer); 
      lastEmitTime = millis();
  }
  // --- END DEBOUNCE LOGIC ---

  if(mapInit){
    updateMapContent();
  }
}

function updateMapContent(){
  let myPosOnCanvas = myMap.latLngToPixel(currentLatitude, currentLongitude)
  me.goalX = myPosOnCanvas.x;
  me.goalY = myPosOnCanvas.y;
}

function updateOtherPlayerContent(socketID){
    let player = otherPlayers[socketID];
    if (player && player.lat !== undefined) {
        let posOnCanvas = myMap.latLngToPixel(player.lat, player.lon);
        player.goalX = posOnCanvas.x;
        player.goalY = posOnCanvas.y;
    }
}

// P5 touch events (keeping for map interaction)
function touchStarted() {
  if(mapInit){
    let pos = myMap.pixelToLatLng(touches[0].x, touches[0].y);
    console.log("TOUCHED", pos);
  }else{
    console.log("TOUCHED", touches);
  }
}
function touchMoved() {}
function touchEnded() {}


// ==========================================================
// PLAYER CLASSES
// ==========================================================

class MyPoint{
  constructor(){
    this.x = 0;
    this.y = 0;
    this.goalX = 0;
    this.goalY = 0;
    this.size = 14;
    this.col = color(255, 255, 0); // Changed to yellow for contrast
  }
  update(){
    this.x = lerp(this.x, this.goalX, 0.2)
    this.y = lerp(this.y, this.goalY, 0.2)
  }
  display(){
    push();
    translate(this.x, this.y);

    // 1. Draw the GLOW EFFECT (Light Source Visual)
    noStroke();
    fill(255, 255, 200, 50); 
    
    // Draw three circles using the dynamically calculated pixel radius
    for(let i = 0; i < 3; i++) {
        // The light circle scales with the map zoom because it uses personalClearRadiusPixels
        circle(0, 0, personalClearRadiusPixels * 2 + i * 5); 
    }
    
    // 2. Draw the PLAYER DOT
    fill(this.col); 
    stroke(255, 0, 0); 
    strokeWeight(3)
    let dia = this.size + sin(frameCount*0.1)
    circle(0, 0, dia);
    
    pop();
  }
}

class OtherPlayerPoint{
    constructor(id){
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.goalX = 0;
        this.goalY = 0;
        this.lat = 0;
        this.lon = 0;
        this.size = 10;
        this.col = color(170, 240, 190); 
    }
    update(){
        this.x = lerp(this.x, this.goalX, 0.2)
        this.y = lerp(this.y, this.goalY, 0.2)
    }
    display(){
        push();
        translate(this.x, this.y);
        fill(this.col);
        stroke(0, 100, 200);
        strokeWeight(2)
        let dia = this.size + sin(frameCount*0.1)
        circle(0, 0, dia);

        pop();
    }
}