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
let reconnectAttempts = 0;
let isConnected = false;
const MAX_RECONNECT_ATTEMPTS = 10;


// ==========================
// 🔥 PRINTING FUNCTIONS
// ==========================
function printBanner() {
console.log(`
╔═══════════════════════════════════════════════════╗
║              🤖 MSI XMD BOT ONLINE                ║
║               Powered by Baileys                  ║
╚═══════════════════════════════════════════════════╝
`);
}

function printPairingCode(code) {
  console.log(`
╔════════════════════════════════════════════╗
║               🔐 PAIRING CODE              ║
╠════════════════════════════════════════════╣
║              ${code.match(/.{1,4}/g).join('-')}              ║
╚════════════════════════════════════════════╝

➡ Open WhatsApp → Linked Devices → Link with phone number
`);
}


// ==========================
// 📌 RESTORE SESSION (RENDER)
// ==========================
async function restoreSessionFromBase64() {
  const sessionBase64 = process.env.WHATSAPP_SESSION;
  if (!sessionBase64) return false;

  await fs.rm(AUTH_FOLDER, { recursive: true, force: true }).catch(()=>{});
  await fs.mkdir(AUTH_FOLDER, { recursive: true });

  const sessionData = JSON.parse(Buffer.from(sessionBase64,'base64').toString());
  for (const [file, content] of Object.entries(sessionData)) {
    await fs.writeFile(`${AUTH_FOLDER}/${file}`, content);
  }

  console.log("🔑 Session restored from Environment");
  return true;
}


// ==========================
// 🚀 MAIN BOT FUNCTION
// ==========================
export async function startBot() {
  
  printBanner();
  await restoreSessionFromBase64();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    version,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000
  });

  sock.ev.on("creds.update", saveCreds);


  // =============================
  // 🔥 ON MESSAGE (fix applied)
  // =============================
  sock.ev.on("messages.upsert", async ({ messages }) => {
      if (!isConnected) return;
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      
      try {
          await handleMessage(sock, msg);
      } catch(e) {
          console.log("❌ Handler error:", e.message);
      }
  });


  // =============================
  // 🔥 CONNECTION HANDLER FIXED
  // =============================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

      if (connection === "open") {
          console.log("✅ Bot Connected Successfully");
          isConnected = true;
          reconnectAttempts = 0;
          console.log("📌 Send .menu to confirm bot works");
      }

      if (connection === "close") {
          isConnected = false;
          const reason = lastDisconnect?.error?.output?.statusCode;
          console.log("⚠ Connection Lost:",reason);

          if (reason !== DisconnectReason.loggedOut && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`🔄 Reconnecting Attempt ${reconnectAttempts}`);
                await delay(3000);
                return startBot();
          } else {
                console.log("❌ SESSION EXPIRED — REPAIR REQUIRED");
          }
      }

      // show pairing code
      if (qr) {
        console.log("⚠ QR Fallback — waiting for phone number pairing");
      }
  });


  // =============================
  // 📞 PHONE NUMBER PAIR SYSTEM
  // =============================
  if (!sock.authState.creds.registered) {
      const num = process.env.PHONE_NUMBER?.replace(/[^0-9]/g,"");
      if (!num) return console.log("⚠ Set PHONE_NUMBER env variable");

      await delay(4000);
      const code = await sock.requestPairingCode(num);
      printPairingCode(code);
  }

  return sock;
    } 
