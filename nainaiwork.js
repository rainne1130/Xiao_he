const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");

const admin = require("firebase-admin");

// ===== 設定 =====
const SERVICE_ROLE_ID = "1500107633900781649";
const GUILD_ID = "1488912636040052869";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== Firebase =====
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://workingnai-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ===== 指令註冊（只跑一次）=====
async function registerCommands(client) {
  const commands = [
    new SlashCommandBuilder()
      .setName("addpoint")
      .setDescription("加值點數")
      .addUserOption(o => o.setName("user").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("removepoint")
      .setDescription("扣除點數")
      .addUserOption(o => o.setName("user").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("point")
      .setDescription("查詢點數")
      .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
      .setName("totalpoint")
      .setDescription("查詢累積點數")
      .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
      .setName("cleartotal")
      .setDescription("清除累積點數")
      .addUserOption(o => o.setName("user").setRequired(true))
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );

  console.log("✅ 指令已自動註冊");
}

// ===== 權限 =====
function hasPermission(member) {
  return member.roles.cache.has(SERVICE_ROLE_ID);
}

// ===== 資料 =====
async function getUser(userId) {
  const ref = db.ref(`users/${userId}`);
  const snap = await ref.once("value");
  return snap.val() || { balance: 0, total: 0 };
}

// ===== 加值 =====
async function addPoint(userId, amount) {
  if (amount <= 0) throw new Error("金額必須大於0");

  const ref = db.ref(`users/${userId}`);
  const data = await getUser(userId);

  const newBalance = data.balance + amount;
  const newTotal = data.total + amount;

  await ref.update({
    balance: newBalance,
    total: newTotal
  });

  return { newBalance, newTotal };
}

// ===== 扣款 =====
async function removePoint(userId, amount) {
  if (amount <= 0) throw new Error("金額必須大於0");

  const ref = db.ref(`users/${userId}`);
  const data = await getUser(userId);

  if (data.balance < amount) throw new Error("餘額不足");

  const newBalance = data.balance - amount;

  await ref.update({ balance: newBalance });

  return newBalance;
}

// ===== 清除累積 =====
async function clearTotal(userId) {
  await db.ref(`users/${userId}`).update({ total: 0 });
}

// ===== 上線 =====
client.once("ready", async () => {
  console.log(`Bot 上線: ${client.user.tag}`);

  // 👉 開機自動註冊（完成後可關掉）
  await registerCommands(client);
});

// ===== 指令處理 =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!hasPermission(interaction.member)) {
    return interaction.reply({ content: "❌ 無權限", ephemeral: true });
  }

  const user = interaction.options.getUser("user");
  const cmd = interaction.commandName;

  try {

    if (cmd === "addpoint") {
      const amount = interaction.options.getInteger("amount");

      const { newBalance, newTotal } = await addPoint(user.id, amount);

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setAuthor({ name: `${user.username} 加值成功`, iconURL: user.displayAvatarURL() })
        .addFields(
          { name: "💰 加值", value: `+${amount}`, inline: true },
          { name: "📊 餘額", value: `${newBalance}`, inline: true },
          { name: "📈 累積", value: `${newTotal}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (cmd === "removepoint") {
      const amount = interaction.options.getInteger("amount");

      const newBalance = await removePoint(user.id, amount);

      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setAuthor({ name: `${user.username} 扣款成功`, iconURL: user.displayAvatarURL() })
        .addFields(
          { name: "💸 扣款", value: `-${amount}`, inline: true },
          { name: "📊 餘額", value: `${newBalance}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (cmd === "point") {
      const data = await getUser(user.id);

      return interaction.reply({
        content: `💰 ${user.username} 點數：${data.balance}`,
        ephemeral: true
      });
    }

    if (cmd === "totalpoint") {
      const data = await getUser(user.id);

      return interaction.reply(`📈 累積點數：${data.total}`);
    }

    if (cmd === "cleartotal") {
      await clearTotal(user.id);

      return interaction.reply(`🧹 已清除累積點數`);
    }

  } catch (err) {
    return interaction.reply({
      content: `❌ ${err.message}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
