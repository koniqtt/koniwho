const { Client, GatewayIntentBits, ActivityType, MessageActionRow, MessageButton, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');
const path = require('path');
require('dotenv').config();

const { token, clientId, guildId } = require('./config.json'); // Assuming you have a config.json file for token and other values

// Initialize the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
});

const messageCounts = new Map();

// Handle the bot's ready event
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
    updateStatus();
    setInterval(updateStatus, 10000); // Update status every 10 seconds
});

// Handle incoming messages for spam detection and buttons
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const userMessageData = messageCounts.get(userId) || { count: 0, timer: null };

    userMessageData.count += 1;

    if (userMessageData.count >= 5) {
        message.channel.send(`TANGINA MO WAG KA SPAM ${message.author}!`);
        userMessageData.count = 0;
        clearTimeout(userMessageData.timer); // Reset the timer if the user reaches the message limit
    }

    if (!userMessageData.timer) {
        userMessageData.timer = setTimeout(() => {
            messageCounts.delete(userId);
        }, 10000); // Reset count after 10 seconds
    }

    messageCounts.set(userId, userMessageData);

    // Handle !button command to send a button
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

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'primary_button') {
        await interaction.reply({ content: 'You clicked the button!', ephemeral: true });
    }
});

// Slash command registration
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
        console.log('Refreshing application (/) commands...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'order') {
        const userMention = interaction.options.getUser('user');
        const item = interaction.options.getString('item');
        const price = interaction.options.getString('price');
        const payment = interaction.options.getString('payment');
        const channel = interaction.options.getChannel('channel');

        await interaction.reply({
            content: `**Order Status**\n` +
                     `┗﹕${userMention} | <#${channel.id}>\n` +  // Use channel.id for mentioning the channel
                     `・Item: ${item}\n` +
                     `・₱${price}\n` +
                     `・${payment}\n`
        });

    }
});

// Activity and presence updates
function updateStatus() {
    client.user.setActivity('My Self', {
        type: ActivityType.Playing,
    });
    client.user.setPresence({ status: 'dnd' });
}

// Express server setup to serve an HTML file
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

// Login the bot with the token
const mySecret = process.env['TOKEN'];
client.login(mySecret);
