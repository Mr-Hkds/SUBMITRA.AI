
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Black_Phoenix/Downloads/NaaGRaaZ studios/autoform-ai (1)/App.tsx', 'utf8');

let p = 0, b = 0, s = 0, bt = 0, q1 = 0, q2 = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '(') p++;
    if (content[i] === ')') p--;
    if (content[i] === '{') b++;
    if (content[i] === '}') b--;
    if (content[i] === '[') s++;
    if (content[i] === ']') s--;
    if (content[i] === '`') bt++;
    if (content[i] === "'") q1++;
    if (content[i] === '"') q2++;
}

console.log(`Paren count: ${p}`);
console.log(`Brace count: ${b}`);
console.log(`Square count: ${s}`);
console.log(`Backtick count: ${bt}`);
console.log(`Single quote: ${q1}`);
console.log(`Double quote: ${q2}`);
