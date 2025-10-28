#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the Vite build output and provides optimization recommendations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('📦 Bundle Analysis Report');
  console.log('=' .repeat(50));

  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist folder not found. Run `npm run build` first.');
    return;
  }

  const chunks = [];
  let totalSize = 0;

  // Read all files in assets directory
  const files = fs.readdirSync(assetsPath);

  files.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file);

    if (['.js', '.css'].includes(ext)) {
      chunks.push({
        name: file,
        size: stats.size,
        type: ext.substring(1),
        gzipEstimate: Math.round(stats.size * 0.3) // Rough gzip estimate
      });
      totalSize += stats.size;
    }
  });

  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size);

  console.log('\n📊 Chunk Analysis:');
  console.log('-'.repeat(80));
  console.log('File Name'.padEnd(40) + 'Size'.padEnd(12) + 'Gzipped'.padEnd(12) + 'Type');
  console.log('-'.repeat(80));

  chunks.forEach(chunk => {
    const sizeFormatted = formatBytes(chunk.size).padEnd(11);
    const gzipFormatted = formatBytes(chunk.gzipEstimate).padEnd(11);
    const typeFormatted = chunk.type.toUpperCase().padEnd(4);

    console.log(
      chunk.name.substring(0, 39).padEnd(40) +
      sizeFormatted +
      gzipFormatted +
      typeFormatted
    );
  });

  console.log('-'.repeat(80));
  console.log(`Total: ${formatBytes(totalSize)} (estimated ${formatBytes(totalSize * 0.3)} gzipped)`);

  // Analysis and recommendations
  console.log('\n🔍 Analysis & Recommendations:');
  console.log('-'.repeat(50));

  const jsChunks = chunks.filter(c => c.type === 'js');
  const cssChunks = chunks.filter(c => c.type === 'css');

  const largeChunks = jsChunks.filter(c => c.size > 500 * 1024); // > 500KB
  const mediumChunks = jsChunks.filter(c => c.size > 200 * 1024 && c.size <= 500 * 1024); // 200-500KB
  const vendorChunks = jsChunks.filter(c => c.name.includes('vendor') || c.name.includes('node_modules'));

  if (largeChunks.length > 0) {
    console.log(`\n⚠️  Large Chunks (>500KB): ${largeChunks.length}`);
    largeChunks.forEach(chunk => {
      console.log(`   • ${chunk.name} - ${formatBytes(chunk.size)}`);
    });
    console.log('   Recommendation: Consider code splitting or lazy loading');
  }

  if (mediumChunks.length > 3) {
    console.log(`\n📋 Medium Chunks (200-500KB): ${mediumChunks.length}`);
    console.log('   Consider if some can be combined or further split');
  }

  const initialLoadSize = jsChunks
    .filter(c => c.name.includes('index') || c.name.includes('main'))
    .reduce((sum, c) => sum + c.size, 0);

  if (initialLoadSize > 300 * 1024) {
    console.log(`\n🚨 Initial Load Warning: ${formatBytes(initialLoadSize)}`);
    console.log('   Target: <300KB for good performance');
    console.log('   Consider lazy loading non-critical components');
  } else {
    console.log(`\n✅ Initial Load: ${formatBytes(initialLoadSize)} (Good!)`);
  }

  // CSS analysis
  if (cssChunks.length > 0) {
    const totalCSS = cssChunks.reduce((sum, c) => sum + c.size, 0);
    console.log(`\n🎨 CSS Files: ${cssChunks.length} (${formatBytes(totalCSS)})`);

    if (totalCSS > 100 * 1024) {
      console.log('   Consider CSS purging or critical CSS extraction');
    }
  }

  // Performance recommendations
  console.log('\n🚀 Performance Recommendations:');
  console.log('-'.repeat(40));

  if (totalSize > 2 * 1024 * 1024) {
    console.log('• Bundle size > 2MB - Consider removing unused dependencies');
  }

  if (vendorChunks.length === 0) {
    console.log('• No vendor chunks detected - Enable vendor chunk splitting');
  }

  console.log('• Enable Brotli compression on your server');
  console.log('• Consider Service Worker for caching');
  console.log('• Use dynamic imports for route-based code splitting');
  console.log('• Monitor bundle size in CI/CD pipeline');

  // Check for potential issues
  console.log('\n🔧 Optimization Checklist:');
  console.log('-'.repeat(35));
  console.log('□ Tree shaking enabled');
  console.log('□ Unused dependencies removed');
  console.log('□ Dynamic imports for routes');
  console.log('□ Vendor chunks separated');
  console.log('□ CSS purged in production');
  console.log('□ Images optimized');
  console.log('□ Gzip/Brotli compression');

  return {
    totalSize,
    chunkCount: chunks.length,
    largeChunks: largeChunks.length,
    initialLoadSize
  };
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    analyzeBundle();
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}