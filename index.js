const { Client, GatewayIntentBits, ActivityType, MessageActionRow, MessageButton } = require('discord.js');
require('dotenv').config();
const express = require('express');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const messageCounts = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(
        '\x1b[36m[ INFO ]\x1b[0m',
        `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`
    );
    updateStatus();
    setInterval(updateStatus, 10000); 
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

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
        }, 10000);
    }

    messageCounts.set(userId, userMessageData);

    // Example button usage when a user sends a message
    if (message.content === '!button') {
        // Create a row of buttons
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('primary_button')
                .setLabel('Click Me!')
                .setStyle('PRIMARY')
        );

        // Send a message with the button
        message.channel.send({
            content: 'Here is your button!',
            components: [row],
        });
    }
});

// Handle button interaction
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'primary_button') {
        await interaction.reply({ content: 'You clicked the button!', ephemeral: true });
    }
});

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

// Status messages
async function setActivity() {
    const time = formatTime();
    client.user.setActivity({
        name: `My Self [${time}]`,
        type: ActivityType.Playing,
        url: '#',
        assets: {
            largeImage: '#',
            largeText: '#',
            smallImage: '#',
            smallText: '#',
        },
        buttons: [
            { label: 'Server', url: '#' },
        ]
    });
    client.user.setPresence({ status: 'dnd' });
}

function updateStatus() {
    client.user.setActivity('My Self', {
        type: ActivityType.Playing,
    });
    client.user.setPresence({ status: 'dnd' });
}

function formatTime() {
    const date = new Date();
    const options = {
        timeZone: 'Asia/Manila',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

const mySecret = process.env['TOKEN'];
client.login(mySecret);
