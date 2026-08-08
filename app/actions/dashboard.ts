"use server";

const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

export async function fetchDashboardData() {
  try {
    if (!googleScriptUrl) throw new Error("URL Google Script tidak ditemui.");
    const res = await fetch(googleScriptUrl, { cache: "no-store" });
    const data = await res.json();
    if (data.result === "error") throw new Error(data.message);

    return { 
      success: true, 
      applications: data.applications || [], 
      users: data.users || [],
      profiles: data.profiles || []
    };
  } catch (err: any) {
    return { success: false, error: err.message, applications: [], users: [], profiles: [] };
  }
}

export async function updateApplicationStatus(payload: {
  applicationId: string;
  newStatus: string;
  supporterName?: string;
  supporterJawatan?: string;
  approverName?: string;
  signatureBase64?: string;
}) {
  try {
    if (!googleScriptUrl) throw new Error("URL Google Script tidak ditemui.");

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateStatus",
        ...payload
      }),
    });

    const data = await res.json();
    if (data.result === "error") throw new Error(data.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveProfileAction(profileData: {
  email: string;
  nama: string;
  jawatan: string;
  tempatBertugas: string;
  noTel: string;
}) {
  try {
    if (!googleScriptUrl) throw new Error("URL Google Script tidak ditemui.");

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveProfile",
        ...profileData
      }),
    });

    const data = await res.json();
    if (data.result === "error") throw new Error(data.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveUserAction(userData: { name: string; email: string; role: string; status: string }) {
  try {
    if (!googleScriptUrl) throw new Error("URL Google Script tidak ditemui.");

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveUser", ...userData }),
    });

    const data = await res.json();
    if (data.result === "error") throw new Error(data.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUserAction(email: string) {
  try {
    if (!googleScriptUrl) throw new Error("URL Google Script tidak ditemui.");

    const res = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteUser", email }),
    });

    const data = await res.json();
    if (data.result === "error") throw new Error(data.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}