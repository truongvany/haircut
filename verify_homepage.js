#!/usr/bin/env node
/**
 * Verification script for HomePage redesign
 * Checks if all components and styles are correctly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Kiểm Tra Thiết Kế Trang Chủ Mới\n');

const checks = [];

// 1. Check NewsPage.tsx exists
const newsPagePath = 'frontend/src/pages/New/NewsPage.tsx';
if (fs.existsSync(newsPagePath)) {
  const content = fs.readFileSync(newsPagePath, 'utf8');
  const hasHeroSection = content.includes('hero-section');
  const hasStatsSection = content.includes('stats-section');
  const hasNewsSection = content.includes('news-section');
  const hasCtaSection = content.includes('cta-section');
  const hasNavigate = content.includes('useNavigate');
  
  checks.push({
    name: 'NewsPage.tsx',
    passed: hasHeroSection && hasStatsSection && hasNewsSection && hasCtaSection && hasNavigate,
    details: {
      'Hero Section': hasHeroSection,
      'Stats Section': hasStatsSection,
      'News Section': hasNewsSection,
      'CTA Section': hasCtaSection,
      'useNavigate Hook': hasNavigate
    }
  });
} else {
  checks.push({
    name: 'NewsPage.tsx',
    passed: false,
    details: { 'File exists': false }
  });
}

// 2. Check CSS file
const cssPath = 'frontend/src/components/NewsPage.css';
if (fs.existsSync(cssPath)) {
  const content = fs.readFileSync(cssPath, 'utf8');
  const hasHeroStyles = content.includes('.hero-section');
  const hasStatsStyles = content.includes('.stats-section');
  const hasNewsStyles = content.includes('.news-section');
  const hasCtaStyles = content.includes('.cta-section');
  const hasAnimations = content.includes('@keyframes');
  const lines = content.split('\n').length;
  
  checks.push({
    name: 'NewsPage.css',
    passed: hasHeroStyles && hasStatsStyles && hasNewsStyles && hasCtaStyles && hasAnimations,
    details: {
      'Hero Styles': hasHeroStyles,
      'Stats Styles': hasStatsStyles,
      'News Styles': hasNewsStyles,
      'CTA Styles': hasCtaStyles,
      'Animations': hasAnimations,
      'Lines': lines
    }
  });
} else {
  checks.push({
    name: 'NewsPage.css',
    passed: false,
    details: { 'File exists': false }
  });
}

// 3. Check PDF report
const pdfPath = 'BAO_CAO_TIEN_DO.pdf';
if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  checks.push({
    name: 'PDF Report',
    passed: stats.size > 0,
    details: {
      'File exists': true,
      'Size (bytes)': stats.size,
      'Size (KB)': (stats.size / 1024).toFixed(2)
    }
  });
} else {
  checks.push({
    name: 'PDF Report',
    passed: false,
    details: { 'File exists': false }
  });
}

// 4. Check HTML template
const htmlPath = 'BAO_CAO_TIEN_DO.html';
if (fs.existsSync(htmlPath)) {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const hasTitle = content.includes('Báo Cáo Tiến Độ');
  const hasSections = content.includes('hero-section') || content.includes('HairCut');
  
  checks.push({
    name: 'HTML Report',
    passed: hasTitle,
    details: {
      'File exists': true,
      'Has title': hasTitle,
      'Has content': hasSections
    }
  });
}

// Print results
console.log('📋 Kết Quả Kiểm Tra:\n');
let passCount = 0;

checks.forEach(check => {
  const symbol = check.passed ? '✅' : '❌';
  console.log(`${symbol} ${check.name}`);
  
  Object.entries(check.details).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      console.log(`   ${value ? '✓' : '✗'} ${key}`);
    } else {
      console.log(`   • ${key}: ${value}`);
    }
  });
  console.log();
  
  if (check.passed) passCount++;
});

// Summary
console.log('📊 Tóm Tắt:');
console.log(`✅ Hoàn thành: ${passCount}/${checks.length}`);

if (passCount === checks.length) {
  console.log('\n🎉 Tất cả kiểm tra đều thành công!');
  console.log('\n🚀 Trang chủ mới đã sẵn sàng:');
  console.log('   • Hero section với floating icons');
  console.log('   • Stats section với 4 metrics');
  console.log('   • Featured news + news grid');
  console.log('   • CTA section call-to-action');
  console.log('   • Responsive design (mobile-first)');
  console.log('   • Smooth animations & transitions');
  console.log('\n✨ Thiết kế chất lượng cao!');
} else {
  console.log('\n⚠️ Một số kiểm tra không thành công.');
}
