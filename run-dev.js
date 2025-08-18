#!/usr/bin/env node

// Simple Next.js dev server starter
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Next.js development server...');

// Try to find Next.js
const possiblePaths = [
  './node_modules/next/dist/bin/next',
  './node_modules/.bin/next',
  'next'
];

let nextPath = null;
const fs = require('fs');

for (const p of possiblePaths) {
  try {
    if (fs.existsSync(p)) {
      nextPath = p;
      break;
    }
  } catch (e) {
    // continue
  }
}

if (nextPath) {
  const proc = spawn('node', [nextPath, 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  proc.on('error', (err) => {
    console.error('Failed to start Next.js:', err);
  });
} else {
  console.error('Next.js not found. Please run: npm install next@latest');
  console.log('\nAlternatively, use online development:');
  console.log('1. Go to https://codesandbox.io/s/new');
  console.log('2. Choose "Next.js" template');
  console.log('3. Copy the project files');
}