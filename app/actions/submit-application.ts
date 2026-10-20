"use server";

const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

function formatMonthApplied(bulanRaw: string, tahunRaw: string): string {
  if (!bulanRaw) return "";

  // Jika input adalah format ISO String (cth: 2026-08-31T16:00:00.000Z)
  if (bulanRaw.includes("T") || bulanRaw.includes("-")) {
    try {
      const d = new Date(bulanRaw);
      if (!isNaN(d.getTime())) {
        const monthNames = [
          "JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN",
          "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"
        ];
        return `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
      }
    } catch (e) {
      // jika gagal parse date, teruskan dengan string biasa
    }
  }

  const bulanFormatted = bulanRaw.toUpperCase().trim();
  const tahunFormatted = (tahunRaw || "").trim();

  if (tahunFormatted && !bulanFormatted.includes("/")) {
    return `${bulanFormatted}/${tahunFormatted}`;
  }

  return bulanFormatted;
}

export async function submitApplication(formData: FormData) {
  try {
    if (!googleScriptUrl) {
      throw new Error("NEXT_PUBLIC_GOOGLE_SCRIPT_URL tidak ditetapkan.");
    }

    const applicationId = `APP-${Date.now()}`;
    const type = formData.get("type") as string;
    
    const rawBulan = (formData.get("bulan") as string || "");
    const rawTahun = (formData.get("tahun") as string || "");
    const monthApplied = formatMonthApplied(rawBulan, rawTahun);

    const vehicleType = (formData.get("vehicleType") as string) || "Kenderaan Sendiri";
    const applicantEmail = (formData.get("applicantEmail") as string) || "";
    const userId = (formData.get("userId") as string) || applicantEmail;

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
      applicantEmail,
      userId,
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
    if (result.result === "error") throw new Error(result.message);

    return { success: true, applicationId };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}