"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

export async function submitApplication(formData: FormData) {
  try {
    if (!googleScriptUrl) {
      return { success: false, error: "URL Google Apps Script tidak dijumpai dalam .env.local" };
    }

    const type = formData.get("type") as "TNT" | "OT" | "BOTH";
    const bulan = (formData.get("bulan") as string) || "";
    const tahun = (formData.get("tahun") as string) || "2026";
    const supporterEmail = (formData.get("supporterEmail") as string) || "";
    const approverEmail = (formData.get("approverEmail") as string) || "";

    const otItems = JSON.parse((formData.get("otItems") as string) || "[]");
    const tntItems = JSON.parse((formData.get("tntItems") as string) || "[]");

    // Pengesahan Clerk
    const authObj = await auth();
    let activeUserId = authObj?.userId;
    if (!activeUserId) {
      const user = await currentUser();
      activeUserId = user?.id;
    }

    const applicationId = `APP-${Date.now()}`;

    // Convert attachments
    const files = formData.getAll("attachments") as File[];
    const attachmentsFiles = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (!file || file.size === 0) continue;
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        attachmentsFiles.push({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Data: base64Data,
        });
      }
    }

    const payload = {
      applicationId,
      userId: activeUserId || "GUEST",
      type,
      monthApplied: `${bulan}/${tahun}`,
      supporterEmail,
      approverEmail,
      otItems,
      tntItems,
      attachmentsFiles,
    };

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return { success: false, error: "Maklum balas Google Script tidak sah: " + responseText };
    }

    if (result.result === "error") {
      return { success: false, error: result.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Submit Error:", err);
    return { success: false, error: err.message || "Berlaku masalah semasa menghantar." };
  }
}