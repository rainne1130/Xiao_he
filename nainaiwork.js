import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, runTransaction } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAsjzcvDVB4AEhk79mgCJt7b2m1QV_zbuE",
  authDomain: "workingnai.firebaseapp.com",
  databaseURL: "https://workingnai-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "workingnai",
  storageBucket: "workingnai.firebasestorage.app",
  messagingSenderId: "G-CX7S8K49BF",
  appId: "1:899110407445:web:3a2634d1c59f855ef16d1c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_ROLE = "老大";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('我要查詢餘額')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('查詢其他陪陪（老大限定）')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('add')
    .setDescription('儲值(老大限定)')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('選取陪陪')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('金額')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('charge')
    .setDescription('扣款(老大限定)')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('選取陪陪')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('金額')
        .setRequired(true)
    )
];

// ======================
client.once(Events.ClientReady, async () => {
  console.log(`已上線：${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Slash 指令已註冊");
});

async function getBalance(userId) {
  try {
    const snapshot = await get(ref(db, `balances/${userId}`));
    if (!snapshot.exists()) {
      await set(ref(db, `balances/${userId}`), 0);
      return 0;
    }
    return snapshot.val();
  } catch (err) {
    console.error(err);
    return 0;
  }
}

async function setBalance(userId, amount) {
  try {
    await set(ref(db, `balances/${userId}`), amount);
  } catch (err) {
    console.error(err);
  }
}

async function updateBalance(userId, delta) {
  const userRef = ref(db, `balances/${userId}`);
  try {
    await runTransaction(userRef, (current) => {
      return (current || 0) + delta;
    });
  } catch (err) {
    console.error(err);
  }
}
async function addTotal(userId, amount) {
	
  const totalRef = ref(db, `total/${userId}`);
  try {
    await runTransaction(totalRef, (current) => {
      return (current || 0) + amount;
    });
  } catch (err) {
    console.error(err);
  }
}

async function getTotal(userId) {
  try {
    const snapshot = await get(ref(db, `total/${userId}`));
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
}

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;

  const isAdmin = i.member.roles.cache.some(r => r.name === ADMIN_ROLE);

  const target = i.options.getUser("user") || i.user;
  const amount = i.options.getInteger("amount");

  const balance = await getBalance(target.id);

  // 查餘額
  if (i.commandName === "balance") {

    if (target.id !== i.user.id && !isAdmin) {
      return i.reply({
        content: "陪陪您好，您只能查自己的餘額!",
        ephemeral: true
      });
    }
	
	const total = await getTotal(target.id);
    return i.reply({
      content: `💰目前陪陪資訊如下:\n ${target.username} \n總累積賺取的薪資為\n${total} 元\n目前可提領餘額為\n${balance} 元`,
      ephemeral: true
    });
  }

  // 儲值
  if (i.commandName === "add") {
	  
	if (!amount || amount <= 0) {
	  return i.reply({ content: "金額錯誤", ephemeral: true });
	}
	  
    if (!isAdmin) {
      return i.reply({ content: "您不是老大，無法使用!", ephemeral: true });
    }

    await updateBalance(target.id, amount);
	await addTotal(target.id, amount);
    return i.reply({
      content: `💰勞大已幫 ${target.username} 陪陪發薪 ${amount} 元!`,
    });
  }

  // 扣款
  if (i.commandName === "charge") {
	  
	if (!amount || amount <= 0) {
	  return i.reply({ content: "金額錯誤", ephemeral: true });
	}
	  
    if (!isAdmin) {
      return i.reply({ content: "您不是老大，無法使用!", ephemeral: true });
    }

    if (balance < amount) {
      return i.reply({ content: "目前餘額不足", ephemeral: true });
    }

    await updateBalance(target.id, -amount);

    return i.reply({
      content: `💸勞大已幫陪陪 ${target.username} 提領薪資 ${amount} 元\n剩餘可提領餘額為:\n${balance - amount} 元!`,
    });
  }
});

// TOKEN 檢查
if (!process.env.TOKEN) {
  console.error("TOKEN 未設定");
  process.exit(1);
}

client.login(process.env.TOKEN);