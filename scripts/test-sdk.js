#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n📋 ${description}`, 'cyan');
  log(`Running: ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ Success: ${description}`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ Failed: ${description}`, 'red');
    log(`Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function checkFile(filePath, description) {
  log(`\n📁 Checking: ${description}`, 'cyan');
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    log(`✅ Found: ${filePath} (${stats.size} bytes)`, 'green');
    return true;
  } else {
    log(`❌ Missing: ${filePath}`, 'red');
    return false;
  }
}

function validatePackageJson() {
  log('\n📦 Validating package.json', 'magenta');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredFields = ['name', 'version', 'description', 'main', 'types', 'scripts'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    log(`❌ Missing required fields: ${missingFields.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ Package.json is valid', 'green');
  return true;
}

function main() {
  log('🚀 Starting Selendra SDK Test Suite', 'magenta');
  log('=====================================', 'magenta');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // 1. Validate package.json
  totalTests++;
  if (validatePackageJson()) passedTests++;
  
  // 2. Install dependencies
  totalTests++;
  const installResult = runCommand('npm ci', 'Installing dependencies');
  if (installResult.success) passedTests++;
  
  // 3. Run linting
  totalTests++;
  const lintResult = runCommand('npm run lint', 'Running ESLint');
  if (lintResult.success) passedTests++;
  
  // 4. Run type checking
  totalTests++;
  const typeResult = runCommand('npm run typecheck', 'Running TypeScript type checking');
  if (typeResult.success) passedTests++;
  
  // 5. Run unit tests
  totalTests++;
  const testResult = runCommand('npm run test:unit', 'Running unit tests');
  if (testResult.success) passedTests++;
  
  // 6. Run integration tests
  totalTests++;
  const integrationResult = runCommand('npm run test:integration', 'Running integration tests');
  if (integrationResult.success) passedTests++;
  
  // 7. Run test coverage
  totalTests++;
  const coverageResult = runCommand('npm run test:coverage', 'Running test coverage');
  if (coverageResult.success) passedTests++;
  
  // 8. Build the package
  totalTests++;
  const buildResult = runCommand('npm run build', 'Building package');
  if (buildResult.success) passedTests++;
  
  // 9. Check build artifacts
  const buildChecks = [
    { path: 'dist/index.js', desc: 'CommonJS build' },
    { path: 'dist/index.esm.js', desc: 'ES Module build' },
    { path: 'dist/index.d.ts', desc: 'TypeScript declarations' }
  ];
  
  buildChecks.forEach(check => {
    totalTests++;
    const fullPath = path.join(__dirname, '..', check.path);
    if (checkFile(fullPath, check.desc)) passedTests++;
  });
  
  // 10. Test package installation
  totalTests++;
  const packResult = runCommand('npm pack --dry-run', 'Testing package creation');
  if (packResult.success) passedTests++;
  
  // 11. Validate TypeScript imports
  totalTests++;
  try {
    const testImport = `
      const { SelendraSDK } = require('./dist/index.js');
      console.log('SDK imported successfully:', typeof SelendraSDK);
    `;
    
    fs.writeFileSync(path.join(__dirname, '..', 'test-import.js'), testImport);
    const importResult = runCommand('node test-import.js', 'Testing CommonJS import');
    fs.unlinkSync(path.join(__dirname, '..', 'test-import.js'));
    
    if (importResult.success) passedTests++;
  } catch (error) {
    log(`❌ Failed: Testing CommonJS import`, 'red');
  }
  
  // 12. Check documentation
  totalTests++;
  const docChecks = [
    { path: 'README.md', desc: 'README documentation' },
    { path: 'PUBLISHING_GUIDE.md', desc: 'Publishing guide' }
  ];
  
  let docsPassed = 0;
  docChecks.forEach(check => {
    const fullPath = path.join(__dirname, '..', check.path);
    if (checkFile(fullPath, check.desc)) docsPassed++;
  });
  
  if (docsPassed === docChecks.length) passedTests++;
  
  // Summary
  log('\n📊 Test Summary', 'magenta');
  log('===============', 'magenta');
  log(`Total Tests: ${totalTests}`, 'white');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! SDK is ready for publishing.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please fix the issues before publishing.', 'red');
    process.exit(1);
  }
}

// Run the test suite
main();