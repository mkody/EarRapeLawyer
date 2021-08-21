const ffmpeg = require('fluent-ffmpeg')
const { Client, Intents } = require('discord.js')
const config = require('./config.json')

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const checkedVideos = {}

function checkVideo (url) {
  return new Promise((resolve) => {
    ffmpeg({ source: url })
      .withAudioFilter('volumedetect')
      .addOption('-f', 'null')
      .noVideo()
      .on('error', (err) => {
        console.log('Error with ffmpeg:', err)
      })
      .on('start', (ffmpegCommand) => {
        console.log('Command:', ffmpegCommand)
      })
      .on('end', (stdout, stderr) => {
        console.log(
          parseFloat(stderr.match(/(?<=max_volume: )(.*)(?= dB)/gm)[0]),
          parseFloat(stderr.match(/(?<=mean_volume: )(.*)(?= dB)/gm)[0])
        )
        resolve([
          parseFloat(stderr.match(/(?<=max_volume: )(.*)(?= dB)/gm)[0]),
          parseFloat(stderr.match(/(?<=mean_volume: )(.*)(?= dB)/gm)[0])
        ])
      })
      .output('no')
      .run()
  })
}

function respond (msg) {
  console.log('Is loud!\n')
  msg.react('📢')
}

bot.on('messageCreate', (msg) => {
  const [attachment] = msg.attachments.values()

  if (attachment !== undefined) {
    if (attachment.url.match(/(.webm)$|(.mov)$|(.mp4)$|(.avi)$/gm) !== null) {
      if (attachment.size < config.maxFileSize) {
        checkVideo(attachment.url)
          .then((val) => {
            if (val[0] === 0 && val[1] > config.earRapeBar) {
              respond(msg)
            }
          })
      }
    }
  }

  for (let i = 0; i < msg.embeds.length; i++) {
    const video = msg.embeds[i].video

    if (video !== undefined) {
      // Special cases
      if (video.url.includes('clips.twitch.tv')) {
        console.log('Ignored twitch clip\n')
      } else if (checkedVideos[video.url] === undefined) {
        checkVideo(video.url)
          .then((val) => {
            if (val[0] === 0 && val[1] > config.earRapeBar) {
              respond(msg)
              checkedVideos[video.url] = true
            } else {
              checkedVideos[video.url] = false
            }
          })
      } else if (checkedVideos[video.url]) {
        respond(msg)
      }
    }
  }
})

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`)
})

bot.login(config.botToken)
