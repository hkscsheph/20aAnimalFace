let video;
let facemesh;
let predictions = [];

function setup() {
  createCanvas(640, 480);
  
  // 1. Setup webcam
  video = createCapture(VIDEO);
  video.size(width, height);

  // 2. Initialize ml5 FaceMesh
  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on("predict", results => {
    predictions = results;
  });

  video.hide();
}

function modelReady() {
  console.log("Artistic tracking activated.");
}

function draw() {
  // Draw the background frame with a high contrast, low-saturation filter for a cinematic look
  image(video, 0, 0, width, height);
  filter(GRAY); // Renders the camera stream in beautiful monochrome
  
  // Vignette overlay to isolate the art piece in the center
  drawVignette();

  // Render the artistic procedural masks
  drawArtisticNose();
}

function drawVignette() {
  push();
  noFill();
  // Draw concentric dark rings to create a dramatic vignette frame
  for (let i = 0; i < 40; i++) {
    stroke(0, 0, 0, map(i, 0, 40, 2, 20));
    strokeWeight(10);
    rect(i * 5, i * 4, width - i * 10, height - i * 8, 10);
  }
  pop();
}

function drawArtisticNose() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;
    
    // Core nose anchors
    const noseBridge = keypoints[168];   // Bridge top
    const noseLeft = keypoints[102];      // Left nostril
    const noseRight = keypoints[331];     // Right nostril
    const noseTip = keypoints[4];         // Tip of nose
    const noseBottom = keypoints[2];      // Bottom center
    
    // Calculate scale and movement dynamics
    let noseWidth = dist(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);
    let timeFactor = frameCount * 0.08;
    
    push();
    
    // --- PART 1: The Charcoal Under-Glow (Shadow) ---
    noStroke();
    for (let j = 4; j > 0; j--) {
      fill(30, 20, 20, map(j, 1, 4, 150, 10)); // Deep warm charcoal tones
      ellipse(
        noseTip[0], 
        noseTip[1] + noseWidth * 0.1, 
        noseWidth * 0.6 * j, 
        noseWidth * 0.4 * j
      );
    }

    // --- PART 2: Avant-Garde Wireframe Muzzle ---
    stroke(255, 245, 230, 220); // Warm ivory thread color
    strokeWeight(1.5);
    noFill();
    
    // Origami-style lines linking the structural boundaries
    beginShape();
    vertex(noseBridge[0], noseBridge[1]);
    vertex(noseRight[0], noseRight[1]);
    vertex(noseTip[0], noseTip[1] + noseWidth * 0.15);
    vertex(noseLeft[0], noseLeft[1]);
    endShape(CLOSE);
    
    // Internal geometric division line (giving it a 3D structural fold)
    line(noseBridge[0], noseBridge[1], noseTip[0], noseTip[1] + noseWidth * 0.15);
    line(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);

    // --- PART 3: Physics-Style Whiskers ---
    stroke(255, 245, 230, 180);
    noFill();
    
    // Let's create a natural, organic droop/curve using Bezier curves
    let baseOffset = sin(timeFactor) * 2; // Subtle breathing motion
    
    // Left side whiskers (procedural curves)
    drawCurvedWhisker(noseLeft[0], noseLeft[1], -1, baseOffset, noseWidth);
    
    // Right side whiskers (procedural curves)
    drawCurvedWhisker(noseRight[0], noseRight[1], 1, baseOffset, noseWidth);
    
    // --- PART 4: Point Elements ---
    // Tiny glowing keypoints marking the structural joints of the "mask"
    fill(220, 100, 80); // Red wax seal color
    noStroke();
    ellipse(noseBridge[0], noseBridge[1], 4, 4);
    ellipse(noseLeft[0], noseLeft[1], 3, 3);
    ellipse(noseRight[0], noseRight[1], 3, 3);
    ellipse(noseTip[0], noseTip[1] + noseWidth * 0.15, 6, 6);

    pop();
  }
}

// Helper function to render elegant, dynamic whiskers
function drawCurvedWhisker(startX, startY, direction, offset, size) {
  let whiskerLength = size * 1.8;
  
  for (let angleOffset of [-15, 0, 15]) {
    let angleRad = radians(angleOffset);
    let targetX = startX + (whiskerLength * direction * cos(angleRad));
    let targetY = startY + (whiskerLength * sin(angleRad)) + (offset * 1.5) + (size * 0.2);
    
    // Control points for a graceful sagging bezier curve (simulating hair weight)
    let cp1x = startX + (whiskerLength * 0.4 * direction);
    let cp1y = startY + (size * 0.3) + offset;
    let cp2x = startX + (whiskerLength * 0.8 * direction);
    let cp2y = targetY + 10;
    
    bezier(startX, startY, cp1x, cp1y, cp2x, cp2y, targetX, targetY);
  }
}
