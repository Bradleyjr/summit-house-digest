import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const issueSlug = process.argv[2] || "2026-05-25";
const port = Number(process.env.PORT || 4174);

const loadPlaywright = () => {
  try {
    return require("playwright");
  } catch {
    console.error(
      [
        "Playwright is not installed in this project.",
        "From the project root, run:",
        "  npm install",
        "  npx playwright install chromium",
        "then run QA again."
      ].join("\n")
    );
    process.exit(1);
  }
};

const { chromium } = loadPlaywright();

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ttf", "font/ttf"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const fullPath = path.normalize(path.join(projectRoot, relativePath));

    if (!fullPath.startsWith(projectRoot)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const body = await fs.readFile(fullPath);
    response.writeHead(200, {
      "content-type": contentTypes.get(path.extname(fullPath)) || "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(port, resolve));

const fail = (messages) => {
  server.close();
  console.error(messages.join("\n"));
  process.exit(1);
};

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  server.close();
  console.error(
    [
      "Could not launch the Chromium browser for QA.",
      `Reason: ${error.message}`,
      "",
      "If this is a fresh machine, install the browser once:",
      "  npx playwright install chromium",
      "then run QA again."
    ].join("\n")
  );
  process.exit(1);
}
const failures = [];

for (const viewport of [
  { width: 1408, height: 972 },
  { width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`http://localhost:${port}/digest/${issueSlug}/`, { waitUntil: "networkidle" });

  const report = await page.evaluate(() => {
    const brokenImages = [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute("src"));
    const footer = document.querySelector(".issue-footer");
    const mascot = document.querySelector(".issue-footer__mascot");
    const lessonImage = document.querySelector(".lesson-band__image");
    const progress = document.querySelector(".share-carousel__progress span");

    return {
      title: document.title,
      brokenImages,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      lessonSpans: document.querySelectorAll("#lesson-title span").length,
      lessonBorder: getComputedStyle(lessonImage, "::before").borderTopWidth,
      footerBefore: getComputedStyle(footer, "::before").content,
      mascotCount: document.querySelectorAll(".issue-footer__mascot").length,
      mascotOpacity: Number(getComputedStyle(mascot).opacity),
      progressTransform: getComputedStyle(progress).transform
    };
  });

  if (errors.length) failures.push(`${viewport.width}px console errors: ${errors.join("; ")}`);
  if (report.brokenImages.length) failures.push(`${viewport.width}px broken images: ${report.brokenImages.join(", ")}`);
  if (report.horizontalOverflow) failures.push(`${viewport.width}px has horizontal overflow`);
  if (report.lessonSpans !== 0) failures.push(`${viewport.width}px lesson title still has span wrappers`);
  if (report.lessonBorder !== "0px") failures.push(`${viewport.width}px lesson image border is ${report.lessonBorder}`);
  if (report.footerBefore !== "none") failures.push(`${viewport.width}px footer still has pseudo mascot`);
  if (report.mascotCount !== 1) failures.push(`${viewport.width}px expected one mascot, found ${report.mascotCount}`);
  if (report.mascotOpacity < 0.1) failures.push(`${viewport.width}px mascot opacity is too low: ${report.mascotOpacity}`);

  await page.close();
}

await browser.close();
server.close();

if (failures.length) fail(failures);

console.log(`QA passed for digest/${issueSlug}/.`);
