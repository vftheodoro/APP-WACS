/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const packages = ['expo-file-system', 'expo-asset'];

function isInstalled(pkg) {
  try {
    const pkgPath = path.join(repoRoot, 'node_modules', pkg);
    return fs.existsSync(pkgPath);
  } catch (e) {
    return false;
  }
}

async function main() {
  const missing = packages.filter(p => !isInstalled(p));
  if (missing.length === 0) {
    console.log('All expo native packages already installed.');
    return;
  }

  const cmd = `npx expo install ${missing.join(' ')}`;
  console.log('Installing missing expo native modules:', missing.join(', '));
  try {
    execSync(cmd, { stdio: 'inherit', cwd: repoRoot });
    console.log('Installed missing expo native modules successfully.');
  } catch (err) {
    console.error('Failed to install expo native modules:', err.message);
    // Don't fail the whole install — allow developers to fix manually
  }
}

main();
