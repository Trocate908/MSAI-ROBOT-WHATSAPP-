import { downloadMediaMessage } from '@whiskeysockets/baileys';

export const stickerCommand = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  description: 'Convert image to sticker (reply to an image)',
  category: 'Media',
  
  async execute(sock, msg, args, { from }) {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = msg.message?.imageMessage || quotedMsg?.imageMessage;
    
    if (!imageMessage) {
      await sock.sendMessage(from, { 
        text: '❌ Please reply to an image or send an image with the command!\n\nUsage: Send an image with caption *.sticker*' 
      });
      return;
    }
    
    await sock.sendMessage(from, { text: '⏳ Creating sticker...' });
    
    try {
      let messageToDownload;
      
      if (msg.message?.imageMessage) {
        messageToDownload = msg;
      } else {
        messageToDownload = {
          key: msg.key,
          message: quotedMsg
        };
      }
      
      const buffer = await downloadMediaMessage(
        messageToDownload,
        'buffer',
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      );
      
      await sock.sendMessage(from, {
        sticker: buffer,
        mimetype: 'image/webp',
      });
    } catch (error) {
      console.error('Sticker error:', error);
      await sock.sendMessage(from, { 
        text: '❌ Failed to create sticker. Please try again with a different image.' 
      });
    }
  }
};
