import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import dotenv from "dotenv";
dotenv.config();

export async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    if (!sock.authState?.creds?.registered) {
        const code = await sock.requestPairingCode(process.env.PHONE_NUMBER);
        console.log("\n🔐 Your WhatsApp Pairing Code:\n");
        console.log("👉 " + code);
        console.log("\nLink from WhatsApp >> Linked Devices >> Link with Code\n");
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "open") console.log("🟢 BOT CONNECTED");
        if (connection === "close") {
            console.log("🔴 Reconnecting…");
            startBot();
        }
    });

    return sock;
                    }
