const fs = require('fs');
const path = require('path');

function cleanFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove BOM
    if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xFFFE) {
        content = content.slice(1);
    }

    // Also remove any other weird character at the start that might be causing "Unexpected character"
    while (content.length > 0 && content.charCodeAt(0) > 127 && content.charCodeAt(0) !== 0x00) {
        // If it's a known non-standard char at start, trim it. 
        // Babel sometimes hates even valid unicode in certain encodings.
        // But let's just be careful.
        if (content.startsWith('import')) break;
        content = content.slice(1);
    }

    // Fix duplicate React imports if any
    const lines = content.split(/\r?\n/);
    let reactImportFound = false;
    const cleanedLines = lines.filter(line => {
        if (line.includes('import React') && line.includes('from \'react\'')) {
            if (reactImportFound) return false;
            reactImportFound = true;
        }
        return true;
    });

    fs.writeFileSync(filepath, cleanedLines.join('\n'), 'utf8');
    console.log(`✓ Cleaned ${path.basename(filepath)}`);
}

const files = [
    path.join(__dirname, 'src', 'Pages', 'MiniDrawer.js'),
    path.join(__dirname, 'src', 'Pages', 'StoreDetails.js'),
    path.join(__dirname, 'src', 'Pages', 'Storemanagement.js'),
    path.join(__dirname, 'src', 'Pages', 'StoreCustomer.js'),
    path.join(__dirname, 'src', 'api', 'client.js')
];

files.forEach(cleanFile);
console.log('Done cleaning!');
