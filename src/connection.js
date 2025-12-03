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

async function restoreSessionFromBase64() {
  const sessionBase64 = process.env.WHATSAPP_SESSION;
  
  if (!sessionBase64) {
    return false;
  }
  
  try {
    const authExists = await fs.access(AUTH_FOLDER).then(() => true).catch(() => false);
    const credsExists = authExists && await fs.access(`${AUTH_FOLDER}/creds.json`).then(() => true).catch(() => false);
    
    if (credsExists) {
      log('📦 Session already exists, skipping restore', 'cyan');
      return true;
    }
    
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

function printPairingCode(code, phoneNumber) {
  console.log();
  console.log(`${colors.magenta}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║                    🔐 YOUR PAIRING CODE 🔐                    ║${colors.reset}`);
  console.log(`${colors.magenta}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.magenta}║                                                              ║${colors.reset}`);
  console.log(`${colors.magenta}║                        ${code}                        ║${colors.reset}`);
  console.log(`${colors.magenta}║                                                              ║${colors.reset}`);
  console.log(`${colors.magenta}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
  log(`📱 Phone: +${phoneNumber}`, 'cyan');
  log('⚠️  Enter this code in WhatsApp QUICKLY (expires in 60 seconds):', 'yellow');
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

let globalSock = null;
let keepAliveInterval = null;

export async function startBot() {
  printBanner();
  
  const phoneNumber = process.env.PHONE_NUMBER;
  const formattedNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : null;
  
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
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    markOnlineOnConnect: true,
  });
  
  globalSock = sock;
  let pairingCodeRequested = false;
  
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr && formattedNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
      pairingCodeRequested = true;
      
      log(`📱 Requesting pairing code for: +${formattedNumber}`, 'cyan');
      
      try {
        const code = await sock.requestPairingCode(formattedNumber);
        printPairingCode(code, formattedNumber);
      } catch (error) {
        log(`❌ Failed to get pairing code: ${error.message}`, 'red');
        pairingCodeRequested = false;
      }
    }
    
    if (connection === 'open') {
      log('✅ MSI XMD Bot connected to WhatsApp!', 'green');
      log('🤖 Bot is now running. Prefix: . (dot)', 'cyan');
      log('📝 Try sending .menu to see available commands', 'blue');
      
      keepAliveInterval = setInterval(() => {
        log('💓 Keep-alive ping', 'blue');
      }, 5 * 60 * 1000);
      
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
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      log(`⚠️ Connection closed. Status: ${statusCode}`, 'yellow');
      
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      
      if (shouldReconnect) {
        log('🔄 Reconnecting in 3 seconds...', 'blue');
        pairingCodeRequested = false;
        await delay(3000);
        startBot();
      } else {
        log('❌ Logged out. Please update WHATSAPP_SESSION and redeploy.', 'red');
      }
    }
  });
  
  if (!formattedNumber && !sock.authState.creds.registered) {
    log('⚠️ No PHONE_NUMBER set. Please set PHONE_NUMBER environment variable.', 'yellow');
  }
  
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;
        if (msg.key.remoteJid === 'status@broadcast') continue;
        
        log(`📨 Message received from: ${msg.key.remoteJid}`, 'cyan');
        
        await handleMessage(sock, msg);
      } catch (error) {
        log(`❌ Error processing message: ${error.message}`, 'red');
      }
    }
  });
  
  return sock;
}
 
