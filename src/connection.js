import pkg from '@whiskeysockets/baileys';
const { 
  default: makeWASocket, 
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  Browsers
} = pkg;

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
  console.log(`${colors.cyan}║                    Powered by Milton                        ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

export async function startBot() {
  printBanner();
  
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  
  log('📱 Initializing WhatsApp connection...', 'blue');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
  });
  
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;
  let pairingCodeRequested = false;
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      log('✅ MSI XMD Bot connected to WhatsApp!', 'green');
      log('🤖 Bot is now running. Prefix: . (dot)', 'cyan');
      log('📝 Try sending .menu to see available commands', 'blue');
      
      // Send keep-alive every 30 seconds
      setInterval(async () => {
        try {
          await sock.sendPresenceUpdate('available');
        } catch (error) {
          // Silent fail
        }
      }, 30000);
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      log(`⚠️ Connection closed. Status: ${statusCode}`, 'yellow');
      
      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delayTime = Math.min(5000 * reconnectAttempts, 30000);
        
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
  });
  
  // Request pairing code if not registered
  if (!sock.authState.creds.registered) {
    await delay(2000);
    
    if (!pairingCodeRequested) {
      pairingCodeRequested = true;
      
      const phoneNumber = process.env.PHONE_NUMBER;
      
      if (phoneNumber) {
        const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        log(`📱 Requesting pairing code for: +${formattedNumber}`, 'cyan');
        
        try {
          const code = await sock.requestPairingCode(formattedNumber);
          printPairingCode(code);
          log(`🔢 Raw code: ${code}`, 'blue');
        } catch (error) {
          log(`❌ Failed to get pairing code: ${error.message}`, 'red');
          log('⚠️ Make sure your phone number is correct (e.g., +263715907468)', 'yellow');
        }
      } else {
        log('⚠️ No PHONE_NUMBER set. Please set PHONE_NUMBER environment variable.', 'yellow');
        log('   Format: +263715907468 (with country code)', 'yellow');
      }
    }
  }
  
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;
      
      await handleMessage(sock, msg);
    }
  });
  
  return sock;
} 
