let video;
let facemesh;
let predictions = [];
let smoothedLightDir = 0; 
let spores = []; // Array to hold random artistic particles

function setup() {
  createCanvas(640, 480);
  
  video = createCapture(VIDEO);
  video.size(width, height);

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on("predict", results => {
    predictions = results;
  });

  video.hide();
}

function modelReady() {
  console.log("Exaggerated Surreal Generative Mode activated.");
}

function draw() {
  // Draw the background video with a slight darkness for contrast
  image(video, 0, 0, width, height);
  fill(0, 0, 0, 60); // Moody atmospheric overlay
  rect(0, 0, width, height);

  drawExaggeratedArtNose();
  updateAndDrawSpores();
}

function drawExaggeratedArtNose() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;
    
    // --- Key Anchors ---
    const noseBridge = keypoints[168];
    const noseLeft = keypoints[102];
    const noseRight = keypoints[331];
    const noseTip = keypoints[4]; 
    const upperLipTop = keypoints[164]; 
    
    let noseWidth = dist(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);
    let noseHeight = dist(noseBridge[0], noseBridge[1], upperLipTop[0], upperLipTop[1]);
    
    // --- 1. Exaggerated Pulsing 3D Projection ---
    let dirX = noseTip[0] - noseBridge[0];
    let dirY = noseTip[1] - noseBridge[1];
    
    // Use Perlin noise to make the snout randomly stretch, bulge, and retract!
    // It will morph between a short stubby nose and a long, exaggerated trunk.
    let dynamicMultiplier = map(noise(frameCount * 0.03), 0, 1, 0.2, 2.5);
    
    let snoutTipX = noseTip[0] + (dirX * dynamicMultiplier);
    let snoutTipY = noseTip[1] + (dirY * dynamicMultiplier);
    
    // Emit particles from the pulsating tip
    if (random() > 0.4) {
      spores.push(new Spore(snoutTipX, snoutTipY, noseWidth));
    }

    // --- 2. Chaotic Light Detection ---
    let cLeft = video.get(keypoints[234][0], keypoints[234][1]); 
    let cRight = video.get(keypoints[454][0], keypoints[454][1]); 
    let bLeft = cLeft ? (cLeft[0] + cLeft[1] + cLeft[2]) / 3 : 0;
    let bRight = cRight ? (cRight[0] + cRight[1] + cRight[2]) / 3 : 0;
    
    let brightnessDiff = bRight - bLeft; 
    let targetLightDir = constrain(brightnessDiff / 40, -1.5, 1.5); 
    smoothedLightDir = lerp(smoothedLightDir, targetLightDir, 0.1);

    push();
    noStroke(); 

    // --- 3. The Solid Blocker Base ---
    fill(10, 5, 15); // Deep void color
    beginShape();
    vertex(noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    quadraticVertex(noseLeft[0] - noseWidth * 0.6, noseLeft[1], upperLipTop[0] - noseWidth * 0.3, upperLipTop[1]);
    vertex(upperLipTop[0], upperLipTop[1]);
    quadraticVertex(noseRight[0] + noseWidth * 0.6, noseRight[1], noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    endShape(CLOSE);

    // --- 4. Iridescent Shifting Gradient ---
    // Generate surreal, shifting colors using time-based noise
    let hue1 = map(noise(frameCount * 0.01), 0, 1, 100, 255);
    let hue2 = map(noise(frameCount * 0.01 + 100), 0, 1, 50, 255);
    
    let highlightX = snoutTipX + (smoothedLightDir * noseWidth * 0.5);
    let highlightY = snoutTipY - (noseWidth * 0.2);
    
    let grad = drawingContext.createRadialGradient(
      highlightX, highlightY, 0,           
      snoutTipX, snoutTipY, noseWidth * (1.0 + dynamicMultiplier) 
    );
    
    // Highlight shifts through weird alien colors (pinks, cyans, glowing whites)
    grad.addColorStop(0, `rgb(255, ${hue1}, ${hue2})`); 
    grad.addColorStop(0.3, `rgb(${hue2 * 0.5}, 50, 80)`);  
    grad.addColorStop(1, 'rgb(15, 10, 20)');    
    
    drawingContext.fillStyle = grad;
    
    // --- 5. The Morphing Organic Volume ---
    beginShape();
    vertex(noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    
    bezierVertex(
      noseRight[0] + noseWidth * 0.5, noseRight[1], 
      snoutTipX + noseWidth * 0.5, snoutTipY - noseWidth * 0.1, 
      snoutTipX, snoutTipY + noseWidth * 0.2 
    );
    
    bezierVertex(
      snoutTipX - noseWidth * 0.5, snoutTipY - noseWidth * 0.1, 
      noseLeft[0] - noseWidth * 0.5, noseLeft[1], 
      noseBridge[0], noseBridge[1] - noseHeight * 0.15
    );
    endShape(CLOSE);

    // --- 6. The Glitching Nose Pad ---
    // Instead of a perfect ellipse, it stutters and shakes randomly
    let jitterX = random(-3, 3);
    let jitterY = random(-3, 3);
    fill(0);
    ellipse(snoutTipX + jitterX, snoutTipY + jitterY, noseWidth * 0.5, noseWidth * 0.35);
    
    fill(255, random(100, 255), random(100, 255), 200); // Glitching specular highlight
    ellipse(snoutTipX + (smoothedLightDir * noseWidth * 0.1) + jitterX, snoutTipY - noseWidth * 0.05 + jitterY, noseWidth * 0.15, noseWidth * 0.08);

    // --- 7. Writhing, Tentacle-Like Whiskers ---
    // Whiskers now whip wildly and change length randomly
    strokeWeight(random(1, 3));
    let baseSway = sin(frameCount * 0.1) * (noseWidth * 0.2); 
    
    drawWrithingWhisker(snoutTipX - noseWidth * 0.3, snoutTipY, -1, baseSway, noseWidth);
    drawWrithingWhisker(snoutTipX + noseWidth * 0.3, snoutTipY, 1, baseSway, noseWidth);

    pop();
  }
}

// Generates chaotic, jagged, yet fluid whiskers using Perlin noise
function drawWrithingWhisker(startX, startY, direction, sway, size) {
  let numWhiskers = 4;
  
  for (let i = 0; i < numWhiskers; i++) {
    // Whiskers randomly change color and opacity
    stroke(random(150, 255), random(200, 255), 255, random(100, 200));
    noFill();
    
    let length = size * random(1.5, 3.5); // Wildly exaggerated lengths
    let erraticBend = (noise(frameCount * 0.05, i * 10) - 0.5) * 150; // Wiggling motion
    
    let endX = startX + (length * direction);
    let endY = startY + sway + erraticBend;
    
    let cp1x = startX + (length * 0.3 * direction);
    let cp1y = startY + erraticBend * 0.5;
    let cp2x = startX + (length * 0.7 * direction);
    let cp2y = endY - erraticBend * 0.5;
    
    bezier(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY);
  }
}

// --- Particle System Class ---
class Spore {
  constructor(x, y, scale) {
    this.x = x + random(-20, 20);
    this.y = y + random(-20, 20);
    this.vx = random(-2, 2);
    this.vy = random(1, 4); // Drift downwards like heavy pollen
    this.life = 255;
    this.size = random(2, scale * 0.15);
    // Random alien colors
    this.r = random(100, 255);
    this.g = random(50, 150);
    this.b = random(150, 255);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= random(2, 6);
  }
  
  show() {
    noStroke();
    fill(this.r, this.g, this.b, this.life);
    ellipse(this.x, this.y, this.size);
  }
}

function updateAndDrawSpores() {
  for (let i = spores.length - 1; i >= 0; i--) {
    spores[i].update();
    spores[i].show();
    if (spores[i].life <= 0) {
      spores.splice(i, 1);
    }
  }
}
