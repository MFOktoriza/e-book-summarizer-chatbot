const { SlashCommandBuilder } = require("discord.js");
const { isResponseEphemeral, commandMap } = require("../config");

const commandName = "reload";
if (!commandMap.some(commandMapElem => commandMapElem.commandName === commandName ? true : false)) {
    throw new Error(`"${commandName}" command is not defined in config.commandMap, please add commandName and commandFile to config.commandMap`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(commandName.toLowerCase())
        .setDescription("Reloads a command")
        .addStringOption(option =>
            option.setName("command")
                .setDescription(`The command to reload`)
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: isResponseEphemeral });

            let reply = `Error running command "${commandName}"`;
            try {
                const reloadCommandName = interaction.options.getString("command", true)?.replace("/", "");
                const reloadCommand = interaction.client?.commands?.get(reloadCommandName);

                if (!reloadCommand) {
                    return reply = `No command named "${reloadCommand}"`;
                }

                let commandFile = "";
                commandMap.some(commandMapElem => {
                    if (commandMapElem.commandName === commandName) {
                        commandFile = commandMapElem.commandFile;
                        return true;
                    }
                    return false;
                });
                if (!commandFile) {
                    console.error(`File for command "${reloadCommandName}" is not exists`);
                    return reply = `Error: internal server error`;
                }

                delete require.cache[require.resolve(`./${commandFile}`)];

                try {
                    const newCommand = require(`./${commandFile}`);
                    interaction.client?.commands?.set(newCommand?.data?.name, newCommand);
                    return reply = `Command "${reloadCommandName}" successfully reloaded`;
                } catch (error) {
                    console.error(`Error reloading "${commandFile}" command, error: "${error}"`);
                }
            } catch (error) {
                console.error(`Error running command "${commandName}", error: ${error}`);
            } finally {
                return await interaction.editReply(reply);
            }
        } catch (error) {
            console.error(`Error setting up "${commandName}" command, error: ${error}`);
        }
    },
};