const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");
const { URL } = require("url");

// axios instance with headers (fixes 403)
const http = axios.create({
    timeout: 20000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    maxRedirects: 5
});

async function downloadBinary(url, filepath) {
    try {
        const response = await http.get(url, { responseType: "arraybuffer" });
        await fs.outputFile(filepath, response.data);
        console.log("Downloaded:", url);
    } catch (err) {
        console.log("Download failed:", url, err.response?.status || err.message);
    }
}

function getFullUrl(base, link) {
    try {
        return new URL(link, base).href;
    } catch {
        return null;
    }
}

async function cloneWebsite(siteUrl) {
    console.log("Cloning:", siteUrl);

    fs.emptyDirSync("output");

    // Fetch main HTML
    const response = await http.get(siteUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Folders
    const folders = {
        images: "output/images",
        videos: "output/videos",
        css: "output/css",
        js: "output/js"
    };

    for (let folder of Object.values(folders)) fs.ensureDirSync(folder);

    // Helper to process any asset (image, css, js, video...)
 async function processAsset(src, folder, prefix) {
    if (!src) return null;

    const full = getFullUrl(siteUrl, src);
    if (!full) return null;

    const ext = path.extname(full).split("?")[0] || "";
    const filename = `${prefix}_${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(folder, filename);

    await downloadBinary(full, filepath);

    // return relative path
    return path.relative("output", filepath).replace(/\\/g, "/");
}

    // DOWNLOAD IMAGES (SYNC LOOP)
    const imgTags = $("img").toArray();
    for (let tag of imgTags) {
        const old = $(tag).attr("src");
        const local = await processAsset(old, folders.images, "img");
        if (local) $(tag).attr("src", local);
    }

    // DOWNLOAD VIDEO FILES
    const videoTags = $("video, video source").toArray();
    for (let tag of videoTags) {
        const old = $(tag).attr("src");
        const local = await processAsset(old, folders.videos, "video");
        if (local) $(tag).attr("src", local);
    }

    // DOWNLOAD CSS
    const cssTags = $("link[rel='stylesheet']").toArray();
    for (let tag of cssTags) {
        const old = $(tag).attr("href");
        const local = await processAsset(old, folders.css, "css");
        if (local) $(tag).attr("href", local);
    }

    // DOWNLOAD JS
    const jsTags = $("script").toArray();
    for (let tag of jsTags) {
        const old = $(tag).attr("src");
        if (!old) continue;
        const local = await processAsset(old, folders.js, "js");
        if (local) $(tag).attr("src", local);
    }

    // SAVE FINAL HTML
    fs.writeFileSync("output/index.html", $.html());
    console.log("Done! Saved to /output");
}

// RUN
const url = process.argv[2];
if (!url) {
    console.log("Usage: node scrape.js <URL>");
    process.exit(1);
}

cloneWebsite(url).catch((err) => {
    console.error("Scraper crashed:", err);
    process.exit(1);
});
