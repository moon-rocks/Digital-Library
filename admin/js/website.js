(async () => {
  if (!isConfigured()) return;
  const card = document.querySelector(".main .card");
  if (!card) return;
  const inputs = [...card.querySelectorAll("input, textarea")];
  const [heading, description, buttonText, buttonLink] = inputs;
  const { data } = await supabaseClient
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (data) {
    if (heading) heading.value = data.hero_heading || heading.value;
    if (description)
      description.value = data.hero_description || description.value;
    if (buttonText)
      buttonText.value = data.hero_button_text || buttonText.value;
    if (buttonLink)
      buttonLink.value = data.hero_button_link || buttonLink.value;
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
        hero_heading: heading?.value,
        hero_description: description?.value,
        hero_button_text: buttonText?.value,
        hero_button_link: buttonLink?.value,
      });
    save.disabled = false;
    if (result.error)
      return toast("Website settings could not be saved.", "error");
    toast("Website settings saved.");
  };
})();
