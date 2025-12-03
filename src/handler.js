import { commands } from '../commands/index.js';

const PREFIX = '.';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function getMessageText(msg) {
  return msg.message?.conversation || 
         msg.message?.extendedTextMessage?.text || 
         msg.message?.imageMessage?.caption ||
         msg.message?.videoMessage?.caption ||
         '';
}

function getSenderName(msg) {
  return msg.pushName || 'User';
}

function getSenderNumber(msg) {
  return msg.key.remoteJid.split('@')[0];
}

export async function handleMessage(sock, msg) {
  const text = getMessageText(msg);
  const from = msg.key.remoteJid;
  const senderName = getSenderName(msg);
  const senderNumber = getSenderNumber(msg);
  
  if (!text.startsWith(PREFIX)) return;
  
  const args = text.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  
  if (!commandName) return;
  
  log(`📩 Command: ${PREFIX}${commandName} from ${senderName} (${senderNumber})`, 'cyan');
  
  const command = commands.get(commandName);
  
  if (!command) {
    await sock.sendMessage(from, { 
      text: `❌ Unknown command: *${PREFIX}${commandName}*\n\nType *${PREFIX}menu* to see available commands.` 
    });
    return;
  }
  
  try {
    await command.execute(sock, msg, args, { PREFIX, senderName, senderNumber, from });
    log(`✅ Command ${PREFIX}${commandName} executed successfully`, 'green');
  } catch (error) {
    log(`❌ Error executing ${PREFIX}${commandName}: ${error.message}`, 'yellow');
    await sock.sendMessage(from, { 
      text: `❌ Error executing command: ${error.message}` 
    });
  }
}

export { PREFIX };
 
