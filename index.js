const ffmpeg = require('fluent-ffmpeg')
const youtubedl = require('youtube-dl-exec')
const { Client, Events, GatewayIntentBits } = require('discord.js')
const config = require('./config.json')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ]
})
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
          parseFloat(stderr.match(/(?<=mean_volume: )(.*)(?= dB)/gm)[0]),
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
  const attachment = msg.attachments.first()

  if (attachment !== undefined) {
    if (attachment.contentType.includes('video')) {
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
    const type = msg.embeds[i].data.type
    const url = msg.embeds[i].url
    const video = msg.embeds[i].video

    // Only check video types (except some domains)
    if (type !== 'video' && !url.includes('twitter.com') && !url.includes('//x.com')) {
      return
    }

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
      // For anything else, try yt-dlp
      console.log('Using yt-dlp...')
      youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        youtubeSkipDashManifest: true,
        x: true,
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
          console.log('YTdlp Error:', err)
        })
    }
  }
}

client.on(Events.MessageCreate, (msg) => checkMsg(msg))
client.on(Events.MessageUpdate, (old, msg) => {
  if (old.embeds !== msg.embeds) checkMsg(msg)
})

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`)
})

client.login(config.botToken)
