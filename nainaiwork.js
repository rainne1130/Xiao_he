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

// ===== 指令註冊 =====
async function registerCommands(client) {
  const commands = [

    new SlashCommandBuilder()
      .setName("addpoint")
	  .setNameLocalizations({ "zh-TW": "儲值點數" })
      .setDescription("加值點數")
      .addUserOption(o =>
        o.setName("user")
         .setDescription("選擇玩家")
         .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount")
         .setDescription("點數")
         .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("removepoint")
	  .setNameLocalizations({ "zh-TW": "扣除點數" })
      .setDescription("扣除點數")
      .addUserOption(o =>
        o.setName("user")
         .setDescription("選擇玩家")
         .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount")
         .setDescription("扣除點數")
         .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("point")
	  .setNameLocalizations({ "zh-TW": "查詢點數餘額" })
      .setDescription("查詢點數")
      .addUserOption(o =>
        o.setName("user")
         .setDescription("查詢對象")
         .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("totalpoint")
	  .setNameLocalizations({ "zh-TW": "查詢總儲值金額" })
      .setDescription("查詢累積點數")
      .addUserOption(o =>
        o.setName("user")
         .setDescription("查詢對象")
         .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("cleartotal")
	  .setNameLocalizations({ "zh-TW": "清除總儲值金額" })
      .setDescription("清除累積點數")
      .addUserOption(o =>
        o.setName("user")
         .setDescription("目標玩家")
         .setRequired(true)
      )

  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );

  console.log("✅ 指令已註冊");
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

  await registerCommands(client); // 第一次開著
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
		.setTitle("💳 點數異動通知")
		.setAuthor({
		  name: `${user.username} 加值成功`
		})
		.setThumbnail(user.displayAvatarURL())
		.addFields(
		  { name: "💰 加值金額", value: `+${amount.toLocaleString()}`, inline: true },
		  { name: "📊 目前餘額", value: `${newBalance.toLocaleString()}`, inline: true },
		  { name: "📈 累積點數", value: `${newTotal.toLocaleString()}`, inline: true }
		)
		.setFooter({
		  text: `操作人：${interaction.user.displayName ?? interaction.user.username}`,
		  iconURL: interaction.user.displayAvatarURL()
		})
		.setTimestamp();
	  return interaction.reply({
		embeds: [embed]
	  });
	}

    if (cmd === "removepoint") {
	  const amount = interaction.options.getInteger("amount");

	  const newBalance = await removePoint(user.id, amount);

	  const embed = new EmbedBuilder()
		.setColor(0xff4444)
		.setTitle("💳 點數異動通知")
		.setAuthor({
		  name: `${user.username} 扣款成功`
		})
		.setThumbnail(user.displayAvatarURL())
		.addFields(
		  { name: "💸 扣款金額", value: `-${amount.toLocaleString()}`, inline: true },
		  { name: "📊 目前餘額", value: `${newBalance.toLocaleString()}`, inline: true }
		)
		.setFooter({
		  text: `操作人：${interaction.user.displayName ?? interaction.user.username}`,
		  iconURL: interaction.user.displayAvatarURL()
		})
		.setTimestamp();

	  return interaction.reply({
		embeds: [embed]
	  });
	}

    if (cmd === "point") {
	  const data = await getUser(user.id);

	  const embed = new EmbedBuilder()
		.setColor(0x3399ff)
		.setTitle("📊 點數查詢")
		.setAuthor({
		  name: `${user.username} 點數資訊`
		})
		.setThumbnail(user.displayAvatarURL())
		.addFields(
		  { name: "💰 目前餘額", value: `${data.balance.toLocaleString()}`, inline: true }
		)
		.setFooter({
		  text: `查詢者：${interaction.user.displayName ?? interaction.user.username}`,
		  iconURL: interaction.user.displayAvatarURL()
		})
		.setTimestamp();

	  return interaction.reply({
		embeds: [embed],
		ephemeral: true
	  });
	}

    if (cmd === "totalpoint") {
	  const data = await getUser(user.id);

	  const embed = new EmbedBuilder()
		.setColor(0x9966ff)
		.setTitle("📈 累積點數查詢")
		.setAuthor({
		  name: `${user.username} 累積資訊`
		})
		.setThumbnail(user.displayAvatarURL())
		.addFields(
		  { name: "📈 總累積點數", value: `${data.total.toLocaleString()}` }
		)
		.setFooter({
		  text: `查詢者：${interaction.user.displayName ?? interaction.user.username}`,
		  iconURL: interaction.user.displayAvatarURL()
		})
		.setTimestamp();

	  return interaction.reply({
		embeds: [embed]
	  });
	}

    if (cmd === "cleartotal") {
	  await clearTotal(user.id);

	  const embed = new EmbedBuilder()
		.setColor(0xff9900)
		.setTitle("🧹 系統操作通知")
		.setAuthor({
		  name: `${user.username} 累積已清除`
		})
		.setThumbnail(user.displayAvatarURL())
		.addFields(
		  { name: "📈 累積點數", value: "已重置為 0" }
		)
		.setFooter({
		  text: `操作人：${interaction.user.displayName ?? interaction.user.username}`,
		  iconURL: interaction.user.displayAvatarURL()
		})
		.setTimestamp();

	  return interaction.reply({
		embeds: [embed]
	  });
	}

  } catch (err) {
    return interaction.reply({
      content: `❌ ${err.message}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
