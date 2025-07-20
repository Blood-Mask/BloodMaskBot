const { Telegraf, Markup } = require("telegraf")
const fs = require('fs')
const bot = new Telegraf("7758909284:AAFPLzUQBir7fAlgd4RCzYuijB7wZcnCgg8")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const db = JSON.parse(fs.readFileSync("db.json"))

let loading

// USER UI
bot.start((ctx) => {
    ctx.reply('Hi, what can I do for you? :)', Markup.inlineKeyboard([
        [Markup.button.callback('Search albums', 'albums')],
        [Markup.button.callback('Search singles', 'singles')]
    ]))
})
bot.action('albums', (ctx) => {
    ctx.answerCbQuery()
    let answer = [[Markup.button.callback("Main menu", `mainmenu`)]]
    for(let i = 0; i < db.albums.length; i++){
        let album = db.albums[i]
        answer.push([Markup.button.callback(album.name, album.name)])
        bot.action(album.name, async (ctx) => {
            ctx.answerCbQuery()
            ctx.reply(`Loading album <b>${album.name}</b>`, {parse_mode:"HTML"})
            for (const track of album.tracks) {
              await ctx.sendAudio(track.file_id)
              await sleep(200)
            }
        })
    }
    ctx.reply('Here are all of the albums:', Markup.inlineKeyboard(answer))
})
bot.action('singles', (ctx) => {
    ctx.answerCbQuery()
    let answer = [[Markup.button.callback("Main menu", `mainmenu`)]]
    for(let i = 0; i < db.singles.length; i++){
        let single = db.singles[i]
        answer.push([Markup.button.callback(single.name, single.name)])
        bot.action(single.name, async (ctx) => {
            isSending = true
            await ctx.answerCbQuery()
            await ctx.sendAudio(single.track.file_id)
            await sleep(3000)
            isSending = false
        })
    }
    ctx.reply('Here are all of the singles:', Markup.inlineKeyboard(answer))
})
bot.action('mainmenu', (ctx) => {
    ctx.answerCbQuery()
    ctx.reply('What can I do for you?  :)', Markup.inlineKeyboard([
        [Markup.button.callback('Search albums', 'albums')],
        [Markup.button.callback('Search singles', 'singles')]
    ]))
})
bot.command('main_menu', (ctx) => {
    ctx.reply('What can I do for you? :)', Markup.inlineKeyboard([
        [Markup.button.callback('Search albums', 'albums')],
        [Markup.button.callback('Search singles', 'singles')]
    ]))
})

// ADMIN FUNCTIONS
function updateDatabase() { fs.writeFileSync("db.json", JSON.stringify(db, null, 1)) }
// ADMIN BOT ACTIONS
bot.command(`setmain`, (ctx) => {
    let messageText = ctx.message.text.split(' ').slice(1).join(' ')
    if(messageText == "12072012"){
        db.MAIN = ctx.from.username
        ctx.reply(`Вітаю, тепер ви - головний адмін!`)
        updateDatabase()
    }else{ return ctx.reply(`Неправильний пароль`) }
})
bot.command(`createalbum`, (ctx) => {
    if(db.MAIN != ctx.from.username) { return ctx.reply(`Активність не зі сторони адміна`) }
    let messageText = ctx.message.text.split(' ').slice(1).join(' ')
    if(messageText == ""){ return ctx.reply(`Немає messageText`) }
    let albumExists = db.albums.find(el => el.name == messageText)
    if(albumExists) { return ctx.reply(`Альбом <b>${albumExists.name}</b> існує!`, {parse_mode:"HTML"}) }
    db.albums.push({
        "name": messageText,
        "type": "album",
        "tracks": []
    })
    ctx.reply(`<b>${messageText}</b> альбом успішно створений`, {parse_mode:"HTML"})
    updateDatabase()
})
bot.command(`createsingle`, (ctx) => {
    if(db.MAIN != ctx.from.username) { return ctx.reply(`Активність не зі сторони адміна`) }
    let messageText = ctx.message.text.split(' ').slice(1).join(' ')
    if(messageText == ""){ return ctx.reply(`Немає messageText`) }
    let singleExists = db.singles.find(el => el.name == messageText)
    if(singleExists) { return ctx.reply(`Сингл <b>${singleExists.name}</b> існує!`, {parse_mode:"HTML"}) }
    db.singles.push({
        "name": messageText,
        "type": "single",
        "track": null
    })
    ctx.reply(`<b>${messageText}</b> сингл успішно створений`, {parse_mode:"HTML"})
    updateDatabase()
})
bot.command(`loadtoalbum`, (ctx) => {
    if(db.MAIN != ctx.from.username) { return ctx.reply(`Активність не зі сторони адміна`) }
    let messageText = ctx.message.text.split(' ').slice(1).join(' ')
    let albumExists = db.albums.find(el => el.name == messageText)
    if(albumExists){
        loading = albumExists
        ctx.reply(`Завантажую треки у альбом ${loading.name}`)
    }
})
bot.command(`loadtosingle`, (ctx) => {
    if(db.MAIN != ctx.from.username) { return ctx.reply(`Активність не зі сторони адміна`) }
    let messageText = ctx.message.text.split(' ').slice(1).join(' ')
    let singleExists = db.singles.find(el => el.name == messageText)
    if(singleExists){
        loading = singleExists
        ctx.reply(`Завантажую трек у сингл ${loading.name}`)
    }
})
bot.on('audio', (ctx) => {
    if(db.MAIN != ctx.from.username) { return ctx.reply(`Активність не зі сторони адміна`) }
    if(loading && loading.type == "album"){
        let index = db.albums.indexOf(loading)
        db.albums[index].tracks.push(ctx.message.audio)
    }else if(loading && loading.type == "single"){
        let index = db.singles.indexOf(loading)
        db.singles[index].track = ctx.message.audio
    }
    else{ return ctx.reply("Немає loading") }
    updateDatabase()
})

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection:', reason)
})

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
