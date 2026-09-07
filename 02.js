let video;
let facemesh;
let predictions = [];

function setup() {
  createCanvas(640, 480);
  
  // 1. Setup the webcam video
  video = createCapture(VIDEO);
  video.size(width, height);

  // 2. Initialize the ml5 FaceMesh method
  facemesh = ml5.facemesh(video, modelReady);

  // 3. Listen to new predictions
  facemesh.on("predict", results => {
    predictions = results;
  });

  video.hide();
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  // Draw the background camera video
  image(video, 0, 0, width, height);

  // Render the nose-only covers
  drawRatNoseOnly();
}

function drawRatNoseOnly() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;
    
    // --- Precise Nose Keypoints ---
    const noseBridgeTop = keypoints[168]; // Top of the nose bridge (between eyes)
    const noseLeftEdge = keypoints[102];   // Outer left nostril edge
    const noseRightEdge = keypoints[331];  // Outer right nostril edge
    const noseTip = keypoints[4];         // Absolute tip of the nose
    const noseBottom = keypoints[2];       // Just below the septum base
    
    // Calculate proportional sizing for the rat nose elements
    let noseWidth = dist(noseLeftEdge[0], noseLeftEdge[1], noseRightEdge[0], noseRightEdge[1]);
    
    push();
    
    // 1. Draw the snout body (spanning precisely over the human nose)
    fill(90, 85, 85); // Rat-grey fur tone
    stroke(40);
    strokeWeight(1.5);
    
    beginShape();
    // Anchor top of the snout to the bridge of the nose
    vertex(noseBridgeTop[0], noseBridgeTop[1]);
    // Outer right side
    vertex(noseRightEdge[0] + noseWidth * 0.1, noseRightEdge[1]);
    // Pointy bottom center (creates the rat's muzzle shape covering the septum)
    vertex(noseBottom[0], noseBottom[1] + noseWidth * 0.2);
    // Outer left side
    vertex(noseLeftEdge[0] - noseWidth * 0.1, noseLeftEdge[1]);
    endShape(CLOSE);
    
    // 2. Draw the black rat nose tip
    fill(20);
    noStroke();
    let tipSizeX = noseWidth * 0.4;
    let tipSizeY = noseWidth * 0.25;
    ellipse(noseBottom[0], noseBottom[1] + noseWidth * 0.15, tipSizeX, tipSizeY);
    
    // 3. Draw thin whiskers shooting out only from the sides of the snout
    stroke(240, 240, 240, 200); // Semi-transparent white whiskers
    strokeWeight(1.5);
    
    let whiskerOriginY = noseTip[1];
    
    // Left side whiskers
    let leftX = noseLeftEdge[0];
    line(leftX, whiskerOriginY, leftX - noseWidth * 1.5, whiskerOriginY - 10);
    line(leftX, whiskerOriginY, leftX - noseWidth * 1.7, whiskerOriginY);
    line(leftX, whiskerOriginY, leftX - noseWidth * 1.5, whiskerOriginY + 10);
    
    // Right side whiskers
    let rightX = noseRightEdge[0];
    line(rightX, whiskerOriginY, rightX + noseWidth * 1.5, whiskerOriginY - 10);
    line(rightX, whiskerOriginY, rightX + noseWidth * 1.7, whiskerOriginY);
    line(rightX, whiskerOriginY, rightX + noseWidth * 1.5, whiskerOriginY + 10);
    
    pop();
  }
}
