import { startBot } from './src/connection.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - Bot status
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    bot: 'MSI XMD Bot 🤖',
    description: 'WhatsApp Bot powered by Baileys',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/status'
    }
  });
});

// Health check endpoint (for Render monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Bot status endpoint
app.get('/status', (req, res) => {
  res.json({
    bot: 'MSI XMD Bot',
    platform: 'WhatsApp',
    status: 'running',
    node_version: process.version,
    memory_usage: process.memoryUsage(),
    uptime: `${Math.floor(process.uptime())} seconds`
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: ['/', '/health', '/status']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start both the bot and the web server
async function start() {
  try {
    console.log('🚀 Starting MSI XMD Bot...');
    console.log('========================================');
    
    // Start WhatsApp bot
    await startBot();
    
    // Start web server
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🤖 MSI XMD Bot initialized`);
      console.log(`🌐 Web server listening on port ${PORT}`);
      console.log(`📊 Status: http://localhost:${PORT}/`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log('========================================');
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ CRITICAL: Failed to start bot:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Start the application
start();
