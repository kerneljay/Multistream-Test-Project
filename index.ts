import NodeMediaServer from "node-media-server";
import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

// Load config
const ffmpegPath = process.env.FFMPEG_PATH;
const obsKey = process.env.OBS_KEY;

const youtubeKey = process.env.YOUTUBE_KEY;
const twitchKey = process.env.TWITCH_KEY;
const kickKey = process.env.KICK_KEY;
const kickUrl = process.env.KICK_URL;

const enableYouTube = process.env.ENABLE_YOUTUBE === "true";
const enableTwitch = process.env.ENABLE_TWITCH === "true";
const enableKick = process.env.ENABLE_KICK === "true";

const closeServerOnStreamEnd = true;
const ffmpegProcesses: any[] = [];

// Logging override
function safeLog(...message: string[]) {
  const joined = message.join(" ");
  if (
    [youtubeKey, twitchKey, kickKey].some((key) => key && joined.includes(key))
  )
    return;
  if (
    message.join(" ").includes("v4.0.18") ||
    message.join(" ").includes("Author") ||
    message.join(" ").includes("Homepage") ||
    message.join(" ").includes("License")
  )
    return;
  if (joined.includes("undefined")) {
    console.error(joined);
    return;
  }

  if (
    joined.includes("v4.0.18") ||
    joined.includes("Author") ||
    joined.includes("Homepage") ||
    joined.includes("License")
  )
    return;

  console.info(joined);
}
console.log = safeLog;

// NodeMediaServer config
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
  safeLog("Stopping stream...");
  ffmpegProcesses.forEach((proc) => proc.kill());
  nms.stop();
  process.exit();
}

["SIGINT", "SIGTERM", "exit"].forEach((signal) =>
  process.on(signal, () => handleStoppingStream())
);

// Centralized stream launcher
function startStream(targetName: string, targetUrl: string) {
  const args = [
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
    targetUrl,
  ];

  if (!ffmpegPath) {
    console.error(
      "FFmpeg path not provided. Please set the FFMPEG_PATH environment variable."
    );
    return;
  }

  const proc = spawn(ffmpegPath, args, {
    stdio: ["ignore", "inherit", "inherit"],
  });

  if (!proc) {
    console.error(`Failed to start ${targetName} FFmpeg process.`);
    return;
  }

  proc.on("error", (err: any) => {
    console.error(`${targetName} FFmpeg error:`, err);
  });

  proc.on("exit", (code: any, signal: any) => {
    safeLog(`${targetName} FFmpeg exited with code ${code}, signal ${signal}`);
    if (closeServerOnStreamEnd) handleStoppingStream();
  });

  console.log(`${targetName} FFmpeg process started.`);
  ffmpegProcesses.push(proc);
}

// Start enabled streams
if (enableYouTube && youtubeKey) {
  startStream("YouTube", `rtmp://a.rtmp.youtube.com/live2/${youtubeKey}`);
}
if (enableTwitch && twitchKey) {
  startStream("Twitch", `rtmp://live.twitch.tv/app/${twitchKey}`);
}
if (enableKick && kickKey && kickUrl) {
  startStream("Kick", `${kickUrl}/app/${kickKey}`);
}

// Health check
setInterval(() => {
  ffmpegProcesses.forEach((proc, idx) => {
    if (proc.killed) {
      console.warn(`⚠️ FFmpeg process #${idx} appears to be stopped.`);
    }
  });
}, 60000);

safeLog("Twitch Stream: ", enableTwitch ? "Enabled" : "Disabled");
safeLog("YouTube Stream: ", enableYouTube ? "Enabled" : "Disabled");
safeLog("Kick Stream: ", enableKick ? "Enabled" : "Disabled");
safeLog("🟢 Server running and ready to stream.");
