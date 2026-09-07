document.addEventListener("DOMContentLoaded", async () => {
  if (!isConfigured()) {
    ["total", "published", "drafts", "downloads"].forEach(
      (id) => (document.getElementById(id).textContent = "0"),
    );
    return;
  }
  let { data, error } = await supabaseClient
    .from("resources")
    .select(
      "id,title,resource_type,semester,status,downloads,views,file_size,image_size,created_at",
    )
    .order("created_at", { ascending: false });
  if (error && ["PGRST204", "42703"].includes(error.code)) {
    const fallback = await supabaseClient
      .from("resources")
      .select(
        "id,title,resource_type,semester,status,downloads,views,created_at",
      )
      .order("created_at", { ascending: false });
    data = (fallback.data || []).map((resource) => ({
      ...resource,
      file_size: 0,
      image_size: 0,
    }));
    error = fallback.error;
  }
  if (error) {
    const message =
      error.code === "PGRST205"
        ? "Database schema is missing. Run supabase.sql in the configured Supabase project."
        : "Could not load dashboard. Check your Supabase connection.";
    return toast(message, "error");
  }
  const resources = data || [];
  document.getElementById("total").textContent = resources.length;
  document.getElementById("published").textContent = resources.filter(
    (resource) => resource.status === "published",
  ).length;
  document.getElementById("drafts").textContent = resources.filter(
    (resource) => resource.status === "draft",
  ).length;
  document.getElementById("downloads").textContent = resources.reduce(
    (total, resource) => total + (resource.downloads || 0),
    0,
  );
  const views = document.getElementById("views");
  if (views)
    views.textContent = resources.reduce(
      (total, resource) => total + (resource.views || 0),
      0,
    );
  const storageLimit =
    (window.DIGITAL_LIBRARY_STORAGE?.totalStorageGb || 1) * 1024 * 1024 * 1024;
  const storageUsed = resources.reduce(
    (total, resource) =>
      total +
      (Number(resource.file_size) || 0) +
      (Number(resource.image_size) || 0),
    0,
  );
  const storagePercent = Math.min(100, (storageUsed / storageLimit) * 100);
  const storageUsedNode = document.getElementById("storageUsed");
  const storageRemainingNode = document.getElementById("storageRemaining");
  const storageBar = document.getElementById("storageBar");
  const storageStatus = document.getElementById("storageStatus");
  if (storageUsedNode) storageUsedNode.textContent = formatBytes(storageUsed);
  if (storageRemainingNode)
    storageRemainingNode.textContent = `${formatBytes(Math.max(0, storageLimit - storageUsed))} remaining · ${storagePercent.toFixed(1)}% used`;
  if (storageBar) storageBar.style.width = `${storagePercent}%`;
  if (storageStatus) {
    storageStatus.textContent =
      storagePercent >= 95
        ? "Critical"
        : storagePercent >= 85
          ? "High usage"
          : storagePercent >= 70
            ? "Warning"
            : "Normal";
    storageStatus.className = `storage-status ${storagePercent >= 85 ? "danger" : storagePercent >= 70 ? "warning" : "normal"}`;
  }
  const grid = document.querySelector(".grid");
  if (grid && !grid.dataset.typeMetrics) {
    grid.dataset.typeMetrics = "ready";
    ["Book", "Notes", "PYQ", "Lab Manual"].forEach((type) => {
      const count = resources.filter(
        (resource) => resource.resource_type === type,
      ).length;
      const card = document.createElement("div");
      card.className = "card metric";
      card.innerHTML = `<div class="label">${type}s</div><div class="value">${count}</div>`;
      grid.append(card);
    });
  }
  const recent = document.getElementById("recent");
  if (recent)
    recent.innerHTML =
      resources
        .slice(0, 6)
        .map(
          (resource) =>
            `<div style="padding:12px 0;border-bottom:1px solid #edf0f5"><b>${escapeHtml(resource.title)}</b><div class="muted" style="font-size:12px">${escapeHtml(resource.resource_type || "")} · Semester ${escapeHtml(resource.semester || "—")} · ${escapeHtml(resource.status)}</div></div>`,
        )
        .join("") || '<div class="empty">No resources yet.</div>';
});
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>\'"]/g,
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
