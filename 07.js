let video;
let facemesh;
let predictions = [];
let smoothedLightDir = 0; 
let canvasTexture;

let faceAssignments = [];

// Vintage Oil Paint Palette (Bone, Brick, Ochre, Dusty Blue, Creepy Pink)
const palettes = [
  [210, 200, 180], // Bone White
  [160, 60, 40],   // Brick Red
  [200, 130, 50],  // Ochre
  [70, 90, 110],   // Dusty Blue
  [200, 120, 130]  // Faded Pink
];

// The 11 distinct generative animal profiles
const animals = [
  { name: 'Rat', len: 0.6, wid: 1.0, pad: 'ellipse', whisk: 'stiff', ear: 'round', eSize: 0.8, col: 0 },
  { name: 'Cat', len: 0.2, wid: 0.8, pad: 'triangle', whisk: 'straight', ear: 'pointy', eSize: 1.0, col: 1 },
  { name: 'Fox', len: 1.1, wid: 0.8, pad: 'triangle', whisk: 'straight', ear: 'pointy', eSize: 1.4, col: 2 },
  { name: 'Pig', len: 0.3, wid: 1.5, pad: 'pig', whisk: 'none', ear: 'floppy', eSize: 1.2, col: 4 },
  { name: 'Rabbit', len: 0.3, wid: 0.7, pad: 'triangle', whisk: 'straight', ear: 'tall', eSize: 2.2, col: 0 },
  { name: 'Elephant', len: 2.5, wid: 1.2, pad: 'ellipse', whisk: 'none', ear: 'massive', eSize: 2.8, col: 3 },
  { name: 'Bear', len: 0.6, wid: 1.4, pad: 'ellipse', whisk: 'none', ear: 'round', eSize: 0.6, col: 1 },
  { name: 'Raven', len: 1.5, wid: 0.4, pad: 'beak', whisk: 'none', ear: 'none', eSize: 0, col: 0 },
  { name: 'Deer', len: 0.9, wid: 0.7, pad: 'ellipse', whisk: 'none', ear: 'leaf', eSize: 1.5, col: 2 },
  { name: 'Rhino', len: 1.2, wid: 1.2, pad: 'horn', whisk: 'none', ear: 'tubes', eSize: 0.5, col: 3 },
  // UPDATED BAT: Custom bat_nose pad
  { name: 'Bat', len: 0.2, wid: 1.2, pad: 'bat_nose', whisk: 'none', ear: 'bat', eSize: 2.5, col: 4 }
];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  facemesh = ml5.facemesh(video, () => console.log("Vintage Painted Multi-Chimera Ready."));
  facemesh.on("predict", results => { predictions = results; });
  video.hide();

  canvasTexture = createGraphics(width, height);
  canvasTexture.pixelDensity(1);
  canvasTexture.loadPixels();
  for (let i = 0; i < canvasTexture.pixels.length; i += 4) {
    let noiseVal = random(150, 255);
    canvasTexture.pixels[i] = noiseVal;         
    canvasTexture.pixels[i+1] = noiseVal * 0.9; 
    canvasTexture.pixels[i+2] = noiseVal * 0.8; 
    canvasTexture.pixels[i+3] = random(20, 60); 
  }
  canvasTexture.updatePixels();
}

function draw() {
  image(video, 0, 0, width, height);
  fill(50, 40, 30, 120); 
  rect(0, 0, width, height);

  drawPaintedChimera();
  image(canvasTexture, 0, 0);
  drawUI();
}

