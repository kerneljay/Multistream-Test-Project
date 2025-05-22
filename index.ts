import NodeMediaServer from "node-media-server";
import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const closeServerOnStreamEnd = false;
const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe"; // This is ur FFmpeg path
const obsKey = "heyobs"; // This is ur OBS stream key

const youtubeKey = process.env.YOUTUBE_KEY;
const twitchStreamKey = process.env.TWITCH_KEY;
const kickKey = process.env.KICK_KEY;
const kickUrl = process.env.KICK_URL;

const twitch = true; // wanna stream to twitch? go ahead!
const youtube = true; // wanna stream to youtube? go ahead!
const kick = true; // wanna stream to kick? go ahead!

console.log("Twitch Stream: ", twitch ? "Enabled" : "Disabled");
console.log("Youtube Stream: ", youtube ? "Enabled" : "Disabled");
console.log("Kick Stream: ", kick ? "Enabled" : "Disabled");

// Override console logging in NodeMediaServer
console.log = (...message) => {
  if (message.join(" ").includes("close")) {
    if (closeServerOnStreamEnd) {
      handleStoppingStream();
    }
    return;
  }
  if (
    typeof kickKey === "string" &&
    typeof twitchStreamKey === "string" &&
    typeof youtubeKey === "string"
  ) {
    if (
      message.join(" ").includes(kickKey) ||
      message.join(" ").includes(twitchStreamKey) ||
      message.join(" ").includes(youtubeKey)
    ) {
      return;
    }
  }
  if (
    message.join(" ").includes("v4.0.18") ||
    message.join(" ").includes("Author") ||
    message.join(" ").includes("Homepage") ||
    message.join(" ").includes("License")
  )
    return;
  if (message.join(" ").includes("undefined")) {
    console.error(message.join(" "));
    return;
  }
  console.info(message.join(" "));
};

// console.info = () => {};
// console.warn = () => {};
// console.error = () => {};

const config = {
  rtmp: {
    port: 1935,
    gop_cache: true,
  },
  http: {
    port: 8000,
    allow_origin: "*",
    mediaroot: "./media",
  },
};
const nms = new NodeMediaServer(config);
nms.run();

function handleStoppingStream() {
  // This means the RTMP server closes locally whenever we stop the stream (this is a energy saving setting)
  console.log("Stopping stream");
  process.exit();
}

// YOUTUBE INTEGRATION //
function startYoutube() {
  const youtubeArgs = [
    "-hide_banner", // don’t show the build/config banner
    "-loglevel",
    "error", // only show actual errors
    "-re",
    "-i",
    `rtmp://localhost/live/${obsKey}`,
    "-c",
    "copy",
    "-f",
    "flv",
    `rtmp://a.rtmp.youtube.com/live2/${youtubeKey}`,
  ];
  const ffmpegYouTube = spawn(ffmpegPath, youtubeArgs, { stdio: "inherit" });
  return ffmpegYouTube;
}

if (youtube) {
  const ffmpegYouTube = startYoutube();
  ffmpegYouTube.on("error", (err) => {
    console.error("YouTube FFmpeg failed to start:", err);
  });
  ffmpegYouTube.on("exit", (code, signal) => {
    console.log(`YouTube FFmpeg exited with code ${code}, signal ${signal}`);
  });
}
// END OF YOUTUBE INTEGRATION //

// TWITCH INTEGRATION //
function startTwitch() {
  const twitchArgs = [
    "-hide_banner", // don’t show the build/config banner
    "-loglevel",
    "error", // only show actual errors
    "-re",
    "-i",
    `rtmp://localhost/live/${obsKey}`,
    "-c",
    "copy",
    "-f",
    "flv",
    `rtmp://live.twitch.tv/app/${twitchStreamKey}`,
  ];
  const ffmpegTwitch = spawn(ffmpegPath, twitchArgs, { stdio: "inherit" });
  return ffmpegTwitch;
}

if (twitch) {
  const ffmpegTwitch = startTwitch();
  ffmpegTwitch.on("error", (err) => {
    console.error("Twitch FFmpeg failed to start:", err);
  });
  ffmpegTwitch.on("exit", (code, signal) => {
    console.log(`Twitch FFmpeg exited with code ${code}, signal ${signal}`);
  });
}
// END OF TWITCH INTEGRATION //

// KICK INTEGRATION //
function startKick() {
  const xArgs = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-re",
    "-i",
    `rtmp://localhost/live/${obsKey}`,
    "-c",
    "copy",
    "-f",
    "flv",
    `rtmps://${kickUrl}/app/${kickKey}`, // Put the Kick URL here
  ];

  const ffmpegKick = spawn(ffmpegPath, xArgs, { stdio: "inherit" });
  return ffmpegKick;
}

if (kick) {
  const ffmpegKick = startKick();
  ffmpegKick.on("error", (err) => {
    console.error("Kick FFmpeg failed to start:", err);
  });
  ffmpegKick.on("exit", (code, signal) => {
    console.log(`Kick FFmpeg exited with code ${code}, signal ${signal}`);
  });
}
// END OF Kick INTEGRATION //
