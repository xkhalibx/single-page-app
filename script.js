const button = document.getElementById("loadNews");
const newsContainer = document.getElementById("newsContainer");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const storyCount = document.getElementById("storyCount");

const storiesEndpoint = "https://hacker-news.firebaseio.com/v0/topstories.json";
const storyEndpoint = "https://hacker-news.firebaseio.com/v0/item/";
const storiesToLoad = 30;
let stories = [];

function showMessage(message, isError = false) {
    newsContainer.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "message";
    paragraph.textContent = message;

    if (isError) {
        const retry = document.createElement("button");
        retry.className = "message-retry";
        retry.type = "button";
        retry.textContent = "Try again";
        retry.addEventListener("click", loadStories);
        paragraph.append(" ", retry);
    }

    newsContainer.append(paragraph);
    storyCount.textContent = "";
}

function formatAge(timestamp) {
    const elapsedHours = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 3600));
    if (elapsedHours < 1) {
        return "JUST NOW";
    }
    if (elapsedHours < 24) {
        return `${elapsedHours}H AGO`;
    }
    return `${Math.floor(elapsedHours / 24)}D AGO`;
}

function isSafeStoryUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function getStoryUrl(story) {
    return isSafeStoryUrl(story.url)
        ? story.url
        : `https://news.ycombinator.com/item?id=${encodeURIComponent(story.id)}`;
}

function createStoryCard(story) {
    const article = document.createElement("article");
    article.className = "article";

    const meta = document.createElement("div");
    meta.className = "story-meta";

    const score = document.createElement("span");
    score.textContent = `${story.score ?? 0} POINTS`;

    const author = document.createElement("span");
    author.textContent = `BY ${story.by || "UNKNOWN"}`;

    const age = document.createElement("span");
    age.textContent = formatAge(story.time);

    meta.append(score, author, age);

    const heading = document.createElement("h3");
    heading.className = "story-title";
    const title = document.createElement("a");
    title.href = getStoryUrl(story);
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = story.title || "Untitled story";
    heading.append(title);

    const link = document.createElement("a");
    link.className = "story-link";
    link.href = `https://news.ycombinator.com/item?id=${encodeURIComponent(story.id)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append("Discuss on Hacker News ", Object.assign(document.createElement("span"), { textContent: "↗" }));

    article.append(meta, heading, link);
    return article;
}

function renderStories(searchTerm = searchInput.value) {
    const query = searchTerm.trim().toLocaleLowerCase();
    const filteredStories = stories.filter((story) =>
        `${story.title} ${story.by}`.toLocaleLowerCase().includes(query)
    );

    newsContainer.replaceChildren();
    storyCount.textContent = `${filteredStories.length} ${filteredStories.length === 1 ? "STORY" : "STORIES"}`;

    if (filteredStories.length === 0) {
        const message = query
            ? "No stories match your search. Try another keyword."
            : "No stories are available right now. Refresh to try again.";
        const paragraph = document.createElement("p");
        paragraph.className = "message";
        paragraph.textContent = message;
        newsContainer.append(paragraph);
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const story of filteredStories) {
        fragment.append(createStoryCard(story));
    }
    newsContainer.append(fragment);
}

async function loadStories() {
    button.disabled = true;
    newsContainer.setAttribute("aria-busy", "true");
    showMessage("Fetching the latest stories...");

    try {
        const response = await fetch(storiesEndpoint);
        if (!response.ok) {
            throw new Error(`Could not load story list (${response.status}).`);
        }

        const storyIds = await response.json();
        if (!Array.isArray(storyIds)) {
            throw new Error("The Hacker News API returned an invalid story list.");
        }

        const responses = await Promise.all(
            storyIds.slice(0, storiesToLoad).map(async (id) => {
                const storyResponse = await fetch(`${storyEndpoint}${id}.json`);
                if (!storyResponse.ok) {
                    throw new Error(`Could not load story ${id} (${storyResponse.status}).`);
                }
                return storyResponse.json();
            })
        );

        stories = responses.filter(
            (story) => story && !story.deleted && !story.dead && story.title
        );
        renderStories();
    } catch (error) {
        console.error("Unable to load Hacker News stories:", error);
        showMessage("Stories couldn't be loaded. Check your connection and try again.", true);
    } finally {
        button.disabled = false;
        newsContainer.setAttribute("aria-busy", "false");
    }
}

button.addEventListener("click", loadStories);
searchInput.addEventListener("input", () => renderStories(searchInput.value));
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!searchForm.reportValidity()) {
        return;
    }

    const searchTerm = new FormData(searchForm).get("q")?.toString() ?? "";
    renderStories(searchTerm);
});
document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== searchInput) {
        event.preventDefault();
        searchInput.focus();
    }
});

loadStories();
