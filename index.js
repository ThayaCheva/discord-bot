const Discord = require('discord.js')
const fetch = require("node-fetch")
const {token} = require('./config.json')
const fs = require('node:fs')
const path = require('node:path');
const sadWords = ["sad", "depressed", "unhappy", "angry"]
const encourage = ["Cheer up!", "Hang in there.", "You are a great person / bot!"]

const client = new Discord.Client({ intents: ["Guilds", "GuildMessages", "MessageContent"] })
client.commands = new Discord.Collection()

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on(Discord.Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

function getQuote() {
    return fetch("https://zenquotes.io/api/random")
        .then(res => {
            return res.json()
        })
        .then(data => {
            return data[0]["q"] + " -" + data[0]["a"]
        })
}

client.on("messageCreate", msg => {
    if (msg.author.bot) {
        return
    }
    if (msg.content === "$inspire") {
      getQuote().then(quote => msg.channel.send(quote))
    }
    if (sadWords.some(word => msg.content.includes(word))) {
        const encouragement = encourage[Math.floor(Math.random() * encourage.length)]
        msg.reply(encouragement)
    }
})


client.login(token)