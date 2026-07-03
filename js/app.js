// === State ===
let currentMood = null;
let currentPoem = null;
let favorites = JSON.parse(localStorage.getItem("wenxuan_fav") || "[]");
let journal = JSON.parse(localStorage.getItem("wenxuan_journal") || "[]");
let currentView = "explore"; // explore | favorites | journal

// === DOM refs ===
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const heroQuote = $("#hero-quote");
const heroSource = $("#hero-source");
const poemCard = $("#poem-card");
const poemDailyBadge = $("#poem-daily-badge");
const poemTitle = $("#poem-title");
const poemAuthor = $("#poem-author");
const poemText = $("#poem-text");
const poemTranslation = $("#poem-translation");
const poemReflection = $("#poem-reflection");
const favBtn = $("#fav-btn");
const randomBtn = $("#random-btn");
const moodNav = $("#mood-nav");
const moodTags = $("#mood-tags");
const favoritesSection = $("#favorites-section");
const favoritesList = $("#favorites-list");
const journalSection = $("#journal-section");
const journalText = $("#journal-text");
const journalEntries = $("#journal-entries");
const journalSaveBtn = $("#journal-save-btn");

// Sections
const exploreSection = $("#explore-section");
const favSection = $("#favorites-section");
const jourSection = $("#journal-section");

// Nav
const navExplore = $("#nav-explore");
const navFav = $("#nav-fav");
const navJournal = $("#nav-journal");

// === Utility ===
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTodaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getDailyPoem() {
  const seed = getTodaySeed();
  return allPoems[seed % allPoems.length];
}

// === Render Poem ===
function renderPoem(poem, isDaily = false) {
  currentPoem = poem;
  if (isDaily) {
    poemDailyBadge.textContent = "\u2606 \u4eca\u65e5\u63a8\u8350";
    poemDailyBadge.style.display = "inline-block";
  } else {
    poemDailyBadge.style.display = "none";
  }
  poemTitle.textContent = poem.title;
  poemAuthor.textContent = `\u2014\u2014 ${poem.dynasty}\u00b7${poem.author}`;
  poemText.textContent = poem.text;

  const transLabel = poemTranslation.querySelector(".poem-translation-label");
  const transBody = poemTranslation.querySelector(".poem-translation-body");
  transBody.textContent = poem.translation;
  poemTranslation.style.display = "block";

  poemReflection.textContent = poem.reflection;

  updateFavBtn();

  // Reset animation
  poemCard.classList.remove("fade-in");
  void poemCard.offsetWidth;
  poemCard.classList.add("fade-in");
}

function updateFavBtn() {
  if (!currentPoem) return;
  const isFav = favorites.some((f) => f.id === currentPoem.id);
  favBtn.classList.toggle("favorited", isFav);
  favBtn.querySelector(".icon-text").textContent = isFav ? "\u2665" : "\u2661";
}

function toggleFavorite() {
  if (!currentPoem) return;
  const idx = favorites.findIndex((f) => f.id === currentPoem.id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({ id: currentPoem.id, title: currentPoem.title, author: currentPoem.author, mood: currentMood });
  }
  localStorage.setItem("wenxuan_fav", JSON.stringify(favorites));
  updateFavBtn();
  if (currentView === "favorites") renderFavorites();
}

// === Random / Mood ===
function showRandom() {
  currentMood = null;
  highlightMood(null);
  const poem = allPoems[Math.floor(Math.random() * allPoems.length)];
  renderPoem(poem, false);
}

function showByMood(moodKey) {
  currentMood = moodKey;
  highlightMood(moodKey);
  const list = poems[moodKey];
  if (!list || list.length === 0) return;
  const poem = list[Math.floor(Math.random() * list.length)];
  renderPoem(poem, false);
}

function showDaily() {
  currentMood = null;
  highlightMood(null);
  const poem = getDailyPoem();
  renderPoem(poem, true);
}

