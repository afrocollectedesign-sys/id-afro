const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/App.tsx',
  'src/components/BoutiqueView.tsx',
  'src/index.css'
];

// For background
const bgGradient = "bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1]";
const textGradient = "text-transparent bg-clip-text bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1]";
const accentColor = "#8133f1";

for (const file of filesToProcess) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace backgrounds
  // We need to be careful with bg-[#0084FF]/X opacity variants
  // bg-[#0084FF] -> bgGradient
  // bg-[#0084FF]/5 -> bg-[#8133f1]/5
  content = content.replace(/bg-\[#0084FF\]\/(5|10|20)/g, (match, opacity) => {
    return `bg-[#8133f1]/${opacity}`;
  });
  content = content.replace(/bg-\[#0084FF\]/g, bgGradient);

  // Replace text
  // if it's text-[#0084FF] on an SVG, we might want to just make it solid purple,
  // but we can't easily parse that. Actually, let's use the solid purple for ALL text right now to ensure reliability,
  // except for large headers where we can apply the gradient manually.
  // The user says "utilise c'est couleur là" (use these colors), so the gradient or solid purple is fine.
  
  // Actually, we can use the gradient for text and see. But let's use the purple `#8133f1` for text and borders since the right side of the canva bar is purple and it's very distinct. Or maybe the Teal `#00c4cc`.
  content = content.replace(/text-\[#0084FF\]\/(50|80)/g, (match, op) => `text-[#8133f1]/${op}`);
  content = content.replace(/text-\[#0084FF\]/g, 'text-[#8133f1]');
  
  // Replace borders
  content = content.replace(/border-\[#0084FF\]\/(10|20)/g, (match, op) => `border-[#8133f1]/${op}`);
  content = content.replace(/border-\[#0084FF\]/g, 'border-[#8133f1]');
  
  // Replace rings
  content = content.replace(/ring-\[#0084FF\]/g, 'ring-[#8133f1]');
  content = content.replace(/ring-\[#0084FF\]\/10/g, 'ring-[#8133f1]/10');
  
  // Replace shadows
  content = content.replace(/shadow-\[#0084FF\]\/20/g, 'shadow-[#8133f1]/20');
  content = content.replace(/rgba\(0,132,255,/g, 'rgba(129,51,241,');

  // Any other inline colors
  content = content.replace(/#0084FF/g, '#8133f1');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Colors replaced successfully!");
