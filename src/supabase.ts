import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://jilryozofyibcuixjbhd.supabase.co";
// const supabaseKey =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbHJ5b3pvZnlpYmN1aXhqYmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTE5OTEsImV4cCI6MjA1ODIyNzk5MX0.aCY4iiCqt-OFQ95eaN64TPO9_QMAUyrUNQe_QKZXgo4";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbHJ5b3pvZnlpYmN1aXhqYmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY1MTk5MSwiZXhwIjoyMDU4MjI3OTkxfQ.MmnsGxuupTa2BhoRRSlbvc1gtbpmJ6zAt36Z493VfJU";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function autoCancelAppointment() {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .lt("appointment_date", new Date().toDateString())
    .in("status", ["pending", "Pending"]);

  if (error) {
    console.error("❌ Error cancelling expired appointments:", error);
    return;
  }

  console.log("✅ Update Success!");
}

export default supabase;
