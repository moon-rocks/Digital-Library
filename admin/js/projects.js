(() => {
  const supabaseClient =
    window.supabaseClient ||
    supabase.createClient(
      window.DIGITAL_LIBRARY_CONFIG.url,
      window.DIGITAL_LIBRARY_CONFIG.anonKey,
    );
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );
  const safeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "-");
  let sessionUser;
  let selectedStatus = "pending";
  let projects = [];
  let submissions = [];

  const storagePath = (bucket, path) =>
    path
      ? supabaseClient.storage.from(bucket).remove([path])
      : Promise.resolve({ error: null });

  async function uploadReplacement(file, bucket, projectId, kind) {
    if (!file || !file.size) return null;
    const allowed =
      kind === "image"
        ? ["jpg", "jpeg", "png", "webp"]
        : ["pdf", "zip", "ppt", "pptx", "doc", "docx"];
    const extension = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(extension))
      throw new Error(`Unsupported ${kind} file format.`);
    if (file.size > 25 * 1024 * 1024)
      throw new Error("Each uploaded file must be under 25 MB.");
    const path = `projects/${projectId}/${Date.now()}-${safeFileName(file.name)}`;
    const result = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (result.error) throw result.error;
    return path;
  }

  async function init() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
      location.href = "login.html";
      return;
    }
    sessionUser = sessionData.session.user;
    const { data: admin, error: adminError } = await supabaseClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", sessionUser.id)
      .eq("role", "admin")
      .eq("active", true)
      .maybeSingle();
    if (adminError || !admin) {
      location.href = "login.html";
      return;
    }
    bindEvents();
    await loadSubmissions();
    await syncApprovedProjects();
    await loadProjects();
  }

  async function loadSubmissions() {
    const { data, error } = await supabaseClient
      .from("project_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) {
      $("#list").textContent = error.message;
      return;
    }
    const rows = data || [];
    submissions = rows;
    ["pending", "approved", "rejected"].forEach((status) => {
      $(`#${status}`).textContent = rows.filter(
        (row) => row.verification_status === status,
      ).length;
    });
    const visibleRows = rows.filter(
      (row) => row.verification_status === selectedStatus,
    );
    $("#listTitle").textContent =
      `${selectedStatus[0].toUpperCase()}${selectedStatus.slice(1)} Submissions`;
    $("#list").innerHTML = visibleRows.length
      ? visibleRows.map(submissionCard).join("")
      : `<div class="empty">No ${esc(selectedStatus)} submissions.</div>`;
  }

  function submissionCard(project) {
    const links = `${project.github_url ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(project.github_url)}">GitHub</a>` : ""}${project.live_url ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(project.live_url)}">Live Demo</a>` : ""}`;
    const actions =
      project.verification_status === "pending"
        ? `<button class="btn primary sm" data-approve="${esc(project.id)}">Approve</button><button class="btn danger sm" data-reject="${esc(project.id)}">Reject</button>`
        : project.verification_status === "rejected"
          ? `<button class="btn danger sm" data-delete-submission="${esc(project.id)}">Delete</button>`
          : `<button class="btn primary sm" data-edit-approved="${esc(project.project_id || "")}" data-project-title="${esc(project.title)}">Edit / Replace</button><button class="btn danger sm" data-delete-approved="${esc(project.project_id || "")}" data-project-title="${esc(project.title)}">Delete Project</button>`;
    return `<div class="card" style="margin:12px 0;border:1px solid #e7ebf2"><div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap"><div><h3 style="margin:0 0 8px">${esc(project.title)}</h3><div class="muted">Student: ${esc(project.student_name)} · Team: ${esc(project.team_members || "—")}</div><div class="muted">${esc(project.department || "—")} · Semester ${esc(project.semester || "—")}</div><p>${esc(project.description)}</p><div class="muted">${esc(project.tech_stack || "")}</div>${project.rejection_reason ? `<p class="muted">Reason: ${esc(project.rejection_reason)}</p>` : ""}</div><span class="demo-pill">${esc(project.verification_status).toUpperCase()}</span></div><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">${links}${actions}</div></div>`;
  }

  async function approve(id) {
    const result = await supabaseClient
      .from("project_submissions")
      .select("*")
      .eq("id", id)
      .eq("verification_status", "pending")
      .single();
    if (result.error) return alert(result.error.message);
    const submission = result.data;
    const thumbnailUrl = submission.thumbnail_path
      ? supabaseClient.storage
          .from("project-images")
          .getPublicUrl(submission.thumbnail_path).data.publicUrl
      : null;
    const insert = await supabaseClient
      .from("projects")
      .insert({
        title: submission.title,
        description: submission.description,
        department: submission.department,
        semester: submission.semester,
        category: submission.category,
        project_status: submission.project_status,
        verification_status: "approved",
        tech_stack: submission.tech_stack,
        github_url: submission.github_url,
        live_url: submission.live_url,
        thumbnail_url: thumbnailUrl,
        thumbnail_path: submission.thumbnail_path,
        project_file_path: submission.project_file_path,
        student_name: submission.student_name,
        team_members: submission.team_members,
      })
      .select()
      .single();
    if (insert.error) return alert(insert.error.message);
    const update = await supabaseClient
      .from("project_submissions")
      .update({
        verification_status: "approved",
        reviewed_by: sessionUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("verification_status", "pending");
    if (update.error) {
      await supabaseClient.from("projects").delete().eq("id", insert.data.id);
      return alert(update.error.message);
    }
    await Promise.all([loadSubmissions(), loadProjects()]);
  }

  function openRejectDialog(id) {
    const form = $("#rejectForm");
    form.elements.id.value = id;
    form.elements.reason.value = "";
    $("#rejectDialog").showModal();
  }

  async function rejectProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    const result = await supabaseClient
      .from("project_submissions")
      .update({
        verification_status: "rejected",
        rejection_reason: form.elements.reason.value.trim() || null,
        reviewed_by: sessionUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", form.elements.id.value)
      .eq("verification_status", "pending");
    button.disabled = false;
    if (result.error)
      return alert(`Could not reject submission: ${result.error.message}`);
    $("#rejectDialog").close();
    await loadSubmissions();
  }

  async function deleteSubmission(id) {
    if (!confirm("Delete this rejected submission permanently?")) return;
    const result = await supabaseClient
      .from("project_submissions")
      .delete()
      .eq("id", id)
      .eq("verification_status", "rejected");
    if (result.error) return alert(result.error.message);
    loadSubmissions();
  }

  async function syncApprovedProjects() {
    const approved = submissions.filter(
      (submission) => submission.verification_status === "approved",
    );
    if (!approved.length) return;
    const { data: existing, error } = await supabaseClient
      .from("projects")
      .select("*");
    if (error) throw error;
    const projectRows = existing || [];
    const byId = new Map(projectRows.map((project) => [project.id, project]));
    const identity = (item) =>
      `${item.title}\n${item.description}\n${item.project_file_path || ""}`;
    const byIdentity = new Map(
      projectRows.map((project) => [identity(project), project]),
    );
    for (const submission of approved) {
      const current =
        (submission.project_id && byId.get(submission.project_id)) ||
        byIdentity.get(identity(submission));
      if (current) {
        continue;
      }
      const thumbnailUrl = submission.thumbnail_path
        ? supabaseClient.storage
            .from("project-images")
            .getPublicUrl(submission.thumbnail_path).data.publicUrl
        : null;
      const result = await supabaseClient
        .from("projects")
        .insert({
          title: submission.title,
          description: submission.description,
          department: submission.department,
          semester: submission.semester,
          category: submission.category,
          project_status: submission.project_status,
          verification_status: "approved",
          tech_stack: submission.tech_stack,
          github_url: submission.github_url,
          live_url: submission.live_url,
          thumbnail_url: thumbnailUrl,
          thumbnail_path: submission.thumbnail_path,
          project_file_path: submission.project_file_path,
          student_name: submission.student_name,
          team_members: submission.team_members,
        })
        .select()
        .single();
      if (result.error) throw result.error;
      byId.set(result.data.id, result.data);
      byIdentity.set(identity(result.data), result.data);
    }
  }

  async function ensurePublishedProject(submission) {
    const existing = findProject(submission.project_id, submission.title);
    if (existing) return existing;
    const thumbnailUrl = submission.thumbnail_path
      ? supabaseClient.storage
          .from("project-images")
          .getPublicUrl(submission.thumbnail_path).data.publicUrl
      : null;
    const result = await supabaseClient
      .from("projects")
      .insert({
        title: submission.title,
        description: submission.description,
        department: submission.department,
        semester: submission.semester,
        category: submission.category,
        project_status: submission.project_status,
        verification_status: "approved",
        tech_stack: submission.tech_stack,
        github_url: submission.github_url,
        live_url: submission.live_url,
        thumbnail_url: thumbnailUrl,
        thumbnail_path: submission.thumbnail_path,
        project_file_path: submission.project_file_path,
        student_name: submission.student_name,
        team_members: submission.team_members,
      })
      .select()
      .single();
    if (result.error) throw result.error;
    projects.push(result.data);
    return result.data;
  }

  async function manageApprovedSubmission(id, title, action) {
    const submission =
      submissions.find((item) => item.id === id) ||
      submissions.find(
        (item) =>
          item.title === title && item.verification_status === "approved",
      );
    if (!submission)
      return alert(
        "The approved submission could not be found. Refresh the page and try again.",
      );
    if (action === "edit") {
      try {
        const project = await ensurePublishedProject(submission);
        openEditor(project.id);
        await loadProjects();
      } catch (error) {
        alert(`Could not prepare project for editing: ${error.message}`);
      }
      return;
    }
    if (
      !confirm(`Delete project "${submission.title}" and its uploaded files?`)
    )
      return;
    const project = findProject(submission.project_id, submission.title);
    if (project) {
      await deleteProject(project.id);
      const submissionResult = await supabaseClient
        .from("project_submissions")
        .delete()
        .eq("id", submission.id);
      if (submissionResult.error) return alert(submissionResult.error.message);
      await loadSubmissions();
      return;
    }
    const result = await supabaseClient
      .from("project_submissions")
      .delete()
      .eq("id", submission.id);
    if (result.error) return alert(result.error.message);
    await Promise.all([
      storagePath("project-images", submission.thumbnail_path),
      storagePath("project-files", submission.project_file_path),
    ]);
    await loadSubmissions();
  }

  async function loadProjects() {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      $("#projectsList").textContent = error.message;
      return;
    }
    projects = (data || []).filter(
      (project) => project.verification_status === "approved",
    );
    const approvedSubmissions = new Map(
      submissions
        .filter((submission) => submission.verification_status === "approved")
        .map((submission) => [submission.project_id, submission.submitted_at]),
    );
    projects = projects
      .map((project, index) => ({ project, index }))
      .sort((first, second) => {
        const timeDifference =
          new Date(
            approvedSubmissions.get(second.project.id) ||
              second.project.created_at ||
              0,
          ).getTime() -
          new Date(
            approvedSubmissions.get(first.project.id) ||
              first.project.created_at ||
              0,
          ).getTime();
        return timeDifference || first.index - second.index;
      })
      .map(({ project }) => project);
    $("#projectsList").innerHTML = projects.length
      ? projects.map(projectCard).join("")
      : '<div class="empty">No approved projects yet.</div>';
  }

  function projectCard(project) {
    return `<div class="card" style="margin:12px 0;border:1px solid #e7ebf2"><div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap"><div><h3 style="margin:0 0 8px">${esc(project.title)}</h3><div class="muted">${esc(project.department || "—")} · Semester ${esc(project.semester || "—")} · ${esc(project.category || "Uncategorized")}</div><p>${esc(project.description)}</p><div class="muted">${esc(project.student_name || "")} · ${esc(project.tech_stack || "")}</div></div><span class="badge">${esc(project.project_status || "ongoing")}</span></div><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary sm" data-edit-project="${esc(project.id)}">Edit / Replace Files</button><button class="btn danger sm" data-delete-project="${esc(project.id)}">Delete</button></div></div>`;
  }

  function openEditor(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    const form = $("#projectEditorForm");
    form.elements.id.value = project.id;
    form.elements.title.value = project.title || "";
    form.elements.description.value = project.description || "";
    form.elements.department.value = project.department || "";
    form.elements.semester.value = project.semester || "";
    form.elements.category.value = project.category || "";
    form.elements.project_status.value = project.project_status || "ongoing";
    form.elements.tech_stack.value = project.tech_stack || "";
    form.elements.student_name.value = project.student_name || "";
    form.elements.team_members.value = project.team_members || "";
    form.elements.github_url.value = project.github_url || "";
    form.elements.live_url.value = project.live_url || "";
    $("#projectEditor").showModal();
  }

  async function saveProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const project = projects.find((item) => item.id === form.elements.id.value);
    if (!project) return;
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    let newThumbnail = null;
    let newProjectFile = null;
    try {
      const replacingFiles =
        form.elements.thumbnail.files.length ||
        form.elements.project_file.files.length;
      if (
        replacingFiles &&
        !confirm(
          "Replace the selected project file(s)? The old file will be removed after the update succeeds.",
        )
      )
        return;
      newThumbnail = await uploadReplacement(
        form.elements.thumbnail.files[0],
        "project-images",
        project.id,
        "image",
      );
      newProjectFile = await uploadReplacement(
        form.elements.project_file.files[0],
        "project-files",
        project.id,
        "project",
      );
      const payload = {
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim(),
        department: form.elements.department.value.trim() || null,
        semester: form.elements.semester.value
          ? Number(form.elements.semester.value)
          : null,
        category: form.elements.category.value.trim() || null,
        project_status: form.elements.project_status.value,
        tech_stack: form.elements.tech_stack.value.trim() || null,
        student_name: form.elements.student_name.value.trim() || null,
        team_members: form.elements.team_members.value.trim() || null,
        github_url: form.elements.github_url.value.trim() || null,
        live_url: form.elements.live_url.value.trim() || null,
      };
      if (newThumbnail) {
        payload.thumbnail_path = newThumbnail;
        payload.thumbnail_url = supabaseClient.storage
          .from("project-images")
          .getPublicUrl(newThumbnail).data.publicUrl;
      }
      if (newProjectFile) payload.project_file_path = newProjectFile;
      const result = await supabaseClient
        .from("projects")
        .update(payload)
        .eq("id", project.id);
      if (result.error) throw result.error;
      if (newThumbnail && project.thumbnail_path)
        await storagePath("project-images", project.thumbnail_path);
      if (newProjectFile && project.project_file_path)
        await storagePath("project-files", project.project_file_path);
      $("#projectEditor").close();
      await loadProjects();
      alert("Project updated successfully.");
    } catch (error) {
      await Promise.all([
        storagePath("project-images", newThumbnail),
        storagePath("project-files", newProjectFile),
      ]);
      alert(error.message || "Project update failed.");
    } finally {
      button.disabled = false;
    }
  }

  async function deleteProject(id) {
    const project = projects.find((item) => item.id === id);
    if (
      !project ||
      !confirm(`Delete project "${project.title}" and its uploaded files?`)
    )
      return;
    const result = await supabaseClient.from("projects").delete().eq("id", id);
    if (result.error) return alert(result.error.message);
    await Promise.all([
      storagePath("project-images", project.thumbnail_path),
      storagePath("project-files", project.project_file_path),
    ]);
    loadProjects();
  }

  function findProject(id, title) {
    return (
      projects.find((project) => project.id === id) ||
      projects.find((project) => project.title === title)
    );
  }

  function bindEvents() {
    document.querySelectorAll("[data-status]").forEach((button) =>
      button.addEventListener("click", () => {
        selectedStatus = button.dataset.status;
        document
          .querySelectorAll("[data-status]")
          .forEach((item) => item.classList.toggle("primary", item === button));
        loadSubmissions();
      }),
    );
    $("#refresh").addEventListener("click", () =>
      Promise.all([loadSubmissions(), loadProjects()]),
    );
    $("#refreshProjects").addEventListener("click", loadProjects);
    $("#projectEditorForm").addEventListener("submit", saveProject);
    $("#rejectForm").addEventListener("submit", rejectProject);
    $("#closeRejectDialog").addEventListener("click", () =>
      $("#rejectDialog").close(),
    );
    $("#closeProjectEditor").addEventListener("click", () =>
      $("#projectEditor").close(),
    );
    document.addEventListener("click", (event) => {
      const approveButton = event.target.closest("[data-approve]");
      const rejectButton = event.target.closest("[data-reject]");
      const deleteSubmissionButton = event.target.closest(
        "[data-delete-submission]",
      );
      const editButton = event.target.closest("[data-edit-project]");
      const deleteButton = event.target.closest("[data-delete-project]");
      const editApprovedButton = event.target.closest("[data-edit-approved]");
      const deleteApprovedButton = event.target.closest(
        "[data-delete-approved]",
      );
      if (approveButton) approve(approveButton.dataset.approve);
      if (rejectButton) openRejectDialog(rejectButton.dataset.reject);
      if (deleteSubmissionButton)
        deleteSubmission(deleteSubmissionButton.dataset.deleteSubmission);
      if (editButton) openEditor(editButton.dataset.editProject);
      if (deleteButton) deleteProject(deleteButton.dataset.deleteProject);
      if (editApprovedButton) {
        manageApprovedSubmission(
          editApprovedButton.dataset.editApproved,
          editApprovedButton.dataset.projectTitle,
          "edit",
        );
      }
      if (deleteApprovedButton) {
        manageApprovedSubmission(
          deleteApprovedButton.dataset.deleteApproved,
          deleteApprovedButton.dataset.projectTitle,
          "delete",
        );
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
