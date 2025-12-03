import { startBot } from './src/connection.js';

console.log('🚀 Starting MSI XMD Bot...');
console.log();

startBot().catch((error) => {
  console.error('❌ Failed to start bot:', error.message);
  process.exit(1);
});
