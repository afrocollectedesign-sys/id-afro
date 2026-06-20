import fs from 'fs';
const files = ['src/App.tsx', 'src/components/BoutiqueView.tsx'];
for (const f of files) {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/#E34A3E/g, '#8B3DFF');
  text = text.replace(/#c93b30/g, '#7022d1');
  fs.writeFileSync(f, text);
}
console.log('replaced');
