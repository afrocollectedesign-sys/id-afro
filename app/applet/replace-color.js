import fs from 'fs';
const files = ['src/App.tsx', 'src/components/BoutiqueView.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#8B3DFF/g, '#0084FF');
  content = content.replace(/#7022d1/g, '#0062CC');
  fs.writeFileSync(file, content);
}
console.log('done');
