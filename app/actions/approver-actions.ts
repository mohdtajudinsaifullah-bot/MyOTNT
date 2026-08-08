"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Dapatkan senarai permohonan berserta item TNT & OT
export async function getApplications() {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        application_ot_items (*),
        application_tnt_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching applications:", err);
    return { success: false, error: err.message, data: [] };
  }
}

// Kemaskini status permohonan (APPROVED / REJECTED)
export async function updateApplicationStatus(id: string, status: "APPROVED" | "REJECTED") {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Sesi tidak sah." };
    }

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}