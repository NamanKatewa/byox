const README_URL =
  "https://raw.githubusercontent.com/codecrafters-io/build-your-own-x/master/README.md";
let tutorials = [];
const filters = {
  category: "all",
  language: "all",
};

const elements = {
  categoryFilter: null,
  languageFilter: null,
  cardsContainer: null,
};

async function load() {
  const res = await fetch(README_URL);
  const md = await res.text();
  const html = marked.parse(md);

  const categorized = extractCategorizedDataFromHTML(html);
  tutorials = flattenCategorized(normalizeCategorizedData(categorized));

  cacheDomReferences();
  populateFilters(tutorials);
  renderCards(tutorials);
}

function cacheDomReferences() {
  elements.categoryFilter = document.getElementById("categoryFilter");
  elements.languageFilter = document.getElementById("languageFilter");
  elements.cardsContainer = document.getElementById("cardsContainer");

  elements.categoryFilter.addEventListener("change", () => {
    filters.category = elements.categoryFilter.value;
    renderCards(tutorials);
  });

  elements.languageFilter.addEventListener("change", () => {
    filters.language = elements.languageFilter.value;
    renderCards(tutorials);
  });
}

function extractCategorizedDataFromHTML(htmlString) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = htmlString;

  const uls = wrapper.querySelectorAll("ul");
  const categories = Array.from(uls[0].querySelectorAll("li a")).map((a) =>
    a.textContent.trim()
  );

  const data = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const ul = uls[i + 1];
    if (!ul) continue;

    const items = [];
    const links = ul.querySelectorAll("li > a");
    links.forEach((a) => {
      if (a?.href && a?.textContent) {
        items.push({ title: a.textContent.trim(), url: a.href });
      }
    });

    data[cat] = items;
  }
  return data;
}

function normalizeCategorizedData(rawData) {
  const normalized = {};
  for (const [category, items] of Object.entries(rawData)) {
    normalized[category] = items.map(({ title, url }) => {
      const [langPart, ...titleParts] = title.split(":");
      const languages = langPart.includes(":")
        ? []
        : langPart.split("/").map((l) => l.trim().replace(/^\(|\)$/g, ""));

      const cleanTitle =
        titleParts.length > 0 ? titleParts.join(":").trim() : title.trim();

      return { title: cleanTitle, url, languages };
    });
  }
  return normalized;
}

function flattenCategorized(data) {
  const result = [];
  for (const [category, items] of Object.entries(data)) {
    for (const item of items) {
      result.push({ ...item, category });
    }
  }
  return result;
}

function populateFilters(data) {
  const categories = new Set();
  const languages = new Set();

  for (const t of data) {
    categories.add(t.category);
    t.languages.forEach((lang) => languages.add(lang));
  }

  const addOptions = (select, values) => {
    const fragment = document.createDocumentFragment();
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "all";
    defaultOpt.textContent = "All";
    fragment.appendChild(defaultOpt);

    for (const val of [...values].sort()) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      fragment.appendChild(opt);
    }
    select.appendChild(fragment);
  };

  addOptions(elements.categoryFilter, categories);
  addOptions(elements.languageFilter, languages);
}

function renderCards(data) {
  const container = elements.cardsContainer;
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (const t of data) {
    if (
      (filters.category === "all" || t.category === filters.category) &&
      (filters.language === "all" || t.languages.includes(filters.language))
    ) {
      const card = document.createElement("div");
      card.className = "card";

      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = t.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = t.title;
      title.appendChild(link);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${t.languages.join(", ")} | ${t.category}`;

      card.appendChild(title);
      card.appendChild(meta);
      fragment.appendChild(card);
    }
  }

  container.appendChild(fragment);
}

load();
