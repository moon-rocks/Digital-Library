(() => {
  const client = window.digitalLibraryPublic?.client || null;
  let currentFilter = "all";
  let projects = [];
  let projectLoadError = "";
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
  const friendlyUploadError = (error) => {
    const message = error?.message || String(error || "");
    const lower = message.toLowerCase();
    if (lower.includes("bucket") && lower.includes("not found"))
      return "Storage bucket is missing. Please run the project Supabase SQL migration first.";
    if (lower.includes("row-level security") || lower.includes("rls"))
      return "Upload was blocked by Supabase storage rules. Please update the project storage policies.";
    if (
      lower.includes("permission denied") ||
      lower.includes("forbidden") ||
      lower.includes("policy")
    )
      return "This upload is not allowed by the current Supabase permissions.";
    if (lower.includes("duplicate") || lower.includes("already exists"))
      return "A file with this name already exists. Rename the file and try again.";
    if (lower.includes("too large") || lower.includes("exceeds"))
      return "File is too large. Keep each upload under 25 MB.";
    return message || "File upload failed. Please try again.";
  };
  function validateUploadFile(file, type) {
    if (!file || !file.size) return null;
    if (!(file instanceof File)) return null;
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes)
      throw new Error("Each uploaded file must be under 25 MB.");
    if (type === "image") {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowed.includes(file.type))
        throw new Error(
          "Only JPG, PNG, and WebP images are allowed for thumbnails.",
        );
    }
    if (type === "project") {
      const allowed = [
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const extension = file.name.split(".").pop()?.toLowerCase();
      const safeExtensions = ["pdf", "zip", "ppt", "pptx", "doc", "docx"];
      if (!allowed.includes(file.type) && !safeExtensions.includes(extension)) {
        throw new Error(
          "Only PDF, ZIP, PPT, PPTX, DOC, and DOCX files are supported.",
        );
      }
    }
    return file;
  }
  function card(p) {
    const contributors = String(p.team_members || "")
      .split(/[,\n]/)
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
    const thumbnailUrl =
      p.thumbnail_url ||
      (p.thumbnail_path && client
        ? client.storage.from("project-images").getPublicUrl(p.thumbnail_path)
            .data.publicUrl
        : "");
    return `<article class="project-card">
      <div class="project-thumb">${thumbnailUrl ? `<img src="${esc(thumbnailUrl)}" alt="">` : `<i class="fa-solid fa-code text-5xl text-blue-600"></i>`}</div>
      <div class="p-6 project-card-body"><div class="flex justify-between gap-3 items-center"><span class="text-xs font-extrabold px-3 py-1 rounded-full ${status === "ONGOING" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}">${status}</span><span class="text-xs text-slate-500">${esc(p.department || "Unspecified")}</span></div>
      <h3 class="text-xl font-bold mt-4">${esc(p.title)}</h3><p class="text-slate-600 text-sm mt-2 line-clamp-3">${esc(p.description)}</p>
      <p class="text-xs font-semibold text-slate-500 mt-4">${esc(tech)}${p.semester ? ` · Semester ${esc(p.semester)}` : ""}${p.category ? ` · ${esc(p.category)}` : ""}</p>
      <p class="text-xs text-slate-500 mt-2">Guide: ${esc(p.student_name || "Not specified")}</p>
      <div class="flex items-center justify-between gap-3 flex-wrap mt-5 text-xs text-slate-500"><span><i class="fa-solid fa-users mr-1"></i>${esc(contributors.length || p.contributors_count || 1)} contributors</span><button type="button" class="font-bold text-blue-600 hover:underline" data-view-contributors="${esc(p.id)}">View Contributors</button>${githubUrl ? `<a class="font-bold text-blue-600 hover:underline" target="_blank" rel="noopener" href="${esc(githubUrl)}">GitHub ↗</a>` : ""}${demoUrl ? `<a class="font-bold text-blue-600 hover:underline" target="_blank" rel="noopener" href="${esc(demoUrl)}">Demo URL ↗</a>` : ""}${p.projectFileUrl ? `<a class="font-bold text-blue-600 hover:underline" target="_blank" rel="noopener" href="${esc(p.projectFileUrl)}"><i class="fa-solid fa-download mr-1"></i>Project File</a>` : ""}</div></div>
    </article>`;
  }
  async function loadProjects() {
    const grids = document.querySelectorAll("#projectGrid");
    if (!grids.length) return;
    projectLoadError = client ? "" : "Supabase is not configured.";
    if (!client) return renderProjects();
    const [projectResult, submissionResult] = await Promise.all([
      client
        .from("projects")
        .select("*")
        .eq("verification_status", "approved")
        .order("created_at", { ascending: false }),
      client
        .from("project_submissions")
        .select("*")
        .eq("verification_status", "approved")
        .order("submitted_at", { ascending: false }),
    ]);
    if (projectResult.error) {
      projectLoadError = projectResult.error.message;
      projects = [];
      return renderProjects();
    }
    const published = (projectResult.data || []).filter(
      (project) => project.verification_status === "approved",
    );
    const approvedRows = submissionResult.data || [];
    const submissionsByProjectId = new Map(
      approvedRows
        .filter((submission) => submission.project_id)
        .map((submission) => [submission.project_id, submission]),
    );
    const projectIdentity = (project) =>
      `${project.title}\n${project.description}\n${project.project_file_path || ""}`;
    const known = new Set(published.map(projectIdentity));
    const publishedWithUploadTime = published.map((project) => ({
      ...project,
      uploadTime:
        submissionsByProjectId.get(project.id)?.submitted_at ||
        project.created_at,
    }));
    const approvedSubmissions = approvedRows
      .filter(
        (submission) =>
          !submission.project_id && !known.has(projectIdentity(submission)),
      )
      .map((submission) => ({
        ...submission,
        verification_status: "approved",
        created_at: submission.submitted_at,
        uploadTime: submission.submitted_at,
      }));
    projects = [...publishedWithUploadTime, ...approvedSubmissions]
      .map((project, index) => ({ project, index }))
      .sort((first, second) => {
        const timeDifference =
          new Date(
            second.project.uploadTime || second.project.created_at || 0,
          ).getTime() -
          new Date(
            first.project.uploadTime || first.project.created_at || 0,
          ).getTime();
        return timeDifference || first.index - second.index;
      })
      .map(({ project }) => project);
    projects = await Promise.all(
      projects.map(async (project) => {
        if (!project.project_file_path) return project;
        const result = await client.storage
          .from("project-files")
          .createSignedUrl(project.project_file_path, 3600);
        return { ...project, projectFileUrl: result.data?.signedUrl || null };
      }),
    );
    renderProjects();
  }

  function renderProjects() {
    const grids = document.querySelectorAll("#projectGrid");
    const search =
      document.querySelector("#projectSearch")?.value.trim().toLowerCase() ||
      "";
    const filtered = projects.filter((project) => {
      const searchable = [
        project.title,
        project.description,
        project.tech_stack,
        project.student_name,
        project.team_members,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!search || searchable.includes(search)) &&
        (currentFilter === "all" || project.project_status === currentFilter)
      );
    });
    grids.forEach(
      (g) =>
        (g.innerHTML = projectLoadError
          ? `<div class="project-empty col-span-full">Could not load projects: ${esc(projectLoadError)}</div>`
          : filtered.length
            ? filtered.map(card).join("")
            : `<div class="project-empty col-span-full">No matching approved projects yet.</div>`),
    );
  }
  document.querySelectorAll("[data-project-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.projectFilter;
      document
        .querySelectorAll("[data-project-filter]")
        .forEach((b) => b.classList.toggle("active", b === btn));
      renderProjects();
    });
  });
  ["#projectSearch"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", renderProjects);
    document
      .querySelector(selector)
      ?.addEventListener("change", renderProjects);
  });
  const contributorsDialog = document.getElementById("contributorsDialog");
  const contributorsDialogTitle = document.getElementById(
    "contributorsDialogTitle",
  );
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
  closeContributors?.addEventListener("click", () =>
    contributorsDialog?.close(),
  );
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
      contributionSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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
        const upload = async (file, bucket, kind = "project") => {
          const validFile = validateUploadFile(file, kind);
          if (!validFile) return null;
          const path = `submissions/${slug}/${validFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
          const r = await client.storage.from(bucket).upload(path, validFile, {
            upsert: false,
            contentType: validFile.type || "application/octet-stream",
          });
          if (r.error) throw new Error(friendlyUploadError(r.error));
          return path;
        };
        const imagePath = await upload(
          fd.get("thumbnail"),
          "project-images",
          "image",
        );
        const filePath = await upload(
          fd.get("project_file"),
          "project-files",
          "project",
        );
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
          err?.message ||
          friendlyUploadError(err) ||
          "Submission failed. Please try again.";
      } finally {
        btn.disabled = false;
        btn.innerHTML =
          '<i class="fa-solid fa-paper-plane mr-2"></i> Submit for Verification';
      }
    });
  loadProjects();
})();
