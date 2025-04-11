const { config } = require("dotenv");

config({ path: "./.env" });

module.exports = {
    baseDir: process.env.BASE_DIR,
    dockerBaseDir: process.env.DOCKER_BASE_DIR,
    discordAppId: process.env.DISCORD_APP_ID,
    discordToken: process.env.DISCORD_TOKEN,
    discordPublicKey: process.env.DISCORD_PUBLIC_KEY,
    backendApiHost: process.env.BACKEND_API_HOST,
    isResponseEphemeral: (/^true$/i?.test(process.env.IS_RESPONSE_EPHEMERAL)),
    commandMap: [
        {
            commandName: "ask",
            commandFile: "askQuestion.js"
        },
        {
            commandName: "list",
            commandFile: "listDocument.js"
        },
        {
            commandName: "upload",
            commandFile: "uploadDocument.js"
        },
        {
            commandName: "reload",
            commandFile: "reloadCommand.js"
        },
    ],
}