function highlightMood(moodKey) {
  moodTags.querySelectorAll(".mood-tag").forEach((el) => {
    el.classList.toggle("active", el.dataset.mood === moodKey);
  });
  moodNav.querySelectorAll(".mood-nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.mood === moodKey);
  });
}

// === Favorites UI ===
function renderFavorites() {
  if (favorites.length === 0) {
    favoritesList.innerHTML = `<div class="favorites-empty">
      \u8fd8\u6ca1\u6709\u6536\u85cf\u7684\u8bd7\u8bcd\u3002<br>
      \u70b9\u51fb\u8bd7\u8bcd\u5361\u7247\u4e0a\u7684 \u2661 \u6536\u85cf\u4f60\u559c\u6b22\u7684\u7b97\u7247\u5427\u3002
    </div>`;
    return;
  }
  favoritesList.innerHTML = favorites.map((f) => {
    // Find the poem data
    const p = allPoems.find((x) => x.id === f.id);
    if (!p) return "";
    return `<div class="fav-item" data-id="${f.id}">
      <div>
        <div class="fav-item-title">${p.title}</div>
        <div class="fav-item-author">${p.dynasty}\u00b7${p.author}</div>
      </div>
      <button class="fav-item-remove" data-id="${f.id}" title="\u79fb\u9664\u6536\u85cf">&times;</button>
    </div>`;
  }).join("");

  // Click to view
  favoritesList.querySelectorAll(".fav-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".fav-item-remove")) return;
      const id = el.dataset.id;
      const p = allPoems.find((x) => x.id === id);
      if (p) {
        switchView("explore");
        renderPoem(p, false);
      }
    });
  });

  // Remove
  favoritesList.querySelectorAll(".fav-item-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      favorites = favorites.filter((f) => f.id !== id);
      localStorage.setItem("wenxuan_fav", JSON.stringify(favorites));
      renderFavorites();
      updateFavBtn();
    });
  });
}

// === Journal UI ===
function renderJournal() {
  if (journal.length === 0) {
    journalEntries.innerHTML = `<div class="favorites-empty">
      \u8fd8\u6ca1\u6709\u5199\u8fc7\u611f\u609f\u3002<br>
      \u8bfb\u5b8c\u4e00\u9996\u8bd7\u540e\uff0c\u628a\u4f60\u7684\u5fc3\u60c5\u5199\u4e0b\u6765\u5427\u3002
    </div>`;
    return;
  }
  journalEntries.innerHTML = [...journal].reverse().map((entry, i) => {
    const realIdx = journal.length - 1 - i;
    return `<div class="journal-entry">
      <div class="journal-entry-date">${entry.date}</div>
      <div>${entry.text.replace(/\n/g, "<br>")}</div>
      <button class="journal-entry-del" data-idx="${realIdx}">&times;</button>
    </div>`;
  }).join("");

  journalEntries.querySelectorAll(".journal-entry-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      journal.splice(idx, 1);
      localStorage.setItem("wenxuan_journal", JSON.stringify(journal));
      renderJournal();
    });
  });
}

// === View Switching ===
function switchView(view) {
  currentView = view;
  exploreSection.classList.toggle("active", view === "explore");
  favSection.classList.toggle("active", view === "favorites");
  jourSection.classList.toggle("active", view === "journal");
  navExplore.classList.toggle("active", view === "explore");
  navFav.classList.toggle("active", view === "favorites");
  navJournal.classList.toggle("active", view === "journal");

  if (view === "favorites") renderFavorites();
  if (view === "journal") renderJournal();
}

// === Mood Navigator (bottom) ===
function buildMoodNav() {
  let html = "";
  for (const [key, label] of Object.entries(moodLabels)) {
    const icon = moodIcons[key] || "";
    html += `<button class="mood-nav-item" data-mood="${key}">${icon} ${label}</button>`;
  }
  moodNav.innerHTML = html;
  moodNav.querySelectorAll(".mood-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView("explore");
      showByMood(btn.dataset.mood);
    });
  });
}

