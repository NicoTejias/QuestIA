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
    if (l.startsWith('function QuizResultsModal')) break;

    const opens = (l.match(/<>/g) || []).length;
    const closes = (l.match(/<\/>/g) || []).length;
    net += opens;
    net -= closes;

    if (opens > 0 || closes > 0) {
        details.push(`L${i+1}: net=${net} (+${opens} -${closes}) | ${l.trim()}`);
    }
}

console.log('Final net fragments:', net);
console.log(details.join('\n'));
