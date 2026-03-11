const fs = require('fs');
const content = fs.readFileSync('src/components/teacher/CourseDetail.tsx', 'utf8');

let net = 0;
let details = [];
let inCourseDetail = false;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('export default function CourseDetail')) {
        inCourseDetail = true;
    }
    if (!inCourseDetail) continue;

    // stop at next function
    if (l.startsWith('function QuizResultsModal')) {
        break;
    }

    const opens = (l.match(/<div/g) || []).length;
    const closes = (l.match(/<\/div>/g) || []).length;
    net += opens;
    net -= closes;

    if (opens > 0 || closes > 0) {
        details.push(`L${i+1}: net=${net} (+${opens} -${closes}) | ${l.trim()}`);
    }
}

console.log('Final net:', net);
console.log(details.slice(-20).join('\n'));
