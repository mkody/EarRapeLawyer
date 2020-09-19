const ffmpeg = require('fluent-ffmpeg')
const Discord = require('discord.js')

const bot = new Discord.Client()
const botToken = "YOUR TOKEN GOES HERE"

const maxFileSize = 10000000 //In bytes
const earRapeBar = -7.0 //in dB
const message = "Warning! This video contains very loud sounds!"
const color = [255, 75, 75]

var checkedVideos = {}

function checkVideo(url) {
    return new Promise((resolve) => {
        ffmpeg({ source: url })
            .withAudioFilter('volumedetect')
            .addOption('-f', 'null')
            .noVideo()
            .on('start', function (ffmpegCommand) {
                console.log('Output the ffmpeg command', ffmpegCommand);
            })
            .on('end', function (stdout, stderr) {
                console.log(parseFloat(stderr.match(/(?<=max_volume: )(.*)(?= dB)/gm)[0]), parseFloat(stderr.match(/(?<=mean_volume: )(.*)(?= dB)/gm)[0]))
                resolve([parseFloat(stderr.match(/(?<=max_volume: )(.*)(?= dB)/gm)[0]), parseFloat(stderr.match(/(?<=mean_volume: )(.*)(?= dB)/gm)[0])])
            })
            .output("no")
            .run()
    })
}

function respond(msg) {
    embed = new Discord.MessageEmbed()
        .setTitle(message)
        .setFooter(msg.member.displayName, msg.member.user.avatarURL())
        .setColor(color)
    msg.channel.send(embed)
}

bot.on('message', (msg) => {
    if (msg.attachments.array()[0] !== undefined) {
        if (msg.attachments.array()[0].url.match(/(.webm)$|(.mov)$|(.mp4)$|(.avi)$/gm) !== null) {
            if (msg.attachments.array()[0].size < maxFileSize) {
                checkVideo(msg.attachments.array()[0].url).then((val) => {
                    if (val[0] === 0 && val[1] > earRapeBar) {
                        respond(msg)
                    }
                })
            }
        }
    }
    for (var i = 0; i < msg.embeds.length; i++) {
        if (msg.embeds[i].type === 'video') {
            var link = msg.embeds[i].url
            if (checkedVideos[link] === undefined) {
                checkVideo(link).then((val, avg) => {
                    if (val[0] === 0 && val[1] > earRapeBar) {
                        respond(msg)
                        checkedVideos[link] = true
                    } else {
                        checkedVideos[link] = false
                    }
                })
            } else if (checkedVideos[link]) {
                respond(msg)
            }
        }
    }
})

bot.login(botToken)