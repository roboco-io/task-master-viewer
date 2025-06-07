const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 128x128 canvas
const size = 128;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0066CC';
ctx.beginPath();
ctx.roundRect(0, 0, size, size, 16);
ctx.fill();

// White card
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.roundRect(20, 20, 88, 88, 8);
ctx.fill();

// Helper function to draw checkbox
function drawCheckbox(x, y, checked, inProgress) {
  ctx.strokeStyle = checked ? '#00B400' : (inProgress ? '#0066CC' : '#969696');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, 12, 12, 2);
  ctx.stroke();
  
  if (checked) {
    // Draw checkmark
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 6);
    ctx.lineTo(x + 5, y + 9);
    ctx.lineTo(x + 9, y + 3);
    ctx.stroke();
  } else if (inProgress) {
    // Draw spinning dot (static for PNG)
    ctx.fillStyle = '#0066CC';
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper function to draw task line
function drawTaskLine(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, 48, 4, 2);
  ctx.fill();
}

// Draw tasks
// Completed task
drawCheckbox(30, 35, true, false);
drawTaskLine(50, 39, '#00B400');

// In-progress task
drawCheckbox(30, 60, false, true);
drawTaskLine(50, 64, '#505050');

// Pending task
drawCheckbox(30, 85, false, false);
drawTaskLine(50, 89, '#969696');

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('icon.png', buffer);

console.log('Icon generated: icon.png');