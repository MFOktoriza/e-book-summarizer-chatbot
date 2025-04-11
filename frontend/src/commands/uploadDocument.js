
const { createWriteStream, existsSync, mkdirSync } = require("fs");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { join } = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { backendApiHost, dockerBaseDir, isResponseEphemeral, commandMap } = require("../config");

const commandName = "upload";
if (!commandMap.some(commandMapElem => commandMapElem.commandName === commandName ? true : false)) {
    throw new Error(`"${commandName}" command is not defined in config.commandMap, please add commandName and commandFile to config.commandMap`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(commandName.toLowerCase())
        .setDescription("Upload a document")
        .addAttachmentOption(option =>
            option.setName("document")
                .setDescription("PDF document to upload")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("title")
                .setDescription("Title of the document")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("author")
                .setDescription("Author of the document")),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: isResponseEphemeral });

            let reply = `Error running command "${commandName}"`;
            try {
                const attachment = interaction.options.getAttachment("document");
                if (!attachment) {
                    return reply = "Please provide the document";
                }
                if (attachment?.contentType?.toLowerCase() !== "application/pdf") {
                    return reply = "Can only upload .pdf document";
                }

                const title = interaction.options.getString("title");
                if (!title) {
                    return reply = "Please provide the valid title string";
                }

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

                const documentName = `${String(title)
                    .trim()
                    .toLowerCase()
                    .replaceAll("/", "")
                    .replaceAll("\\", "")
                    .replaceAll(/\s+/g, "_")}-${serverId}.pdf`;

                const documentsPath = join(dockerBaseDir, "documents");
                if (!existsSync(documentsPath)) {
                    mkdirSync(documentsPath, { recursive: true });
                }

                const { body } = await fetch(attachment?.url);
                const fileStream = createWriteStream(join(documentsPath, documentName));
                await finished(Readable.fromWeb(body).pipe(fileStream))

                const response = await fetch(`http://${backendApiHost}/upload_document?${new URLSearchParams({
                    document_path: join(documentsPath, documentName),
                    id: serverId,
                    title: interaction.options.getString("title"),
                    author: interaction.options.getString("author") || ""
                })}`, { method: "POST" });
                const responseBody = await response.json();
                if (!responseBody?.status === "success" || !responseBody?.message) {
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
