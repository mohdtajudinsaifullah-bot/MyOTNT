"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

export async function submitApplication(formData: FormData) {
  try {
    if (!googleScriptUrl) {
      throw new Error("NEXT_PUBLIC_GOOGLE_SCRIPT_URL tidak ditetapkan dalam fail .env atau Vercel.");
    }

    const { userId } = await auth();
    let activeUserId = userId;

    if (!activeUserId) {
      const user = await currentUser();
      activeUserId = user?.id || null;
    }

    const applicationId = `APP-${Date.now()}`;
    const type = formData.get("type") as string;
    const monthApplied = `${formData.get("bulan")}/${formData.get("tahun")}`;
    const vehicleType = (formData.get("vehicleType") as string) || "Kenderaan Sendiri";
    const otItems = JSON.parse((formData.get("otItems") as string) || "[]");
    const tntItems = JSON.parse((formData.get("tntItems") as string) || "[]");
    const supporterEmail = formData.get("supporterEmail") as string;
    const approverEmail = formData.get("approverEmail") as string;

    const attachmentsFiles: { fileName: string; mimeType: string; base64Data: string }[] = [];
    const files = formData.getAll("attachments") as File[];

    for (const file of files) {
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        attachmentsFiles.push({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Data: base64Data,
        });
      }
    }

    const payload = {
      action: "submitApplication",
      applicationId,
      userId: activeUserId,
      type,
      monthApplied,
      vehicleType,
      otItems,
      tntItems,
      supporterEmail,
      approverEmail,
      attachmentsFiles,
    };

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.result === "error") {
      throw new Error(result.message);
    }

    return { success: true, applicationId };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}