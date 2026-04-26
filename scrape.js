const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");
const { URL } = require("url");

async function downloadBinary(url, filepath) {
    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 20000
        });
        await fs.outputFile(filepath, response.data);
    } catch (err) {
        console.log("Download failed:", url);
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

    const { data: html } = await axios.get(siteUrl);
    const $ = cheerio.load(html);

    // FILE FOLDERS
    const folders = {
        images: "output/images",
        videos: "output/videos",
        css: "output/css",
        js: "output/js"
    };

    for (let p of Object.values(folders)) fs.ensureDirSync(p);

    // ---- DOWNLOAD HELPERS ----
    async function process(src, folder, prefix) {
        if (!src) return null;
        const full = getFullUrl(siteUrl, src);
        if (!full) return null;

        const ext = path.extname(full).split("?")[0] || "";
        const filename = prefix + "_" + Math.random().toString(36).slice(2) + ext;
        const filepath = path.join(folder, filename);

        await downloadBinary(full, filepath);

        return filepath;
    }

    // ---- IMAGES ----
    $("img, source, picture img").each(async function () {
        const old = $(this).attr("src");
        const local = await process(old, folders.images, "img");
        if (local) $(this).attr("src", local);
    });

    // ---- VIDEOS ----
    $("video, video source").each(async function () {
        const old = $(this).attr("src");
        const local = await process(old, folders.videos, "video");
        if (local) $(this).attr("src", local);
    });

    // ---- CSS ----
    $("link[rel='stylesheet']").each(async function () {
        const old = $(this).attr("href");
        const local = await process(old, folders.css, "css");
        if (local) $(this).attr("href", local);
    });

    // ---- JS ----
    $("script").each(async function () {
        const old = $(this).attr("src");
        if (!old) return;
        const local = await process(old, folders.js, "js");
        if (local) $(this).attr("src", local);
    });

    // ذخیره HTML نهایی
    fs.writeFileSync("output/index.html", $.html());

    console.log("Done. Saved to output/");
}

// ---- RUN ----
const url = process.argv[2];
if (!url) {
    console.log("Usage: node scrape.js <URL>");
    process.exit();
}

cloneWebsite(url);
