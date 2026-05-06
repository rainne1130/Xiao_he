const { 
  Client,ActionRowBuilder,ButtonBuilder,ButtonStyle,GatewayIntentBits,
  EmbedBuilder,REST,Routes,SlashCommandBuilder,ModalBuilder,
  TextInputBuilder,TextInputStyle,
  ChannelType,PermissionFlagsBits,
} = require("discord.js");

const admin = require("firebase-admin");

// ===== 設定 =====
const SERVICE_ROLE_ID = "1490342166910996510";
const GUILD_ID = "1488912636040052869";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== Firebase =====
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nai-working-money-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();

// ===== 指令註冊 =====
async function registerCommands(client) {
  const commands = [

    new SlashCommandBuilder()
	  .setName("addpoint")
	  .setNameLocalizations({
		"zh-TW": "儲值點數"
	  })
	  .setDescription("Add points to a user")
	  .setDescriptionLocalizations({
		"zh-TW": "💰 為指定玩家增加點數"
	  })
	  .addUserOption(o =>
		o.setName("user")
		 .setNameLocalizations({
		   "zh-TW": "選擇闆闆"
		 })
		 .setDescription("Target user")
		 .setDescriptionLocalizations({
		   "zh-TW": "👤 選擇要儲值的闆闆"
		 })
		 .setRequired(true)
	  )
	  .addIntegerOption(o =>
		o.setName("amount")
		 .setNameLocalizations({
		   "zh-TW": "增加點數"
		 })
		 .setDescription("Amount of points")
		 .setDescriptionLocalizations({
		   "zh-TW": "💵 輸入要增加的點數"
		 })
		 .setMinValue(1)
		 .setRequired(true)
	  ),

    new SlashCommandBuilder()
	  .setName("removepoint")
	  .setNameLocalizations({
		"zh-TW": "扣除點數"
	  })
	  .setDescription("Remove points from a user")
	  .setDescriptionLocalizations({
		"zh-TW": "💸 扣除指定闆闆的點數"
	  })
	  .addUserOption(o =>
		o.setName("user")
		 .setNameLocalizations({
		   "zh-TW": "選擇闆闆"
		 })
		 .setDescription("Target user")
		 .setDescriptionLocalizations({
		   "zh-TW": "👤 選擇要扣款的闆闆"
		 })
		 .setRequired(true)
	  )
	  .addIntegerOption(o =>
		o.setName("amount")
		 .setNameLocalizations({
		   "zh-TW": "扣除點數"
		 })
		 .setDescription("Amount to remove")
		 .setDescriptionLocalizations({
		   "zh-TW": "💵 輸入要扣除的點數"
		 })
		 .setMinValue(1)
		 .setMaxValue(1000000)
		 .setRequired(true)
	  ),

    new SlashCommandBuilder()
	  .setName("point")
	  .setNameLocalizations({
		"zh-TW": "查詢點數餘額"
	  })
	  .setDescription("Check your balance")
	  .setDescriptionLocalizations({
		"zh-TW": "📊 查詢自己的點數餘額"
	  })
	  .addUserOption(o =>
		o.setName("user")
		 .setNameLocalizations({
		   "zh-TW": "闆闆"
		 })
		 .setDescription("Target user (self only)")
		 .setDescriptionLocalizations({
		   "zh-TW": "👤 選擇查詢對象"
		 })
		 .setRequired(true)
	  ),

    new SlashCommandBuilder()
	  .setName("totalpoint")
	  .setNameLocalizations({
		"zh-TW": "查詢總儲值金額"
	  })
	  .setDescription("Check total points")
	  .setDescriptionLocalizations({
		"zh-TW": "📈 查詢自己的累積點數"
	  }),

    new SlashCommandBuilder()
	  .setName("cleartotal")
	  .setNameLocalizations({
		"zh-TW": "清除總儲值金額"
	  })
	  .setDescription("Reset user's total points")
	  .setDescriptionLocalizations({
		"zh-TW": "🧹 清除指定闆闆的累積點數"
	  })
	  .addUserOption(o =>
		o.setName("user")
		 .setNameLocalizations({
		   "zh-TW": "選擇闆闆"
		 })
		 .setDescription("Target user")
		 .setDescriptionLocalizations({
		   "zh-TW": "👤 選擇要清除的闆闆"
		 })
		 .setRequired(true)
	  ),
	  
	new SlashCommandBuilder()
	  .setName("top")
	  .setNameLocalizations({
		"zh-TW": "累積點數排行"
	  })
	  .setDescription("View top total points ranking")
	  .setDescriptionLocalizations({
		"zh-TW": "🏆 查看累積點數前十排行榜"
	  }),
	  
	new SlashCommandBuilder()
	  .setName("menu")
	  .setNameLocalizations({
		"zh-TW": "下單面板"
	  })
	  .setDescription("Open order panel")
	  .setDescriptionLocalizations({
		"zh-TW": "🎀 開啟下單面板"
	  })

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

const fs = require("fs");
const path = require("path");

async function generateTranscript(channel) {
  let messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({
      limit: 100,
      before: lastId
    });

    if (fetched.size === 0) break;

    messages = messages.concat(Array.from(fetched.values()));
    lastId = fetched.last().id;
  }

  messages.reverse();

  let html = `
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Transcript</title>
  </head>
  <body style="font-family: Arial; background:#2b2d31; color:white;">
    <h2>📜 ${channel.name}</h2>
    <hr/>
  `;

  for (const msg of messages) {
    html += `
      <div style="margin-bottom:10px;">
        <b>${msg.author.username}</b>：
        ${msg.content || "[Embed/Attachment]"}
        <br/>
        <small>${new Date(msg.createdTimestamp).toLocaleString()}</small>
      </div>
    `;
  }

  html += `</body></html>`;

  const filePath = path.join(__dirname, `transcript-${channel.id}.html`);
  fs.writeFileSync(filePath, html);

  return filePath;
}

// ===== 上線 =====
client.once("ready", async () => {
  console.log(`Bot 上線: ${client.user.tag}`);

  //await registerCommands(client); // 第一次開著
});

// ===== 指令處理 =====
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {

		const cmd = interaction.commandName;
		const user = interaction.options.getUser("user");

		// 權限
		if (["addpoint", "removepoint", "cleartotal", "top"].includes(cmd)) {
		  if (!hasPermission(interaction.member)) {
			return interaction.reply({
			  content: "❌ 您沒有權限使用此功能",
			  ephemeral: true
			});
		  }
		}

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

			  // ❌ 禁止查別人
			  if (user.id !== interaction.user.id) {
				return interaction.reply({
				  content: "❌ 只能查詢自己的點數",
				  ephemeral: true
				});
			  }

			  const data = await getUser(user.id);

			  const embed = new EmbedBuilder()
				.setColor(0x3399ff)
				.setTitle("📊 點數查詢")
				.setAuthor({
				  name: `${user.username} 點數資訊`
				})
				.setThumbnail(user.displayAvatarURL())
				.addFields(
				  { name: "💰 目前餘額", value: `${data.balance.toLocaleString()}` }
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

			  const user = interaction.user;

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
				embeds: [embed],
				ephemeral: true
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
				embeds: [embed],
				ephemeral: true
			  });
			}
			
			if (cmd === "top") {

			  const ref = db.ref("users");
			  const snap = await ref.once("value");
			  const data = snap.val() || {};

			  const list = Object.entries(data)
				.map(([id, v]) => ({
				  id,
				  total: v.total || 0
				}))
				.filter(v => v.total > 0);

			  list.sort((a, b) => b.total - a.total);

			  const top10 = list.slice(0, 10);

			  if (top10.length === 0) {
				return interaction.reply({
				  content: "📭 目前沒有任何累積資料",
				  ephemeral: true
				});
			  }

			  const lines = await Promise.all(
				top10.map(async (u, i) => {
				  let name = `未知玩家`;

				  try {
					const member = await interaction.guild.members.fetch(u.id);
					name = member.displayName;
				  } catch {}

				  return `**${i + 1}.** ${name} ｜ ${u.total.toLocaleString()}`;
				})
			  );

			  const embed = new EmbedBuilder()
				.setColor(0xFFD700)
				.setTitle("🏆 累積點數排行 TOP 10")
				.setDescription(lines.join("\n"))
				.setTimestamp();

			  return interaction.reply({
				embeds: [embed],
				ephemeral: true
			  });
			}
			
			if (cmd === "menu") {

			  const embed = new EmbedBuilder()
				.setColor(0x3399ff) // 藍色條
				.setDescription(
			`🎀✨【下單區｜開始你的專屬時光】✨🎀
			
			☃︎歡迎來到奈奈的下單區(｡•ᴗ•｡)♡
			想找人陪你玩、聊天或放鬆一下嗎？
			點擊下方按鈕，就可以開始你的專屬時光啦❄︎`
				);

			  const row1 = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("order_game")
				.setLabel("🎮 遊戲訂單")
				.setStyle(ButtonStyle.Secondary),

			  new ButtonBuilder()
				.setCustomId("order_voice")
				.setLabel("🎧 語音訂單")
				.setStyle(ButtonStyle.Secondary),
				
			  new ButtonBuilder()
				.setCustomId("note")
				.setLabel("📌 便利貼")
				.setStyle(ButtonStyle.Secondary)
			);

			const row2 = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("order_boost")
				.setLabel("⚔️ 代打訂單")
				.setStyle(ButtonStyle.Secondary),

			  new ButtonBuilder()
				.setCustomId("order_gift")
				.setLabel("🎁 贈送禮物")
				.setStyle(ButtonStyle.Secondary)
			);

			  return interaction.reply({
				embeds: [embed],
				components: [row1, row2]
			  });
			}
		} catch (err) {
			  console.error(err);

			  if (interaction.deferred || interaction.replied) {
				return interaction.editReply({
				  content: `❌ ${err.message}`
				});
			  } else {
				return interaction.reply({
				  content: `❌ ${err.message}`,
				  ephemeral: true
				});
			  }
			}
    }

