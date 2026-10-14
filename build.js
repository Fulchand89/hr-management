const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('▶ [Build] Installing client dependencies...');
execSync('npm --prefix client install', { stdio: 'inherit' });

console.log('▶ [Build] Building client with Vite...');
execSync('npm --prefix client run build', { stdio: 'inherit' });

// Ensure dist directory exists at root for Vercel Vite preset
const rootDist = path.resolve(__dirname, 'dist');
const clientDist = path.resolve(__dirname, 'client/dist');

if (fs.existsSync(clientDist)) {
  console.log('▶ [Build] Mirroring client/dist to root dist directory...');
  fs.cpSync(clientDist, rootDist, { recursive: true });
}

if (fs.existsSync(path.join(rootDist, 'index.html'))) {
  console.log('✔ [Build] Output directory successfully prepared at ./dist');
} else {
  console.error('✖ [Build Error] Failed to generate index.html in ./dist');
  process.exit(1);
}
