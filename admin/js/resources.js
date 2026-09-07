let allResources = [];
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}
async function loadResources() {
  if (!isConfigured()) {
    renderResources([]);
    return;
  }
  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return toast("Could not load resources.", "error");
  allResources = data || [];
  renderResources(allResources);
}
function renderResources(resources) {
  const q = (document.querySelector("#search")?.value || "").toLowerCase(),
    t = document.querySelector("#type")?.value || "",
    s = document.querySelector("#status")?.value || "";
  const filtered = resources.filter((x) => {
    const searchable =
      `${x.title || ""} ${x.subject || ""} ${x.branch || ""}`.toLowerCase();
    return (
      (!q || searchable.includes(q)) &&
      (!t || x.resource_type === t) &&
      (!s || x.status === s)
    );
  });
  const rows = document.querySelector("#resourceRows");
  if (!rows) return;
  rows.innerHTML = filtered.length
    ? filtered
        .map(
          (x) =>
            `<tr><td><b>${escapeHtml(x.title)}</b><div class="muted" style="font-size:11px">ADMIN MANAGED</div></td><td>${escapeHtml(x.resource_type || "—")}</td><td>${escapeHtml(x.branch || "—")}</td><td>${escapeHtml(x.semester || "—")}</td><td>${escapeHtml(x.subject || "—")}</td><td><span class="badge ${x.status === "draft" ? "draft" : ""}">${escapeHtml(x.status)}</span></td><td>${x.created_at ? new Date(x.created_at).toLocaleDateString() : "—"}</td><td><div class="actions"><a class="btn sm" href="edit-resource.html?id=${encodeURIComponent(x.id)}">Edit</a><button class="btn danger sm" data-delete-resource="${escapeHtml(x.id)}">Delete</button></div></td></tr>`,
        )
        .join("")
    : '<tr><td colspan="8" class="empty">No resources found.</td></tr>';
  rows
    .querySelectorAll("[data-delete-resource]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        deleteResource(button.dataset.deleteResource),
      ),
    );
}
async function deleteResource(id) {
  if (!confirm("Delete this resource and its stored files?")) return;
  try {
    const lookup = await supabaseClient
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();
    if (lookup.error) throw lookup.error;

    const resource = lookup.data;
    const getStoragePathFromPublicUrl = (url, bucketName) => {
      if (!url) return null;
      const marker = `/storage/v1/object/public/${bucketName}/`;
      const index = url.indexOf(marker);
      return index === -1
        ? null
        : decodeURIComponent(url.slice(index + marker.length));
    };
    const files = [
      {
        bucket: "resources",
        path:
          resource.file_path ||
          getStoragePathFromPublicUrl(resource.file_url, "resources"),
        label: "PDF",
      },
      {
        bucket: "images",
        path:
          resource.image_path ||
          getStoragePathFromPublicUrl(resource.image_url, "images"),
        label: "cover image",
      },
    ].filter((file) => file.path);

    for (const file of files) {
      const result = await supabaseClient.storage
        .from(file.bucket)
        .remove([file.path]);
      if (result.error) {
        console.error(
          `${file.label} STORAGE DELETE ERROR:`,
          result.error,
          file.path,
        );
        throw new Error(
          `${file.label} deletion failed: ${result.error.message}`,
        );
      }
    }

    const deletion = await supabaseClient
      .from("resources")
      .delete()
      .eq("id", resource.id);
    if (deletion.error) {
      console.error("RESOURCE DELETE ERROR:", deletion.error);
      if (files.length)
        console.error("Storage files may now be orphaned:", files);
      throw deletion.error;
    }

    toast("Resource deleted successfully.");
    await loadResources();
  } catch (error) {
    console.error("Supabase delete error:", error);
    toast(`Unable to delete resource: ${error.message || error}`, "error");
    await loadResources();
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  await loadResources();
  ["search", "type", "status"].forEach((id) =>
    document
      .querySelector("#" + id)
      ?.addEventListener("input", () => renderResources(allResources)),
  );
});
