/*
  ABC Browser Circus Prototype - Adapted from Patt Vira's Distorted Reflections
  Key changes:
  - Added user file upload (mobile-friendly)
  - Resized for mobile screen dimensions
  - Distortion is now time-based (using frameCount) instead of mouseX
*/

let currentImg = null; // Stores the user-uploaded image
let tiles = [];
let size = 20; // Increased tile size for better performance on mobile/larger canvases
let cols, rows;
let mode = 4; // Use the random rotation distortion mode

let imageLoaded = false;
let fileInput;

// Function to handle the image file upload
// function handleFile() {
//     fileInput = document.getElementById('imageUpload');
//     fileInput.onchange = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 loadImage(e.target.result, (img) => {
//                     currentImg = img;
//                     imageLoaded = true;
//                     // Remove the loading message once the image is uploaded
//                     document.getElementById('loading-message').style.display = 'none';
//                     initializeDistortion();
//                 });
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     // Trigger the hidden file input when the user taps anywhere on the document
//     document.addEventListener('click', () => {
//         if (!imageLoaded) {
//             fileInput.click();
//         }
//     });
// }

// --- Replacement for handleFile() in sketch.js ---
function handleFile() {
    fileInput = document.getElementById('imageUpload');
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            // 1. Create a FormData object to send the file
            const formData = new FormData();
            formData.append('photo', file); // 'photo' matches the upload.single('photo') in server.js

            try {
                // 2. POST the file to the server's upload endpoint
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');
                
                const data = await response.json();
                console.log('Server response:', data);

                // 3. Load the image back from the server using the path it returned
                // This simulates the full life cycle: Client uploads -> Server saves -> Client loads from server
                loadImage(data.path, (img) => {
                    currentImg = img;
                    imageLoaded = true;
                    document.getElementById('loading-message').style.display = 'none';
                    initializeDistortion();
                });
                
            } catch (error) {
                console.error('Error during file upload:', error);
                alert('Could not upload file to server. Check server console.');
            }
        }
    };

    document.addEventListener('click', () => {
        if (!imageLoaded) {
            fileInput.click();
        }
    });
}

// Initial setup for the canvas
function setup() {
    // Canvas size adapts to the window size for mobile responsiveness
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noLoop(); // Don't start drawing until an image is loaded
    handleFile();
}

// Function to resize and tile the image once it's loaded
function initializeDistortion() {
    if (!currentImg) return;

    // Calculate maximum size while preserving aspect ratio
    let targetW = windowWidth;
    let targetH = windowHeight;
    let ratio = Math.min(targetW / currentImg.width, targetH / currentImg.height);
    let resizedW = currentImg.width * ratio;
    let resizedH = currentImg.height * ratio;

    // Ensure the canvas is sized to the resized image for a 'full-bleed' look
    resizeCanvas(resizedW, resizedH);

    // Resize the image internally
    currentImg.resize(resizedW, resizedH);

    // Recalculate grid based on new size
    cols = floor(width / size);
    rows = floor(height / size);
    tiles = [];

    // Slice the image into tiles
    for (let i = 0; i < cols; i++) {
        tiles[i] = [];
        for (let j = 0; j < rows; j++) {
            // Use currentImg.get() to extract the pixels for the tile
            tiles[i][j] = currentImg.get(i * size, j * size, size, size);
        }
    }

    loop(); // Start the drawing loop
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

// function draw() {
//     if (!imageLoaded || !currentImg) {
//         background(220); // Keep background visible while waiting
//         return;
//     }

//     background(220);

//     // Time-based condition for distortion: distort more over time
//     // This value will increase, causing more tiles to distort
//     let distortionThreshold = map(frameCount, 0, 3600, 0, cols); // 3600 frames is about 1 minute at 60fps

//     for (let i = 0; i < cols; i++) {
//         for (let j = 0; j < rows; j++) {
//             let x = i * size + size / 2;
//             let y = j * size + size / 2;

//             push();
//             translate(x, y);

//             // Condition for distortion is based on time (distortionThreshold)
//             // As frameCount increases, distortionThreshold increases, and more tiles (i < distortionThreshold) will distort.
//             if (i < distortionThreshold) {
//                 // Random 90-degree rotation distortion
//                 let angle = floor(random(4)) * PI / 2;
//                 rotate(angle);
//             }

//             // The original image data is used to draw the tile
//             image(tiles[i][j], 0, 0);
//             pop();
//         }
//     }
// }

function draw() {
    if (!imageLoaded || !currentImg) {
        background(220);
        return;
    }

    background(220);

    // --- Dynamic Distortion Parameters ---
    
    // 1. Distortion Probability (grows over time)
    // Map frameCount (0) up to a max frame count (e.g., 5400 frames = 90 seconds at 60fps) 
    // to a probability from 0.0 (no distortion) to 1.0 (all tiles distort).
    // This controls how many tiles are randomly selected each frame.
    const maxFrames = 5400; // Time in frames until max distortion is reached (100%)
    let probability = map(frameCount, 0, maxFrames, 0.0, 1.0);
    probability = constrain(probability, 0.0, 1.0); // Keep it between 0% and 100%

    // 2. Maximum Displacement Magnitude (grows over time)
    // The amount of position shift grows up to a maximum amount (e.g., size * 1.5).
    const maxDisplacement = size * 1.5;
    let displacementMagnitude = map(frameCount, 0, maxFrames, 0, maxDisplacement);
    displacementMagnitude = constrain(displacementMagnitude, 0, maxDisplacement);

    // --- End Distortion Parameters ---

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            
            let originalX = i * size + size / 2;
            let originalY = j * size + size / 2;
            
            let x = originalX;
            let y = originalY;

            let angle = 0; // Default angle is 0 (no rotation)
            
            // --- Apply Randomization based on Probability ---
            // 'random(1)' returns a float between 0 and 1. 
            // If it's less than the growing 'probability', we apply the distortion.
            if (random(1) < probability) { 
                
                // Position Randomization
                // The offset is controlled by the growing displacementMagnitude
                let xOffset = random(-displacementMagnitude, displacementMagnitude);
                let yOffset = random(-displacementMagnitude, displacementMagnitude);
                
                x = originalX + xOffset;
                y = originalY + yOffset;
                
                // Rotation Randomization (still the 90-degree snap)
                angle = floor(random(4)) * PI / 2;
            }
            // --- End Randomization ---


            push();
            translate(x, y);
            rotate(angle);

            // Draw the tile at the (potentially) new position and rotation
            image(tiles[i][j], 0, 0);
            pop();
        }
    }
}