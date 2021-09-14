// import dependencies
const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');
const ytdl = require('ytdl-core');

// create our client and login using our token
const client = new Discord.Client();

const queue = new Map();

var name;
var isloop = 0;
const commandList = ["$play <youtube url> - play a song", "$skip - skip current song", "$stop - stop it from playing song", "$loop - loop current queue", "$exitloop - stop looping", "$get queue - display current queue", "$get song - display current song", "$dc - disconnect bot from voice channel", "$command - display command list"];

//basic listener for console.log
client.once('ready', () => {
    console.log('Ready!');
   });
   client.once('reconnecting', () => {
    console.log('Reconnecting!');
   });
   client.once('disconnect', () => {
    console.log('Disconnect!');
   });

client.on('message', async message => {
    // ignore if message is from bot
    if (message.author.bot) return;
    // ignore if message not starting with prefix defined
    if (!message.content.startsWith(prefix)) return;


    const serverQueue = queue.get(message.guild.id);
    if (message.content.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
     return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
     return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
     return;
    } else if (message.content.startsWith(`${prefix}loop`)) {
      isloop = 1;
      message.channel.send(`${message.author.tag} has started the loop`);
      console.log(serverQueue.songs);
      return;
    } else if (message.content.startsWith(`${prefix}exitloop`)) {
      isloop = 0;
      message.channel.send(`${message.author.tag} has stopped the loop`);
      return;
    } else if (message.content.startsWith(`${prefix}get queue`)) {
      message.channel.send(`Current queue:`);
      for(let x = 0; x < serverQueue.songs.length; x++){
        message.channel.send(`${x + 1}. ${serverQueue.songs[x].title}`);
      }
      return;
    } else if(message.content.startsWith(`${prefix}get song`)){
      message.channel.send(`Current song: ${serverQueue.songs[0].title}`);
      return;
    } else if(message.content.startsWith(`${prefix}dc`)){
      message.channel.send(`Bye`);
      serverQueue.voiceChannel.leave();
      queue.delete(message.guild.id);
      return;
    } else if (message.content === '$dummy bot') {
      message.reply('???');
      return;
    } else if (message.content === '$niubi') {
      message.reply('Thanks, i know i am');
      return;
    } else if (message.content === '$command') {
      message.channel.send(`Command :`);
      for (let x = 0; x < commandList.length; x++) {
        message.channel.send(`${x+1}. ${commandList[x]}`);
      }
      return;
    } else {
      message.channel.send("Haiyaa you've entered an invalid command.");
    } 
})

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    // check if the user is in the voice channel
    if (!voiceChannel)
      return message.channel.send(
        "Haiyaa you are not in a voice channel."
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    // check bot permission
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "Eh bro, give me permission to join and speak la."
      );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };


    if (!serverQueue) {
        // Creating the contract for our queue
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        // Setting the queue using our contract
        queue.set(message.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);
  
        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            // Calling the play function to start a song
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`${song.title} is added to queue`);
    }
}



function skip(message, serverQueue) {
    // if not inside a channel
    if (!message.member.voice.channel)
      return message.channel.send(
        "Yo bro, you are not inside a voice channel!"
      );
      // if no song to skip
    if (!serverQueue)
      return message.channel.send("No song to skip!");
    serverQueue.connection.dispatcher.end();
    return serverQueue.textChannel.send(`**${storeSongName(0, 0)}** has been skipped by ${message.author.username}`);
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Haiyaa you have to be in a voice channel to stop the music!"
      );
      
    if (!serverQueue)
      return message.channel.send("There is no song that I could stop!");
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    return serverQueue.textChannel.send(`**${storeSongName(0, 0)}** has been stopped by ${message.author.username}`);
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        setTimeout(function() {
          if(!song){
            serverQueue.voiceChannel.leave()
          }
        }, 300000);
        queue.delete(guild.id);
        return;
    }
    
    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      if(isloop == 1) {
        serverQueue.songs.push(serverQueue.songs[0])
        console.log(serverQueue.songs);
      }
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]); 
    })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now playing: **${song.title}**`);
    storeSongName(song.title, 1);
  }

function storeSongName(songName, stat){

    if(stat == 1){
        name = songName;
    }
    else if(stat == 0) {
        return name;
    }
}



client.login(token);