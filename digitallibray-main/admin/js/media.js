(() => {
  const card = document.querySelector(".main .card");
  if (!card || !isConfigured()) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp,application/pdf";
  input.className = "input";
  const upload = document.createElement("button");
  upload.type = "button";
  upload.className = "btn primary";
  upload.textContent = "Upload file";
  const list = document.createElement("div");
  list.className = "table-wrap";
  const summary = document.createElement("div");
  summary.className = "muted storage-summary";
  summary.textContent = "Calculating storage...";
  card.querySelector(".section-head")?.append(input, upload);
  card.querySelector(".section-head")?.after(summary);
  card.querySelector(".empty")?.replaceWith(list);
  async function listFolder(bucket, folder = "") {
    const result = await supabaseClient.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (result.error) return [];
    const files = [];
    for (const item of result.data || []) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.id) files.push({ ...item, bucket, path });
      else files.push(...(await listFolder(bucket, path)));
    }
    return files;
  }
  async function load() {
    const objects = [];
    for (const bucket of ["resources", "images"]) {
      objects.push(...(await listFolder(bucket)));
    }
    const used = objects.reduce(
      (total, file) => total + (Number(file.metadata?.size) || 0),
      0,
    );
    const limit =
      (window.DIGITAL_LIBRARY_STORAGE?.totalStorageGb || 1) *
      1024 *
      1024 *
      1024;
    summary.textContent = `Storage: ${formatBytes(used)} used · ${formatBytes(Math.max(0, limit - used))} remaining · ${((used / limit) * 100).toFixed(1)}%`;
    list.innerHTML = objects.length
      ? `<table class="table"><thead><tr><th>Name</th><th>Folder</th><th>Type</th><th>Size</th><th>Updated</th><th>Action</th></tr></thead><tbody>${objects.map((file) => `<tr><td>${escapeHtml(file.name)}</td><td>${escapeHtml(file.path.slice(0, Math.max(0, file.path.lastIndexOf("/"))) || "—")}</td><td>${escapeHtml(file.metadata?.mimetype || "—")}</td><td>${formatBytes(Number(file.metadata?.size) || 0)}</td><td>${file.updated_at ? new Date(file.updated_at).toLocaleDateString() : "—"}</td><td><button class="btn danger sm" data-delete-file="${escapeHtml(file.bucket)}" data-file-path="${escapeHtml(file.path)}">Delete</button></td></tr>`).join("")}</tbody></table>`
      : '<div class="empty">No files uploaded yet.</div>';
    list.querySelectorAll("[data-delete-file]").forEach(
      (button) =>
        (button.onclick = async () => {
          if (!confirm("Delete this stored file?")) return;
          const result = await supabaseClient.storage
            .from(button.dataset.deleteFile)
            .remove([button.dataset.filePath]);
          if (result.error) return toast("File could not be deleted.", "error");
          toast("File deleted.");
          load();
        }),
    );
  }
  upload.onclick = async () => {
    const file = input.files[0];
    if (!file) return toast("Choose a file first.", "error");
    const isPdf = file.type === "application/pdf";
    const limit = isPdf
      ? (window.DIGITAL_LIBRARY_STORAGE?.maxPdfSizeMb || 10) * 1024 * 1024
      : (window.DIGITAL_LIBRARY_STORAGE?.maxImageSizeMb || 2) * 1024 * 1024;
    if (file.size > limit)
      return toast(`File must be smaller than ${formatBytes(limit)}.`, "error");
    if (
      !isPdf &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return toast("Unsupported image format.", "error");
    const bucket = isPdf ? "resources" : "images";
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    upload.disabled = true;
    const result = await supabaseClient.storage.from(bucket).upload(path, file);
    upload.disabled = false;
    if (result.error) return toast("Upload failed.", "error");
    toast("File uploaded.");
    input.value = "";
    load();
  };
  load();
})();
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
