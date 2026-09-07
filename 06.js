let video;
let facemesh;
let predictions = [];
let smoothedLightDir = 0; 
let spores = []; 

// The Mutation Engine Variables
let currentAnimalIndex = 0;
let lastMutationTime = 0;

// The 11 distinct generative animal profiles
const animals = [
  { name: 'Rat', len: 0.6, wid: 1.0, pad: 'ellipse', whisk: 'chaotic', ear: 'round', eSize: 0.8 },
  { name: 'Cat', len: 0.2, wid: 0.8, pad: 'triangle', whisk: 'straight', ear: 'pointy', eSize: 1.0 },
  { name: 'Fox', len: 1.1, wid: 0.8, pad: 'triangle', whisk: 'straight', ear: 'pointy', eSize: 1.4 },
  { name: 'Pig', len: 0.3, wid: 1.5, pad: 'pig', whisk: 'none', ear: 'floppy', eSize: 1.2 },
  { name: 'Rabbit', len: 0.3, wid: 0.7, pad: 'triangle', whisk: 'straight', ear: 'tall', eSize: 2.2 },
  { name: 'Elephant', len: 2.5, wid: 1.2, pad: 'ellipse', whisk: 'none', ear: 'massive', eSize: 2.8 },
  { name: 'Bear', len: 0.6, wid: 1.4, pad: 'ellipse', whisk: 'none', ear: 'round', eSize: 0.6 },
  { name: 'Raven', len: 1.5, wid: 0.4, pad: 'beak', whisk: 'none', ear: 'none', eSize: 0 },
  { name: 'Deer', len: 0.9, wid: 0.7, pad: 'ellipse', whisk: 'none', ear: 'leaf', eSize: 1.5 },
  { name: 'Rhino', len: 1.2, wid: 1.2, pad: 'horn', whisk: 'none', ear: 'tubes', eSize: 0.5 },
  { name: 'Bat', len: 0.2, wid: 1.2, pad: 'triangle', whisk: 'none', ear: 'bat', eSize: 2.5 }
];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  facemesh = ml5.facemesh(video, () => console.log("Chimera Engine Ready."));
  facemesh.on("predict", results => { predictions = results; });
  video.hide();
}

function draw() {
  image(video, 0, 0, width, height);
  fill(0, 0, 0, 80); 
  rect(0, 0, width, height);

  // Trigger random mutation every 4 seconds
  if (millis() - lastMutationTime > 4000) {
    currentAnimalIndex = floor(random(animals.length));
    lastMutationTime = millis();
  }

  drawMutatingChimera();
  updateAndDrawSpores();
  drawUI();
}

