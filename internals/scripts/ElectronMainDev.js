const path = require('path');

// Register Babel first - this must happen before any TypeScript files are loaded
require(path.join(__dirname, 'BabelRegister.js'));

// Force CommonJS mode for the TypeScript file by using a dynamic require
// This ensures BabelRegister intercepts the require before Node.js tries to parse it
const mainDevPath = path.join(__dirname, '..', '..', 'app', 'main.dev.ts');

// Use a workaround: delete the file extension cache and require
delete require.cache[mainDevPath];
require(mainDevPath);
