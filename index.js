const ffmpeg = require('fluent-ffmpeg')
const youtubedl = require('youtube-dl-exec')
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

function checkMsg (msg) {
  // Check first attachment (if there's one)
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

  // Check embeds
  for (let i = 0; i < msg.embeds.length; i++) {
    const type = msg.embeds[i].type
    const url = msg.embeds[i].url
    const video = msg.embeds[i].video

    // Only check video types (except some domains)
    if (type !== 'video' &&
        !url.includes('twitter.com')) return

    // If there's a proxyURL, it's an embedable video
    if (video && 'proxyURL' in video && video.proxyURL) {
      if (checkedVideos[video.url] === undefined) {
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
    } else {
      // For anything else, try youtube-dl
      console.log('Using youtube-dl...')
      youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        youtubeSkipDashManifest: true,
        x: true
      })
        .then(output => {
          if ('is_live' in output && output.is_live === true) {
            console.log('Video is live, ignoring.')
            return
          } else if (output.duration > config.remoteMaxDuration) {
            console.log('Video is too long, ignoring.')
            return
          }

          if (checkedVideos[output.url] === undefined) {
            checkVideo(output.url)
              .then((val) => {
                if (val[0] === 0 && val[1] > config.earRapeBar) {
                  respond(msg)
                  checkedVideos[output.url] = true
                } else {
                  checkedVideos[output.url] = false
                }
              })
          } else if (checkedVideos[output.url]) {
            respond(msg)
          }
        })
        .catch(err => {
          if (err.stderr.includes("There's no video")) {
            console.log('No video, ignoring.')
            return
          }
          console.err(err)
        })
    }
  }
}

bot.on('messageCreate', (msg) => checkMsg(msg))
bot.on('messageUpdate', (old, msg) => {
  if (old.embeds !== msg.embeds) checkMsg(msg)
})

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`)
})

bot.login(config.botToken)
