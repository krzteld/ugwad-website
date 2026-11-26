// Shared Database, Cloudinary & Security Configuration

const CONFIG = {
  // 1. Supabase Credentials (Found in Supabase: Project Settings > API)
  SUPABASE_URL: "https://nosjmgfouvvhmpzpbyqm.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2ptZ2ZvdXZ2aG1wenBieXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5Mjc4MjAsImV4cCI6MjExMDUwMzgyMH0.VFpwE126fCc9iRRgB4tv236Uc4EhiFJyCUiI3_rDOOg",

  // 2. Cloudinary Credentials (Found in Cloudinary Dashboard & Upload Presets)
  CLOUDINARY_CLOUD_NAME: "dxu2mgjfj",
  CLOUDINARY_UPLOAD_PRESET: "ugwad_unsigned",

  // 3. Organization Security Passcode
  ORG_PASSCODE: "UGWAD2026"
};

// Initialize the global Supabase client for Members 2, 3, and 4 to use
const supabaseClient = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

// Helper function to upload product photos or GCash receipts to Cloudinary
async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CONFIG.CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
     "https://api.cloudinary.com/v1_1/" + CONFIG.CLOUDINARY_CLOUD_NAME + "/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Image upload to Cloudinary failed. Check your preset settings.");
  }

  const data = await response.json();
  return data.secure_url; // Returns the clickable image link
}
