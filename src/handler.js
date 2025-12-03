export async function handleMessage(sock, msg) {
    try {
        const jid = msg.key.remoteJid;
        
        // Extract text sent
        const text = msg.message.conversation 
            || msg.message.extendedTextMessage?.text 
            || msg.message.imageMessage?.caption 
            || "";

        if (!text) return;

        const prefix = ".";
        if (!text.startsWith(prefix)) return;

        const command = text.slice(prefix.length).trim().split(" ")[0].toLowerCase();
        const args = text.split(" ").slice(1);

        console.log("📩 Command received:", command);

        // ===========================
        // 💥 COMMANDS BELOW
        // ===========================

        if (command === "menu") {
            await sock.sendMessage(jid, {
                text: `
🌐 *MSI XMD BOT ONLINE*
Prefix: .

Available Commands:
• .menu — show this menu
• .ping — test speed
• .owner — show developer

More commands coming soon... 🚀
                `
            });
        }

        else if (command === "ping") {
            await sock.sendMessage(jid, { text: "🏓 Pong! Bot is active." });
        }

        else if (command === "owner") {
            await sock.sendMessage(jid, {
                text: "👤 Developer: *Milton / Mewtwo*\nThis bot is powered by Baileys⚡"
            });
        }

        // ===========================
        // Default if no command found
        // ===========================
        else {
            await sock.sendMessage(jid, {
                text: "❓ Unknown command. Try *.menu*"
            });
        }

    } catch (err) {
        console.log("❌ Handler error:", err.message);
    }
}
