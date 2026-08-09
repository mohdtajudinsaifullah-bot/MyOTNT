"use client";

import { useState } from "react";
import { submitApplication } from "@/app/actions/submit-application";

type OTItem = {
  tarikh: string;
  tugasan: string;
  lokasiMahkamah: string;
  bilFail: string;
  tempohJam: string;
  alasan: string;
};

type TNTItem = {
  tarikh: string;
  tugasan: string;
  lokasiMahkamah: string;
  jarakKm: string;
  bilFail: string;
  alamatLodging: string;
  alasan: string;
};

export default function ApplicationForm() {
  const [type, setType] = useState<"TNT" | "OT" | "BOTH">("BOTH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("2026");

  const [supporterEmail, setSupporterEmail] = useState("");
  const [approverEmail, setApproverEmail] = useState("");

  const [otItems, setOtItems] = useState<OTItem[]>([
    { tarikh: "", tugasan: "", lokasiMahkamah: "", bilFail: "", tempohJam: "", alasan: "" },
  ]);

  const [tntItems, setTntItems] = useState<TNTItem[]>([
    { tarikh: "", tugasan: "", lokasiMahkamah: "", jarakKm: "", bilFail: "", alamatLodging: "", alasan: "" },
  ]);

  const [attachments, setAttachments] = useState<File[]>([]);

  const addOtRow = () => {
    setOtItems([...otItems, { tarikh: "", tugasan: "", lokasiMahkamah: "", bilFail: "", tempohJam: "", alasan: "" }]);
  };
  const removeOtRow = (index: number) => {
    setOtItems(otItems.filter((_, i) => i !== index));
  };
  const updateOtItem = (index: number, field: keyof OTItem, value: string) => {
    const updated = [...otItems];
    updated[index][field] = value;
    setOtItems(updated);
  };

  const addTntRow = () => {
    setTntItems([...tntItems, { tarikh: "", tugasan: "", lokasiMahkamah: "", jarakKm: "", bilFail: "", alamatLodging: "", alasan: "" }]);
  };
  const removeTntRow = (index: number) => {
    setTntItems(tntItems.filter((_, i) => i !== index));
  };
  const updateTntItem = (index: number, field: keyof TNTItem, value: string) => {
    const updated = [...tntItems];
    updated[index][field] = value;
    setTntItems(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!bulan) {
      alert("Sila isi ruangan Bulan!");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("bulan", bulan);
      formData.append("tahun", tahun);
      formData.append("otItems", JSON.stringify(otItems));
      formData.append("tntItems", JSON.stringify(tntItems));
      formData.append("supporterEmail", supporterEmail);
      formData.append("approverEmail", approverEmail);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await submitApplication(formData);

      if (res.success) {
        alert("Permohonan berjaya dihantar! 🎉");
        setBulan("");
        setAttachments([]);
        setOtItems([{ tarikh: "", tugasan: "", lokasiMahkamah: "", bilFail: "", tempohJam: "", alasan: "" }]);
        setTntItems([{ tarikh: "", tugasan: "", lokasiMahkamah: "", jarakKm: "", bilFail: "", alamatLodging: "", alasan: "" }]);
        setSupporterEmail("");
        setApproverEmail("");
      } else {
        alert(`Gagal Hantar: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Berlaku masalah: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border">
      {/* Header Borang JKSM */}
      <div className="bg-sky-100 border border-sky-300 p-4 rounded-lg text-center mb-6">
        <h2 className="font-bold text-slate-800 text-base md:text-lg uppercase">
          PERMOHONAN KEBENARAN {type === "OT" ? "BEKERJA LEBIH MASA" : type === "TNT" ? "MENJALANKAN TUGAS LUAR STESEN" : "TNT & OT (SERENTAK)"}
        </h2>
        <div className="flex flex-wrap justify-center gap-6 mt-3 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span>BULAN:</span>
            <input type="text" placeholder="Contoh: JULAI" value={bulan} onChange={(e) => setBulan(e.target.value)} className="p-1 border rounded w-28 text-center bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <span>TAHUN:</span>
            <input type="text" value={tahun} onChange={(e) => setTahun(e.target.value)} className="p-1 border rounded w-20 text-center bg-white" />
          </div>
        </div>
      </div>

      {/* Dynamic Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Jenis Permohonan:</label>
        <div className="flex gap-2">
          {(["TNT", "OT", "BOTH"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setType(mode)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === mode ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode === "BOTH" ? "TNT + OT (Serentak)" : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Section OT (MENEGAK / STACK) */}
      {(type === "OT" || type === "BOTH") && (
        <div className="mb-8 border border-amber-200 rounded-lg p-4 bg-amber-50/30">
          <h3 className="text-md font-bold text-amber-800 mb-3 flex items-center gap-2">
            ⏰ Perincian Permohonan Kerja Lebih Masa (OT)
          </h3>
          <div className="space-y-4">
            {otItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {otItems.length > 1 && (
                    <button onClick={() => removeOtRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded">
                      ✕ Padam
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <input type="date" value={item.tarikh} onChange={(e) => updateOtItem(idx, "tarikh", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Tugasan" value={item.tugasan} onChange={(e) => updateOtItem(idx, "tugasan", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Lokasi Mahkamah" value={item.lokasiMahkamah} onChange={(e) => updateOtItem(idx, "lokasiMahkamah", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Bil. Fail" value={item.bilFail} onChange={(e) => updateOtItem(idx, "bilFail", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Tempoh Jam" value={item.tempohJam} onChange={(e) => updateOtItem(idx, "tempohJam", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Alasan Permohonan" value={item.alasan} onChange={(e) => updateOtItem(idx, "alasan", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addOtRow} className="mt-4 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 shadow-sm">
            + Tambah Baris OT
          </button>
        </div>
      )}

      {/* Section TNT (MENEGAK / STACK) */}
      {(type === "TNT" || type === "BOTH") && (
        <div className="mb-8 border border-blue-200 rounded-lg p-4 bg-blue-50/30">
          <h3 className="text-md font-bold text-blue-800 mb-3 flex items-center gap-2">
            🚘 Perincian Permohonan Tugas Luar Stesen (TNT)
          </h3>
          <div className="space-y-4">
            {tntItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {tntItems.length > 1 && (
                    <button onClick={() => removeTntRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded">
                      ✕ Padam
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <input type="date" value={item.tarikh} onChange={(e) => updateTntItem(idx, "tarikh", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Tugasan" value={item.tugasan} onChange={(e) => updateTntItem(idx, "tugasan", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Lokasi Mahkamah" value={item.lokasiMahkamah} onChange={(e) => updateTntItem(idx, "lokasiMahkamah", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Jarak (KM)" value={item.jarakKm} onChange={(e) => updateTntItem(idx, "jarakKm", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Bil. Fail" value={item.bilFail} onChange={(e) => updateTntItem(idx, "bilFail", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Alamat Hotel/Lodging" value={item.alamatLodging} onChange={(e) => updateTntItem(idx, "alamatLodging", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                  <input placeholder="Alasan Permohonan" value={item.alasan} onChange={(e) => updateTntItem(idx, "alasan", e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addTntRow} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm">
            + Tambah Baris TNT
          </button>
        </div>
      )}

      {/* 📧 Bahagian Emel Penyemak & Pelulus */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm my-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>✉️</span> Maklumat Penyemak & Pelulus
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Emel Penyokong / Penyemak
            </label>
            <input
              type="email"
              placeholder="contoh: penyokong@mahkamah.gov.my"
              value={supporterEmail}
              onChange={(e) => setSupporterEmail(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Emel Pelulus
            </label>
            <input
              type="email"
              placeholder="contoh: pelulus@mahkamah.gov.my"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Section Lampiran Dokumen */}
      <div className="mb-8 border border-slate-200 rounded-lg p-4 bg-slate-50">
        <h3 className="text-md font-bold text-slate-800 mb-2 flex items-center gap-2">
          📎 Lampiran Dokumen Sokongan (Surat Arahan / Resit / Dokumen)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Boleh muat naik lebih dari satu fail (PDF, PNG, JPG dll).
        </p>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />

        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Senarai Fail Dipilih:</p>
            {attachments.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                <span className="truncate max-w-md font-medium text-slate-700">📄 {file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-red-500 hover:text-red-700 font-bold ml-2 px-2"
                >
                  Padam
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm rounded-lg shadow transition-all"
        >
          {isSubmitting ? "Sedang Dihantar..." : "Hantar Permohonan"}
        </button>
      </div>
    </div>
  );
}