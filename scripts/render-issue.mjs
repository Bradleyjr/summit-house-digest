import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultIssueSlug = "2026-05-25";
const indexPath = path.join(projectRoot, "index.html");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const attr = escapeHtml;
const renderLineBreaks = (value = "") => escapeHtml(value).replaceAll("\n", "<br />");

const compact = (html) =>
  html
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

const classes = (...items) => items.filter(Boolean).join(" ");
const slugClass = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const renderMasthead = (issue) => `
      <section class="masthead section-reveal" aria-labelledby="issue-title">
        <canvas class="masthead__print-field" aria-hidden="true"></canvas>
        <div class="masthead__frame">
          <img
            class="masthead__logo"
            src="${attr(issue.masthead.logo.src)}"
            alt="${attr(issue.masthead.logo.alt)}"
          />
          <div class="masthead__meta">
            <span>${escapeHtml(issue.title)}</span>
            <span>Issue ${escapeHtml(issue.issueNumber)}</span>
            <span>${escapeHtml(issue.weekLabel)}</span>
          </div>
          <h1 id="issue-title" class="masthead__title">
            ${escapeHtml(issue.masthead.headline)}
          </h1>
${issue.masthead.dek ? `          <p class="masthead__note">
            ${escapeHtml(issue.masthead.dek)}
          </p>` : ""}
        </div>
        <aside class="masthead__index" aria-label="Issue sections">
${issue.masthead.nav.map((item) => `          <a href="${attr(item.href)}">${escapeHtml(item.label)}</a>`).join("\n")}
        </aside>
      </section>`;

const renderWeekCard = (card) => {
  const cardClass = classes(
    "week-card",
    card.variant === "wide" && "week-card--wide",
    card.variant === "dark" && "week-card--dark",
    card.variant === "occasions" && "week-card--occasions"
  );
  const items = Array.isArray(card.items)
    ? `\n            <ul class="week-card__items">\n${card.items
        .map((item) => {
          const itemClass = classes("week-card__item", item.label && `week-card__item--${slugClass(item.label)}`);
          return `              <li class="${itemClass}" data-occasion="${attr(slugClass(item.label))}"><span>${escapeHtml(item.label)}</span><p>${escapeHtml(item.text)}</p></li>`;
        })
        .join("\n")}\n            </ul>`
    : "";

  return `          <article class="${cardClass}">
${card.label && !card.hideIntro ? `            <span class="week-card__label">${escapeHtml(card.label)}</span>` : ""}
${Number.isFinite(Number(card.count)) ? `            <strong data-count="${attr(card.count)}">${escapeHtml(card.count)}</strong>` : ""}
${card.text && !card.hideIntro ? `            <p>${escapeHtml(card.text)}</p>` : ""}${items}
${card.variant === "occasions" ? `            <div class="week-card__controls" aria-label="Cycle occasion cards">
              <button type="button" class="week-card__control" data-occasion-prev aria-label="Previous occasion card"><span>Prev</span></button>
              <button type="button" class="week-card__control" data-occasion-next aria-label="Next occasion card"><span>Next</span></button>
            </div>` : ""}
          </article>`;
};

const renderWeek = (week) => `
      <section id="week" class="${classes("week-grid", week.variant === "single-block" && "week-grid--single", "section-reveal")}" aria-labelledby="week-title">
        <div class="section-coordinate">${escapeHtml(week.coordinate)}</div>
        <h2 id="week-title" class="week-grid__title">${renderLineBreaks(week.title)}</h2>
        <div class="week-grid__items">
${week.cards.map(renderWeekCard).join("\n")}
        </div>
      </section>`;

const renderFeature = (feature) => `
      <section id="feature" class="feature-spread section-reveal" aria-labelledby="feature-title">
        <div class="feature-spread__copy">
          <div class="section-coordinate">${escapeHtml(feature.coordinate)}</div>
          <p class="feature-spread__kicker">${escapeHtml(feature.kicker)}</p>
          <h2 id="feature-title">${escapeHtml(feature.title)}</h2>
          <p>
            ${escapeHtml(feature.body)}
          </p>
        </div>
        <div class="feature-spread__image-stack" aria-label="Summit House brand imagery">
${feature.images
  .map(
    (image) => `          <figure class="image-slab ${attr(image.className)}">
            <img src="${attr(image.src)}" alt="${attr(image.alt)}" />
          </figure>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderBusinessUnits = (businessUnits) => `
      <section id="business-units" class="bu-section section-reveal" aria-labelledby="bu-title">
        <div class="bu-section__header">
          <div class="section-coordinate">${escapeHtml(businessUnits.coordinate)}</div>
          <h2 id="bu-title">${escapeHtml(businessUnits.title)}</h2>
        </div>
        <div class="bu-editorial">
          <div class="bu-intro">
            <div class="bu-intro__copy">
              <p class="bu-editorial__lead">
                ${escapeHtml(businessUnits.lead)}
              </p>
              <p class="bu-intro__note">
                ${escapeHtml(businessUnits.note)}
              </p>
            </div>
            <figure class="bu-intro__image">
              <img src="${attr(businessUnits.primaryImage.src)}" alt="${attr(businessUnits.primaryImage.alt)}" />
            </figure>
            <figure class="bu-intro__thumb">
              <img src="${attr(businessUnits.supportingImage.src)}" alt="${attr(businessUnits.supportingImage.alt)}" />
            </figure>
          </div>
          <div class="${classes("bu-notes-list", businessUnits.variant === "sh-primary" && "bu-notes-list--sh-primary")}" aria-label="Business unit highlights">
${businessUnits.notes
  .map(
    (note) => `            <article class="${classes(note.featured && "is-primary")}" data-preview="${attr(note.preview)}">
              <span>${escapeHtml(note.unit)}</span>
              <p>${escapeHtml(note.text)}</p>
            </article>`
  )
  .join("\n")}
          </div>
          <div class="agency-preview" aria-hidden="true">
            <img src="assets/images/summit-house-logomark-ink.png" alt="" />
          </div>
        </div>
      </section>`;

