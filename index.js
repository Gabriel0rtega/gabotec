const { executionAsyncResource } = require('async_hooks');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
    key: "AIzaSyDIt8YGy3AvdU-R6Sf01JlV_2Q9chT_pAs",
    revealed: true
});

const client = new Discord.Client();
const queue = new Map();
client.on("ready", () => {
    console.log("!Estoy Listo!")
})

client.on("message", async(message) => {
    const prefix = '*';
    const serverQueue = queue.get(message.guild.id);
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase();

    switch(command){
        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
    }

    async function execute(message, serverQueue){
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("Porfavor únase a un chat de voz");
        }else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            const songInfo = await ytdl.getInfo(result.first.url)

            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };

            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };
                queue.set(message.guild.id, queueConstructor);

                queueConstructor.songs.push(song);

                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                }catch (err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`Incapaz de únirse al chat de voz ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send(`La canción ha sido añadida ${song.url}`);
            }
        }
    }
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('Terminda', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`Ahora sonando ${serverQueue.songs[0].url}`)
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("¡necesitas únirte a un canal de voz!")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("¡necesitas únirte a un canal de voz!");
        if(!serverQueue)
            return message.channel.send("No hay nada que saltar!");
        serverQueue.connection.dispatcher.end();
    }
})

client.login("ODEzODAzMDMyMzI3NjE4NjUw.YDUnIg.TY81fAcaVcj7qP-GV3sUB9DHkYg")