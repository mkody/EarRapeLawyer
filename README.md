# EarRapeLawyer
Discord bot detecting videos with ear rape.

Original code from [ObiArt/EarRapeLawyer](https://github.com/ObiArt/EarRapeLawyer)

## Install
- Copy `config.json.dist` to `config.json` and edit it
- `yarn install`
- `node index.js`

## Config
- botToken : Your bot token [(guide)](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
- earRapeBar : Level in dB to consider as ear rape
- maxFileSize : Max file size in bytes (only discord uploads, not embeds)
- remoteMaxDuration : Max length in seconds to download and check a remote file
