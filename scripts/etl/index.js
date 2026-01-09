#!/usr/bin/env node

/**
 * Mini-CRM ETL Script
 * Extract, Transform, Load customer data with validation and deduplication
 * 
 * Usage:
 *   node scripts/etl/index.js --input=data.json [--output=output/] [--dry-run] [--merge]
 */

const fs = require('fs');
const path = require('path');
const { transformCustomer } = require('./transformers');
const { deduplicateCustomers } = require('./deduplicator');

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../../output');

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    output: DEFAULT_OUTPUT_DIR,
    dryRun: false,
    merge: false,
    help: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--input=')) {
      options.input = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--merge') {
      options.merge = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  });

  return options;
}

function showHelp() {
  console.log(`
Mini-CRM ETL Script
===================

Usage:
  node scripts/etl/index.js --input=<file> [options]

Options:
  --input=<file>    Input JSON file path (required)
  --output=<dir>    Output directory (default: ./output)
  --dry-run         Process data but don't save to files
  --merge           Merge duplicate records instead of just reporting
  --help, -h        Show this help message

Examples:
  node scripts/etl/index.js --input=sample-data.json
  node scripts/etl/index.js --input=customers.json --output=./processed --merge
  node scripts/etl/index.js --input=sample-data.json --dry-run

Output Files:
  valid-customers.json    Successfully processed customer records
  error-report.json       Records with validation errors
  duplicate-report.json   Detected duplicate records
  etl-summary.json        Processing statistics
`);
}

// =============================================================================
// File Operations
// =============================================================================

function readInputFile(filePath) {
  // Resolve path relative to etl directory if not absolute
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file not found: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  return JSON.parse(content);
}

function ensureOutputDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeOutputFile(dirPath, filename, data) {
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

// =============================================================================
// ETL Process
// =============================================================================

function runETL(options) {
  console.log('\n🚀 Mini-CRM ETL Process Starting...\n');
  console.log(`📁 Input: ${options.input}`);
  console.log(`📂 Output: ${options.output}`);
  console.log(`🔄 Dry Run: ${options.dryRun}`);
  console.log(`🔀 Merge Duplicates: ${options.merge}\n`);

  // Step 1: Extract
  console.log('📥 Step 1: Extracting data...');
  const rawData = readInputFile(options.input);
  console.log(`   Found ${rawData.length} records\n`);

  // Step 2: Transform
  console.log('🔄 Step 2: Transforming data...');
  const transformed = rawData.map((record, index) => {
    const result = transformCustomer(record);
    result.originalIndex = index;
    result.originalData = record;
    return result;
  });

  const transformErrors = transformed.filter(t => !t.isValid);
  const transformWarnings = transformed.filter(t => t.warnings.length > 0);
  console.log(`   ✅ Valid: ${transformed.length - transformErrors.length}`);
  console.log(`   ❌ Errors: ${transformErrors.length}`);
  console.log(`   ⚠️  Warnings: ${transformWarnings.length}\n`);

  // Step 3: Deduplicate
  console.log('🔍 Step 3: Deduplicating...');
  const deduped = deduplicateCustomers(transformed, { merge: options.merge });
  console.log(`   📊 Unique valid: ${deduped.valid.length}`);
  console.log(`   🔁 Duplicates: ${deduped.duplicates.length}`);
  console.log(`   ❌ Invalid: ${deduped.invalid.length}\n`);

  // Step 4: Generate Reports
  const summary = {
    timestamp: new Date().toISOString(),
    input: options.input,
    stats: {
      totalInput: rawData.length,
      validRecords: deduped.valid.length,
      invalidRecords: deduped.invalid.length,
      duplicateRecords: deduped.duplicates.length,
      recordsWithWarnings: transformWarnings.length
    }
  };

  const errorReport = deduped.invalid.map(record => ({
    originalIndex: record.originalIndex,
    originalData: record.originalData,
    errors: record.errors
  }));

  const duplicateReport = deduped.duplicates.map(dup => ({
    originalIndex: dup.originalIndex,
    duplicateOf: dup.duplicateOf,
    reasons: dup.reasons,
    record: dup.record.data
  }));

  const validCustomers = deduped.valid.map(record => record.data);

  // Step 5: Output
  if (!options.dryRun) {
    console.log('💾 Step 4: Saving output files...');
    ensureOutputDir(options.output);
    
    const files = [
      writeOutputFile(options.output, 'valid-customers.json', validCustomers),
      writeOutputFile(options.output, 'error-report.json', errorReport),
      writeOutputFile(options.output, 'duplicate-report.json', duplicateReport),
      writeOutputFile(options.output, 'etl-summary.json', summary)
    ];
    
    files.forEach(f => console.log(`   📄 ${f}`));
  } else {
    console.log('🔍 Step 4: Dry run - no files saved\n');
  }

  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 ETL SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Input Records:    ${summary.stats.totalInput}`);
  console.log(`Valid Records:          ${summary.stats.validRecords}`);
  console.log(`Invalid Records:        ${summary.stats.invalidRecords}`);
  console.log(`Duplicate Records:      ${summary.stats.duplicateRecords}`);
  console.log(`Records with Warnings:  ${summary.stats.recordsWithWarnings}`);
  console.log('='.repeat(50));

  // Print errors if any
  if (errorReport.length > 0) {
    console.log('\n❌ HATA DETAYLARI:');
    errorReport.forEach(err => {
      console.log(`   [${err.originalIndex}] ${JSON.stringify(err.originalData)}`);
      err.errors.forEach(e => console.log(`       → ${e}`));
    });
  }

  // Print duplicates if any
  if (duplicateReport.length > 0) {
    console.log('\n🔁 DUPLICATE DETAYLARI:');
    duplicateReport.forEach(dup => {
      console.log(`   [${dup.originalIndex}] ${dup.record.firstName} ${dup.record.lastName || ''} - ${dup.reasons.join(', ')}`);
    });
  }

  console.log('\n✅ ETL Process Complete!\n');

  return {
    summary,
    validCustomers,
    errorReport,
    duplicateReport
  };
}

// =============================================================================
// Main
// =============================================================================

function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.input) {
    console.error('❌ Error: --input parameter is required');
    showHelp();
    process.exit(1);
  }

  try {
    runETL(options);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ETL Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runETL };
