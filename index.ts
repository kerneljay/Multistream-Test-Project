import NodeMediaServer from "node-media-server";
import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
const obsKey = "heyobs";

const youtubeKey = process.env.YOUTUBE_KEY;
const twitchStreamKey = process.env.TWITCH_KEY;
const xKey = process.env.X_KEY;

const twitch = true;
const youtube = true;
const x = true;

console.log("Twitch Stream: ", twitch ? "Enabled" : "Disabled");
console.log("Youtube Stream: ", youtube ? "Enabled" : "Disabled");
console.log("X Stream: ", x ? "Enabled" : "Disabled");

// Override console logging in NodeMediaServer
console.log = (...message) => {
  if (message.join(" ").includes("close")) {
    handleStoppingStream();
    return;
  }
  if (
    typeof xKey === "string" &&
    typeof twitchStreamKey === "string" &&
    typeof youtubeKey === "string"
  ) {
    if (
      message.join(" ").includes(xKey) ||
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
    return; // Hide homepage/url
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
  // This means the RTMP server closes locally whenever we stop the stream
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

// X INTEGRATION //
function startX() {
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
    `rtmps://fa723fc1b171.global-contribute.live-video.net/app/${xKey}`, // corrected
  ];

  const ffmpegX = spawn(ffmpegPath, xArgs, { stdio: "inherit" });
  return ffmpegX;
}

if (x) {
  const ffmpegX = startX();
  ffmpegX.on("error", (err) => {
    console.error("X FFmpeg failed to start:", err);
  });
  ffmpegX.on("exit", (code, signal) => {
    console.log(`X FFmpeg exited with code ${code}, signal ${signal}`);
  });
}
// END OF X INTEGRATION //
