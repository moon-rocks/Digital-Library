const publicConfig = window.DIGITAL_LIBRARY_CONFIG || {};
const publicSupabaseClient =
  window.supabase?.createClient && publicConfig.url && publicConfig.anonKey
    ? window.supabase.createClient(publicConfig.url, publicConfig.anonKey)
    : null;
window.digitalLibraryPublic = {
  configured: Boolean(publicSupabaseClient),
  client: publicSupabaseClient,
  normalizeResourceType(type) {
    return String(type || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
  },
  async fetchResources(resourceType) {
    if (!publicSupabaseClient) return null;
    console.log("Requested resource type:", resourceType);
    const result = await publicSupabaseClient
      .from("resources")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (result.error) {
      console.error("Supabase resource error:", result.error);
      throw result.error;
    }
    const normalizedType = this.normalizeResourceType(resourceType);
    const data = (result.data || []).filter(
      (resource) =>
        !normalizedType ||
        this.normalizeResourceType(resource.resource_type) === normalizedType,
    );
    console.log("Fetched resources:", data);
    return data;
  },
  async resources(type) {
    return this.fetchResources(type);
  },
  getResourceFileUrl(resource) {
    if (resource.file_url) return resource.file_url;
    if (!resource.file_path || !publicSupabaseClient) return null;
    return publicSupabaseClient.storage
      .from("resources")
      .getPublicUrl(resource.file_path).data.publicUrl;
  },
  getResourceImageUrl(resource) {
    if (resource.image_url) return resource.image_url;
    if (!resource.image_path || !publicSupabaseClient) return null;
    return publicSupabaseClient.storage
      .from("images")
      .getPublicUrl(resource.image_path).data.publicUrl;
  },
  fileUrl(resource) {
    return this.getResourceFileUrl(resource);
  },
  imageUrl(resource) {
    return this.getResourceImageUrl(resource);
  },
};