function drawMutatingChimera() {
  let anim = animals[currentAnimalIndex];

  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;
    
    const noseBridge = keypoints[168];
    const noseLeft = keypoints[102];
    const noseRight = keypoints[331];
    const noseTip = keypoints[4]; 
    const upperLipTop = keypoints[164]; 
    const leftTemple = keypoints[162]; // Anchor for left ear
    const rightTemple = keypoints[389]; // Anchor for right ear
    
    let baseNoseWidth = dist(noseLeft[0], noseLeft[1], noseRight[0], noseRight[1]);
    let faceWidth = dist(leftTemple[0], leftTemple[1], rightTemple[0], rightTemple[1]);
    let noseHeight = dist(noseBridge[0], noseBridge[1], upperLipTop[0], upperLipTop[1]);
    
    // Apply animal profile multipliers
    let noseWidth = baseNoseWidth * anim.wid;
    
    // 1. 3D Projection using Profile Length
    let dirX = noseTip[0] - noseBridge[0];
    let dirY = noseTip[1] - noseBridge[1];
    
    // Perlin noise adds organic breathing/pulsing to the specific animal's length
    let dynamicLen = anim.len * map(noise(frameCount * 0.05), 0, 1, 0.8, 1.2);
    let snoutTipX = noseTip[0] + (dirX * dynamicLen);
    let snoutTipY = noseTip[1] + (dirY * dynamicLen);
    
    if (random() > 0.5) spores.push(new Spore(snoutTipX, snoutTipY, noseWidth));

    // 2. Ears Generation
    drawGenerativeEar(leftTemple[0], leftTemple[1], faceWidth, anim, true);
    drawGenerativeEar(rightTemple[0], rightTemple[1], faceWidth, anim, false);

    // 3. Light Detection
    let cLeft = video.get(keypoints[234][0], keypoints[234][1]); 
    let cRight = video.get(keypoints[454][0], keypoints[454][1]); 
    let bLeft = cLeft ? (cLeft[0] + cLeft[1] + cLeft[2]) / 3 : 0;
    let bRight = cRight ? (cRight[0] + cRight[1] + cRight[2]) / 3 : 0;
    smoothedLightDir = lerp(smoothedLightDir, constrain((bRight - bLeft) / 40, -1.5, 1.5), 0.1);

    push();
    noStroke(); 

    // 4. Nostril Blocker Base
    fill(10, 5, 15); 
    beginShape();
    vertex(noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    quadraticVertex(noseLeft[0] - baseNoseWidth * 0.6, noseLeft[1], upperLipTop[0] - baseNoseWidth * 0.3, upperLipTop[1]);
    vertex(upperLipTop[0], upperLipTop[1]);
    quadraticVertex(noseRight[0] + baseNoseWidth * 0.6, noseRight[1], noseBridge[0], noseBridge[1] - noseHeight * 0.15);
    endShape(CLOSE);

    // 5. Shifting Iridescent Gradient
    let hue1 = map(noise(frameCount * 0.01, currentAnimalIndex), 0, 1, 50, 360);
    drawingContext.fillStyle = getGradient(snoutTipX, snoutTipY, noseWidth, dynamicLen, hue1);
    
    // 6. The Morphing Snout Body
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

    // 7. Generative Nose Pads
    drawNosePad(snoutTipX, snoutTipY, noseWidth, anim.pad);

    // 8. Whiskers
    let sway = sin(frameCount * 0.1) * (noseWidth * 0.2); 
    if (anim.whisk === 'chaotic') {
      drawWrithingWhisker(snoutTipX - noseWidth * 0.3, snoutTipY, -1, sway, noseWidth);
      drawWrithingWhisker(snoutTipX + noseWidth * 0.3, snoutTipY, 1, sway, noseWidth);
    } else if (anim.whisk === 'straight') {
      drawStraightWhisker(snoutTipX - noseWidth * 0.3, snoutTipY, -1, sway, noseWidth);
      drawStraightWhisker(snoutTipX + noseWidth * 0.3, snoutTipY, 1, sway, noseWidth);
    }

    pop();
  }
}

// --- Generative Component Functions ---

function getGradient(tx, ty, w, lenMultiplier, baseHue) {
  let highlightX = tx + (smoothedLightDir * w * 0.5);
  let highlightY = ty - (w * 0.2);
  let grad = drawingContext.createRadialGradient(highlightX, highlightY, 0, tx, ty, w * (1.5 + lenMultiplier));
  
  // Create HSL colors for vibrant, shifting alien tones
  grad.addColorStop(0, `hsl(${baseHue}, 80%, 70%)`); 
  grad.addColorStop(0.3, `hsl(${(baseHue + 40) % 360}, 60%, 30%)`);  
  grad.addColorStop(1, 'rgb(15, 10, 20)');    
  return grad;
}

