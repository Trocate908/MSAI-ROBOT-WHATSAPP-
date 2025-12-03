export const aliveCommand = {
  name: 'alive',
  aliases: ['bot', 'test'],
  description: 'Check if bot is online',
  category: 'General',
  
  async execute(sock, msg, args, { senderName, from }) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    
    const aliveText = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 *MSI XMD BOT*   
┃━━━━━━━━━━━━━━━━━━━━━
┃ ✅ Status: *ONLINE*
┃ ⏱️ Uptime: *${uptimeStr}*
┃ 👤 User: *${senderName}*
┃ 📅 ${new Date().toLocaleDateString()}
┃ ⏰ ${new Date().toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━━━━╯

💚 Bot is running smoothly!`;
    
    await sock.sendMessage(from, { text: aliveText });
  }
};
