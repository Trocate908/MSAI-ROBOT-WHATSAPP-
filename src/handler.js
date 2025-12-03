import { commands } from '../commands/index.js';

const PREFIX = '.';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function getMessageText(msg) {
  const message = msg.message;
  
  if (!message) return '';
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  if (message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId;
  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId;
  if (message.templateButtonReplyMessage?.selectedId) return message.templateButtonReplyMessage.selectedId;
  
  return '';
}

function getSenderName(msg) {
  return msg.pushName || 'User';
}

function getSenderNumber(msg) {
  const jid = msg.key.remoteJid || '';
  return jid.split('@')[0];
}

export async function handleMessage(sock, msg) {
  try {
    const text = getMessageText(msg);
    const from = msg.key.remoteJid;
    const senderName = getSenderName(msg);
    const senderNumber = getSenderNumber(msg);
    
    log(`📝 Message text: "${text}"`, 'cyan');
    
    if (!text || !text.startsWith(PREFIX)) {
      return;
    }
    
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
      log(`❌ Error executing ${PREFIX}${commandName}: ${error.message}`, 'red');
      console.error(error);
      await sock.sendMessage(from, { 
        text: `❌ Error executing command: ${error.message}` 
      });
    }
  } catch (error) {
    log(`❌ Handler error: ${error.message}`, 'red');
    console.error(error);
  }
}

export { PREFIX };
