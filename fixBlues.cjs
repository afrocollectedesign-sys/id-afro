const fs = require('fs');

let t = fs.readFileSync('src/App.tsx', 'utf8');
t = t.replace(/blue-50/g, 'fuchsia-50');
t = t.replace(/blue-100/g, 'fuchsia-100');
t = t.replace(/sky-200/g, 'cyan-200');

fs.writeFileSync('src/App.tsx', t);