// ===== 按鈕點擊 =====
	if (interaction.isButton()) {

		if (interaction.customId === "order_game") {

		const modal = new ModalBuilder()
		.setCustomId("modal_game_order")
		.setTitle("🎮 遊戲訂單");

		const input1 = new TextInputBuilder()
		.setCustomId("companion")
		.setLabel("請選擇指定的陪陪")
		.setStyle(TextInputStyle.Short)
		.setPlaceholder("不指定 or 奈奈")
		.setRequired(true);

		const input2 = new TextInputBuilder()
		.setCustomId("game")
		.setLabel("下單的遊戲名稱")
		.setStyle(TextInputStyle.Short)
		.setPlaceholder("特戰英豪")
		.setRequired(true);

		const input3 = new TextInputBuilder()
		.setCustomId("type")
		.setLabel("下單類型")
		.setStyle(TextInputStyle.Short)
		.setPlaceholder("娛樂／技術／大神")
		.setRequired(true);

		const input4 = new TextInputBuilder()
		.setCustomId("time")
		.setLabel("下單時間")
		.setStyle(TextInputStyle.Short)
		.setPlaceholder("1/1 13:00（非必填）")
		.setRequired(false);

		modal.addComponents(
		new ActionRowBuilder().addComponents(input1),
		new ActionRowBuilder().addComponents(input2),
		new ActionRowBuilder().addComponents(input3),
		new ActionRowBuilder().addComponents(input4)
		);

		return interaction.showModal(modal);
		}
		
		if (interaction.customId === "order_voice") {

		  const modal = new ModalBuilder()
			.setCustomId("modal_voice_order")
			.setTitle("🎧 語音訂單");

		  const input1 = new TextInputBuilder()
			.setCustomId("companion")
			.setLabel("請選擇指定的陪陪")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("不指定 or 奈奈")
			.setRequired(true);

		  const input2 = new TextInputBuilder()
			.setCustomId("type")
			.setLabel("下單類型")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("唱歌－命運")
			.setRequired(true);

		  const input3 = new TextInputBuilder()
			.setCustomId("time")
			.setLabel("下單時間")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("1/1 13:00（非必填）")
			.setRequired(false);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2),
			new ActionRowBuilder().addComponents(input3)
		  );

		  return interaction.showModal(modal);
		}
		
		if (interaction.customId === "order_boost") {

		  const modal = new ModalBuilder()
			.setCustomId("modal_boost_order")
			.setTitle("⚔️ 代打訂單");

		  const input1 = new TextInputBuilder()
			.setCustomId("rank")
			.setLabel("段位需求")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("金3-白1")
			.setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1)
		  );

		  return interaction.showModal(modal);
		}
		
		if (interaction.customId === "create_voice") {

		  if (!interaction.member.roles.cache.has(SERVICE_ROLE_ID)) {
			return interaction.reply({
			  content: "❌ 僅限客服可操作",
			  ephemeral: true
			});
		  }

		  const textChannel = interaction.channel;

		  try {
			let ownerId = null;

			const msgs = await textChannel.messages.fetch({ limit: 10 });

			const embedMsg = msgs.find(m =>
			  m.embeds?.[0]?.description?.includes("<@")
			);

			if (embedMsg) {
			  const match = embedMsg.embeds[0].description.match(/<@(\d+)>/);
			  if (match) ownerId = match[1];
			}

			const member = await interaction.guild.members.fetch(ownerId || interaction.user.id);

			const safeName = member.user.username.replace(/\s+/g, "");
			const voiceName = `語音_${safeName}`;

			// ===== ❗防重複（關鍵）=====
			const channels = await interaction.guild.channels.fetch();

			const existing = channels.find(c =>
			  c.type === ChannelType.GuildVoice &&
			  c.name === voiceName &&
			  c.parentId === "1493237762168721458"
			);

			if (existing) {
			  return interaction.reply({
				content: `❌ 語音頻道已存在：${existing}`,
				ephemeral: true
			  });
			}

			// ===== 建立語音 =====
			const voiceChannel = await interaction.guild.channels.create({
			  name: voiceName,
			  type: ChannelType.GuildVoice,
			  parent: "1493237762168721458",
			  permissionOverwrites: [
				{
				  id: interaction.guild.roles.everyone.id,
				  deny: [PermissionFlagsBits.ViewChannel]
				},
				{
				  id: SERVICE_ROLE_ID,
				  allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.Connect
				  ]
				},
				{
				  id: member.id,
				  allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.Connect
				  ]
				}
			  ]
			});

			return interaction.reply({
			  content: `✅ 已建立語音頻道：${voiceChannel}`,
			  ephemeral: true
			});

		  } catch (err) {
			console.error(err);

			return interaction.reply({
			  content: "❌ 建立語音失敗",
			  ephemeral: true
			});
		  }
		}
		
		if (interaction.customId === "rate_feedback") {

		  // ===== 權限 =====
		  if (!interaction.member.roles.cache.has(SERVICE_ROLE_ID)) {
			return interaction.reply({
			  content: "❌ 僅限客服可操作",
			  ephemeral: true
			});
		  }

		  const textChannel = interaction.channel;

		  // ===== ❗防重複評價 =====
		  const ratedRef = db.ref(`ratings/${textChannel.id}/${interaction.user.id}`);
		  const snap = await ratedRef.once("value");

		  if (snap.exists()) {
			return interaction.reply({
			  content: "❌ 此工單你已經評價過了",
			  ephemeral: true
			});
		  }

		  // ===== 評分按鈕 =====
		  const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("rate_1").setLabel("⭐").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("rate_2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("rate_3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("rate_4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("rate_5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Success)
		  );

		  return interaction.reply({
			content: "✨請為這次訂單做出評價✨",
			components: [row]
		  });
		}
		
		if (interaction.customId.startsWith("rate_")) {

		  const stars = interaction.customId.split("_")[1];

		  const modal = new ModalBuilder()
			.setCustomId(`modal_rating_${stars}`)
			.setTitle("📊 訂單評價");

		  const input1 = new TextInputBuilder()
			.setCustomId("companion")
			.setLabel("陪陪名稱")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("奈奈")
			.setRequired(true);

		  const input2 = new TextInputBuilder()
			.setCustomId("feedback")
			.setLabel("評價內容")
			.setStyle(TextInputStyle.Paragraph)
			.setPlaceholder("請輸入您的回饋")
			.setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2)
		  );

		  return interaction.showModal(modal);
		}
		
		if (interaction.customId === "order_gift") {

		  const modal = new ModalBuilder()
			.setCustomId("modal_gift_order")
			.setTitle("🎁 贈送禮物");

		  const input1 = new TextInputBuilder()
			.setCustomId("companion")
			.setLabel("請提供您想要送禮物的陪陪")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("奈奈")
			.setRequired(true);

		  const input2 = new TextInputBuilder()
			.setCustomId("gift")
			.setLabel("請輸入您想要贈送的禮物名稱")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("布丁")
			.setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2)
		  );

		  return interaction.showModal(modal);
		}
		
		if (interaction.customId === "note") {

		  const modal = new ModalBuilder()
			.setCustomId("modal_note")
			.setTitle("📌 便利貼");

		  const input1 = new TextInputBuilder()
			.setCustomId("amount")
			.setLabel("金額")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("最低金額為50元")
			.setRequired(true);

		  const input2 = new TextInputBuilder()
			.setCustomId("note")
			.setLabel("備註")
			.setStyle(TextInputStyle.Paragraph)
			.setPlaceholder("幫我選午餐吃甚麼")
			.setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2)
		  );

		  return interaction.showModal(modal);
		}
		
		if (interaction.customId === "close_ticket") {

		  if (!interaction.member.roles.cache.has(SERVICE_ROLE_ID)) {
			return interaction.reply({
			  content: "❌ 僅限客服可操作",
			  ephemeral: true
			});
		  }

		  await interaction.reply({
			content: "🗑️ 工單關閉中...",
			ephemeral: true
		  });

		  const textChannel = interaction.channel;

		  (async () => {

			// ===== 刪語音 =====
			try {
			  let ownerId = null;

			  const msgs = await textChannel.messages.fetch({ limit: 10 });
			  const embedMsg = msgs.find(m => m.embeds?.[0]?.description?.includes("下單闆闆"));

			  if (embedMsg) {
				const match = embedMsg.embeds[0].description.match(/<@(\d+)>/);
				if (match) ownerId = match[1];
			  }

			  if (ownerId) {
				const member = await interaction.guild.members.fetch(ownerId);
				const safeName = member.user.username.replace(/\s+/g, "");
				const voiceName = `語音_${safeName}`;

				const channels = await interaction.guild.channels.fetch();

				const voiceChannel = channels.find(c =>
				  c.type === ChannelType.GuildVoice &&
				  c.name === voiceName &&
				  c.parentId === "1493237762168721458"
				);

				if (voiceChannel) {
				  await voiceChannel.delete().catch(() => {});
				}
			  }

			} catch (err) {
			  console.error("刪語音錯誤:", err);
			}

			// ===== 紀錄 =====
			try {
			  const filePath = await generateTranscript(textChannel);

			  const isBoostOrder = textChannel.name.includes("代打訂單");

			  const targetChannelId = isBoostOrder
				? "1491426891754766466"
				: "1490375081245933648";

			  const logChannel = await interaction.guild.channels.fetch(targetChannelId);

			  await logChannel.send({
				content: `📜 工單紀錄：${textChannel.name}`,
				files: [filePath]
			  });

			  setTimeout(() => {
				fs.unlink(filePath, (err) => {
				  if (err) console.error("刪檔失敗:", err);
				});
			  }, 5000);

			} catch (err) {
			  console.error("紀錄錯誤:", err);
			}

			// ===== 刪工單 =====
			setTimeout(() => {
			  textChannel.delete().catch(() => {});
			  console.log("工單已刪除:", textChannel.name);
			}, 10000);

		  })();
		}
	}
		
	// ===== Modal 提交 =====
	if (interaction.isModalSubmit()) {

		if (interaction.customId === "modal_game_order") {

			await interaction.deferReply({ ephemeral: true });

			const companion = interaction.fields.getTextInputValue("companion");
			const game = interaction.fields.getTextInputValue("game");
			const type = interaction.fields.getTextInputValue("type");
			const time = interaction.fields.getTextInputValue("time") || "未填寫";

			const counterRef = db.ref("counters/gameOrder");
			const snap = await counterRef.once("value");
			let num = (snap.val() || 0) + 1;
			await counterRef.set(num);

			const code = String(num).padStart(4, "0");

			const channel = await interaction.guild.channels.create({
			  name: `遊戲訂單_${code}`,
			  type: ChannelType.GuildText,
			  parent: "1491428115258282205",
			  permissionOverwrites: [
				// ❌ 預設所有人看不到
				{
				  id: interaction.guild.roles.everyone.id,
				  deny: [PermissionFlagsBits.ViewChannel]
				},

				// ✅ 服務人員角色
				{
				  id: SERVICE_ROLE_ID,
				  allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages
				  ]
				},

				// ✅ 下單玩家
				{
				  id: interaction.user.id,
				  allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages
				  ]
				},

				// 🔥 Bot 自己
				{
				  id: interaction.guild.members.me.id,
				  allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages
				  ]
				}
			  ]
			});

			const embed = new EmbedBuilder()
			  .setColor(0x3399ff)
			  .setTitle("✨叮咚!有新的遊戲訂單✨")
			  .setDescription(
		`👤 下單闆闆：<@${interaction.user.id}>
		🎮 遊戲名稱：${game}
		📌 遊戲類型：${type}
		👥 指定陪陪：${companion}
		⏰ 預約時間：${time}`
			  )
			  .setTimestamp();

			const row = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("create_voice")
				.setLabel("🔊 創建語音頻道")
				.setStyle(ButtonStyle.Secondary),

			  new ButtonBuilder()
				.setCustomId("rate_feedback")
				.setLabel("⭐ 評價回饋")
				.setStyle(ButtonStyle.Success),

			  new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel("🗑️ 結束工單")
				.setStyle(ButtonStyle.Danger)
			);

			await channel.send({
			  content: `<@&${SERVICE_ROLE_ID}>`,
			  embeds: [embed],
			  components: [row]
			});

			return interaction.editReply({
			  content: `✅ 訂單已建立：${channel}`
			});
		}
		
		if (interaction.customId === "modal_voice_order") {

		  await interaction.deferReply({ ephemeral: true });

		  const companion = interaction.fields.getTextInputValue("companion");
		  const type = interaction.fields.getTextInputValue("type");
		  const time = interaction.fields.getTextInputValue("time") || "未填寫";

		  const counterRef = db.ref("counters/voiceOrder");
		  const snap = await counterRef.once("value");
		  let num = (snap.val() || 0) + 1;
		  await counterRef.set(num);

		  const code = String(num).padStart(4, "0");

		  const channel = await interaction.guild.channels.create({
			name: `語音訂單_${code}`,
			type: ChannelType.GuildText,
			parent: "1491428115258282205",
			permissionOverwrites: [
			  {
				id: interaction.guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel]
			  },
			  {
				id: SERVICE_ROLE_ID,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			  },
			  {
				id: interaction.user.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			  },
			  {
				id: interaction.guild.members.me.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
			  }
			]
		  });

		  // ===== 通知 =====
		  const embed = new EmbedBuilder()
			.setColor(0x9966ff)
			.setTitle("✨叮咚!有新的語音訂單✨")
			.setDescription(
		`👤 下單闆闆：<@${interaction.user.id}>
		📌 下單類型：${type}
		👥 指定陪陪：${companion}
		⏰ 預約時間：${time}`
			)
			.setTimestamp();

		  const row = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("create_voice")
				.setLabel("🔊 創建語音頻道")
				.setStyle(ButtonStyle.Secondary),

			  new ButtonBuilder()
				.setCustomId("rate_feedback")
				.setLabel("⭐ 評價回饋")
				.setStyle(ButtonStyle.Success),

			  new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel("🗑️ 結束工單")
				.setStyle(ButtonStyle.Danger)
			);

		  await channel.send({
			content: `<@&${SERVICE_ROLE_ID}>`,
			embeds: [embed],
			components: [row]
		  });

		  return interaction.editReply({
			content: `✅ 語音訂單已建立：${channel}`
		  });
		}
		
		if (interaction.customId === "modal_boost_order") {

		  await interaction.deferReply({ ephemeral: true });

		  const rank = interaction.fields.getTextInputValue("rank");

		  // ===== 編號 =====
		  const counterRef = db.ref("counters/boostOrder");
		  const snap = await counterRef.once("value");
		  let num = (snap.val() || 0) + 1;
		  await counterRef.set(num);

		  const code = String(num).padStart(4, "0");

		  // ===== 建頻道 =====
		  const channel = await interaction.guild.channels.create({
			name: `代打訂單_${code}`,
			type: ChannelType.GuildText,
			parent: "1491428115258282205",
			permissionOverwrites: [
			  {
				id: interaction.guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel]
			  },
			  {
				id: SERVICE_ROLE_ID,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.user.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.guild.members.me.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  }
			]
		  });

		  // ===== 通知 =====
		  const embed = new EmbedBuilder()
			.setColor(0xff9900)
			.setTitle("✨叮咚!有新的代打訂單✨")
			.setDescription(
		`👤 下單闆闆：<@${interaction.user.id}>
		🏆 段位需求：${rank}`
			)
			.setTimestamp();

		  const row = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("create_voice")
				.setLabel("🔊 創建語音頻道")
				.setStyle(ButtonStyle.Secondary),

			  new ButtonBuilder()
				.setCustomId("rate_feedback")
				.setLabel("⭐ 評價回饋")
				.setStyle(ButtonStyle.Success),

			  new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel("🗑️ 結束工單")
				.setStyle(ButtonStyle.Danger)
			);

		  await channel.send({
			content: `<@&${SERVICE_ROLE_ID}>`,
			embeds: [embed],
			components: [row]
		  });

		  return interaction.editReply({
			content: `✅ 代打訂單已建立：${channel}`
		  });
		}
		
		if (interaction.customId.startsWith("modal_rating_")) {

		  await interaction.deferReply({ ephemeral: true });

		  try {

			const textChannel = interaction.channel;
			const ratedRef = db.ref(`ratings/${textChannel.id}/${interaction.user.id}`);
			const snap = await ratedRef.once("value");

			if (snap.exists()) {
			  return interaction.editReply({
				content: "❌ 你已經評價過此工單"
			  });
			}

			const stars = interaction.customId.split("_")[2];
			const companion = interaction.fields.getTextInputValue("companion");
			const feedback = interaction.fields.getTextInputValue("feedback");

			// ===== 取得工單創建人 =====
			let ownerId = interaction.user.id;

			const msgs = await textChannel.messages.fetch({ limit: 10 });

			const embedMsg = msgs.find(m =>
			  m.embeds?.[0]?.description?.includes("<@")
			);

			if (embedMsg) {
			  const match = embedMsg.embeds[0].description.match(/<@(\d+)>/);
			  if (match) ownerId = match[1];
			}

			const member = await interaction.guild.members.fetch(ownerId);

			// ===== 評價 UI =====
			const embed = new EmbedBuilder()
			  .setColor(0xFFD700)
			  .setAuthor({
				name: `⭐ ${stars} 星評價`,
			  })
			  .setThumbnail(member.user.displayAvatarURL())
			  .addFields(
				{ name: "👤 陪陪名稱", value: companion },
				{ name: "⭐ 闆闆評分", value: `${"⭐".repeat(stars)}` },
				{ name: "📝 訂單回饋", value: feedback }
			  )
			  .setFooter({
				text: `評價人：${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL()
			  })
			  .setTimestamp();

			const reviewChannel = await interaction.guild.channels.fetch("1489186836579356702");

			await reviewChannel.send({
			  embeds: [embed]
			});

			await ratedRef.set(true);

			return interaction.editReply({
			  content: "✅ 評價已送出，感謝您的回饋！"
			});

		  } catch (err) {
			console.error(err);

			return interaction.editReply({
			  content: `❌ 發生錯誤：${err.message}`
			});
		  }
		}
		
		if (interaction.customId === "modal_gift_order") {

		  await interaction.deferReply({ ephemeral: true });

		  const companion = interaction.fields.getTextInputValue("companion");
		  const gift = interaction.fields.getTextInputValue("gift");

		  // ===== 編號 =====
		  const counterRef = db.ref("counters/giftOrder");
		  const snap = await counterRef.once("value");
		  let num = (snap.val() || 0) + 1;
		  await counterRef.set(num);

		  const code = String(num).padStart(4, "0");

		  // ===== 建立頻道 =====
		  const channel = await interaction.guild.channels.create({
			name: `禮物訂單_${code}`,
			type: ChannelType.GuildText,
			parent: "1491428115258282205",
			permissionOverwrites: [
			  {
				id: interaction.guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel]
			  },
			  {
				id: SERVICE_ROLE_ID,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.user.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.guild.members.me.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  }
			]
		  });

		  // ===== UI =====
		  const embed = new EmbedBuilder()
			.setColor(0xFFD700) // 金色
			.setTitle("🚀闆闆來送禮物囉🚀")
			.setThumbnail(interaction.user.displayAvatarURL()) // 右側頭像
			.addFields(
			  { name: "👤 闆闆名稱", value: `<@${interaction.user.id}>` },
			  { name: "🎀 陪陪名稱", value: companion },
			  { name: "🎁 禮物名稱", value: gift }
			)
			.setTimestamp();

		  const row = new ActionRowBuilder().addComponents(
			  new ButtonBuilder()
				.setCustomId("rate_feedback")
				.setLabel("⭐ 評價回饋")
				.setStyle(ButtonStyle.Success),

			  new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel("🗑️ 結束工單")
				.setStyle(ButtonStyle.Danger)
			);

		  // ===== 發送通知 =====
		  await channel.send({
			content: `<@&${SERVICE_ROLE_ID}> <@${interaction.user.id}>`,
			embeds: [embed],
			components: [row]
		  });

		  return interaction.editReply({
			content: `✅ 禮物訂單已建立：${channel}`
		  });
		}
		
		if (interaction.customId === "modal_note") {

		  await interaction.deferReply({ ephemeral: true });

		  // ===== 取得資料 =====
		  const amountRaw = interaction.fields.getTextInputValue("amount");
		  const note = interaction.fields.getTextInputValue("note");

		  const amount = Number(amountRaw);

		  // ===== 金額檢查 =====
		  if (isNaN(amount) || amount < 50) {
			return interaction.editReply({
			  content: "❌ 金額最低為 50 元，請重新輸入"
			});
		  }

		  // ===== 工單名稱（安全處理）=====
		  const username = interaction.member.displayName
		  .replace(/\s+/g, "")
		  .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, "");

		  const channel = await interaction.guild.channels.create({
			name: `便利貼訂單_${username}`,
			type: ChannelType.GuildText,
			parent: "1491428115258282205",
			permissionOverwrites: [
			  {
				id: interaction.guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel]
			  },
			  {
				id: SERVICE_ROLE_ID,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.user.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  },
			  {
				id: interaction.guild.members.me.id,
				allow: [
				  PermissionFlagsBits.ViewChannel,
				  PermissionFlagsBits.SendMessages
				]
			  }
			]
		  });

		  // ===== UI =====
		  const embed = new EmbedBuilder()
			.setColor(0x00cc99)
			.setTitle("📌 便利貼通知")
			.setThumbnail(interaction.user.displayAvatarURL())
			.addFields(
			  { name: "👤 闆闆名稱", value: `<@${interaction.user.id}>` },
			  { name: "💰 此單金額", value: `${amount.toLocaleString()} 元` },
			  { name: "📝 闆闆備註", value: note }
			)
			.setTimestamp();

		  const row = new ActionRowBuilder().addComponents(

			  new ButtonBuilder()
				.setCustomId("rate_feedback")
				.setLabel("⭐ 評價回饋")
				.setStyle(ButtonStyle.Success),

			  new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel("🗑️ 結束工單")
				.setStyle(ButtonStyle.Danger)

			);

		  // ===== 發送 =====
		  await channel.send({
			content: `<@&${SERVICE_ROLE_ID}> <@${interaction.user.id}>`,
			embeds: [embed],
			components: [row]
		  });

		  return interaction.editReply({
			content: `✅ 便利貼已建立：${channel}`
		  });
		}
	}
});
client.login(process.env.TOKEN);
