(() => {
  const DEFAULT_RESOURCE_IMAGE = "public/premium_photo-1681681061615-623d024005ff.avif";
  const pageConfig = {
    "PYQ.html": { type: "PYQ", container: "#pyqList", label: "PYQs" },
    "Notes.html": { type: "Notes", container: "#semesterGrid", label: "Notes" },
    "LabManual.html": { type: "Lab Manual", container: "#labManualGrid", label: "Lab Manuals" },
    "Publication.html": { type: "Publication", container: "#publicationGrid", label: "Publications" },
    "Newsletter.html": { type: "Newsletter", container: "#newsletterGrid", label: "Newsletters" },
    "Magazine.html": { type: "Magazine", container: "#magazineGrid", label: "Magazines" },
    "curriculum.html": { type: "Syllabus", container: "#curriculumGrid", label: "Curriculum" },
    "cheetSheet.html": { type: "Cheatsheet", container: "#cheatsheetContainer", label: "Cheat Sheets" },
    "BeyoundCurriculum.html": { type: "Beyond Curriculum", container: "#beyondCurriculumGrid", label: "Beyond Curriculum" },
  }[location.pathname.split("/").pop()];
  if (!pageConfig || !window.digitalLibraryPublic?.configured) return;
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  const getContainer = () => {
    return document.querySelector(pageConfig.container);
  };
  const createCard = (resource, index) => {
    const url = escapeHtml(window.digitalLibraryPublic.getResourceFileUrl(resource) || "#");
    const image = escapeHtml(window.digitalLibraryPublic.getResourceImageUrl(resource) || DEFAULT_RESOURCE_IMAGE);
    const title = escapeHtml(resource.title);
    const description = escapeHtml(resource.description || resource.subject || "");
    const metadata = `${escapeHtml(resource.branch || "")}${resource.semester ? ` · Semester ${escapeHtml(resource.semester)}` : ""}${resource.academic_year ? ` · ${escapeHtml(resource.academic_year)}` : ""}`;
    const card = document.createElement("article");
    card.dataset.resourceId = resource.id || "";

    if (pageConfig.type === "PYQ") {
      card.className = "grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-0 px-5 py-5 border-b hover:bg-blue-50 transition";
      card.innerHTML = `<div class="md:col-span-9"><p class="text-xs text-gray-500 md:hidden mb-1">PYQ Name</p><h3 class="font-medium text-slate-800 whitespace-pre-line">${title}</h3></div><div class="md:col-span-3 md:text-center"><a href="${url}" target="_blank" rel="noopener noreferrer" download class="inline-block w-full md:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"><i class="fa-solid fa-download mr-2"></i>Download PDF</a></div>`;
    } else if (pageConfig.type === "Notes") {
      card.className = "note-row semester-card bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 p-8 border hover:border-pink-500";
      card.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block"><div class="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl">📘</div><h3 class="text-3xl font-bold mt-6">${title}</h3><p class="text-gray-500 mt-3">${description || "Notes resource"}</p><div class="mt-6 space-y-2 text-gray-700"><p>📚 Notes</p><p>${metadata || "Published resource"}</p><p>📄 View PDF</p></div></a>`;
    } else if (pageConfig.type === "Lab Manual") {
      card.className = "bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group";
      card.innerHTML = `<div class="h-[300px] bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center justify-center text-center px-8 relative overflow-hidden"><div class="relative w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300"><i class="fa-solid fa-file-lines text-white text-4xl"></i></div><span class="relative mt-5 text-xs font-bold tracking-[0.2em] text-blue-600 uppercase">Lab Manual</span><h2 class="relative mt-3 text-2xl font-bold text-gray-900 leading-tight">${title}</h2></div><div class="p-5 text-center border-t border-gray-100"><h3 class="text-xl font-bold text-gray-900">LAB MANUAL</h3><p class="text-gray-500 text-sm mt-2">• ${metadata || description}</p><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/20"><i class="fa-solid fa-book-open"></i> Read Lab Manual</a></div>`;
    } else if (pageConfig.type === "Publication" || pageConfig.type === "Newsletter") {
      const label = pageConfig.type === "Publication" ? "Read Publication" : "Read Newsletter";
      card.className = "bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group";
      card.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block overflow-hidden"><img src="${image}" alt="${title}" class="w-full h-[380px] ${pageConfig.type === "Publication" ? "object-contain" : "object-cover"} group-hover:scale-105 transition-transform duration-500"></a><div class="p-5 text-center"><h3 class="text-xl font-bold text-gray-900">${title}</h3><p class="text-gray-500 text-sm mt-2">${description}</p><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl font-semibold transition"><i class="fa-solid fa-newspaper"></i> ${label}</a></div>`;
    } else if (pageConfig.type === "Magazine") {
      card.className = "bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group";
      card.innerHTML = `<div class="overflow-hidden"><img src="${image}" alt="${title}" class="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-500"></div><div class="p-5 text-center"><h3 class="text-xl font-bold text-gray-900">${title}</h3><p class="text-gray-500 text-sm mt-2">${description || metadata}</p><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl font-semibold transition"><i class="fa-solid fa-book-open"></i> Open Magazine</a></div>`;
    } else if (pageConfig.type === "Cheatsheet") {
      card.className = "card-shine group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10";
      card.innerHTML = `<div class="relative flex items-center justify-between gap-3"><span class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">${escapeHtml(resource.resource_type)}</span><span class="text-xs font-semibold text-slate-600">${String(index + 1).padStart(2, "0")}</span></div><div class="relative mt-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-950"><img src="${image}" alt="${title}" loading="lazy" class="relative z-10 h-28 w-28 object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2"></div><div class="relative pt-5"><h3 class="text-lg font-bold text-white transition-colors duration-300 group-hover:text-blue-400">${title}</h3><p class="mt-2 min-h-[48px] text-sm leading-6 text-slate-400">${description}</p><a href="${url}" target="_blank" rel="noopener noreferrer" class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">Download PDF</a></div>`;
    } else {
      card.className = "bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden group";
      card.innerHTML = `<div class="bg-gradient-to-r from-blue-600 to-cyan-500 p-7 text-white"><span class="bg-white/20 px-3 py-1 rounded-full text-sm">${escapeHtml(resource.resource_type)}</span><h3 class="text-3xl font-bold mt-6">${title}</h3><p class="mt-2 text-blue-100">${description}</p></div><div class="p-6"><p class="text-gray-600">${metadata || "Published resource"}</p><a href="${url}" target="_blank" rel="noopener noreferrer" class="block mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-center font-semibold">View</a></div>`;
    }

    const imageElement = card.querySelector("img");
    if (imageElement) imageElement.onerror = () => { imageElement.src = DEFAULT_RESOURCE_IMAGE; };
    return card;
  };
  const render = (resources) => {
    const container = getContainer();
    if (!container) return;
    const existingTitles = new Set(
      [...container.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading) => heading.textContent.trim().toLowerCase()),
    );
    resources.forEach((resource, index) => {
      const title = String(resource.title || "").trim().toLowerCase();
      if (existingTitles.has(title)) return;
      existingTitles.add(title);
      container.appendChild(createCard(resource, index));
    });
  };
  const load = async () => {
    try {
      const resources = await window.digitalLibraryPublic.fetchResources(pageConfig.type);
      render(resources || []);
    } catch (error) {
      console.error("RESOURCE FETCH ERROR:", error);
      console.error(`Unable to load ${pageConfig.label}:`, error.message || error);
    }
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
  else load();
})();
