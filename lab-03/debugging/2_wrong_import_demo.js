/**
 * Demonstration of Scenario B: MODULE_NOT_FOUND (Wrong Import Path)
 * Run with: node debugging/2_wrong_import_demo.js
 */

console.log("--- Demonstrating Scenario B: Wrong Import Path ---");

// Attempting an incorrect import
const faultyPath = "./non_existent_module.js";
try {
  console.log(`[Attempting] require('${faultyPath}')...`);
  require(faultyPath);
} catch (error) {
  console.log(`[Caught Error] Code: ${error.code}`);
  console.log(`[Error Message] ${error.message}`);
}

// Correcting the path
const correctModule = "../package.json";
try {
  console.log(`\n[Resolution] Correcting path to: require('${correctModule}')...`);
  const pkg = require(correctModule);
  console.log(`[Success] Successfully imported module! Package name: "${pkg.name}"`);
  console.log("\nDemo completed successfully: MODULE_NOT_FOUND explained and resolved.\n");
} catch (error) {
  console.error(error);
}

