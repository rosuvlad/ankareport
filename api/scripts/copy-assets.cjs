// Copy AnkaReport dist files to API public/assets folder
// This makes the API self-contained with all required assets

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../dist');
const targetDir = path.join(__dirname, '../public/libs');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Files to copy
const filesToCopy = ['ankareport.js', 'ankareport.css'];

console.log('Copying AnkaReport assets to API public folder...');

filesToCopy.forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const targetFile = path.join(targetDir, file);
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`  ✓ Copied ${file}`);
  } else {
    console.warn(`  ⚠ Warning: ${file} not found in ${sourceDir}`);
  }
});

console.log('Asset copy completed!');