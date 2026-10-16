const fs = require('fs');
const path = require('path');

function removeCommentedCode(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');

    // Find the first non-commented import statement
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') && !trimmed.startsWith('// import')) {
            startIndex = i;
            break;
        }
    }

    if (startIndex > 0) {
        const cleaned = lines.slice(startIndex).join('\n');
        fs.writeFileSync(filepath, cleaned, 'utf8');
        console.log(`Fixed ${path.basename(filepath)} - removed ${startIndex} lines of commented code`);
    } else {
        console.log(`${path.basename(filepath)} - no changes needed`);
    }
}

const files = [
    path.join(__dirname, 'src', 'Pages', 'MiniDrawer.js'),
    path.join(__dirname, 'src', 'Pages', 'StoreDetails.js'),
    path.join(__dirname, 'src', 'Pages', 'Storemanagement.js')
];

files.forEach(filepath => {
    try {
        if (fs.existsSync(filepath)) {
            removeCommentedCode(filepath);
        } else {
            console.log(`File not found: ${filepath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filepath}:`, error.message);
    }
});

console.log('Done!');
