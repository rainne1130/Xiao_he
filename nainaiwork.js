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
const REVIEW_ROLE_ID = "1490593115466240000";

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
		"zh-TW": "儲值奈奈幣"
	  })
	  .setDescription("Add points to a user")
	  .setDescriptionLocalizations({
		"zh-TW": "💰 為指定闆闆增加奈奈幣"
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
		   "zh-TW": "增加奈奈幣"
		 })
		 .setDescription("Amount of points")
		 .setDescriptionLocalizations({
		   "zh-TW": "💵 輸入要增加的奈奈幣"
		 })
		 .setMinValue(1)
		 .setRequired(true)
	  ),

    new SlashCommandBuilder()
	  .setName("removepoint")
	  .setNameLocalizations({
		"zh-TW": "扣除奈奈幣"
	  })
	  .setDescription("Remove points from a user")
	  .setDescriptionLocalizations({
		"zh-TW": "💸 扣除指定闆闆的奈奈幣"
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
		   "zh-TW": "扣除奈奈幣"
		 })
		 .setDescription("Amount to remove")
		 .setDescriptionLocalizations({
		   "zh-TW": "💵 輸入要扣除的奈奈幣"
		 })
		 .setMinValue(1)
		 .setMaxValue(1000000)
		 .setRequired(true)
	  ),

    new SlashCommandBuilder()
	  .setName("point")
	  .setNameLocalizations({
		"zh-TW": "查詢奈奈幣餘額"
	  })
	  .setDescription("Check your balance")
	  .setDescriptionLocalizations({
		"zh-TW": "📊 查詢自己的奈奈幣餘額"
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
		"zh-TW": "📈 查詢累積奈奈幣"
	  })
	  .addUserOption(o =>
		o.setName("user")
		 .setNameLocalizations({
		   "zh-TW": "闆闆"
		 })
		 .setDescription("Target user")
		 .setDescriptionLocalizations({
		   "zh-TW": "👤 選擇查詢對象"
		 })
		 .setRequired(false)
	  ),

    new SlashCommandBuilder()
	  .setName("cleartotal")
	  .setNameLocalizations({
		"zh-TW": "清除總儲值金額"
	  })
	  .setDescription("Reset user's total points")
	  .setDescriptionLocalizations({
		"zh-TW": "🧹 清除指定闆闆的累積奈奈幣"
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
		"zh-TW": "累積奈奈幣排行"
	  })
	  .setDescription("View top total points ranking")
	  .setDescriptionLocalizations({
		"zh-TW": "🏆 查看累積奈奈幣前十排行榜"
	  }),
	  
	new SlashCommandBuilder()
	  .setName("menu")
	  .setNameLocalizations({
		"zh-TW": "下單面板"
	  })
	  .setDescription("Open order panel")
	  .setDescriptionLocalizations({
		"zh-TW": "🎀 開啟下單面板"
	  }),
	  
	new SlashCommandBuilder()
	  .setName("gift")
	  .setNameLocalizations({
		"zh-TW": "贈送禮物"
	  })
	  .setDescription("Send gift")
	  .setDescriptionLocalizations({
		"zh-TW": "🎁 發送專屬禮物給陪陪"
	  })

	  .addUserOption(o =>
		o.setName("sender")
		  .setNameLocalizations({
			"zh-TW": "送禮闆闆"
		  })
		  .setDescription("Gift sender")
		  .setDescriptionLocalizations({
			"zh-TW": "👤 選擇送禮的闆闆"
		  })
		  .setRequired(true)
	  )

	  .addStringOption(o =>
		o.setName("targets")
		  .setNameLocalizations({
			"zh-TW": "陪陪"
		  })
		  .setDescription("Mention companions")
		  .setDescriptionLocalizations({
			"zh-TW": "💝 @ 想送禮的陪陪（可多人）"
		  })
		  .setRequired(true)
	  )

	  .addStringOption(o =>
		o.setName("gift")
		  .setNameLocalizations({
			"zh-TW": "禮物"
		  })
		  .setDescription("Select gift")
		  .setDescriptionLocalizations({
			"zh-TW": "🎀 選擇想贈送的禮物"
		  })
		  .setRequired(true)
		  .addChoices(
			{ name: "🍮 布丁", value: "布丁" },
			{ name: "☁️ 棉花糖", value: "棉花糖" },
			{ name: "✨ 仙女棒", value: "仙女棒" },
			{ name: "🍗 鹹酥雞", value: "鹹酥雞" },
			{ name: "✔️ 好寶寶印章", value: "好寶寶印章" },
			{ name: "🀄 麻將發大財", value: "麻將發大財" },
			{ name: "💍 鑽戒", value: "鑽戒" },
			{ name: "🏎️ 跑車", value: "跑車" },
			{ name: "🚀 火箭", value: "火箭" },
			{ name: "🏰 城堡", value: "城堡" }
		  )
	  )

		.addStringOption(o =>
		  o.setName("anonymous")
			.setNameLocalizations({
			  "zh-TW": "匿名贈送"
			})
			.setDescription("Anonymous gift")
			.setDescriptionLocalizations({
			  "zh-TW": "🎭 是否匿名送禮"
			})
			.setRequired(true)
			.addChoices(
			  { name: "是", value: "yes" },
			  { name: "否", value: "no" }
			)
		),
	  
	  new SlashCommandBuilder()
	  .setName("playpay")
	  .setNameLocalizations({
		"zh-TW": "陪玩轉帳"
	  })
	  .setDescription("Play payment")
	  .setDescriptionLocalizations({
		"zh-TW": "💳 發送陪玩轉帳資訊"
	  }),

	new SlashCommandBuilder()
	  .setName("boostpay")
	  .setNameLocalizations({
		"zh-TW": "代打轉帳"
	  })
	  .setDescription("Boost payment")
	  .setDescriptionLocalizations({
		"zh-TW": "🏦 發送代打轉帳資訊"
	  }),

	new SlashCommandBuilder()
	  .setName("jkpay")
	  .setNameLocalizations({
		"zh-TW": "陪玩街口"
	  })
	  .setDescription("JKOPay")
	  .setDescriptionLocalizations({
		"zh-TW": "💰 發送街口付款資訊"
	  }),
	  
	new SlashCommandBuilder()
	  .setName("review")
	  .setNameLocalizations({
		"zh-TW": "評價系統"
	  })
	  .setDescription("Open review system")
	  .setDescriptionLocalizations({
		"zh-TW": "⭐ 開啟評價系統"
	  }),

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

