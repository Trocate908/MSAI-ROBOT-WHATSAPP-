import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { promises as fs } from 'fs';
import pino from 'pino';
import { handleMessage } from './handler.js';

const AUTH_FOLDER = './auth_info_baileys';
const logger = pino({ level: 'silent' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Track reconnection attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let isConnected = false;

async function restoreSessionFromBase64() {
  const sessionBase64 = process.env.WHATSAPP_SESSION;
  
  if (!sessionBase64) {
    return false;
  }
  
  try {
    log('📦 Restoring session from WHATSAPP_SESSION...', 'cyan');
    
    await fs.rm(AUTH_FOLDER, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(AUTH_FOLDER, { recursive: true });
    
    const jsonString = Buffer.from(sessionBase64, 'base64').toString('utf-8');
    const sessionData = JSON.parse(jsonString);
    
    for (const [filename, content] of Object.entries(sessionData)) {
      await fs.writeFile(`${AUTH_FOLDER}/${filename}`, content, 'utf-8');
    }
    
    log('✅ Session restored successfully!', 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to restore session: ${error.message}`, 'red');
    return false;
  }
}

async function convertSessionToBase64() {
  try {
    const files = await fs.readdir(AUTH_FOLDER);
    const sessionData = {};
    
    for (const file of files) {
      const filePath = `${AUTH_FOLDER}/${file}`;
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        const content = await fs.readFile(filePath, 'utf-8');
        sessionData[file] = content;
      }
    }
    
    return Buffer.from(JSON.stringify(sessionData)).toString('base64');
  } catch (error) {
    log(`❌ Failed to convert session: ${error.message}`, 'red');
    return null;
  }
}

function printPairingCode(code) {
  // Format the code as WhatsApp expects: XXXX-XXXX
  const formattedCode = code.match(/.{1,4}/g).join('-').toUpperCase();
  
  console.log();
  console.log(`${colors.magenta}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║                    🔐 YOUR PAIRING CODE 🔐                    ║${colors.reset}`);
  console.log(`${colors.magenta}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.magenta}║                                                              ║${colors.reset}`);
  console.log(`${colors.magenta}║                   ${formattedCode}                   ║${colors.reset}`);
  console.log(`${colors.magenta}║                                                              ║${colors.reset}`);
  console.log(`${colors.magenta}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
  log('📱 Enter this 8-character code in WhatsApp:', 'yellow');
  log('   Settings > Linked Devices > Link with phone number', 'yellow');
  console.log();
}

function printBanner() {
  console.log();
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}║              🤖  MSI XMD BOT - WhatsApp Bot  🤖              ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}║                    Powered by Baileys                        ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

export async function startBot() {
  printBanner();
  
  await restoreSessionFromBase64();
  
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();
  
  log(`📱 Baileys version: ${version.join('.')}`, 'blue');
  
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    version,
    // ADD THESE OPTIONS FOR BETTER STABILITY:
    markOnlineOnConnect: false, // Don't show online immediately
    defaultQueryTimeoutMs: 60000, // Increase timeout
    keepAliveIntervalMs: 30000, // Send keep-alive every 30 seconds
    connectTimeoutMs: 60000, // Increase connection timeout
    emitOwnEvents: false, // Reduce event emissions
    retryRequestDelayMs: 1000, // Retry delay for failed requests
  });
  
  let pairingCodeRequested = false;
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (connection === 'open') {
      isConnected = true;
      reconnectAttempts = 0; // Reset reconnection attempts
      log('✅ MSI XMD Bot connected to WhatsApp!', 'green');
      log('🤖 Bot is now running. Prefix: . (dot)', 'cyan');
      log('📝 Try sending .menu to see available commands', 'blue');
      
      // Send periodic keep-alive messages
      setInterval(async () => {
        if (isConnected) {
          try {
            await sock.sendPresenceUpdate('available');
            log('🫀 Keep-alive sent', 'blue');
          } catch (error) {
            log(`⚠️ Keep-alive failed: ${error.message}`, 'yellow');
          }
        }
      }, 60000); // Every 60 seconds
      
      if (!process.env.WHATSAPP_SESSION) {
        log('⏳ Waiting 2 minutes for session sync...', 'yellow');
        await delay(120000);
        
        const base64 = await convertSessionToBase64();
        if (base64) {
          console.log();
          log('📋 COPY THIS SESSION FOR RENDER DEPLOYMENT:', 'green');
          console.log();
          console.log('┌──────────────── START OF SESSION ────────────────┐');
          console.log();
          console.log(base64);
          console.log();
          console.log('└───────────────── END OF SESSION ─────────────────┘');
          console.log();
          log('💡 Add this as WHATSAPP_SESSION environment variable in Render', 'yellow');
        }
      }
    }
    
    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
      
      log(`⚠️ Connection closed. Status: ${statusCode || 'N/A'}`, 'yellow');
      log(`📝 Error: ${errorMessage}`, 'yellow');
      
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delayTime = Math.min(5000 * reconnectAttempts, 30000); // Exponential backoff
        
        log(`🔄 Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, 'blue');
        log(`⏳ Waiting ${delayTime/1000} seconds before reconnect`, 'yellow');
        
        await delay(delayTime);
        startBot();
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        log('❌ Max reconnection attempts reached. Please restart the bot.', 'red');
      } else {
        log('❌ Logged out. Please delete session and re-pair.', 'red');
      }
    }
    
    // Handle QR code if needed (fallback)
    if (qr && !sock.authState.creds.registered) {
      log('⚠️ Using QR code as fallback...', 'yellow');
      // You can add QR code display here if needed
    }
  });
  
  const phoneNumber = process.env.PHONE_NUMBER;
  
  if (phoneNumber && !sock.authState.creds.registered) {
    await delay(3000);
    
    if (!pairingCodeRequested) {
      pairingCodeRequested = true;
      
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      log(`📱 Requesting pairing code for: +${formattedNumber}`, 'cyan');
      
      try {
        const code = await sock.requestPairingCode(formattedNumber);
        printPairingCode(code);
        
        // Also log the raw code for debugging
        log(`🔢 Raw code: ${code}`, 'blue');
        
      } catch (error) {
        log(`❌ Failed to get pairing code: ${error.message}`, 'red');
        log('⚠️  Make sure your phone number is correct and includes country code', 'yellow');
        log('   Example: +1234567890', 'yellow');
      }
    }
  } else if (!phoneNumber && !sock.authState.creds.registered) {
    log('⚠️ No PHONE_NUMBER set. Please set PHONE_NUMBER environment variable.', 'yellow');
    log('   Format: +1234567890 (with country code)', 'yellow');
  }
  
  sock.ev.on('messages.upsert', async (m) => {
    if (!isConnected) return; // Don't process messages if not connected
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;
      
      await handleMessage(sock, msg);
    }
  });
  
  // Handle connection errors
  sock.ev.on('connection.update', (update) => {
    if (update.connection === 'connecting') {
      log('🔄 Connecting to WhatsApp...', 'blue');
    }
  });
  
  return sock;
}
 
