const fs = require('fs');
const path = require('path');

function removeAllConflictMarkers(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const originalLength = content.length;

    // Remove all conflict marker blocks
    // Pattern: <<<<<<< HEAD\n(content)\n=======\n(content)\n>>>>>>> hash
    const conflictPattern = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> [a-f0-9]+\r?\n/g;

    // Keep the HEAD version (first capture group)
    content = content.replace(conflictPattern, '$1\n');

    if (content.length !== originalLength) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ Fixed ${path.basename(filepath)}`);
        return true;
    }
    return false;
}

const files = [
    path.join(__dirname, 'src', 'Pages', 'MiniDrawer.js'),
    path.join(__dirname, 'src', 'Pages', 'Home.js'),
    path.join(__dirname, 'src', 'Pages', 'StoreDetails.js'),
    path.join(__dirname, 'src', 'Pages', 'Storemanagement.js'),
    path.join(__dirname, 'src', 'Pages', 'StoreCustomer.js')
];

let fixedCount = 0;
files.forEach(filepath => {
    try {
        if (fs.existsSync(filepath)) {
            if (removeAllConflictMarkers(filepath)) {
                fixedCount++;
            }
        }
    } catch (error) {
        console.error(`✗ Error processing ${path.basename(filepath)}:`, error.message);
    }
});

console.log(`\nFixed ${fixedCount} file(s) with merge conflicts.`);
