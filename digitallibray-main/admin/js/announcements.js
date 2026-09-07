(() => {
  const card = document.querySelector(".main .card");
  if (!card || !isConfigured()) return;
  const list = document.createElement("div");
  list.className = "announcement-list";
  const form = document.createElement("form");
  form.className = "form-grid announcement-form";
  form.innerHTML = `<div class="field"><label>Title</label><input class="input" name="title" required></div><div class="field"><label>Type</label><select class="select" name="type"><option>Info</option><option>Important</option><option>New</option><option>Update</option><option>Notice</option></select></div><div class="field full"><label>Message</label><textarea class="textarea" name="message" required></textarea></div><div class="field"><label>Status</label><select class="select" name="status"><option value="draft">Draft</option><option value="published">Published</option></select></div><div class="field"><label>Start Date</label><input class="input" type="datetime-local" name="start_date"></div><div class="field"><label>End Date</label><input class="input" type="datetime-local" name="end_date"></div><div class="field full"><button class="btn primary" type="submit">Save Announcement</button></div>`;
  card.replaceChildren(form, list);
  async function load() {
    const { data, error } = await supabaseClient
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast("Could not load announcements.", "error");
    list.innerHTML = data?.length
      ? data
          .map(
            (item) =>
              `<div class="card"><b>${escapeHtml(item.title)}</b><div class="muted">${escapeHtml(item.type)} · ${escapeHtml(item.status)}</div><p>${escapeHtml(item.message)}</p><button class="btn danger sm" data-delete="${item.id}">Delete</button></div>`,
          )
          .join("")
      : '<div class="empty">No announcements yet.</div>';
    list.querySelectorAll("[data-delete]").forEach(
      (button) =>
        (button.onclick = async () => {
          if (!confirm("Delete this announcement?")) return;
          const result = await supabaseClient
            .from("announcements")
            .delete()
            .eq("id", button.dataset.delete);
          if (result.error) return toast("Delete failed.", "error");
          toast("Announcement deleted.");
          load();
        }),
    );
  }
  form.onsubmit = async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const result = await supabaseClient
      .from("announcements")
      .insert({
        title: values.get("title"),
        message: values.get("message"),
        type: values.get("type"),
        status: values.get("status"),
        start_date: values.get("start_date") || null,
        end_date: values.get("end_date") || null,
      });
    if (result.error) return toast("Announcement could not be saved.", "error");
    form.reset();
    toast("Announcement created.");
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
