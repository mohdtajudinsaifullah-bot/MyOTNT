"use server";

const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

export async function submitApplication(formData: FormData) {
  try {
    if (!googleScriptUrl) {
      throw new Error("NEXT_PUBLIC_GOOGLE_SCRIPT_URL tidak ditetapkan.");
    }

    const applicationId = `APP-${Date.now()}`;
    const type = formData.get("type") as string;
    
    // Auto Tukar Bulan & Tahun ke Huruf Besar
    const bulan = (formData.get("bulan") as string || "").toUpperCase().trim();
    const tahun = (formData.get("tahun") as string || "").trim();
    const monthApplied = `${bulan}/${tahun}`;

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