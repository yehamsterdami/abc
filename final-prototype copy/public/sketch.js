
let currentImg = null; // stores the user-uploaded image
let tiles = [];
// let size = 20; 
let initialSize = 40; 
let minSize = 1;      
let currentTileSize = initialSize; 
let cols, rows;
let mode = 4; // random rotation distortion mode

let imageLoaded = false;
let fileInput;


function handleFile() {
    fileInput = document.getElementById('imageUpload');
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('photo', file); // matches the upload.single('photo') in server.js

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');
                
                const data = await response.json();
                console.log('Server response:', data);

                // load the image back from the server using the path it returned
                loadImage(data.path, (img) => {
                    currentImg = img;
                    imageLoaded = true;
                    document.getElementById('loading-message').style.display = 'none';
                    initializeDistortion();
                });
                
            } catch (error) {
                console.error('Error during file upload:', error);
                alert('Could not upload file to server.');
            }
        }
    };

    document.addEventListener('click', () => {
        if (!imageLoaded) {
            fileInput.click();
        }
    });
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noLoop(); 
    handleFile();
}

// resize image into tiles based on currentTileSize 
function initializeDistortion() {
    if (!currentImg) return;

    // Calculate maximum size while preserving aspect ratio
    let targetW = windowWidth;
    let targetH = windowHeight;
    let ratio = Math.min(targetW / currentImg.width, targetH / currentImg.height);
    let resizedW = currentImg.width * ratio;
    let resizedH = currentImg.height * ratio;

    resizeCanvas(resizedW, resizedH);

    currentImg.resize(resizedW, resizedH);

    // Recalculate grid
    cols = floor(width / currentTileSize);
    rows = floor(height / currentTileSize);
    tiles = [];

    // slice the image into tiles
    for (let i = 0; i < cols; i++) {
        tiles[i] = [];
        for (let j = 0; j < rows; j++) {
            // Use currentImg.get() to extract the pixels for the tile
            tiles[i][j] = currentImg.get(i * currentTileSize, j * currentTileSize, currentTileSize, currentTileSize);
        }
    }

    loop(); 
}

// Ensure the canvas adapts if the device orientation/window size changes
function windowResized() {
    if (imageLoaded) {
        initializeDistortion();
    } else {
         // If no image is loaded, just resize the canvas to the window
         resizeCanvas(windowWidth, windowHeight);
    }
}

function draw() {
    if (!imageLoaded || !currentImg) {
        background(220);
        return;
    }

    background(220);

    // --- Dynamic Tile Size Calculation ---
    const startSizeReductionFrame = 1800; // Start shrinking the size after 30 seconds (1800 frames at 60fps)
    const endSizeReductionFrame = 5400;   // Stop shrinking at 90 seconds (5400 frames)

    let newTileSize;
    if (frameCount < startSizeReductionFrame) {
        // Before the reduction time, keep the size constant
        newTileSize = initialSize;
    } else {
        // After the start time, map frameCount to a tile size that shrinks from initialSize to minSize
        newTileSize = map(frameCount, 
                          startSizeReductionFrame, 
                          endSizeReductionFrame, 
                          initialSize, 
                          minSize);
        // Ensure size doesn't go below the minimum
        newTileSize = constrain(newTileSize, minSize, initialSize);
    }
    
    // Check if the integer value of the tile size has changed significantly
    if (floor(newTileSize) !== floor(currentTileSize)) {
        // Only re-slice the image if the size has changed (performance optimization)
        currentTileSize = newTileSize;
        initializeDistortion();
        // Since re-initialization can take a moment, we skip the rest of this draw loop
        return;
    }
    // --- End Tile Size Calculation ---


    // --- Dynamic Distortion Parameters (Using existing logic, but with currentTileSize) ---
    const maxFrames = endSizeReductionFrame; // Use the same end time for max distortion/fragmentation
    
    let probability = map(frameCount, 0, maxFrames, 0.0, 1.0);
    probability = constrain(probability, 0.0, 1.0); 

    const maxDisplacement = currentTileSize * 1.5; // Base displacement on the CURRENT tile size
    let displacementMagnitude = map(frameCount, 0, maxFrames, 0, maxDisplacement);
    displacementMagnitude = constrain(displacementMagnitude, 0, maxDisplacement);
    // --- End Distortion Parameters ---

    // Drawing loop runs much faster now because tiling is done conditionally
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            
            // Note: We use currentTileSize (which is updated inside the conditional block above) 
            // for calculating original X and Y
            let originalX = i * currentTileSize + currentTileSize / 2;
            let originalY = j * currentTileSize + currentTileSize / 2;
            
            let x = originalX;
            let y = originalY;
            let angle = 0; 
            
            if (random(1) < probability) { 
                
                // Position Randomization
                let xOffset = random(-displacementMagnitude, displacementMagnitude);
                let yOffset = random(-displacementMagnitude, displacementMagnitude);
                
                x = originalX + xOffset;
                y = originalY + yOffset;
                
                // Rotation Randomization
                angle = floor(random(4)) * PI / 2;
            }

            push();
            translate(x, y);
            rotate(angle);

            // Draw the tile
            image(tiles[i][j], 0, 0);
            pop();
        }
    }
}

