#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the project root directory
const rootDir = path.dirname(__dirname);

// Read package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Parse current version
const currentVersion = packageJson.version.split('.');
const major = parseInt(currentVersion[0]);
const minor = parseInt(currentVersion[1]);
const patch = parseInt(currentVersion[2]) + 1;

// Create new version
const newVersion = `${major}.${minor}.${patch}`;

console.log(`\n📦 Auto-Versioning...`);
console.log(`   Old version: ${packageJson.version}`);
console.log(`   New version: ${newVersion}\n`);

// 1. Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ Updated package.json to ${newVersion}`);

// 2. Update capacitor.config.ts
const capacitorPath = path.join(rootDir, 'capacitor.config.ts');
let capacitorContent = fs.readFileSync(capacitorPath, 'utf8');
capacitorContent = capacitorContent.replace(
  /appVersion:\s*['"].*?['"]/,
  `appVersion: '${newVersion}'`
);
fs.writeFileSync(capacitorPath, capacitorContent);
console.log(`✅ Updated capacitor.config.ts to ${newVersion}`);

// 3. Update android/app/build.gradle
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Update versionCode (increment by 1)
  const oldVersionCode = parseInt(buildGradleContent.match(/versionCode\s+(\d+)/)?.[1] || '0');
  const newVersionCode = oldVersionCode + 1;
  buildGradleContent = buildGradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${newVersionCode}`
  );
  
  // Update versionName
  buildGradleContent = buildGradleContent.replace(
    /versionName\s+['"].*?['"]/,
    `versionName "${newVersion}"`
  );
  
  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log(`✅ Updated android/app/build.gradle to ${newVersion} (versionCode: ${newVersionCode})`);
} else {
  console.log(`⚠️  android/app/build.gradle not found (will be created when you run 'npx cap add android')`);
}

console.log(`\n✨ Version auto-increment complete!\n`);