// === Hero Mood Tags ===
function buildHeroTags() {
  let html = "";
  for (const [key, label] of Object.entries(moodLabels)) {
    const icon = moodIcons[key] || "";
    html += `<button class="mood-tag" data-mood="${key}">${icon} ${label}</button>`;
  }
  moodTags.innerHTML = html;
  moodTags.querySelectorAll(".mood-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView("explore");
      showByMood(btn.dataset.mood);
    });
  });
}

// === Hero Random Daily Line ===
function getRandomHeroLine() {
  const lines = [
    "\u6587\u5b66\u662f\u6700\u5b89\u9759\u7684\u53cb\u4eba\uff0c\u4e0d\u66fe\u8bf4\u8bdd\uff0c\u5374\u61c2\u4f60\u4e00\u5207\u3002",
    "\u5fd9\u788c\u7684\u65e5\u5b50\u91cc\uff0c\u8bb0\u5f97\u7ed9\u81ea\u5df1\u7559\u4e00\u53e5\u8bd7\u7684\u65f6\u95f4\u3002",
    "\u4f60\u4e0d\u662f\u5b64\u72ec\uff0c\u4f60\u662f\u8fd8\u6ca1\u9047\u89c1\u90a3\u9996\u4e0e\u4f60\u5fc3\u6709\u7075\u6089\u7684\u8bd7\u3002",
    "\u8bd7\u8bcd\u4e0d\u89e3\u7b54\u95ee\u9898\uff0c\u4f46\u5b83\u4f1a\u966a\u4f60\u5ea6\u8fc7\u95ee\u9898\u3002",
    "\u8d8a\u662f\u7cdf\u7cd5\u7684\u65e5\u5b50\uff0c\u8d8a\u8981\u5b66\u4f1a\u70b9\u4eae\u4e00\u53e5\u8bd7\u3002",
    "\u6bcf\u4e2a\u5fc3\u4e8b\u90fd\u80fd\u5728\u53e4\u8bd7\u91cc\u627e\u5230\u56de\u97f3\uff0c\u4f60\u53ea\u662f\u8fd8\u6ca1\u53d1\u73b0\u3002",
    "\u4e16\u754c\u5f88\u5435\uff0c\u4f46\u4f60\u53ef\u4ee5\u5f88\u5b89\u9759\u3002\u5c31\u50cf\u53e4\u4eba\u90a3\u6837\u3002",
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

// === Init ===
function init() {
  buildMoodNav();
  buildHeroTags();

  // Hero random line
  heroQuote.textContent = `\u201c${getRandomHeroLine()}\u201d`;
  heroSource.textContent = "\u2014\u2014 \u58a8\u5c7e \u00b7 \u6587\u5b66\u7597\u6108\u7a7a\u95f4";

  // Daily poem on load
  showDaily();

  // Nav
  navExplore.addEventListener("click", () => switchView("explore"));
  navFav.addEventListener("click", () => switchView("favorites"));
  navJournal.addEventListener("click", () => switchView("journal"));

  // Fav btn
  favBtn.addEventListener("click", toggleFavorite);

  // Random btn
  randomBtn.addEventListener("click", () => {
    switchView("explore");
    showRandom();
  });

  // Journal save
  journalSaveBtn.addEventListener("click", () => {
    const text = journalText.value.trim();
    if (!text) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    journal.push({ date: dateStr, text });
    localStorage.setItem("wenxuan_journal", JSON.stringify(journal));
    journalText.value = "";
    renderJournal();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "r" || e.key === "R") {
      switchView("explore");
      showRandom();
    }
    if (e.key === "f" || e.key === "F") {
      toggleFavorite();
    }
    if (e.key === "d" || e.key === "D") {
      switchView("explore");
      showDaily();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
