const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");

// ===== 基本設定 =====
const GUILD_ID = "1488912636040052869";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== 清空指令函式 =====
async function clearCommandsOnStartup(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    // 清空 Guild 指令
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: [] }
    );
    console.log("✅ Guild 指令已清空");

    // 清空 Global 指令
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );
    console.log("✅ Global 指令已清空");

  } catch (err) {
    console.error("❌ 清空指令失敗:", err);
  }
}

// ===== Bot 上線 =====
client.once("ready", async () => {
  console.log(`Bot 上線: ${client.user.tag}`);

  // 👉 啟動時清空指令
  await clearCommandsOnStartup(client);
});

// ===== 啟動 =====
client.login(process.env.TOKEN);