function drawGenerativeEar(x, y, faceWidth, anim, isLeft) {
  if (anim.ear === 'none') return;
  
  push();
  translate(x, y);
  let angle = isLeft ? -PI/4 : PI/4;
  rotate(angle + sin(frameCount * 0.05) * 0.1); // Ears twitch slightly
  
  let s = faceWidth * 0.3 * anim.eSize;
  fill(15, 10, 15, 220); 
  stroke(255, 255, 255, 80);
  strokeWeight(2);
  
  if (anim.ear === 'round' || anim.ear === 'massive') ellipse(0, -s/2, s, s);
  else if (anim.ear === 'pointy') triangle(-s/2, 0, s/2, 0, 0, -s);
  else if (anim.ear === 'floppy') { noStroke(); fill(30,20,20); bezier(-s/2, 0, -s, s, s, s, s/2, 0); }
  else if (anim.ear === 'tall') ellipse(0, -s, s*0.4, s*2);
  else if (anim.ear === 'leaf') { bezier(0, 0, -s/2, -s/2, -s/4, -s, 0, -s); bezier(0, 0, s/2, -s/2, s/4, -s, 0, -s); }
  else if (anim.ear === 'tubes') rect(-s/4, -s, s/2, s, 10);
  else if (anim.ear === 'bat') { triangle(-s, 0, s, 0, 0, -s*1.2); triangle(-s, -s*0.5, s, -s*0.5, 0, -s*1.5); }
  
  pop();
}

function drawNosePad(tx, ty, w, type) {
  fill(5);
  if (type === 'ellipse') {
    ellipse(tx, ty, w * 0.4, w * 0.3);
  } else if (type === 'triangle') {
    triangle(tx - w*0.2, ty - w*0.1, tx + w*0.2, ty - w*0.1, tx, ty + w*0.2);
  } else if (type === 'pig') {
    fill(200, 100, 120); // Pinkish pad
    ellipse(tx, ty, w * 0.6, w * 0.4);
    fill(0);
    ellipse(tx - w*0.15, ty, w*0.1, w*0.15); // Left hole
    ellipse(tx + w*0.15, ty, w*0.1, w*0.15); // Right hole
  } else if (type === 'horn') {
    fill(200, 200, 210);
    triangle(tx - w*0.3, ty, tx + w*0.3, ty, tx, ty - w*1.5); // Rhino horn
  } // 'beak' intentionally draws nothing here (snout acts as beak)
  
  // Specular reflection
  if (type !== 'horn' && type !== 'beak') {
    fill(255, 255, 255, 180);
    ellipse(tx + (smoothedLightDir * w * 0.1), ty - w * 0.05, w * 0.1, w * 0.05);
  }
}

function drawWrithingWhisker(startX, startY, dir, sway, size) {
  for (let i = 0; i < 4; i++) {
    stroke(random(150, 255), random(200, 255), 255, random(100, 200));
    noFill(); strokeWeight(random(1, 3));
    let length = size * random(1.5, 3.5); 
    let bend = (noise(frameCount * 0.05, i * 10) - 0.5) * 150; 
    bezier(startX, startY, startX + (length * 0.3 * dir), startY + bend*0.5, startX + (length * 0.7 * dir), startY + sway - bend*0.5, startX + (length * dir), startY + sway + bend);
  }
}

function drawStraightWhisker(startX, startY, dir, sway, size) {
  for (let i = -1; i <= 1; i++) {
    stroke(200, 220, 255, 150);
    noFill(); strokeWeight(1.5);
    let length = size * 2.0; 
    let yOffset = i * 15;
    line(startX, startY + yOffset, startX + (length * dir), startY + yOffset + sway);
  }
}

function drawUI() {
  fill(255); noStroke();
  textSize(24); textStyle(BOLD);
  textAlign(CENTER);
  text(`Manifesting: ${animals[currentAnimalIndex].name}`, width / 2, height - 30);
  
  textSize(14); textStyle(NORMAL);
  text("The chimera mutates every 4 seconds.", width / 2, height - 10);
}

// --- Particle Spores ---
class Spore {
  constructor(x, y, scale) {
    this.x = x + random(-20, 20);
    this.y = y + random(-20, 20);
    this.vx = random(-2, 2);
    this.vy = random(1, 4);
    this.life = 255;
    this.size = random(2, scale * 0.15);
    this.r = random(100, 255); this.g = random(50, 150); this.b = random(150, 255);
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= random(3, 7); }
  show() { noStroke(); fill(this.r, this.g, this.b, this.life); ellipse(this.x, this.y, this.size); }
}

function updateAndDrawSpores() {
  for (let i = spores.length - 1; i >= 0; i--) {
    spores[i].update(); spores[i].show();
    if (spores[i].life <= 0) spores.splice(i, 1);
  }
}
