const storageConfig = window.DIGITAL_LIBRARY_STORAGE || {
  maxPdfSizeMb: 10,
  maxImageSizeMb: 2,
};
const maxPdfBytes = storageConfig.maxPdfSizeMb * 1024 * 1024;
const maxImageBytes = storageConfig.maxImageSizeMb * 1024 * 1024;
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
async function uploadFile(file, bucket, folder, resourceId) {
  if (!file || !file.size) return null;
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${resourceId}/${safe}`;
  const { error } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (error) {
    console.error("STORAGE ERROR:", error);
    console.error("FILE PATH", path);
    console.error("FILE", file);
    throw error;
  }
  const { data: publicData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(path);
  const publicUrl = publicData?.publicUrl || null;
  console.log("Uploaded file URL:", publicUrl);
  return { path, size: file.size, publicUrl };
}
function validateFile(file, types, maxBytes, label) {
  if (!file || !file.size) return null;
  const extension = file.name.split(".").pop().toLowerCase();
  if (!types.extensions.includes(extension) || !types.mime.includes(file.type))
    throw new Error(`${label} format is not supported.`);
  if (file.size > maxBytes)
    throw new Error(`${label} must be smaller than ${formatBytes(maxBytes)}.`);
  return file;
}
function showFileInfo(input, label, limit) {
  if (!input || input.dataset.storageInfo) return;
  const info = document.createElement("small");
  info.className = "file-info muted";
  info.textContent = `${label} limit: ${formatBytes(limit)}`;
  input.after(info);
  input.addEventListener("change", () => {
    const file = input.files[0];
    info.textContent = file
      ? `${file.name} · ${formatBytes(file.size)} · limit ${formatBytes(limit)}`
      : `${label} limit: ${formatBytes(limit)}`;
  });
  input.dataset.storageInfo = "true";
}
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("#resourceForm");
  if (!form) return;
  if (
    form.elements.resource_type &&
    !form.elements.resource_type.querySelector('[value="Beyond Curriculum"]')
  ) {
    form.elements.resource_type.add(
      new Option("Beyond Curriculum", "Beyond Curriculum"),
    );
  }
  const id = new URLSearchParams(location.search).get("id");
  showFileInfo(form.elements.file, "PDF", maxPdfBytes);
  showFileInfo(form.elements.image, "Image", maxImageBytes);
  if (window.EDIT_MODE && id && isConfigured()) {
    const { data, error } = await supabaseClient
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return toast("Resource could not be loaded.", "error");
    Object.entries(data).forEach(([key, value]) => {
      if (form.elements[key] && form.elements[key].type !== "file")
        form.elements[key].value = Array.isArray(value)
          ? value.join(", ")
          : (value ?? "");
    });
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#saveBtn");
    button.disabled = true;
    button.textContent = "Uploading...";
    const uploadedFiles = [];
    try {
      if (!isConfigured()) throw new Error("Supabase is not configured.");
      const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();
      if (userError || !userData.user || !(await isAdminUser(userData.user)))
        throw new Error("You are not authorized to upload resources.");
      console.info("Authenticated upload user:", userData.user.id);
      const values = new FormData(form);
      const file = validateFile(
        values.get("file"),
        {
          mime: ["application/pdf"],
          extensions: ["pdf"],
        },
        maxPdfBytes,
        "PDF",
      );
      const image = validateFile(
        values.get("image"),
        {
          mime: ["image/jpeg", "image/png", "image/webp"],
          extensions: ["jpg", "jpeg", "png", "webp"],
        },
        maxImageBytes,
        "Image",
      );
      const type = values.get("resource_type");
      if (!RESOURCE_TYPES.includes(type))
        throw new Error("Choose a valid resource type.");
      const resourceId = id || crypto.randomUUID();
      const payload = {
        id: resourceId,
        title: String(values.get("title") || "").trim(),
        description: values.get("description"),
        resource_type: type,
        branch: values.get("branch"),
        semester: values.get("semester")
          ? Number(values.get("semester"))
          : null,
        subject: values.get("subject"),
        academic_year: values.get("academic_year")
          ? Number(values.get("academic_year"))
          : null,
        tags: String(values.get("tags") || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: values.get("status") || "draft",
      };
      if (!payload.title) throw new Error("Title is required.");
      const storageLimit =
        (storageConfig.totalStorageGb || 1) * 1024 * 1024 * 1024;
      const usageResult = await supabaseClient
        .from("resources")
        .select("file_size,image_size");
      const hasStorageMetadata = !usageResult.error;
      if (usageResult.error?.code === "PGRST205")
        throw new Error(
          "Resources table is missing. Run supabase.sql in your Supabase project first.",
        );
      if (
        usageResult.error &&
        !["PGRST204", "42703"].includes(usageResult.error.code)
      )
        throw new Error("Could not check storage availability.");
      const currentUsage = (usageResult.data || []).reduce(
        (total, resource) =>
          total +
          (Number(resource.file_size) || 0) +
          (Number(resource.image_size) || 0),
        0,
      );
      const selectedSize = (file?.size || 0) + (image?.size || 0);
      if (currentUsage + selectedSize > storageLimit)
        throw new Error(
          "Storage limit reached. Remove unused files before uploading.",
        );
      if (!window.EDIT_MODE && !file)
        throw new Error("A PDF file is required.");
      if (file) {
        const uploaded = await uploadFile(
          file,
          "resources",
          type.toLowerCase().replaceAll(" ", "-"),
          resourceId,
        );
        payload.file_path = uploaded.path;
        if (hasStorageMetadata) payload.file_size = uploaded.size;
        uploadedFiles.push({ bucket: "resources", path: uploaded.path });
      }
      if (image) {
        const uploaded = await uploadFile(
          image,
          "images",
          "images/thumbnails",
          resourceId,
        );
        payload.image_path = uploaded.path;
        if (hasStorageMetadata) payload.image_size = uploaded.size;
        uploadedFiles.push({ bucket: "images", path: uploaded.path });
      }
      button.textContent = "Saving...";
      const result =
        window.EDIT_MODE && id
          ? await supabaseClient.from("resources").update(payload).eq("id", id)
          : await supabaseClient.from("resources").insert(payload);
      if (result.error) {
        console.error("RESOURCE INSERT ERROR:", result.error);
        throw result.error;
      }
      console.log("Resource payload:", payload);
      toast(
        window.EDIT_MODE
          ? "Resource updated successfully."
          : "Resource uploaded successfully.",
      );
      form.reset();
      setTimeout(() => (location.href = "resources.html"), 700);
    } catch (error) {
      console.error("RESOURCE SAVE ERROR", error);
      await Promise.all(
        uploadedFiles.map((file) =>
          supabaseClient.storage.from(file.bucket).remove([file.path]),
        ),
      );
      const message = error.message || "Save failed.";
      const lowerMessage = message.toLowerCase();
      const friendlyMessage = lowerMessage.includes("row-level security")
        ? "Storage RLS policy rejected this upload. Run the latest Storage policies SQL."
        : lowerMessage.includes("invalid jwt") || lowerMessage.includes("jwt")
          ? "Your login session has expired. Please login again."
          : lowerMessage.includes("permission denied") || error.status === 403
            ? "Storage INSERT permission was denied. Check the bucket policy for this admin user."
            : message.toLowerCase().includes("bucket")
              ? "Storage bucket is missing or unavailable. Check the resources/images buckets."
              : message.toLowerCase().includes("column")
                ? "Resource schema columns do not match. Run the latest supabase.sql migration."
                : message.includes("duplicate") ||
                    message.includes("already exists")
                  ? "A file with this name already exists. Rename the file and try again."
                  : message;
      toast(friendlyMessage, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Save Resource";
    }
  });
});
