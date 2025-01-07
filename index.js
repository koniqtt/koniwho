const { Client, GatewayIntentBits, ActivityType, MessageActionRow, MessageButton, SlashCommandBuilder, Routes, EmbedBuilder   } = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');
const path = require('path');
require('dotenv').config();

const { token, clientId, guildId, Output_channel } = require('./config.json'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
});

const messageCounts = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
    updateStatus();
    setInterval(updateStatus, 10000); 
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    console.log(`Message received: ${message.content} from ${message.author.tag}`);

    const userId = message.author.id;
    const userMessageData = messageCounts.get(userId) || { count: 0, timer: null };

    userMessageData.count += 1;

    if (userMessageData.count >= 5) {
        message.channel.send(`TANGINA MO WAG KA SPAM ${message.author}!`);
        userMessageData.count = 0;
        clearTimeout(userMessageData.timer); 
    }

    if (!userMessageData.timer) {
        userMessageData.timer = setTimeout(() => {
            messageCounts.delete(userId);
        }, 5000); 
    }

    messageCounts.set(userId, userMessageData);

    if (message.content === '!button') {
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('primary_button')
                .setLabel('Click Me!')
                .setStyle('PRIMARY')
        );

        message.channel.send({
            content: 'Here is your button!',
            components: [row],
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'primary_button') {
        await interaction.reply({ content: 'You clicked the button!', ephemeral: true });
    } else if (interaction.isCommand() && interaction.commandName === 'order') {
        const userMention = interaction.options.getUser('user');
        const item = interaction.options.getString('item');
        const price = interaction.options.getString('price');
        const payment = interaction.options.getString('payment');

        const channel = await client.channels.fetch(Output_channel);
        if (!channel) {
            await interaction.reply({ content: 'Failed', ephemeral: true });
            return;
        }

        await channel.send({
            content: `>>> ## <a:emoji_20:1326030204531114095> ORDER STATUS\n` +
            `     <a:emoji_27:1326031618036727809> : ${userMention} | <#${channel.id}>\n` + 
            `          <:emoji_13:1326029730121515008> ${item}\n` +
            `          <:emoji_13:1326029730121515008> ₱${price} | ${payment}\n`
        });

        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('Borat n Makonat')
            .setDescription('Very nice!')
            .setImage('koni.gif')
            .setFooter({ text: 'Borat says: "Great Success!"' }); 


        await interaction.reply({ embeds: [embed] });
    }
});


const commands = [
    new SlashCommandBuilder()
        .setName('order')
        .setDescription('Place an order with a user, item, price, payment method, and a channel')
        .addUserOption(option => option.setName('user').setDescription('Mention the user').setRequired(true))
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Enter an item')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('price')
                .setDescription('Enter a price')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('payment')
                .setDescription('Enter a payment method')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel for the order')
                .setRequired(true)
        ),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Clearing old commands...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        
        console.log('Registering new commands...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

function updateStatus() {
    client.user.setActivity('My Self', {
        type: ActivityType.Playing,
    });
    client.user.setPresence({ status: 'dnd' });
}

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath, { headers: { 'Content-Type': 'text/html' } });
});

app.listen(port, () => {
    console.log(
        '\x1b[36m[ SERVER ]\x1b[0m',
        `\x1b[32m SH : http://localhost:${port} ✅\x1b[0m`
    );
});

const mySecret = process.env['TOKEN'];
client.login(mySecret);
