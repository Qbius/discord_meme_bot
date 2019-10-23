const fs =       require('fs');
const gm =       require('gm');
const download = require('image-downloader');
const gen_uuid = require('uuid/v4');
const memegen =  require('meme-maker');
const Discord =  require("discord.js");

const client = new Discord.Client();

const fragment_sentence = (str, chunk_size) => {
    parts = str.split(' ').reduce(([H, ...T], word) => (H && H.length + word.length < chunk_size) ? [H + ' ' + word, ...T] : [word, H, ...T], []);
    parts.reverse();
    return parts.filter(e => e !== undefined);
};
 
client.on("ready", () => client.on("message", message => {
    if (!message.author.bot && message.channel.type === "dm") {

        const imgurl = (message.attachments.size > 0) ? message.attachments.first().url : 'https://i.imgur.com/4vGHaKT.jpg';
        const [top_text, ...rest] = message.content.split('/').map(str => str.trim().toUpperCase());
        const bot_text = rest.join(' ');
    
        const filename = gen_uuid() + ".png";
        const new_filename = gen_uuid() + ".png";

	    download.image({
		    url: imgurl,
		    dest: filename
	    }).then(_ => {
            let img = gm(filename);
            img.size((err, {width: w, height: h}) => {
                const padding = 31;
                const max_chars_per_line = (24 / 620) * w;
                const top_parts = fragment_sentence(top_text, max_chars_per_line);
                const bot_parts = fragment_sentence(bot_text, max_chars_per_line);
                const top_size = Math.abs((h / 2) - 2 - padding * top_parts.length) * -1;
                const bot_size = h / 2 - padding * bot_parts.length;
                img
                    .font(__dirname + '/impact.ttf', 50)
                    .fill('#FFF')
                    .stroke('#000', 2)
                    .drawText(0, top_size, top_parts.join('\n'), 'center')
                    .drawText(0, bot_size, bot_parts.join('\n'), 'center')
                    .write(new_filename, _ => message.channel.send("", {files: [new_filename]}).then(_ => {
                        fs.unlinkSync(filename);
                        fs.unlinkSync(new_filename);
                    }));
            });
        }).catch(console.log);
    }
}));

client.login(fs.readFileSync('bot_token', 'utf-8').trim());
