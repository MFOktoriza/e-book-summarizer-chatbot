const { SlashCommandBuilder } = require("discord.js");
const { backendApiHost, isResponseEphemeral, commandMap } = require("../config")

const commandName = "list";
if (!commandMap.some(commandMapElem => commandMapElem.commandName === commandName ? true : false)) {
    throw new Error(`"${commandName}" command is not defined in config.commandMap, please add commandName and commandFile to config.commandMap`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(commandName.toLowerCase())
        .setDescription("List document uploaded by user"),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: isResponseEphemeral });

            let reply = `Error running command "${commandName}"`;
            try {
                let serverId = "";
                switch (true) {
                    case interaction?.guildId != null:
                        serverId = `gid_${interaction?.guildId}`;
                        break;
                    case interaction?.user?.id != null:
                        serverId = `uid_${interaction?.user?.id}`;
                        break;
                    default:
                        break;
                }
                if (!serverId) {
                    return reply = "Error: Server ID or User ID is not available";
                }

                const response = await fetch(`http://${backendApiHost}/list_document?${new URLSearchParams({ id: serverId })}`);
                const responseBody = await response.json();
                if (!responseBody?.status?.toLowerCase() === "success" || !responseBody?.message) {
                    return reply = "Error: Internal server error";
                }

                const responseBodyPoints = responseBody.message?.points;
                if (!responseBodyPoints) {
                    return reply = "Error: Internal server error";
                }

                const responseMessage = responseBodyPoints.map((pointData, index) =>
                    `${index + 1}. ${pointData?.payload?.title}\n  - id: ${pointData?.id}\n  - title: ${pointData?.payload?.title}\n  - author: ${pointData?.payload?.author || ""}`
                ).join("\n");

                return reply = responseMessage ? responseMessage : "No document uploaded yet";
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
