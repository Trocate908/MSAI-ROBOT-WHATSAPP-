import { getCommandList } from './index.js';

export const menuCommand = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show all available commands',
  category: 'General',
  
  async execute(sock, msg, args, { PREFIX, senderName, from }) {
    const commands = getCommandList();
    
    const categories = {};
    for (const cmd of commands) {
      const cat = cmd.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }
    
    let menuText = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 *MSI XMD BOT*   
┃━━━━━━━━━━━━━━━━━━━━━
┃ 👋 Hello, *${senderName}*!
┃ 📌 Prefix: *${PREFIX}*
╰━━━━━━━━━━━━━━━━━━━━━╯\n`;
    
    for (const [category, cmds] of Object.entries(categories)) {
      menuText += `\n╭━━━ *${category.toUpperCase()}* ━━━╮\n`;
      
      for (const cmd of cmds) {
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
        menuText += `┃ ${PREFIX}${cmd.name}${aliases}\n`;
        menuText += `┃   └ ${cmd.description}\n`;
      }
      
      menuText += `╰${'━'.repeat(20)}╯\n`;
    }
    
    menuText += `\n💡 *Tip:* Type any command to use it!`;
    
    await sock.sendMessage(from, { text: menuText });
  }
};
