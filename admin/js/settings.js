(async () => {
  if (!isConfigured()) return;
  const card = document.querySelector(".main .card");
  if (!card) return;
  const fields = [...card.querySelectorAll("input, textarea, select")];
  const [websiteName, contactEmail, description, footerText, maintenance] =
    fields;
  const { data } = await supabaseClient
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (data) {
    if (websiteName) websiteName.value = data.website_name || "";
    if (contactEmail) contactEmail.value = data.contact_email || "";
    if (description) description.value = data.website_description || "";
    if (footerText) footerText.value = data.footer_text || "";
    if (maintenance) maintenance.value = data.maintenance_mode ? "On" : "Off";
  }
  const save = card.querySelector("button");
  if (!save) return;
  save.type = "button";
  save.onclick = async () => {
    save.disabled = true;
    const result = await supabaseClient
      .from("site_settings")
      .upsert({
        id: 1,
        website_name: websiteName?.value || "Digital Library",
        contact_email: contactEmail?.value || null,
        website_description: description?.value || null,
        footer_text: footerText?.value || null,
        maintenance_mode: maintenance?.value === "On",
      });
    save.disabled = false;
    if (result.error) return toast("Settings could not be saved.", "error");
    toast("Settings saved.");
  };
})();
