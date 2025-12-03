export const pingCommand = {
  name: 'ping',
  aliases: ['p'],
  description: 'Check bot response time',
  category: 'General',
  
  async execute(sock, msg, args, { from }) {
    const start = Date.now();
    
    const sentMsg = await sock.sendMessage(from, { text: '🏓 Pinging...' });
    
    const latency = Date.now() - start;
    
    await sock.sendMessage(from, { 
      text: `🏓 *Pong!*\n\n⚡ Response time: *${latency}ms*`,
      edit: sentMsg.key
    });
  }
};
