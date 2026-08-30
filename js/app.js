// Renders the hero (latest episode) and the paginated episode grid
// from data/episodes.json, which the GitHub Action keeps in sync with YouTube.

const PAGE_SIZE = 6;

function ytThumb(videoId) {
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function renderHero(ep) {
  if (!ep) return;

  document.getElementById("hero-title").textContent = ep.title || "";
  document.getElementById("hero-guest").textContent = ep.guestName || "";
  document.getElementById("hero-role").textContent = ep.guestRole || "";
  document.getElementById("hero-desc").textContent = ep.description || "";

  const videoSlot = document.getElementById("hero-video");
  if (ep.videoId) {
    videoSlot.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${ep.videoId}"
      title="${(ep.title || "").replace(/"/g, "&quot;")}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
  }
}

function episodeCard(ep) {
  const thumb = ytThumb(ep.videoId);
  const url = ep.videoId ? `https://www.youtube.com/watch?v=${ep.videoId}` : "#";

  const a = document.createElement("a");
  a.className = "episode-card";
  a.href = url;
  a.target = ep.videoId ? "_blank" : "_self";
  a.rel = "noopener";

  a.innerHTML = `
    <div class="episode-thumb">
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy" />` : ""}
      ${ep.duration ? `<span class="episode-duration">${ep.duration}</span>` : ""}
    </div>
    <div class="episode-body">
      ${ep.guestRole || ep.guestName ? `<p class="episode-guest">${[ep.guestName, ep.guestRole].filter(Boolean).join(" · ")}</p>` : ""}
      <h3 class="episode-title">${ep.title || ""}</h3>
      <p class="episode-desc">${ep.description || ""}</p>
    </div>
  `;
  return a;
}

function renderGrid(episodes) {
  const grid = document.getElementById("episode-grid");
  const loadMoreBtn = document.getElementById("load-more");
  grid.innerHTML = "";

  if (!episodes.length) {
    grid.innerHTML = `<p class="episode-empty">No episodes in this season yet.</p>`;
    loadMoreBtn.hidden = true;
    return;
  }

  let shown = 0;

  function showNextPage() {
    const next = episodes.slice(shown, shown + PAGE_SIZE);
    next.forEach((ep) => grid.appendChild(episodeCard(ep)));
    shown += next.length;
    loadMoreBtn.hidden = shown >= episodes.length;
  }

  showNextPage();
  loadMoreBtn.onclick = showNextPage;
}

function renderSeasonTabs(episodes) {
  const tabsWrap = document.getElementById("season-tabs");
  const seasons = [...new Set(episodes.map((ep) => ep.season).filter((s) => s != null))].sort((a, b) => b - a);

  if (seasons.length <= 1) {
    tabsWrap.hidden = true;
    return episodes; // nothing to filter — just show everything
  }

  tabsWrap.hidden = false;
  tabsWrap.innerHTML = "";

  function makeTab(label, isActive, onClick) {
    const btn = document.createElement("button");
    btn.className = "season-tab";
    btn.type = "button";
    btn.role = "tab";
    btn.setAttribute("aria-selected", String(isActive));
    btn.textContent = label;
    btn.addEventListener("click", () => {
      tabsWrap.querySelectorAll(".season-tab").forEach((t) => t.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      onClick();
    });
    return btn;
  }

  tabsWrap.appendChild(makeTab("All episodes", true, () => renderGrid(episodes)));
  seasons.forEach((season, i) => {
    tabsWrap.appendChild(
      makeTab(`Season ${season}`, false, () => renderGrid(episodes.filter((ep) => ep.season === season)))
    );
  });

  return episodes;
}

async function init() {
  try {
    const res = await fetch("data/episodes.json", { cache: "no-store" });
    const data = await res.json();
    const episodes = (data.episodes || []).slice();

    renderHero(episodes[0]);
    const rest = episodes.slice(1);
    renderSeasonTabs(rest);
    renderGrid(rest);
  } catch (err) {
    console.error("Could not load episodes.json", err);
    document.getElementById("episode-grid").innerHTML =
      `<p class="episode-empty">Episodes couldn't be loaded right now.</p>`;
  }
}

init();
