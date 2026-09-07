(() => {
  const client = window.digitalLibraryPublic?.client || null;
  let currentFilter = "all";
  const demoProjectTitles = new Set([
    "Campus Book Marketplace",
    "Digital Attendance System",
  ]);
  const contributorProjects = new Map();
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[c],
    );
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ""), window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };
  function card(p) {
    const contributors = [p.student_name, ...(String(p.team_members || "").split(/[,\n]/))]
      .map((name) => name.trim())
      .filter(Boolean);
    contributorProjects.set(p.id, {
      title: p.title,
      names: contributors,
    });
    const status = p.project_status === "completed" ? "COMPLETED" : "ONGOING";
    const tech = Array.isArray(p.tech_stack)
      ? p.tech_stack.join(" · ")
      : p.tech_stack || "Student Project";
    const githubUrl = safeUrl(p.github_url);
    const demoUrl = safeUrl(p.live_url);
    return `<article class="project-card">
      <div class="project-thumb">${p.thumbnail_url ? `<img src="${esc(p.thumbnail_url)}" alt="">` : `<i class="fa-solid fa-code text-5xl text-blue-600"></i>`}</div>
      <div class="p-6 project-card-body"><div class="flex justify-between gap-3 items-center"><span class="text-xs font-extrabold px-3 py-1 rounded-full ${status === "ONGOING" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}">${status}</span><span class="text-xs text-slate-500">${esc(p.department || "CSE")}</span></div>
      <h3 class="text-xl font-bold mt-4">${esc(p.title)}</h3><p class="text-slate-600 text-sm mt-2 line-clamp-3">${esc(p.description)}</p>
      <p class="text-xs font-semibold text-slate-500 mt-4">${esc(tech)}</p>
      <div class="flex items-center justify-between gap-3 flex-wrap mt-5 text-xs text-slate-500"><span><i class="fa-solid fa-users mr-1"></i>${esc(contributors.length || p.contributors_count || 1)} contributors</span><button type="button" class="font-bold text-blue-600 hover:underline" data-view-contributors="${esc(p.id)}">View Contributors</button>${githubUrl ? `<a class="font-bold text-blue-600 hover:underline" target="_blank" rel="noopener" href="${esc(githubUrl)}">GitHub ↗</a>` : ""}${demoUrl ? `<a class="font-bold text-blue-600 hover:underline" target="_blank" rel="noopener" href="${esc(demoUrl)}">Demo URL ↗</a>` : ""}</div></div>
    </article>`;
  }
  async function loadProjects() {
    const grids = document.querySelectorAll("#projectGrid");
    if (!grids.length) return;
    let data = [];
    if (client) {
      const { data: rows, error } = await client
        .from("projects")
        .select("*")
        .eq("verification_status", "approved")
        .order("created_at", { ascending: false });
      if (!error) {
        data = (rows || []).filter(
          (project) => !demoProjectTitles.has(project.title),
        );
      }
    }
    const filtered =
      currentFilter === "all"
        ? data
        : data.filter((p) => p.project_status === currentFilter);
    grids.forEach(
      (g) =>
        (g.innerHTML = filtered.length
          ? filtered.map(card).join("")
          : `<div class="project-empty col-span-full">No ${currentFilter} projects yet.</div>`),
    );
  }
  document.querySelectorAll("[data-project-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.projectFilter;
      document
        .querySelectorAll("[data-project-filter]")
        .forEach((b) => b.classList.toggle("active", b === btn));
      loadProjects();
    });
  });
  const contributorsDialog = document.getElementById("contributorsDialog");
  const contributorsDialogTitle = document.getElementById("contributorsDialogTitle");
  const contributorsList = document.getElementById("contributorsList");
  const closeContributors = document.getElementById("closeContributors");
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-contributors]");
    if (!button || !contributorsDialog) return;
    const project = contributorProjects.get(button.dataset.viewContributors);
    if (!project) return;
    contributorsDialogTitle.textContent = project.title;
    contributorsList.innerHTML = project.names
      .map((name) => `<li>${esc(name)}</li>`)
      .join("");
    contributorsDialog.showModal();
    closeContributors.focus();
  });
  closeContributors?.addEventListener("click", () => contributorsDialog?.close());
  contributorsDialog?.addEventListener("click", (event) => {
    if (event.target === contributorsDialog) contributorsDialog.close();
  });
  const form = document.getElementById("projectSubmitForm");
  const contributionSection = document.getElementById("submit");
  const openContribution = document.getElementById("openContribution");
  const closeContribution = document.getElementById("closeContribution");
  const submitHeading = document.getElementById("submitHeading");
  if (contributionSection && openContribution && closeContribution) {
    openContribution.addEventListener("click", () => {
      contributionSection.hidden = false;
      openContribution.setAttribute("aria-expanded", "true");
      contributionSection.scrollIntoView({ behavior: "smooth", block: "start" });
      submitHeading?.focus({ preventScroll: true });
    });
    closeContribution.addEventListener("click", () => {
      contributionSection.hidden = true;
      openContribution.setAttribute("aria-expanded", "false");
      openContribution.focus();
    });
  }
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const notice = document.getElementById("submitNotice");
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Submitting...";
      try {
        if (!client) throw new Error("Supabase is not configured.");
        const fd = new FormData(form),
          slug = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
        const upload = async (file, bucket) => {
          if (!file || !file.size) return null;
          if (file.size > 25 * 1024 * 1024)
            throw new Error("Each uploaded file must be under 25 MB.");
          const path = `submissions/${slug}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
          const r = await client.storage
            .from(bucket)
            .upload(path, file, { upsert: false });
          if (r.error) throw r.error;
          return path;
        };
        const imagePath = await upload(fd.get("thumbnail"), "project-images");
        const filePath = await upload(fd.get("project_file"), "project-files");
        const payload = {
          title: fd.get("title"),
          student_name: fd.get("student_name"),
          team_members: fd.get("team_members") || null,
          department: fd.get("department") || null,
          semester: fd.get("semester") ? Number(fd.get("semester")) : null,
          project_status: fd.get("project_status"),
          description: fd.get("description"),
          tech_stack: fd.get("tech_stack") || null,
          github_url: fd.get("github_url") || null,
          live_url: fd.get("live_url") || null,
          thumbnail_path: imagePath,
          project_file_path: filePath,
          verification_status: "pending",
        };
        const r = await client.from("project_submissions").insert(payload);
        if (r.error) throw r.error;
        notice.className =
          "md:col-span-2 rounded-xl p-4 bg-emerald-50 text-emerald-700";
        notice.textContent =
          "Submitted successfully. Your project is pending admin verification.";
        form.reset();
      } catch (err) {
        notice.className =
          "md:col-span-2 rounded-xl p-4 bg-red-50 text-red-700";
        notice.textContent =
          err.message || "Submission failed. Please try again.";
      } finally {
        btn.disabled = false;
        btn.innerHTML =
          '<i class="fa-solid fa-paper-plane mr-2"></i> Submit for Verification';
      }
    });
  loadProjects();
})();