const renderLessons = (lessons) => `
      <section id="lessons" class="lesson-band section-reveal" aria-labelledby="lesson-title">
        <div class="section-coordinate">${escapeHtml(lessons.coordinate)}</div>
        <h2 id="lesson-title">${escapeHtml(lessons.title)}</h2>
        <figure class="lesson-band__image">
          <img src="${attr(lessons.image.src)}" alt="${attr(lessons.image.alt)}" />
        </figure>
        <div class="lesson-band__note">
          <p>
            ${escapeHtml(lessons.body)}
          </p>
          <div class="lesson-band__credit">${escapeHtml(lessons.credit)}</div>
        </div>
      </section>`;

const renderSharing = (sharing) => {
  const first = sharing.posts[0];
  return `
      <section id="sharing" class="sharing-section section-reveal" aria-labelledby="sharing-title">
        <div class="sharing-section__title">
          <div class="section-coordinate">${escapeHtml(sharing.coordinate)}</div>
          <h2 id="sharing-title">${escapeHtml(sharing.title)}</h2>
        </div>
        <div class="share-carousel share-observatory" aria-label="LinkedIn posts from the week">
          <div class="share-carousel__stage share-observatory__wall">
${sharing.posts
  .map(
    (post, index) => `            <figure class="share-post${index === 0 ? " is-active" : ""}" data-title="${attr(post.title)}" data-source="${attr(post.source)}" data-index="${attr(post.index)}">
              <img src="${attr(post.image)}" alt="${attr(post.alt)}" />
              <figcaption><span>${escapeHtml(post.index)} / ${escapeHtml(post.unit)}</span><strong>${escapeHtml(post.caption)}</strong></figcaption>
            </figure>`
  )
  .join("\n")}
          </div>
          <div class="share-theater__details share-observatory__details">
            <div class="share-carousel__copy" aria-live="polite">
              <span class="share-carousel__source">${escapeHtml(first.source)}</span>
              <h3>${escapeHtml(first.title)}</h3>
              <p>
                ${escapeHtml(sharing.body)}
              </p>
            </div>
            <div class="share-carousel__controls">
              <button type="button" class="share-carousel__button" data-carousel-prev aria-label="Previous LinkedIn post">
                <span>Prev</span>
              </button>
              <div class="share-carousel__progress" aria-hidden="true">
                <span></span>
              </div>
              <button type="button" class="share-carousel__button" data-carousel-next aria-label="Next LinkedIn post">
                <span>Next</span>
              </button>
            </div>
          </div>
          <div class="share-theater__thumbs share-observatory__rail" aria-label="Choose a LinkedIn post">
${sharing.posts
  .map(
    (post, index) => `            <button type="button" class="share-thumb${index === 0 ? " is-active" : ""}" data-post-index="${index}">
              <img src="${attr(post.image)}" alt="" />
              <span>${escapeHtml(post.index)} / ${escapeHtml(post.unit)}</span>
            </button>`
  )
  .join("\n")}
          </div>
        </div>
      </section>`;
};

const renderFooter = (footer) => `
      <footer class="issue-footer section-reveal">
        <img
          class="issue-footer__mascot"
          src="${attr(footer.mascot.src)}"
          alt="${attr(footer.mascot.alt)}"
          aria-hidden="true"
        />
        <div class="issue-footer__meta">
${footer.links.map((link) => `          <span>${escapeHtml(link)}</span>`).join("\n")}
        </div>
      </footer>`;

export const readIssue = async (issueSlug = defaultIssueSlug) => {
  const issuePath = path.join(projectRoot, "issues", issueSlug, "issue.json");
  return JSON.parse(await fs.readFile(issuePath, "utf8"));
};

export const renderMain = (issue) =>
  compact(`<main class="${classes("issue", issue.layoutVariant && `issue--${issue.layoutVariant}`)}">
${[
  renderMasthead(issue),
  renderWeek(issue.week),
  renderFeature(issue.feature),
  renderBusinessUnits(issue.businessUnits),
  renderLessons(issue.lessons),
  renderSharing(issue.sharing),
  renderFooter(issue.footer)
].join("\n\n")}
    </main>`);

export const renderIssueDocument = (templateHtml, issue, { baseHref } = {}) => {
  const withBase = baseHref
    ? templateHtml.replace(/<head>\s*/, `<head>\n    <base href="${attr(baseHref)}" />\n    `)
    : templateHtml;
  return withBase.replace(/<main class="issue(?:\s[^"]*)?">[\s\S]*?<\/main>/, renderMain(issue));
};

export const renderIssueToIndex = async (issueSlug = defaultIssueSlug) => {
  const issue = await readIssue(issueSlug);
  const html = await fs.readFile(indexPath, "utf8");
  const nextHtml = renderIssueDocument(html, issue);

  if (nextHtml === html) {
    console.log(`No changes. ${issueSlug} is already rendered.`);
  } else {
    await fs.writeFile(indexPath, nextHtml);
    console.log(`Rendered ${issueSlug} to ${path.relative(projectRoot, indexPath)}.`);
  }
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await renderIssueToIndex(process.argv[2] || defaultIssueSlug);
}
