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
  console.log("Organic geometric mode activated.");
}

function draw() {
  // Draw the background camera video
  image(video, 0, 0, width, height);

  // Render the organic, borderless nose-only covers
  drawOrganicNose();
}

function drawOrganicNose() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;
    
    // --- Key Nose Anchors ---
    const noseBridge = keypoints[168];   // Top of the nose bridge
    const noseLeft = keypoints[102];      // Left nostril edge
    const noseRight = keypoints[331];     // Right nostril edge
    const noseBottom = keypoints[2];      // Bottom septum base
    
    // Calculate size dynamically
    let noseWidth = dist(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);
    let noseHeight = dist(noseBridge[0], noseBridge[1], noseBottom[0], noseBottom[1]);
    
    push();
    noStroke(); // Crucial: removes all geometric border outlines

    // 1. The Main Snout: A smooth, tapered organic drop-shape
    fill(75, 70, 70); // Smooth warm charcoal-grey
    
    beginShape();
    // Start with a smooth rounded top at the bridge using bezier vertices
    vertex(noseBridge[0] - noseWidth * 0.15, noseBridge[1]);
    
    // Curve down to the right edge
    bezierVertex(
      noseBridge[0], noseBridge[1], 
      noseRight[0], noseRight[1] - noseHeight * 0.2, 
      noseRight[0] + noseWidth * 0.1, noseRight[1]
    );
    
    // Curve into the rounded bottom tip
    bezierVertex(
      noseRight[0], noseRight[1] + noseHeight * 0.3, 
      noseBottom[0] + noseWidth * 0.2, noseBottom[1] + noseHeight * 0.25, 
      noseBottom[0], noseBottom[1] + noseHeight * 0.25
    );
    
    // Curve up through the left edge
    bezierVertex(
      noseBottom[0] - noseWidth * 0.2, noseBottom[1] + noseHeight * 0.25, 
      noseLeft[0], noseLeft[1] + noseHeight * 0.3, 
      noseLeft[0] - noseWidth * 0.1, noseLeft[1]
    );
    
    // Curve back up to the top bridge
    bezierVertex(
      noseLeft[0], noseLeft[1] - noseHeight * 0.2, 
      noseBridge[0], noseBridge[1], 
      noseBridge[0] - noseWidth * 0.15, noseBridge[1]
    );
    endShape(CLOSE);

    // 2. The Nose Tip: A clean, borderless organic capsule
    fill(35, 30, 30); // Darker tone
    ellipse(
      noseBottom[0], 
      noseBottom[1] + noseHeight * 0.1, 
      noseWidth * 0.45, 
      noseWidth * 0.3
    );

    // 3. Fluid, Tapered Whiskers
    // Drawn as thin, borderless shapes that mimic organic hairs rather than computer lines
    fill(245, 240, 235, 210); // Soft milk-white
    
    let timeFactor = frameCount * 0.06;
    let sway = sin(timeFactor) * (noseWidth * 0.05); // Organic breathing sway
    
    // Left Whiskers
    drawOrganicWhisker(noseLeft[0], noseLeft[1], -1, sway, noseWidth);
    
    // Right Whiskers
    drawOrganicWhisker(noseRight[0], noseRight[1], 1, sway, noseWidth);

    pop();
  }
}

// Draws a tapered, borderless whisker shape using curves
function drawOrganicWhisker(startX, startY, direction, sway, size) {
  let length = size * 1.5;
  
  // Render three organic tapered whiskers
  for (let angle of [-12, 0, 12]) {
    let rad = radians(angle);
    let endX = startX + (length * direction * cos(rad));
    let endY = startY + (length * sin(rad)) + sway;
    
    beginShape();
    // Start at a point on the nose side
    vertex(startX, startY - 0.5);
    // Curve to the tapered thin tip
    quadraticVertex(startX + (length * 0.5 * direction), startY + (size * 0.1), endX, endY);
    // Curve back creating a tiny organic taper
    quadraticVertex(startX + (length * 0.5 * direction), startY + (size * 0.1) + 1, startX, startY + 0.5);
    endShape(CLOSE);
  }
}
