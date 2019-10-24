const fs =       require('fs');
const gm =       require('gm');
const download = require('image-downloader');
const gen_uuid = require('uuid/v4');
const memegen =  require('meme-maker');
const Discord =  require("discord.js");
const client = new Discord.Client();

const defaults_dir = 'defaults';

const get_filename_promise = (link, filename) => {
    if (link.length == 0)
        return new Promise((resolve, reject) => resolve(link));
    else
        return download.image({url: link, dest: filename});
};

const get_image_traits = (text) => {
    const replacement = gen_uuid();
    let [tt, bt, tf, bf] = text.replace('\\@', replacement).split('@').map(str => str.replace(replacement, '@').trim().toUpperCase());
    
    const top_font = (tf !== undefined && !isNaN(tf)) ? +tf : 50;
    const bot_font = (bf !== undefined && !isNaN(tf) && !isNaN(bf)) ? +bf : top_font;
    
    if (bt === undefined) {
        bt = tt;
        tt = '';
    }

    return [tt, bt, top_font, bot_font];
};

const fragment_sentence = (str, chunk_size) => {
    parts = str.split(' ').reduce(([H, ...T], word) => (H && H.length + word.length < chunk_size) ? [H + ' ' + word, ...T] : [word, H, ...T], []);
    parts.reverse();
    return parts.filter(e => e !== undefined);
};

const make_meme = (src, dst, [top_text, bot_text, top_font, bot_font], callback) => {
    console.log("Making a meme with ${top_text} ${bot_text}");
    let img = gm(src);
    img.size((_, {width: w, height: h}) => {

        const get_metrics = (text, font, is_top) => {
            const padding = (31 / 50) * font;
            const max_chars_per_line = (24 / 620) * w * 50 / font;
            const parts = fragment_sentence(text, max_chars_per_line);
            const size = is_top ? Math.abs((h / 2) - 1 - padding * parts.length) * -1 : h / 2 - padding * parts.length;
            return [parts, size];
        };

        const [top_parts, top_size] = get_metrics(top_text, top_font, true);
        const [bot_parts, bot_size] = get_metrics(bot_text, bot_font, false);
        img
            .font(__dirname + '/impact.ttf', top_font)
            .fill('#FFF')
            .stroke('#000', 2)
            .drawText(0, top_size, top_parts.join('\n'), 'center')
            .font(__dirname + '/impact.ttf', bot_font)
            .fill('#FFF')
            .stroke('#000', 2)
            .drawText(0, bot_size, bot_parts.join('\n'), 'center')
            .write(dst, callback);
    });
};
 
client.on("ready", () => client.on("message", message => {
    if (!message.author.bot && message.channel.type === "dm") {
        console.log("ok");

        const default_file = defaults_dir + '/' + message.author.id.toString() + ".png";
        const default_exists = fs.existsSync(default_file);

        if (message.content.toUpperCase() === "SET DEFAULT" && message.attachments.size > 0) {
            download.image({url: message.attachments.first().url, dest: default_file}).then(_ => message.channel.send("Set new default image"));
        }
        else if (message.content.toUpperCase() === "RESTORE" && default_exists) {
            fs.unlink(default_file, () => message.channel.send("Restored the doge"));
        }
        else {
            
            const imgurl = (message.attachments.size > 0) ? message.attachments.first().url : "";
            const memefile = gen_uuid() + ".png";
            const filename = (imgurl.length > 0) ? memefile : (default_exists ? default_file : 'doge.png');
            console.log("Makes sense btw ${imgurl} ${memefile} ${filename}");

	        get_filename_promise(imgurl, filename).then(_ => {
                make_meme(filename, memefile, get_image_traits(message.content), () => {
                    message.channel.send("", {files: [memefile]}).then(_ => {
                        fs.unlinkSync(memefile);
                    });
                });
            }).catch(console.log);
        }
    }
}));

client.login(fs.readFileSync('bot_token', 'utf-8').trim());