function drawPaintedChimera() {
  for (let i = 0; i < predictions.length; i += 1) {
    if (!faceAssignments[i]) {
      faceAssignments[i] = {
        animalIndex: floor(random(animals.length)),
        lastMutationTime: millis()
      };
    }
    
    if (millis() - faceAssignments[i].lastMutationTime > 4000) {
      faceAssignments[i].animalIndex = floor(random(animals.length));
      faceAssignments[i].lastMutationTime = millis();
    }
    
    let anim = animals[faceAssignments[i].animalIndex];
    let baseColor = palettes[anim.col];
    const keypoints = predictions[i].scaledMesh;
    
    const noseBridge = keypoints[168];
    const noseLeft = keypoints[102];
    const noseRight = keypoints[331];
    const noseTip = keypoints[4]; 
    const upperLipTop = keypoints[164]; 
    const leftTemple = keypoints[162]; 
    const rightTemple = keypoints[389]; 
    const leftEye = keypoints[159]; 
    const rightEye = keypoints[386]; 
    
    let baseNoseWidth = dist(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);
    let faceWidth = dist(leftTemple[0], leftTemple[1], rightTemple[0], rightTemple[1]);
    let noseHeight = dist(noseBridge[0], noseBridge[1], upperLipTop[0], upperLipTop[1]);
    
    let noseWidth = baseNoseWidth * anim.wid;
    
    // Painted Generative Ears
    drawPaintedEar(leftTemple[0], leftTemple[1], faceWidth, anim, true, baseColor, i);
    drawPaintedEar(rightTemple[0], rightTemple[1], faceWidth, anim, false, baseColor, i);

    // Hollow Painted Eyes
    fill(15, 12, 10, 240);
    noStroke();
    for(let j=0; j<4; j++) {
      ellipse(leftEye[0] + random(-3,3), leftEye[1] + random(-3,3), noseWidth * 1.5, noseWidth * 1.2);
      ellipse(rightEye[0] + random(-3,3), rightEye[1] + random(-3,3), noseWidth * 1.5, noseWidth * 1.2);
    }
    
    // 3D Projection
    let dirX = noseTip[0] - noseBridge[0];
    let dirY = noseTip[1] - noseBridge[1];
    let dynamicLen = anim.len * map(noise(frameCount * 0.02 + i * 100), 0, 1, 0.9, 1.1);
    let snoutTipX = noseTip[0] + (dirX * dynamicLen);
    let snoutTipY = noseTip[1] + (dirY * dynamicLen);

    // Light Detection
    let cLeft = video.get(keypoints[234][0], keypoints[234][1]); 
    let cRight = video.get(keypoints[454][0], keypoints[454][1]); 
    let bLeft = cLeft ? (cLeft[0] + cLeft[1] + cLeft[2]) / 3 : 0;
    let bRight = cRight ? (cRight[0] + cRight[1] + cRight[2]) / 3 : 0;
    smoothedLightDir = lerp(smoothedLightDir, constrain((bRight - bLeft) / 40, -1.5, 1.5), 0.1);

    push();
    noStroke(); 

    // Nostril Blocker Base
    fill(15, 12, 10); 
    beginShape();
    vertex(noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    quadraticVertex(noseLeft[0] - baseNoseWidth * 0.6, noseLeft[1], upperLipTop[0] - baseNoseWidth * 0.3, upperLipTop[1]);
    vertex(upperLipTop[0], upperLipTop[1]);
    quadraticVertex(noseRight[0] + baseNoseWidth * 0.6, noseRight[1], noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    endShape(CLOSE);

    // The Thick Impasto Snout
    let highlightX = snoutTipX + (smoothedLightDir * noseWidth * 0.5);
    let highlightY = snoutTipY - (noseWidth * 0.2);
    let grad = drawingContext.createRadialGradient(
      highlightX, highlightY, 0,           
      snoutTipX, snoutTipY, noseWidth * (1.5 + dynamicLen) 
    );
    
    grad.addColorStop(0, `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`); 
    grad.addColorStop(0.5, `rgb(${baseColor[0]*0.5}, ${baseColor[1]*0.5}, ${baseColor[2]*0.5})`);  
    grad.addColorStop(1, 'rgb(20, 15, 15)');    
    drawingContext.fillStyle = grad;
    
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

    // Brush stroke overlays
    for(let k=0; k<15; k++) {
      stroke(baseColor[0], baseColor[1], baseColor[2], random(30, 80));
      strokeWeight(random(2, 6));
      noFill();
      let rx = snoutTipX + random(-noseWidth*0.4, noseWidth*0.4);
      let ry = snoutTipY + random(-noseWidth*0.4, noseWidth*0.4);
      bezier(noseBridge[0], noseBridge[1], 
             noseBridge[0] + random(-20,20), noseBridge[1] + random(20, 50),
             rx + random(-20,20), ry - random(20,50),
             rx, ry);
    }

    // Painted Nose Pads
    drawPaintedNosePad(snoutTipX, snoutTipY, noseWidth, anim.pad);

    // Thick Paint Whiskers
    let sway = sin(frameCount * 0.05 + i) * (noseWidth * 0.1); 
    if (anim.whisk === 'stiff') {
      drawPaintedWhisker(snoutTipX - noseWidth * 0.3, snoutTipY, -1, sway, noseWidth, true);
      drawPaintedWhisker(snoutTipX + noseWidth * 0.3, snoutTipY, 1, sway, noseWidth, true);
    } else if (anim.whisk === 'straight') {
      drawPaintedWhisker(snoutTipX - noseWidth * 0.3, snoutTipY, -1, sway, noseWidth, false);
      drawPaintedWhisker(snoutTipX + noseWidth * 0.3, snoutTipY, 1, sway, noseWidth, false);
    }
    pop();
  }
}

// --- Oil Paint Rendering Functions ---

function drawPaintedEar(x, y, faceWidth, anim, isLeft, color, id) {
  if (anim.ear === 'none') return;
  
  push();
  translate(x, y);
  
  // Asymmetric Mirroring System: Safely flips the X axis for the left ear 
  // so we can draw highly detailed asymmetric shapes (like the bat wing) perfectly.
  scale(isLeft ? -1 : 1, 1);
  
  // Base rotation (Outward tilt + twitch)
  rotate(PI / 6 + sin(frameCount * 0.02 + id) * 0.05); 
  
  let s = faceWidth * 0.3 * anim.eSize;
  fill(color[0]*0.7, color[1]*0.7, color[2]*0.7, 240); 
  stroke(15, 10, 10);
  strokeWeight(random(3, 6)); 
  
  for(let j=0; j<3; j++) {
    push();
    translate(random(-2,2), random(-2,2));
    
    if (anim.ear === 'round' || anim.ear === 'massive') ellipse(0, -s/2, s, s);
    else if (anim.ear === 'pointy') triangle(-s/2, 0, s/2, 0, 0, -s);
    else if (anim.ear === 'floppy') bezier(-s/2, 0, -s, s, s, s, s/2, 0);
    else if (anim.ear === 'tall') ellipse(0, -s, s*0.4, s*2);
    else if (anim.ear === 'leaf') { bezier(0, 0, -s/2, -s/2, -s/4, -s, 0, -s); bezier(0, 0, s/2, -s/2, s/4, -s, 0, -s); }
    else if (anim.ear === 'tubes') rect(-s/4, -s, s/2, s, 10);
    
    // UPDATED BAT EAR: Scalloped wing texture with structural ribs
    else if (anim.ear === 'bat') { 
      beginShape();
      vertex(0, 0);
      quadraticVertex(-s*0.3, -s*0.5, 0, -s); // Smooth inner edge to top point
      quadraticVertex(s*0.4, -s*0.8, s*0.6, -s*0.4); // Scallop 1 (Outer edge)
      quadraticVertex(s*0.8, -s*0.1, s*0.2, 0);      // Scallop 2 (Outer base)
      endShape(CLOSE);
      
      // Draw leathery wing ribs on the inside of the ear
      noFill();
      stroke(15, 10, 10, 150);
      strokeWeight(random(2, 4));
      line(0, 0, 0, -s);           // Center cartilage spine
      line(0, 0, s*0.6, -s*0.4);   // Outer upper rib
      line(0, 0, s*0.2, 0);        // Outer lower rib
    }
    
    pop();
  }
  pop();
}

function drawPaintedNosePad(tx, ty, w, type) {
  fill(15, 10, 10);
  noStroke();
  
  for(let j=0; j<3; j++) {
    let ox = tx + random(-2,2);
    let oy = ty + random(-2,2);
    
    if (type === 'ellipse') {
      ellipse(ox, oy, w * 0.4, w * 0.3);
    } else if (type === 'triangle') {
      triangle(ox - w*0.2, oy - w*0.1, ox + w*0.2, oy - w*0.1, ox, oy + w*0.2);
    } else if (type === 'pig') {
      fill(180, 120, 110); 
      ellipse(ox, oy, w * 0.6, w * 0.4);
      fill(15);
      ellipse(ox - w*0.15, oy, w*0.1, w*0.15); 
      ellipse(ox + w*0.15, oy, w*0.1, w*0.15); 
    } else if (type === 'horn') {
      fill(180, 170, 160);
      triangle(ox - w*0.3, oy, ox + w*0.3, oy, ox, oy - w*1.5); 
    } 
    // UPDATED BAT NOSE: Anatomical fleshy "leaf" nose with deep nostrils
    else if (type === 'bat_nose') {
      fill(20, 15, 15);
      triangle(ox - w*0.25, oy, ox + w*0.25, oy, ox, oy - w*0.4); // Leaf top
      ellipse(ox, oy + w*0.1, w*0.5, w*0.3);                      // Bulky base
      fill(0); // Deep hollow nostrils
      ellipse(ox - w*0.15, oy + w*0.1, w*0.15, w*0.2);
      ellipse(ox + w*0.15, oy + w*0.1, w*0.15, w*0.2);
    }
  }
}

function drawPaintedWhisker(startX, startY, dir, sway, size, isStiff) {
  for (let i = -1; i <= 1; i++) {
    stroke(15, 15, 15, 200); 
    strokeWeight(random(2, 5));
    noFill();
    let length = size * random(1.8, 2.5); 
    let yOffset = i * 15;
    
    if (isStiff) {
      beginShape();
      vertex(startX, startY + yOffset);
      vertex(startX + (length * 0.5 * dir), startY + yOffset + random(-5,5));
      vertex(startX + (length * dir), startY + yOffset + sway);
      endShape();
    } else {
      bezier(startX, startY + yOffset, 
             startX + (length * 0.3 * dir), startY + yOffset + sway*2,
             startX + (length * 0.7 * dir), startY + yOffset - sway,
             startX + (length * dir), startY + yOffset + sway);
    }
  }
}

function drawUI() {
  fill(240, 230, 210, 180); 
  noStroke();
  textSize(24); textStyle(BOLD); textFont('Georgia'); 
  textAlign(CENTER);
  
  if (predictions.length === 1 && faceAssignments[0]) {
    text(`Subject: ${animals[faceAssignments[0].animalIndex].name}`, width / 2, height - 30);
  } else if (predictions.length > 1) {
    text(`Subjects: ${predictions.length} Entities Manifesting`, width / 2, height - 30);
  } else {
    text(`Awaiting Subjects...`, width / 2, height - 30);
  }
  
  textSize(14); textStyle(ITALIC);
  text("Mutating independently every 4 seconds", width / 2, height - 10);
}