const GIFT_CHANNEL_ID = "1492207255808901331"; //禮物頻道id

const GIFTS = {
  "布丁": {
    image: "https://cdn.discordapp.com/attachments/1492442980320022638/1492442980571807784/103.png?ex=69fc4ed6&is=69fafd56&hm=84e2c0cf46c1148e6af04794377817b8933f6ec75dbb8e493d6a4cac9847e185&",
    text:
`今天的你甜度超標♡
像布丁一樣軟軟嫩嫩又療癒

陪陪再累也要記得微笑哦(๑˃ᴗ˂)ﻭ
闆闆送你一點甜，讓心情也變好`
  },

  "棉花糖": {
    image: "https://cdn.discordapp.com/attachments/1492444674567311491/1492444674835611679/1f62b65266fca8b6.png?ex=69fc506a&is=69fafeea&hm=7c74bcca5a6516bbd1db96f1319fe083a19250b31c0a41dd27be29bdb9f6afdb",
    text:
`今天走一個軟萌路線♡
像棉花糖一樣輕飄飄又可愛讓人忍不住想靠近一點點☁️
闆闆表示：你真的太Qㄌ！`
  },

  "仙女棒": {
    image: "https://cdn.discordapp.com/attachments/1492795335138086963/1492795335418974218/d9cf7bd08fa66d0d.png?ex=69fc457e&is=69faf3fe&hm=237c2c5f899474117b99889d2c2a3fb92cf4223a4da2041b658d519c5f7f9ecf&",
    text:
`閃閃發光的就是你✨
像仙女棒一樣照亮整個夜晚 每一刻都在發光發熱(๑•̀ㅂ•́)و✧
今天也要當最亮的那顆星！`
  },

  "鹹酥雞": {
    image: "https://cdn.discordapp.com/attachments/1493647304849232084/1493647305533030683/598bd4342f6472a6.png?ex=69fc1334&is=69fac1b4&hm=ded0b14abe2b40bb37eb338f7fcb1a565f1b5a905db1fc0805d9aaddcf3b314d&",
    text:
`努力工作也要補充快樂😋
鹹酥雞就是今天的幸福來源
陪玩結束一起吃最對味🍗
老闆懂你，快樂不能少！`
  },

  "好寶寶印章": {
    image: "https://cdn.discordapp.com/attachments/1495751697438478466/1495751698050842655/177.png?ex=69fc7ad2&is=69fb2952&hm=8317f494f539ef8b60a00fe042caed452ac3f57de3d98ea5ab4987bc58eade3a&",
    text:
`今天表現超優秀✔️
乖乖上班還這麼可愛💖
直接蓋一個好寶寶認證章！
老闆：值得被誇獎一整天✨`
  },

  "麻將發大財": {
    image: "https://cdn.discordapp.com/attachments/1495751982642892962/1495751983984935082/189.png?ex=69fc7b16&is=69fb2996&hm=dc9dd460b7adcf05867944a479604ca2e3b63d7808417b37cdd5289755650630&",
    text:
`今天財運直接拉滿💰
不管做什麼都順順順！
陪玩也能一路發發發✨
老闆祝你直接胡一把大的！`
  },

  "鑽戒": {
    image: "https://cdn.discordapp.com/attachments/1497475411771265084/1497475412006277241/197.png?ex=69fc28a7&is=69fad727&hm=bd2585f0a4c574b6955c747675c401eb218016980ca2b9b6aea1e77b6bfb7b93&",
    text:
`今天被寵愛的就是你💖
像鑽戒一樣閃耀又珍貴
每一分努力都值得被看見✨
老闆：你真的很重要！`
  },
  
  "跑車": {
    image: "https://cdn.discordapp.com/attachments/1501718201732698263/1501718203762606180/20fe91246dc790c2.png?ex=69fd1790&is=69fbc610&hm=f6e490538faa378f4fc7912f0e0ef348c84fa6d3d1f20336b4ce43dcfd3538b6&",
    text:
`今天直接帥一波✨
像跑車一樣速度與魅力兼具
魅力值直接飆到最高🏎
老闆：今天你最吸睛！`
  },
  
  "火箭": {
    image: "https://cdn.discordapp.com/attachments/1501718424659693640/1501718425284640819/909801e91e66fc8f.png?ex=69fd17c5&is=69fbc645&hm=8b4c254616783a441713c5d74b8cf383d8a0e3b1351105c1d51a1c0a55061186&",
    text:
`今天狀態直接起飛🚀
一路衝上巔峰停不下來！
努力都會被看見✨
老闆：帶你一起飛更高！`
  },
  
  "城堡": {
    image: "https://cdn.discordapp.com/attachments/1501718646785835088/1501718647184298004/998f3d118ac7121f.png?ex=69fd17fa&is=69fbc67a&hm=bb166a3342eb97322a7c3a9ff2015d4da4bfd48a184b71bdabb91abe4052fe22&",
    text:
`今天你就是小公主/小王子👑
住進夢想中的可愛城堡
被好運跟寵愛包圍💖
老闆：你值得最好的✨`
  }
};

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
		if (["addpoint", "removepoint", "cleartotal", "top", "gift","playpay","boostpay","jkpay"].includes(cmd)) {
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
				.setTitle("💳 奈奈幣異動通知")
				.setAuthor({
				  name: `${user.username} 加值成功`
				})
				.setThumbnail(user.displayAvatarURL())
				.addFields(
				  { name: "💰 加值金額", value: `+${amount.toLocaleString()}`, inline: true },
				  { name: "📊 目前餘額", value: `${newBalance.toLocaleString()}`, inline: true },
				  { name: "📈 累積奈奈幣", value: `${newTotal.toLocaleString()}`, inline: true }
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
				.setTitle("💳 奈奈幣異動通知")
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

			  // ❌ 非客服不能查別人
			  if (
				user.id !== interaction.user.id &&
				!hasPermission(interaction.member)
			  ) {
				return interaction.reply({
				  content: "❌ 只能查詢自己的奈奈幣",
				  ephemeral: true
				});
			  }

			  const data = await getUser(user.id);

			  const embed = new EmbedBuilder()
				.setColor(0x3399ff)
				.setTitle("📊 奈奈幣查詢")
				.setAuthor({
				  name: `${user.username} 奈奈幣資訊`
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

			  const targetUser =
				interaction.options.getUser("user") || interaction.user;

			  // ❌ 非客服不能查別人
			  if (
				targetUser.id !== interaction.user.id &&
				!hasPermission(interaction.member)
			  ) {
				return interaction.reply({
				  content: "❌ 只能查詢自己的累積奈奈幣",
				  ephemeral: true
				});
			  }

			  const data = await getUser(targetUser.id);

			  const embed = new EmbedBuilder()
				.setColor(0x9966ff)
				.setTitle("📈 累積奈奈幣查詢")
				.setAuthor({
				  name: `${targetUser.username} 累積資訊`
				})
				.setThumbnail(targetUser.displayAvatarURL())
				.addFields(
				  { name: "📈 總累積奈奈幣", value: `${data.total.toLocaleString()}` }
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
				  { name: "📈 累積奈奈幣", value: "已重置為 0" }
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
				.setTitle("🏆 累積奈奈幣排行 TOP 10")
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
			
			if (cmd === "gift") {

			  await interaction.deferReply({
				ephemeral: true
			  });

			  const sender = interaction.options.getUser("sender");

			  const targetsInput =
				interaction.options.getString("targets");

			  const anonymous =
				interaction.options.getString("anonymous") === "yes";

			  const mentionMatches =
				targetsInput.match(/<@!?(\d+)>/g);

			  if (!mentionMatches) {
				return interaction.editReply({
				  content: "❌ 請至少 @ 一位陪陪"
				});
			  }

			  const giftName =
				interaction.options.getString("gift");

			  const giftData = GIFTS[giftName];

			  if (!giftData) {
				return interaction.editReply({
				  content: "❌ 找不到禮物資料"
				});
			  }

			  const targetMentions = [];

			  // ===== 平行處理 =====
			  const members = await Promise.all(
				mentionMatches.map(async (mention) => {

				  const id = mention.replace(/\D/g, "");

				  const member = await interaction.guild.members
					.fetch(id)
					.catch(() => null);

				  if (!member) return null;

				  return `<@${id}>`;
				})
			  );

			  for (const m of members) {
				if (m) targetMentions.push(m);
			  }

			  // ===== 顯示名稱 =====
			  const senderDisplay = anonymous
				? "匿名闆闆"
				: `<@${sender.id}>`;

			  // ===== Embed =====
			  const embed = new EmbedBuilder()
				.setColor(0xFFD700)
				.setDescription(
			`🎁 特別感謝 ${senderDisplay} 送給 ${targetMentions.join(" ")} 的 ${giftName} !!!

			─────────────────────

			${giftData.text}`
				)
				.setImage(giftData.image)
				.setTimestamp();

			  // ===== 非匿名才顯示頭像 =====
			  if (!anonymous) {
				embed.setThumbnail(sender.displayAvatarURL());
			  }

			  const channel =
				await interaction.guild.channels.fetch(GIFT_CHANNEL_ID);

			  // ===== 發送 =====
			  await channel.send({
				content: anonymous
				  ? `${targetMentions.join(" ")}`
				  : `${sender} ${targetMentions.join(" ")}`,
				embeds: [embed]
			  });

			  return interaction.editReply({
				content: "✅ 禮物已送出"
			  });
			}
			
			if (cmd === "playpay") {

			  const embed = new EmbedBuilder()
				.setColor(0xFFD700)
				.setDescription(
			`💳 陪玩轉帳資訊

			銀行代碼：053 台中銀行
			帳號：110280040675`
				)
				.setTimestamp();

			  return interaction.reply({
				embeds: [embed]
			  });
			}
			
			if (cmd === "boostpay") {

			  const embed = new EmbedBuilder()
				.setColor(0xFFD700)
				.setDescription(
			`🏦 代打轉帳資訊

			銀行代碼：013 國泰世華
			帳號：699522139860`
				)
				.setTimestamp();

			  return interaction.reply({
				embeds: [embed]
			  });
			}
			
			if (cmd === "jkpay") {

			  const embed = new EmbedBuilder()
				.setColor(0xFFD700)
				.setDescription(
			`💰 陪玩街口付款資訊

			街口帳戶396
			帳號：911279573

			也可以點擊下方連結轉帳給我！

			https://service.jkopay.com/r/transfer?j=Transfer:911279573`
				)
				.setImage("https://cdn.discordapp.com/attachments/1501066167316516915/1501656868357935115/IMG_0737.png?ex=69fcde70&is=69fb8cf0&hm=ba5a1adbbf7d3dcead2645fda0fbe499f13c5e9b4a14a7b3358a774e78def1ab")
				.setTimestamp();

			  return interaction.reply({
				embeds: [embed]
			  });
			}
			
			if (cmd === "review") {

			  // ===== 權限 =====
			  if (!interaction.member.roles.cache.has(REVIEW_ROLE_ID)) {
				return interaction.reply({
				  content: "❌ 您沒有權限使用此功能",
				  ephemeral: true
				});
			  }

			  const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
				  .setCustomId("staff_rate_1")
				  .setLabel("⭐")
				  .setStyle(ButtonStyle.Secondary),

				new ButtonBuilder()
				  .setCustomId("staff_rate_2")
				  .setLabel("⭐⭐")
				  .setStyle(ButtonStyle.Secondary),

				new ButtonBuilder()
				  .setCustomId("staff_rate_3")
				  .setLabel("⭐⭐⭐")
				  .setStyle(ButtonStyle.Secondary),

				new ButtonBuilder()
				  .setCustomId("staff_rate_4")
				  .setLabel("⭐⭐⭐⭐")
				  .setStyle(ButtonStyle.Secondary),

				new ButtonBuilder()
				  .setCustomId("staff_rate_5")
				  .setLabel("⭐⭐⭐⭐⭐")
				  .setStyle(ButtonStyle.Success)
			  );

			  return interaction.reply({
				content: "✨請選擇評價星數✨",
				components: [row]
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
			
		  const input3 = new TextInputBuilder()
			  .setCustomId("anonymous")
			  .setLabel("是否匿名評價？（是/否）")
			  .setStyle(TextInputStyle.Short)
			  .setPlaceholder("是 或 否")
			  .setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2),
			new ActionRowBuilder().addComponents(input3)
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
		  const guild = interaction.guild;

		  // ===== 先做紀錄 =====
		  try {
			const filePath = await generateTranscript(textChannel);

			const isBoostOrder = textChannel.name.includes("代打訂單");

			const targetChannelId = isBoostOrder
			  ? "1491426891754766466"
			  : "1490375081245933648";

			const logChannel = await guild.channels.fetch(targetChannelId);

			await logChannel.send({
			  content: `📜 工單紀錄：${textChannel.name}`,
			  files: [filePath]
			});

			setTimeout(() => {
			  fs.unlink(filePath, (err) => {
				if (err) console.error("刪檔失敗:", err);
			  });
			}, 10000);

		  } catch (err) {
			console.error("紀錄錯誤:", err);
		  }

		  // ===== 延遲 3 分鐘 =====
		  const DELAY = 1000 * 60 * 3;

		  setTimeout(async () => {
			try {

			  // ===== 抓工單創建人 =====
			  let ownerId = null;

			  const msgs = await textChannel.messages.fetch({ limit: 10 });

			  const embedMsg = msgs.find(m =>
				m.embeds?.[0]?.description?.includes("<@")
			  );

			  if (embedMsg) {
				const match = embedMsg.embeds[0].description.match(/<@(\d+)>/);
				if (match) ownerId = match[1];
			  }

			  if (!ownerId) {
				console.log("找不到玩家，略過語音刪除");
			  } else {

				const member = await guild.members.fetch(ownerId);

				const safeName = member.user.username
				  .replace(/\s+/g, "")
				  .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, "");

				const voiceName = `語音_${safeName}`;

				const channels = await guild.channels.fetch();

				const voiceChannel = channels.find(c =>
				  c.type === ChannelType.GuildVoice &&
				  c.name === voiceName &&
				  c.parentId === "1493237762168721458"
				);

				if (voiceChannel) {
				  await voiceChannel.delete().catch(() => {});
				  console.log("語音已刪除:", voiceName);
				} else {
				  console.log("未找到語音頻道:", voiceName);
				}
			  }

			  // ===== 刪工單 =====
			  await textChannel.delete().catch(() => {});
			  console.log("工單已刪除:", textChannel.name);

			} catch (err) {
			  console.error("延遲刪除錯誤:", err);
			}
		  }, DELAY);
		}
		
		if (/^staff_rate_[1-5]$/.test(interaction.customId)) {

		  // ===== 權限 =====
		  if (!interaction.member.roles.cache.has(REVIEW_ROLE_ID)) {
			return interaction.reply({
			  content: "❌ 您沒有權限使用此功能",
			  ephemeral: true
			});
		  }

		  const stars = interaction.customId.split("_")[2];

		  const modal = new ModalBuilder()
			.setCustomId(`staff_modal_rating_${stars}`)
			.setTitle("📊 評價系統");

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
			.setPlaceholder("請輸入評價內容")
			.setRequired(true);

		  const input3 = new TextInputBuilder()
			.setCustomId("anonymous")
			.setLabel("是否匿名評價？（是/否）")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder("是 或 否")
			.setRequired(true);

		  modal.addComponents(
			new ActionRowBuilder().addComponents(input1),
			new ActionRowBuilder().addComponents(input2),
			new ActionRowBuilder().addComponents(input3)
		  );

		  return interaction.showModal(modal);
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

			// ===== 防重複 =====
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

			const anonymousInput = interaction.fields.getTextInputValue("anonymous");

			const isAnonymous = ["是", "yes", "y", "1"].includes(
			  anonymousInput.trim().toLowerCase()
			);

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
			  .setDescription(
				  isAnonymous
					? "💖 感謝匿名闆闆的超級評價!!"
					: `💖 感謝闆闆 <@${interaction.user.id}> 的超級評價!!`
				)
			  .setAuthor({
				name: `⭐ ${stars} 星評價`,
			  })
			  .addFields(
				{ name: "👤 陪陪名稱", value: companion },
				{ name: "⭐ 闆闆評分", value: `${"⭐".repeat(stars)}` },
				{ name: "📝 訂單回饋", value: feedback }
			  )
			  .setFooter({
				text: isAnonymous
				  ? "評價人：匿名闆闆"
				  : `評價人：${interaction.user.username}`,
				iconURL: isAnonymous
				  ? null
				  : interaction.user.displayAvatarURL()
			  })
			  .setTimestamp();

			if (!isAnonymous) {
			  embed.setThumbnail(member.user.displayAvatarURL());
			}

			const reviewChannel = await interaction.guild.channels.fetch("1489186836579356702");

			await reviewChannel.send({
			  embeds: [embed]
			});

			// ===== 記錄已評價 =====
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
		
		if (interaction.customId.startsWith("staff_modal_rating_")) {

		  await interaction.deferReply({ ephemeral: true });

		  try {

			const stars = interaction.customId.split("_")[3];

			const companion =
			  interaction.fields.getTextInputValue("companion");

			const feedback =
			  interaction.fields.getTextInputValue("feedback");

			const anonymousInput =
			  interaction.fields.getTextInputValue("anonymous");

			const isAnonymous = ["是", "yes", "y", "1"].includes(
			  anonymousInput.trim().toLowerCase()
			);

			const embed = new EmbedBuilder()
			  .setColor(0xFFD700)
			  .setDescription(
				isAnonymous
				  ? "💖 感謝匿名闆闆的超級評價!!"
				  : `💖 感謝闆闆 <@${interaction.user.id}> 的超級評價!!`
			  )
			  .setAuthor({
				name: `⭐ ${stars} 星評價`
			  })
			  .addFields(
				{ name: "👤 陪陪名稱", value: companion },
				{ name: "⭐ 闆闆評分", value: `${"⭐".repeat(stars)}` },
				{ name: "📝 評價內容", value: feedback }
			  )
			  .setFooter({
				text: isAnonymous
				  ? "評價人：匿名闆闆"
				  : `評價人：${interaction.user.username}`,
				iconURL: isAnonymous
				  ? null
				  : interaction.user.displayAvatarURL()
			  })
			  .setTimestamp();

			if (!isAnonymous) {
			  embed.setThumbnail(
				interaction.user.displayAvatarURL()
			  );
			}

			const reviewChannel =
			  await interaction.guild.channels.fetch("1489186836579356702");

			await reviewChannel.send({
			  embeds: [embed]
			});

			return interaction.editReply({
			  content: "✅ 評價已送出"
			});

		  } catch (err) {

			console.error(err);

			return interaction.editReply({
			  content: `❌ 發生錯誤：${err.message}`
			});
		  }
		}
	}
});
client.login(process.env.TOKEN);
