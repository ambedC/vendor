import ftp from "basic-ftp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

// ESM does not provide __dirname by default. Create it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isSSR = process.env.NEXT_PUBLIC_SSR === "true";
console.log("isSSR:", isSSR);

// Root path for SSR deployment
const rootPath = process.cwd();

// Folders to exclude in SSR mode
const SSR_EXCLUDE_FOLDERS = [".next", "node_modules", ".github", ".git"];

const config = {
  host: "",
  user: "",
  password: "",
  port: 21,
  localRoot: __dirname + "/build",
  remoteRoot: "/",
  include: ["*", ".htaccess"],
  exclude: ["images/**"],
  deleteRemote: false,
};

const ftpConfig = {
  host: config.host,
  user: config.user,
  password: config.password,
  secure: false,
};

const localBuildPath = "./out";
const remoteDeployPath = "/";

async function deploy() {
  const client = new ftp.Client();

  function updateProgress(message) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  }

  try {
    console.log("\x1b[33mConnecting to FTP server...\x1b[0m");
    await client.access(ftpConfig);
    console.log("\x1b[32mConnected Successfully!\n\x1b[0m");

    const totalSize = await getTotalSize(isSSR ? rootPath : localBuildPath);
    console.log(`Total size to transfer: ${formatBytes(totalSize)}`);

    let transferredBytes = 0;

    async function uploadDirectory(localDir, remoteDir, isSSRMode = false) {
      const files = await fs.promises.readdir(localDir, { withFileTypes: true });

      for (const file of files) {
        // Skip excluded folders in SSR mode
        if (isSSRMode && file.isDirectory() && SSR_EXCLUDE_FOLDERS.includes(file.name)) {
          continue;
        }

        const localPath = path.join(localDir, file.name);
        const remotePath = path.posix.join(remoteDir, file.name);

        if (file.isDirectory()) {
          try {
            await client.ensureDir(remotePath);
          } catch (dirErr) {
            console.log(`Error creating directory ${remotePath}: ${dirErr}`);
          }

          await uploadDirectory(localPath, remotePath, isSSRMode);
        } else {
          try {
            await client.uploadFrom(localPath, remotePath);

            const fileSize = (await fs.promises.stat(localPath)).size;
            transferredBytes += fileSize;

            const percentage = ((transferredBytes / totalSize) * 100).toFixed(2);

            updateProgress(
              `Progress: ${percentage}% (${formatBytes(
                transferredBytes
              )}/${formatBytes(totalSize)})`
            );
          } catch (uploadErr) {
            console.log(`Error uploading ${file.name}: ${uploadErr}`);
          }
        }
      }
    }

    if (isSSR) {
      console.log("\n🚀 SSR Mode: Uploading entire project root except excluded folders...\n");
      await uploadDirectory(rootPath, "/", true);
    } else {
      console.log("\n🚀 Static Mode: Uploading ./out build only...\n");
      await uploadDirectory(localBuildPath, remoteDeployPath, false);
    }

    console.log("\n\n\x1b[32mDeployment successful! 🚀\x1b[0m");
    console.log("\x1b[33mThank you for using Hyper Local Web App! 🎉\x1b[0m");
  } catch (err) {
    console.log(`Error deploying the web: \x1b[31m${err}\x1b[0m`);
  } finally {
    client.close();
  }
}

async function getTotalSize(dir) {
  const fileStats = await fs.promises.stat(dir);

  if (fileStats.isFile()) {
    return fileStats.size;
  } else if (fileStats.isDirectory()) {
    const files = await fs.promises.readdir(dir);
    let totalSize = 0;

    for (const file of files) {
      // Skip excluded folders for SSR
      if (isSSR && SSR_EXCLUDE_FOLDERS.includes(file)) continue;

      totalSize += await getTotalSize(path.join(dir, file));
    }

    return totalSize;
  }
  return 0;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

deploy();
