import 'dotenv/config';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { handleCommand } from './commands.js';
import { BOT_NAME, MESSAGES } from './config.js';

const logger = pino({ level: 'silent' });

const AUTH_FOLDER = './auth_info_baileys';

let connectionSuccessMessageSent = false;
let pairingCodeRequested = false;

const ownerNumber = process.env.PHONE_NUMBER?.replace(/[^0-9]/g, '');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  
  const phoneNumber = process.env.PHONE_NUMBER;
  
  if (!phoneNumber) {
    console.log('╔════════════════════════════════════════╗');
    console.log('║         MSAI Whats Bot Setup           ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  ⚠️  PHONE_NUMBER not set in env       ║');
    console.log('║                                        ║');
    console.log('║  Please set PHONE_NUMBER environment   ║');
    console.log('║  variable with your WhatsApp number    ║');
    console.log('║  Format: countrycode + number          ║');
    console.log('║  Example: 1234567890                   ║');
    console.log('╚════════════════════════════════════════╝');
    process.exit(1);
  }

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

  console.log('╔════════════════════════════════════════╗');
  console.log('║         MSAI Whats Bot Starting        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Phone: ${cleanNumber.padEnd(28)}║`);
  console.log('╚════════════════════════════════════════╝');

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 30000,
    emitOwnEvents: true,
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  if (!state.creds.registered) {
    console.log('\n📱 Waiting for connection to request pairing code...\n');
    
    await delay(5000);
    
    if (!pairingCodeRequested) {
      pairingCodeRequested = true;
      try {
        const code = await sock.requestPairingCode(cleanNumber);
        console.log('╔════════════════════════════════════════╗');
        console.log('║         📲 PAIRING CODE                ║');
        console.log('╠════════════════════════════════════════╣');
        console.log(`║                                        ║`);
        console.log(`║          ${code}                   ║`);
        console.log(`║                                        ║`);
        console.log('╠════════════════════════════════════════╣');
        console.log('║  Steps to connect:                     ║');
        console.log('║  1. Open WhatsApp on your phone        ║');
        console.log('║  2. Go to Settings > Linked Devices    ║');
        console.log('║  3. Tap "Link a Device"                ║');
        console.log('║  4. Select "Link with phone number"    ║');
        console.log('║  5. Enter the code shown above         ║');
        console.log('╚════════════════════════════════════════╝');
      } catch (err) {
        console.error('Failed to request pairing code:', err.message);
        pairingCodeRequested = false;
      }
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      
      console.log(`\n⚠️ Connection closed. Reason: ${DisconnectReason[reason] || reason}`);
      
      pairingCodeRequested = false;
      
      switch (reason) {
        case DisconnectReason.badSession:
          console.log('Bad session, please delete auth folder and restart');
          break;
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.timedOut:
          console.log('Reconnecting...');
          setTimeout(() => startBot(), 5000);
          break;
        case DisconnectReason.connectionReplaced:
          console.log('Connection replaced, another session opened');
          break;
        case DisconnectReason.loggedOut:
          console.log('Logged out, please delete auth folder and restart');
          break;
        case DisconnectReason.restartRequired:
          console.log('Restart required, restarting...');
          startBot();
          break;
        default:
          console.log('Unknown disconnect reason, reconnecting...');
          setTimeout(() => startBot(), 5000);
      }
    }

    if (connection === 'open') {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║      ✅ CONNECTION SUCCESSFUL          ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║  ${BOT_NAME} is now online!             ║`);
      console.log('║  Ready to receive commands             ║');
      console.log('╚════════════════════════════════════════╝\n');

      if (!connectionSuccessMessageSent) {
        connectionSuccessMessageSent = true;
        try {
          const userJid = sock.user.id;
          await sock.sendMessage(userJid, { 
            text: MESSAGES.CONNECTION_SUCCESS 
          });
          console.log('📤 Deployment success message sent to your inbox!');
        } catch (err) {
          console.log('Could not send success message:', err.message);
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const startTime = Date.now();
      
      const messageContent = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text || 
                            '';
      
      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');
      const sender = isGroup ? msg.key.participant : remoteJid;
      const senderNumber = sender?.split('@')[0] || '';
      const isOwner = senderNumber === ownerNumber;
      
      console.log(`📩 Message from ${sender}: ${messageContent}`);

      const context = {
        isGroup,
        sender,
        senderNumber,
        isOwner,
        remoteJid,
        sock
      };

      const result = handleCommand(messageContent, startTime, context);
      
      if (result) {
        try {
          if (result.react) {
            await sock.sendMessage(remoteJid, {
              react: {
                text: result.react,
                key: msg.key
              }
            });
          }

          if (result.action) {
            await handleAction(sock, result.action, msg, context);
          } else if (result.response) {
            await sock.sendMessage(remoteJid, { text: result.response }, { quoted: msg });
            console.log(`📤 Response sent in ${Date.now() - startTime}ms`);
          }
        } catch (err) {
          console.error('Error sending message:', err.message);
        }
      }
    }
  });

  return sock;
}

async function handleAction(sock, action, msg, context) {
  const { remoteJid, isGroup } = context;

  switch (action.type) {
    case 'tagall': {
      if (!isGroup) return;
      try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const participants = groupMetadata.participants;
        
        let mentionText = `📢 *${action.message}*\n\n`;
        const mentions = [];
        
        for (const participant of participants) {
          mentions.push(participant.id);
          mentionText += `@${participant.id.split('@')[0]}\n`;
        }
        
        await sock.sendMessage(remoteJid, { 
          text: mentionText, 
          mentions 
        }, { quoted: msg });
        console.log(`📤 Tagged ${participants.length} members`);
      } catch (err) {
        console.error('Error in tagall:', err.message);
        await sock.sendMessage(remoteJid, { text: '❌ Failed to tag members. Make sure bot is admin.' }, { quoted: msg });
      }
      break;
    }

    case 'groupinfo': {
      if (!isGroup) return;
      try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const created = new Date(groupMetadata.creation * 1000).toLocaleDateString();
        const admins = groupMetadata.participants.filter(p => p.admin).length;
        
        const infoText = `👥 *Group Information*\n\n` +
          `▸ *Name:* ${groupMetadata.subject}\n` +
          `▸ *Members:* ${groupMetadata.participants.length}\n` +
          `▸ *Admins:* ${admins}\n` +
          `▸ *Created:* ${created}\n` +
          `▸ *Description:*\n${groupMetadata.desc || 'No description'}`;
        
        await sock.sendMessage(remoteJid, { text: infoText }, { quoted: msg });
        console.log('📤 Group info sent');
      } catch (err) {
        console.error('Error in groupinfo:', err.message);
        await sock.sendMessage(remoteJid, { text: '❌ Failed to get group info.' }, { quoted: msg });
      }
      break;
    }

    case 'admins': {
      if (!isGroup) return;
      try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const admins = groupMetadata.participants.filter(p => p.admin);
        
        let adminText = `👑 *Group Admins*\n\n`;
        const mentions = [];
        
        for (const admin of admins) {
          mentions.push(admin.id);
          const role = admin.admin === 'superadmin' ? '👑 Owner' : '⭐ Admin';
          adminText += `${role}: @${admin.id.split('@')[0]}\n`;
        }
        
        await sock.sendMessage(remoteJid, { 
          text: adminText, 
          mentions 
        }, { quoted: msg });
        console.log(`📤 Listed ${admins.length} admins`);
      } catch (err) {
        console.error('Error in admins:', err.message);
        await sock.sendMessage(remoteJid, { text: '❌ Failed to get admin list.' }, { quoted: msg });
      }
      break;
    }

    case 'broadcast': {
      await sock.sendMessage(remoteJid, { 
        text: `📢 *Broadcast*\n\n${action.message}\n\n_From: ${BOT_NAME}_` 
      }, { quoted: msg });
      console.log('📤 Broadcast sent');
      break;
    }
  }
}

console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║        🤖 MSAI Whats Bot v1.0.0          ║
║        WhatsApp Bot with Baileys          ║
║                                           ║
╚═══════════════════════════════════════════╝
`);

startBot().catch(err => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
