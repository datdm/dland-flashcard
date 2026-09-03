const fs = require('fs');
const path = require('path');
const { getStructuredMajorSections } = require('../src/lib/examUtils');

const filePath = path.join(__dirname, '..', 'src', 'data', 'exams', 'jlpt-n2-2025-07.json');
const examData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// If examUtils is TS, let's test directly with node or ts-node
