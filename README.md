# EarRapeLawyer
Discord bot detecting videos with ear rape.

Original code from [ObiArt/EarRapeLawyer](https://github.com/ObiArt/EarRapeLawyer)


## Install
### Local
- Have node.js v20+ installed and corepack enabled
- Copy `config.json.dist` to `config.json` and edit it
- `pnpm install`
- `node index.js`

### Docker
- Have docker and preferably a modern docker compose
- Copy `config.json.dist` to `config.json` and edit it
- `docker compose up --build -d`
- `docker compose logs -f`


## Config
- botToken : Your bot token [(guide)](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
- earRapeBar : Level in dB to consider as ear rape
- maxFileSize : Max file size in bytes (only discord uploads, not embeds)
- remoteMaxDuration : Max length in seconds to download and check a remote file
