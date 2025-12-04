import { BOT_NAME, BOT_PREFIX, BOT_VERSION, MESSAGES } from './config.js';

const commands = {
  help: {
    description: 'Show all available commands',
    usage: `${BOT_PREFIX}help`,
    category: 'general',
    execute: () => {
      let helpText = MESSAGES.HELP_HEADER;
      helpText += `*📋 General Commands:*\n\n`;
      
      Object.entries(commands).filter(([_, cmd]) => cmd.category === 'general').forEach(([name, cmd]) => {
        helpText += `▸ *${BOT_PREFIX}${name}* - ${cmd.description}\n`;
      });
      
      helpText += `\n*👥 Group Commands:*\n\n`;
      Object.entries(commands).filter(([_, cmd]) => cmd.category === 'group').forEach(([name, cmd]) => {
        helpText += `▸ *${BOT_PREFIX}${name}* - ${cmd.description}\n`;
      });
      
      helpText += `\n*🔧 Owner Commands:*\n\n`;
      Object.entries(commands).filter(([_, cmd]) => cmd.category === 'owner').forEach(([name, cmd]) => {
        helpText += `▸ *${BOT_PREFIX}${name}* - ${cmd.description}\n`;
      });
      
      helpText += `\n_Powered by ${BOT_NAME} v${BOT_VERSION}_`;
      return helpText;
    }
  },
  
  ping: {
    description: 'Check bot response time',
    usage: `${BOT_PREFIX}ping`,
    category: 'general',
    execute: (args, context) => {
      const responseTime = Date.now() - context.startTime;
      return `🏓 *Pong!*\n\n⚡ Response time: *${responseTime}ms*`;
    }
  },
  
  info: {
    description: 'Get bot information',
    usage: `${BOT_PREFIX}info`,
    category: 'general',
    execute: () => {
      return `╔════════════════════════╗\n║      *Bot Information*      ║\n╚════════════════════════╝\n\n` +
        `▸ *Name:* ${BOT_NAME}\n` +
        `▸ *Version:* ${BOT_VERSION}\n` +
        `▸ *Platform:* WhatsApp\n` +
        `▸ *Library:* Baileys\n` +
        `▸ *Runtime:* Node.js\n\n` +
        `_Use ${BOT_PREFIX}help for available commands_`;
    }
  },
  
  menu: {
    description: 'Display the main menu',
    usage: `${BOT_PREFIX}menu`,
    category: 'general',
    react: '🫀',
    execute: () => {
      return `╔════════════════════════╗\n║      *${BOT_NAME}* Menu      ║\n╚════════════════════════╝\n\n` +
        `Welcome to ${BOT_NAME}!\n\n` +
        `*📋 General Commands*\n` +
        `▸ ${BOT_PREFIX}menu - This menu\n` +
        `▸ ${BOT_PREFIX}help - All commands\n` +
        `▸ ${BOT_PREFIX}ping - Response time\n` +
        `▸ ${BOT_PREFIX}info - Bot info\n` +
        `▸ ${BOT_PREFIX}about - About bot\n` +
        `▸ ${BOT_PREFIX}owner - Owner info\n` +
        `▸ ${BOT_PREFIX}time - Current time\n` +
        `▸ ${BOT_PREFIX}quote - Random quote\n\n` +
        `*👥 Group Commands*\n` +
        `▸ ${BOT_PREFIX}tagall - Tag everyone\n` +
        `▸ ${BOT_PREFIX}groupinfo - Group info\n` +
        `▸ ${BOT_PREFIX}admins - List admins\n\n` +
        `*🔧 Owner Commands*\n` +
        `▸ ${BOT_PREFIX}broadcast - Send to all\n` +
        `▸ ${BOT_PREFIX}status - Bot status\n\n` +
        `*💡 Tip:* All commands start with *${BOT_PREFIX}*`;
    }
  },
  
  about: {
    description: 'Learn about this bot',
    usage: `${BOT_PREFIX}about`,
    category: 'general',
    execute: () => {
      return `*About ${BOT_NAME}*\n\n` +
        `${BOT_NAME} is a fast and reliable WhatsApp bot designed to provide quick responses and useful features.\n\n` +
        `Built with modern technology to ensure speed and reliability.\n\n` +
        `_Version ${BOT_VERSION}_`;
    }
  },
  
  owner: {
    description: 'Get owner contact information',
    usage: `${BOT_PREFIX}owner`,
    category: 'general',
    execute: () => {
      return `*👤 Bot Owner*\n\n` +
        `This bot is managed by the MSAI team.\n\n` +
        `For support or inquiries, please contact the administrator.`;
    }
  },
  
  time: {
    description: 'Get current date and time',
    usage: `${BOT_PREFIX}time`,
    category: 'general',
    execute: () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      return `🕐 *Current Date & Time*\n\n` +
        `📅 *Date:* ${dateStr}\n` +
        `⏰ *Time:* ${timeStr}`;
    }
  },

  quote: {
    description: 'Get a random inspirational quote',
    usage: `${BOT_PREFIX}quote`,
    category: 'general',
    execute: () => {
      const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
        { text: "Your limitation—it's only your imagination.", author: "Unknown" }
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      return `💭 *Random Quote*\n\n"${quote.text}"\n\n— _${quote.author}_`;
    }
  },
  
  sticker: {
    description: 'Convert image to sticker (reply to image)',
    usage: `${BOT_PREFIX}sticker`,
    category: 'general',
    execute: () => {
      return `📌 *Sticker Command*\n\n` +
        `To create a sticker:\n` +
        `1. Send or reply to an image\n` +
        `2. Add caption: ${BOT_PREFIX}sticker\n\n` +
        `_Feature coming soon!_`;
    }
  },

  tagall: {
    description: 'Tag all members in group',
    usage: `${BOT_PREFIX}tagall [message]`,
    category: 'group',
    groupOnly: true,
    execute: (args, context) => {
      if (!context.isGroup) {
        return `❌ This command can only be used in groups!`;
      }
      return { type: 'tagall', message: args.join(' ') || 'Attention everyone!' };
    }
  },

  groupinfo: {
    description: 'Get group information',
    usage: `${BOT_PREFIX}groupinfo`,
    category: 'group',
    groupOnly: true,
    execute: (args, context) => {
      if (!context.isGroup) {
        return `❌ This command can only be used in groups!`;
      }
      return { type: 'groupinfo' };
    }
  },

  admins: {
    description: 'List all group admins',
    usage: `${BOT_PREFIX}admins`,
    category: 'group',
    groupOnly: true,
    execute: (args, context) => {
      if (!context.isGroup) {
        return `❌ This command can only be used in groups!`;
      }
      return { type: 'admins' };
    }
  },

  broadcast: {
    description: 'Broadcast message (Owner only)',
    usage: `${BOT_PREFIX}broadcast [message]`,
    category: 'owner',
    ownerOnly: true,
    execute: (args, context) => {
      if (!context.isOwner) {
        return `❌ This command is for the bot owner only!`;
      }
      const message = args.join(' ');
      if (!message) {
        return `❌ Please provide a message to broadcast!\n\nUsage: ${BOT_PREFIX}broadcast [your message]`;
      }
      return { type: 'broadcast', message };
    }
  },

  status: {
    description: 'Check bot status (Owner only)',
    usage: `${BOT_PREFIX}status`,
    category: 'owner',
    ownerOnly: true,
    execute: (args, context) => {
      if (!context.isOwner) {
        return `❌ This command is for the bot owner only!`;
      }
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      return `🤖 *Bot Status*\n\n` +
        `▸ *Status:* 🟢 Online\n` +
        `▸ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n` +
        `▸ *Memory:* ${memMB} MB\n` +
        `▸ *Platform:* ${process.platform}\n` +
        `▸ *Node.js:* ${process.version}\n\n` +
        `_${BOT_NAME} v${BOT_VERSION}_`;
    }
  }
};

export function handleCommand(text, startTime, context = {}) {
  if (!text || !text.startsWith(BOT_PREFIX)) {
    return null;
  }
  
  const args = text.slice(BOT_PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  
  const cmd = commands[commandName];
  
  if (!cmd) {
    return { response: MESSAGES.COMMAND_NOT_FOUND };
  }
  
  const result = cmd.execute(args, { ...context, startTime });
  
  return {
    response: typeof result === 'string' ? result : null,
    action: typeof result === 'object' ? result : null,
    react: cmd.react || null
  };
}

export { commands };
