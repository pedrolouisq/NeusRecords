const storageKey = "linkCraftConfig";
const iconMap = {
	spotify: "♫",
	instagram: "◎",
	youtube: "▶",
	github: "◈",
	web: "↗",
	twitter: "𝕏"
};
const state = {
	profileName: "",
	profileBio: "",
	profileAvatar: "",
	backgroundTheme: "neus-dark",
	buttonStyle: "soft",
	links: []
};

const elements = {
	profileName: document.getElementById("profileName"),
	profileBio: document.getElementById("profileBio"),
	profileAvatar: document.getElementById("profileAvatar"),
	backgroundTheme: document.getElementById("backgroundTheme"),
	buttonStyle: document.getElementById("buttonStyle"),
	linkTitle: document.getElementById("linkTitle"),
	linkUrl: document.getElementById("linkUrl"),
	linkIcon: document.getElementById("linkIcon"),
	linkList: document.getElementById("linkList"),
	emptyState: document.getElementById("emptyState"),
	previewName: document.getElementById("previewName"),
	previewBio: document.getElementById("previewBio"),
	previewAvatar: document.getElementById("previewAvatar"),
	previewLinks: document.getElementById("previewLinks"),
	phoneScreen: document.getElementById("phoneScreen"),
	saveStatus: document.getElementById("saveStatus")
};

