import os from 'os';

export const infoCommand = {
  name: 'info',
  aliases: ['botinfo', 'status'],
  description: 'Show bot system information',
  category: 'General',
  
  async execute(sock, msg, args, { from }) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    
    const infoText = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   📊 *SYSTEM INFO*   
┃━━━━━━━━━━━━━━━━━━━━━
┃ 🤖 Bot: *MSI XMD*
┃ 📌 Version: *1.0.0*
┃ ⏱️ Uptime: *${hours}h ${minutes}m ${seconds}s*
┃ 💾 Memory: *${memUsed} MB*
┃ 🖥️ Platform: *${os.platform()}*
┃ 📦 Node: *${process.version}*
┃ 🔧 Runtime: *Baileys*
╰━━━━━━━━━━━━━━━━━━━━━╯

🚀 Powered by MSI XMD Bot`;
    
    await sock.sendMessage(from, { text: infoText });
  }
};
