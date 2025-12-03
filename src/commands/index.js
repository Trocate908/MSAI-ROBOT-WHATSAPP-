import { menuCommand } from './menu.js';
import { pingCommand } from './ping.js';
import { aliveCommand } from './alive.js';
import { infoCommand } from './info.js';
import { stickerCommand } from './sticker.js';

export const commands = new Map();

const commandList = [
  menuCommand,
  pingCommand,
  aliveCommand,
  infoCommand,
  stickerCommand,
];

for (const cmd of commandList) {
  commands.set(cmd.name, cmd);
  
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias, cmd);
    }
  }
}

export function getCommandList() {
  const uniqueCommands = [];
  const seen = new Set();
  
  for (const cmd of commandList) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      uniqueCommands.push(cmd);
    }
  }
  
  return uniqueCommands;
}
