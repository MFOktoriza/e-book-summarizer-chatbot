const { SlashCommandBuilder } = require("discord.js");
const { backendApiHost, isResponseEphemeral, commandMap } = require("../config")

const commandName = "ask";
if (!commandMap.some(commandMapElem => commandMapElem.commandName === commandName ? true : false)) {
    throw new Error(`"${commandName}" command is not defined in config.commandMap, please add commandName and commandFile to config.commandMap`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(commandName.toLowerCase())
        .setDescription("Ask bot a question")
        .addStringOption(option =>
            option.setName("question")
                .setDescription("question that will be asked to bot")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("id")
                .setDescription(`id of the document to give context to LLM (Run "list" command to get id of the document)`)
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: isResponseEphemeral });

            let reply = `Error running command "${commandName}"`;
            try {
                const question = interaction.options.getString("question");
                if (!question) {
                    return reply = `Please provide valid question string, input question: ${question}`;
                }

                const id = interaction.options.getString("id");
                if (!question) {
                    return reply = `Please provide valid id string, input id: ${id}`;
                }

                const response = await fetch(`http://${backendApiHost}/ask_question?${new URLSearchParams({ question: question, id: id })}`);
                const responseBody = await response.json();
                if (!responseBody?.status?.toLowerCase() === "success" || !responseBody?.message) {
                    return reply = "Error: Internal server error";
                }

                return reply = responseBody.message;
            } catch (error) {
                console.error(`Error running command "${commandName}", error: ${error}`);
            } finally {
                return await interaction.editReply(reply);
            }
        } catch (error) {
            console.error(`Error setting up "${commandName}" command, error: ${error}`);
        }
    }
}
