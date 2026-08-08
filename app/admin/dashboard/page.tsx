"use client";

import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { getApplications, updateApplicationStatus } from "@/app/actions/approver-actions";

export default function AdminDashboard() {
  const { user } = useUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    const res = await getApplications();
    if (res.success) {
      setApplications(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Adakah anda pasti untuk ${status === "APPROVED" ? "MELULUSKAN" : "MENOLAK"} permohonan ini?`)) return;

    const res = await updateApplicationStatus(id, status);
    if (res.success) {
      alert("Status permohonan berjaya dikemaskini!");
      setSelectedApp(null);
      fetchApps();
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard Semakan & Kelulusan (Admin/Approver)</h1>
          <p className="text-sm text-slate-500">Log masuk sebagai: {user?.fullName || "Pegawai Pelulus"}</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Senarai Permohonan */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-bold text-slate-700 text-lg mb-4">Senarai Permohonan</h2>

          {loading ? (
            <p className="text-sm text-slate-400">Memuatkan data...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-400">Tiada permohonan dijumpai.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-400 ${
                    selectedApp?.id === app.id ? "bg-blue-50 border-blue-500" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-slate-800">
                      Bulan: {app.bulan} {app.tahun}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : app.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Jenis: <span className="font-medium text-slate-700">{app.type}</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">ID: {app.id.substring(0, 8)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Perincian Permohonan (Details) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          {selectedApp ? (
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Perincian Permohonan</h3>
                  <p className="text-xs text-slate-500">Jenis: {selectedApp.type} | Bulan: {selectedApp.bulan} {selectedApp.tahun}</p>
                </div>
                {selectedApp.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, "REJECTED")}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, "APPROVED")}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg"
                    >
                      Luluskan
                    </button>
                  </div>
                )}
              </div>

              {/* Jadual OT jika ada */}
              {selectedApp.application_ot_items?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-amber-800 text-sm mb-2">⏰ Perincian Kerja Lebih Masa (OT)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border">
                      <thead className="bg-amber-50 text-amber-900 border-b">
                        <tr>
                          <th className="p-2">BIL</th>
                          <th className="p-2">TARIKH</th>
                          <th className="p-2">TUGASAN</th>
                          <th className="p-2">LOKASI</th>
                          <th className="p-2">TEMPOH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApp.application_ot_items.map((ot: any, i: number) => (
                          <tr key={ot.id} className="border-b">
                            <td className="p-2 font-bold">{i + 1}</td>
                            <td className="p-2">{ot.tarikh}</td>
                            <td className="p-2">{ot.tugasan}</td>
                            <td className="p-2">{ot.lokasi_mahkamah}</td>
                            <td className="p-2">{ot.tempoh_jam} Jam</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Jadual TNT jika ada */}
              {selectedApp.application_tnt_items?.length > 0 && (
                <div>
                  <h4 className="font-bold text-blue-800 text-sm mb-2">🚘 Perincian Tugas Luar Stesen (TNT)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border">
                      <thead className="bg-blue-50 text-blue-900 border-b">
                        <tr>
                          <th className="p-2">BIL</th>
                          <th className="p-2">TARIKH</th>
                          <th className="p-2">TUGASAN</th>
                          <th className="p-2">LOKASI</th>
                          <th className="p-2">JARAK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApp.application_tnt_items.map((tnt: any, i: number) => (
                          <tr key={tnt.id} className="border-b">
                            <td className="p-2 font-bold">{i + 1}</td>
                            <td className="p-2">{tnt.tarikh}</td>
                            <td className="p-2">{tnt.tugasan}</td>
                            <td className="p-2">{tnt.lokasi_mahkamah}</td>
                            <td className="p-2">{tnt.jarak_km} KM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Sila pilih permohonan dari senarai di sebelah kiri untuk melihat perincian.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}