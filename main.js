const meme_generator = require('nodejs-meme-generator');
const fs = require('fs');
const gen_uuid = require('uuid/v4');
const Discord = require("discord.js");
const client = new Discord.Client();
 
const memgen = new meme_generator({
    fontOptions: {
        fontSize: 42,
        fontFamily: 'impact',
        lineHeight: 4
    }
});

client.on("ready", () => {
    client.on("message", message => {
        if (!message.author.bot && message.channel.type === "dm") {

            const imgurl = (message.attachments.size > 0) ? message.attachments.first().url : 'https://i.imgur.com/4vGHaKT.jpg';
            const [top_text, ...rest] = message.content.split('/').map(str => str.trim().toUpperCase());
            const bot_text = rest.join(' ');
            const filename = gen_uuid() + ".png";

            memgen.generateMeme({
                topText: top_text,
                bottomText: bot_text,
                url: imgurl
            })
                .then(data => fs.writeFileSync(filename, data))
                .then(_    => message.channel.send("", {files: [filename]}))
                .then(_    => fs.unlinkSync(filename));
        }
    });
});

client.login(fs.readFileSync('bot_token', 'utf8'));
 
