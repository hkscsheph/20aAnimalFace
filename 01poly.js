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

  // 3. Listen to new 'predict' events and save the results
  facemesh.on('predict', (results) => {
    predictions = results;
  });

  // Hide the raw video element, we will draw it on the canvas
  video.hide();

  // Set drawing styles for the masks
  noStroke();
}

function modelReady() {
  console.log('Model ready!');
}

function draw() {
  // Draw the video to the canvas
  image(video, 0, 0, width, height);

  // Apply a slightly eerie, dark overlay to match the 3rd image's vibe
  fill(0, 0, 0, 80);
  rect(0, 0, width, height);

  // Draw the rat masks
  drawRatMasks();
}

function drawRatMasks() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;

    // Key facial anchor points
    const noseTip = keypoints[1];
    const leftEye = keypoints[133];
    const rightEye = keypoints[362];
    const topHead = keypoints[10];
    const leftCheek = keypoints[234];
    const rightCheek = keypoints[454];

    // Calculate face width/height for scaling the mask
    let faceWidth = dist(
      leftCheek[0],
      leftCheek[1],
      rightCheek[0],
      rightCheek[1]
    );

    push();
    fill(80, 75, 75); // Dark grey rat color
    stroke(20);
    strokeWeight(2);

    // --- Draw Ears ---
    // Left ear
    ellipse(
      leftEye[0] - faceWidth * 0.4,
      topHead[1] - faceWidth * 0.2,
      faceWidth * 0.5,
      faceWidth * 0.5
    );
    // Right ear
    ellipse(
      rightEye[0] + faceWidth * 0.4,
      topHead[1] - faceWidth * 0.2,
      faceWidth * 0.5,
      faceWidth * 0.5
    );

    // Inner ears (pinkish)
    fill(200, 150, 150);
    noStroke();
    ellipse(
      leftEye[0] - faceWidth * 0.4,
      topHead[1] - faceWidth * 0.2,
      faceWidth * 0.3,
      faceWidth * 0.3
    );
    ellipse(
      rightEye[0] + faceWidth * 0.4,
      topHead[1] - faceWidth * 0.2,
      faceWidth * 0.3,
      faceWidth * 0.3
    );

    // --- Draw the Snout / Main Mask ---
    fill(80, 75, 75);
    stroke(20);
    strokeWeight(2);

    beginShape();
    vertex(leftCheek[0], leftCheek[1]);
    vertex(noseTip[0], noseTip[1] + faceWidth * 0.3); // Pointy snout going down
    vertex(rightCheek[0], rightCheek[1]);
    vertex(topHead[0], topHead[1] - faceWidth * 0.2); // Top of the head mask
    endShape(CLOSE);

    // --- Draw Whiskers ---
    stroke(220); // Light whiskers
    strokeWeight(1.5);
    let snoutX = noseTip[0];
    let snoutY = noseTip[1] + faceWidth * 0.15;

    // Left whiskers
    line(snoutX, snoutY, snoutX - faceWidth * 0.8, snoutY - 20);
    line(snoutX, snoutY, snoutX - faceWidth * 0.9, snoutY);
    line(snoutX, snoutY, snoutX - faceWidth * 0.8, snoutY + 20);

    // Right whiskers
    line(snoutX, snoutY, snoutX + faceWidth * 0.8, snoutY - 20);
    line(snoutX, snoutY, snoutX + faceWidth * 0.9, snoutY);
    line(snoutX, snoutY, snoutX + faceWidth * 0.8, snoutY + 20);

    // --- Draw Nose Tip ---
    fill(0); // Black nose tip
    noStroke();
    ellipse(
      noseTip[0],
      noseTip[1] + faceWidth * 0.25,
      faceWidth * 0.15,
      faceWidth * 0.1
    );

    pop();
  }
}