function safeUrl(value) {
	const trimmed = value.trim();
	if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return "#";
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function initials(name) {
	return (name.trim() || "LinkCraft")
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
}

function saveState(message = "Guardado automáticamente") {
	localStorage.setItem(storageKey, JSON.stringify(state));
	elements.saveStatus.textContent = message;
	window.clearTimeout(saveState.timeout);
	saveState.timeout = window.setTimeout(() => { elements.saveStatus.textContent = ""; }, 2200);
}

function renderPreview() {
	elements.previewName.textContent = state.profileName.trim() || "Tu nombre";
	elements.previewBio.textContent = state.profileBio.trim() || "Tu biografía aparecerá aquí.";
	elements.previewLinks.replaceChildren();
	elements.phoneScreen.className = `phone-screen theme-${state.backgroundTheme}`;

	const avatarUrl = safeUrl(state.profileAvatar);
	if (avatarUrl !== "#") {
		elements.previewAvatar.className = "avatar";
		elements.previewAvatar.alt = `Avatar de ${state.profileName || "tu perfil"}`;
		elements.previewAvatar.src = avatarUrl;
		elements.previewAvatar.onerror = () => {
			elements.previewAvatar.removeAttribute("src");
			elements.previewAvatar.className = "avatar avatar-fallback";
		elements.previewAvatar.textContent = initials(state.profileName);
	};
	} else {
		elements.previewAvatar.removeAttribute("src");
		elements.previewAvatar.className = "avatar avatar-fallback";
		elements.previewAvatar.textContent = initials(state.profileName);
	}

	state.links.forEach((link) => {
		const anchor = document.createElement("a");
		anchor.className = `preview-link button-style-${state.buttonStyle}`;
		anchor.href = safeUrl(link.url);
		anchor.target = "_blank";
		anchor.rel = "noopener noreferrer";
		anchor.innerHTML = `<span aria-hidden="true">${iconMap[link.icon] || iconMap.web}</span>`;
		const title = document.createElement("span");
		title.textContent = link.title || "Enlace";
		anchor.appendChild(title);
		elements.previewLinks.appendChild(anchor);
	});
}

function renderLinkList() {
	elements.linkList.replaceChildren();
	elements.emptyState.hidden = state.links.length > 0;

	state.links.forEach((link, index) => {
		const item = document.createElement("li");
		item.className = "link-item";
		item.innerHTML = `
			<span class="link-icon" aria-hidden="true">${iconMap[link.icon] || iconMap.web}</span>
			<span class="link-info"><strong></strong><small></small></span>
			<span class="item-actions">
				<button class="icon-button move-up" type="button" aria-label="Subir enlace" ${index === 0 ? "disabled" : ""}>↑</button>
				<button class="icon-button move-down" type="button" aria-label="Bajar enlace" ${index === state.links.length - 1 ? "disabled" : ""}>↓</button>
				<button class="icon-button danger delete-link" type="button" aria-label="Eliminar enlace">×</button>
			</span>
		`;
		item.querySelector("strong").textContent = link.title || "Enlace sin título";
		item.querySelector("small").textContent = link.url || "Sin URL";
		item.querySelector(".move-up").addEventListener("click", () => moveLink(index, -1));
		item.querySelector(".move-down").addEventListener("click", () => moveLink(index, 1));
		item.querySelector(".delete-link").addEventListener("click", () => {
			state.links.splice(index, 1);
			update();
		});
		elements.linkList.appendChild(item);
	});
}

function moveLink(index, direction) {
	const targetIndex = index + direction;
	if (targetIndex < 0 || targetIndex >= state.links.length) return;
	[state.links[index], state.links[targetIndex]] = [state.links[targetIndex], state.links[index]];
	update();
}

function update() {
	renderLinkList();
	renderPreview();
	saveState();
}

function loadState() {
	try {
		const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
		if (!saved) return;
		Object.assign(state, saved, { links: Array.isArray(saved.links) ? saved.links : [] });
	} catch (error) {
		localStorage.removeItem(storageKey);
	}
	elements.profileName.value = state.profileName;
	elements.profileBio.value = state.profileBio;
	elements.profileAvatar.value = state.profileAvatar;
	elements.backgroundTheme.value = state.backgroundTheme;
	elements.buttonStyle.value = state.buttonStyle;
}

function addLink() {
	const title = elements.linkTitle.value.trim();
	const url = elements.linkUrl.value.trim();
	if (!title || !url) {
		elements.linkTitle.focus();
		elements.saveStatus.textContent = "Completa el título y la URL del enlace";
		return;
	}
	state.links.push({ title, url, icon: elements.linkIcon.value });
	elements.linkTitle.value = "";
	elements.linkUrl.value = "";
	update();
	elements.linkTitle.focus();
}

function buildCleanView() {
	const popup = window.open("", "_blank");
	if (!popup) {
		elements.saveStatus.textContent = "Permite ventanas emergentes para abrir tu Bio-Link";
		return;
	}
	const escaped = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
	const avatar = safeUrl(state.profileAvatar);
	const avatarMarkup = avatar === "#" ? `<div class="avatar">${escaped(initials(state.profileName))}</div>` : `<img class="avatar" src="${escaped(avatar)}" alt="Avatar">`;
	const links = state.links.map((link) => `<a href="${escaped(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer"><span>${iconMap[link.icon] || iconMap.web}</span>${escaped(link.title || "Enlace")}</a>`).join("");
	const theme = state.backgroundTheme === "minimal" ? "minimal" : state.backgroundTheme;
	popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escaped(state.profileName || "LinkCraft")}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:${theme === "cyberpunk" ? "#180c2e" : theme === "glow" ? "#071526" : theme === "minimal" ? "#f1f5f9" : "#111827"};font-family:Segoe UI,sans-serif;color:${theme === "minimal" ? "#172033" : "#f8fafc"}}main{width:min(100%,360px);text-align:center}.avatar{width:88px;height:88px;display:grid;place-items:center;margin:0 auto 16px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-size:1.8rem;font-weight:800}h1{margin:0 0 8px;font-size:1.5rem}p{margin:0 0 28px;color:${theme === "minimal" ? "#64748b" : "#cbd5e1"};white-space:pre-wrap}section{display:grid;gap:12px}a{display:flex;justify-content:center;gap:10px;padding:14px;border:1px solid ${theme === "minimal" ? "#cbd5e1" : "#ffffff22"};border-radius:10px;background:${theme === "minimal" ? "#fff" : "#ffffff12"};color:inherit;font-weight:700;text-decoration:none}</style></head><body><main>${avatarMarkup}<h1>${escaped(state.profileName || "Tu nombre")}</h1><p>${escaped(state.profileBio || "Tu biografía aparecerá aquí.")}</p><section>${links}</section></main>\u003C/body>\u003C/html>`);
	popup.document.close();
	navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#bio`).catch(() => {});
	elements.saveStatus.textContent = "Guardado y vista limpia abierta";
}

[elements.profileName, elements.profileBio, elements.profileAvatar, elements.backgroundTheme, elements.buttonStyle].forEach((element) => {
	element.addEventListener("input", () => {
		state[element.id] = element.value;
		update();
	});
	element.addEventListener("change", () => {
		state[element.id] = element.value;
		update();
	});
});

document.getElementById("addLinkButton").addEventListener("click", addLink);
[elements.linkTitle, elements.linkUrl].forEach((element) => element.addEventListener("keydown", (event) => {
	if (event.key === "Enter") addLink();
}));
document.getElementById("saveButton").addEventListener("click", () => {
	saveState("Configuración guardada");
	buildCleanView();
});

loadState();
renderLinkList();
renderPreview();
