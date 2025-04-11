const { discordToken, dockerBaseDir } = require ("./config")
const { readdirSync, existsSync, mkdirSync } = require("fs")
const { join } = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageTyping
    ]
});

client.commands = new Collection();

const commandsPath = join(dockerBaseDir, "src", "commands")
if (existsSync(commandsPath)) {
    mkdirSync(commandsPath, { recursive: true });
}
const commandFiles = (readdirSync(commandsPath)).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = join(dockerBaseDir, "src", "events");
if (!existsSync(eventsPath)) {
    mkdirSync(eventsPath, { recursive: true });
}
const eventFiles = (readdirSync(eventsPath)).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(discordToken);
