"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { 
  fetchDashboardData, 
  updateApplicationStatus, 
  saveProfileAction,
  saveUserAction, 
  deleteUserAction 
} from "../actions/dashboard";
import ApplicationForm from "../application-form";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<"status" | "new_app" | "profile" | "users">("status");
  const [selectedAppForPrint, setSelectedAppForPrint] = useState<any>(null);

  // STATE SEARCH & FILTER
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterState, setFilterState] = useState("ALL");

  // State Profil Pemohon
  const [profNama, setProfNama] = useState("");
  const [profJawatan, setProfJawatan] = useState("");
  const [profTempat, setProfTempat] = useState("");
  const [profNoTel, setProfNoTel] = useState("");
  const [isSavingProf, setIsSavingProf] = useState(false);

  // State Modal Actions (Sokong / Lulus / Tolak)
  const [actionModalApp, setActionModalApp] = useState<any>(null);
  const [actionType, setActionType] = useState<"DISOKONG" | "DILULUSKAN" | "DITOLAK" | null>(null);
  const [officerName, setOfficerName] = useState("");
  const [officerJawatan, setOfficerJawatan] = useState("");
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State Admin
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("PENYOKONG");
  const [formStatus, setFormStatus] = useState("AKTIF");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const currentUserRecord = users.find(u => u.email.toLowerCase() === currentUserEmail);
  const userRole = currentUserRecord ? currentUserRecord.role : "PEMOHON";

  const loadData = async () => {
    setLoading(true);
    const res = await fetchDashboardData();
    if (res.success) {
      setApplications(res.applications);
      setUsers(res.users);
      setProfiles(res.profiles);

      const myProf = (res.profiles || []).find((p: any) => p.email.toLowerCase() === currentUserEmail);
      if (myProf) {
        setProfNama(myProf.nama || user?.fullName || "");
        setProfJawatan(myProf.jawatan || "");
        setProfTempat(myProf.tempatBertugas || "");
        setProfNoTel(myProf.noTel || "");
      } else {
        setProfNama(user?.fullName || "");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProf(true);
    const res = await saveProfileAction({
      email: currentUserEmail,
      nama: profNama,
      jawatan: profJawatan,
      tempatBertugas: profTempat,
      noTel: profNoTel
    });
    setIsSavingProf(false);

    if (res.success) {
      alert("Profil berjaya dikemaskini!");
      loadData();
    } else {
      alert("Gagal mengemaskini profil: " + res.error);
    }
  };

  const openActionModal = (app: any, newStatus: "DISOKONG" | "DILULUSKAN" | "DITOLAK") => {
    setActionModalApp(app);
    setActionType(newStatus);
    setOfficerName(user?.fullName || "");
    setOfficerJawatan(newStatus === "DISOKONG" ? "PENYOKONG / PENYEMAK" : "PENGARAH BPKR");
    setSignatureBase64(null);
  };

  const handleConfirmAction = async () => {
    if (actionType !== "DITOLAK" && (!officerName || !signatureBase64)) {
      alert("Sila isi Nama dan muat naik Tandatangan Digital!");
      return;
    }

    setIsSubmittingAction(true);
    const res = await updateApplicationStatus({
      applicationId: actionModalApp.applicationId,
      newStatus: actionType!,
      supporterName: actionType === "DISOKONG" ? officerName : undefined,
      supporterJawatan: actionType === "DISOKONG" ? officerJawatan : undefined,
      approverName: actionType === "DILULUSKAN" ? officerName : undefined,
      signatureBase64: signatureBase64 || ""
    });
    setIsSubmittingAction(false);

    if (res.success) {
      alert(`Permohonan berjaya dikemaskini ke status ${actionType}!`);
      setActionModalApp(null);
      loadData();
    } else {
      alert("Gagal: " + res.error);
    }
  };

  const handleSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return alert("Sila isi Nama dan Emel.");
    setIsSubmittingUser(true);
    const res = await saveUserAction({
      name: formName,
      email: formEmail.toLowerCase().trim(),
      role: formRole,
      status: formStatus
    });
    setIsSubmittingUser(false);
    if (res.success) {
      alert("User berjaya disimpan!");
      setFormName(""); setFormEmail(""); loadData();
    } else alert("Gagal: " + res.error);
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Padam pengguna ${email}?`)) return;
    const res = await deleteUserAction(email);
    if (res.success) { alert("User dipadam."); loadData(); }
  };

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split("T")[0] || dateStr;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  const isRecentUpdate = (tarikhStr: string) => {
    if (!tarikhStr) return false;
    const dateObj = new Date(tarikhStr);
    const diffTime = Math.abs(new Date().getTime() - dateObj.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
  };

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-gray-600 font-medium">Sedang memuatkan Dashboard MyOTNT...</div>;
  }

  // 1. Tapis permohonan mengikut peranan (Role Filter)
  const roleFilteredApps = applications.filter(app => {
    if (userRole === "MASTER_ADMIN") return true;
    if (userRole === "PENYOKONG" || app.supporterEmail?.toLowerCase() === currentUserEmail) {
      return true; // Penyokong boleh lihat semua status semakan
    }
    if (userRole === "PELULUS" || app.approverEmail?.toLowerCase() === currentUserEmail) {
      return true; // Pelulus boleh lihat semua status semakan
    }
    return app.userId === user?.id || app.supporterEmail?.toLowerCase() === currentUserEmail || app.applicantEmail?.toLowerCase() === currentUserEmail;
  });

  // 2. Tapis mengikut Carian Nama, Status, dan Negeri / Tempat Bertugas
  const filteredApps = roleFilteredApps.filter(app => {
    const applicantProf = profiles.find(p => p.email.toLowerCase() === (app.applicantEmail?.toLowerCase() || "")) || {};
    const appName = (applicantProf.nama || app.applicantName || "").toLowerCase();
    const appTempat = (applicantProf.tempatBertugas || app.applicantTempat || "").toLowerCase();
    const appId = (app.applicationId || "").toLowerCase();

    // Matching Carian Nama / ID
    const matchSearch = searchQuery === "" || appName.includes(searchQuery.toLowerCase()) || appId.includes(searchQuery.toLowerCase());
    
    // Matching Status
    const matchStatus = filterStatus === "ALL" || app.status === filterStatus;

    // Matching Negeri / Tempat
    const matchState = filterState === "ALL" || appTempat.includes(filterState.toLowerCase());

    return matchSearch && matchStatus && matchState;
  });

  const parseItems = (jsonStr: string) => {
    try { return JSON.parse(jsonStr || "[]"); } catch { return []; }
  };

  const appApplicantEmail = selectedAppForPrint?.applicantEmail?.toLowerCase() || "";
  const selectedApplicantProfile = appApplicantEmail 
    ? profiles.find(p => p.email.toLowerCase() === appApplicantEmail)
    : null;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 print:p-0 print:max-w-none print:w-full">
      {/* HEADER BAR UTAMA */}
      <div className="print:hidden bg-white rounded-xl shadow-sm border p-4 md:p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Sistem Permohonan TNT & OT (JKSM)</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Selamat datang, <span className="font-semibold text-gray-700">{user?.fullName || user?.firstName}</span> ({currentUserEmail}) | 
            Peranan: <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded font-bold ml-1">{userRole}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMainTab("status")}
            className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${
              mainTab === "status" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📋 Status Permohonan
          </button>

          <button
            onClick={() => setMainTab("new_app")}
            className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${
              mainTab === "new_app" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ➕ Permohonan Baharu
          </button>

          <button
            onClick={() => setMainTab("profile")}
            className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${
              mainTab === "profile" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            👤 Profil Saya
          </button>

          {userRole === "MASTER_ADMIN" && (
            <button
              onClick={() => setMainTab("users")}
              className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${
                mainTab === "users" ? "bg-purple-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ⚙️ Pengurusan Pengguna
            </button>
          )}

          <div className="border-l pl-3 ml-1">
            <UserButton />
          </div>
        </div>
      </div>

      {/* TAB 1: STATUS PERMOHONAN */}
      {mainTab === "status" && (
        <div className="print:hidden bg-white rounded-xl shadow-sm border overflow-hidden">
          
          {/* HEADER JADUAL & BOTON REFRESH */}
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">Rekod & Status Permohonan Saya / Semakan</h2>
              <p className="text-xs text-gray-500">Jumlah rekod dijumpai: <span className="font-bold text-blue-600">{filteredApps.length}</span></p>
            </div>
            <button onClick={loadData} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-gray-700 font-medium">
              🔄 Refresh Data
            </button>
          </div>

          {/* 🔍 RUANGAN FILTER CARIAN PINTAR (NAMA, STATUS, NEGERI) */}
          <div className="p-4 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. CARIAN NAMA / ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">🔍 Cari Nama / ID Permohonan:</label>
              <input
                type="text"
                placeholder="Taip nama pemohon atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 2. FILTER STATUS */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📌 Tapis Mengikut Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">-- Semua Status --</option>
                <option value="PENDING">🟡 PENDING (Menunggu Sokongan)</option>
                <option value="DISOKONG">🔵 DISOKONG (Menunggu Kelulusan)</option>
                <option value="DILULUSKAN">🟢 DILULUSKAN</option>
                <option value="DITOLAK">🔴 DITOLAK</option>
              </select>
            </div>

            {/* 3. FILTER NEGERI / TEMPAT BERTUGAS */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">🏛️ Tapis Mengikut Negeri / Lokasi:</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">-- Semua Negeri / Lokasi --</option>
                <option value="JKSM">JKSM Putrajaya</option>
                <option value="Kuala Lumpur">W.P. Kuala Lumpur</option>
                <option value="Selangor">Selangor</option>
                <option value="Johor">Johor</option>
                <option value="Kedah">Kedah</option>
                <option value="Kelantan">Kelantan</option>
                <option value="Melaka">Melaka</option>
                <option value="Negeri Sembilan">Negeri Sembilan</option>
                <option value="Pahang">Pahang</option>
                <option value="Penang">Pulau Pinang</option>
                <option value="Perak">Perak</option>
                <option value="Perlis">Perlis</option>
                <option value="Sabah">Sabah</option>
                <option value="Sarawak">Sarawak</option>
                <option value="Terengganu">Terengganu</option>
                <option value="Labuan">W.P. Labuan</option>
              </select>
            </div>
          </div>

          {/* JADUAL REKOD */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">ID & Pemohon</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Bulan/Tahun</th>
                  <th className="px-4 py-3">Tarikh Mohon</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lampiran</th>
                  <th className="px-4 py-3 text-center">Tindakan / Cetak PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredApps.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tiada rekod permohonan dijumpai berdasarkan carian anda.</td></tr>
                ) : (
                  filteredApps.map((app) => {
                    const applicantProf = profiles.find(p => p.email.toLowerCase() === (app.applicantEmail?.toLowerCase() || "")) || {};
                    const displayName = applicantProf.nama || app.applicantName || "Pemohon";
                    const displayTempat = applicantProf.tempatBertugas || app.applicantTempat || "";
                    const showNewBadge = (app.status === "DILULUSKAN" || app.status === "DITOLAK") && isRecentUpdate(app.tarikhMohon);

                    return (
                      <tr key={app.applicationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{app.applicationId}</span>
                            {showNewBadge && (
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-semibold mt-0.5">{displayName}</div>
                          {displayTempat && <div className="text-[10px] text-gray-400 uppercase">{displayTempat}</div>}
                        </td>
                        <td className="px-4 py-3 font-medium">{app.type}</td>
                        <td className="px-4 py-3">{app.monthApplied}</td>
                        <td className="px-4 py-3 text-xs">{formatDateOnly(app.tarikhMohon)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs rounded font-bold flex items-center gap-1 w-fit ${
                            app.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            app.status === "DISOKONG" ? "bg-blue-100 text-blue-800" :
                            app.status === "DILULUSKAN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {app.status}
                            {showNewBadge && <span className="bg-red-600 text-white text-[9px] px-1 rounded animate-bounce">NEW</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.fileUrls ? (
                            <a href={app.fileUrls} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-semibold">Lihat Fail</a>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5 flex-wrap">
                            {/* TINDAKAN PENYOKONG */}
                            {(userRole === "PENYOKONG" || userRole === "MASTER_ADMIN") && app.status === "PENDING" && (
                              <>
                                <button onClick={() => openActionModal(app, "DISOKONG")} className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-blue-700 shadow-sm">
                                  Sokong
                                </button>
                                <button onClick={() => openActionModal(app, "DITOLAK")} className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-bold hover:bg-red-700 shadow-sm">
                                  Tolak
                                </button>
                              </>
                            )}

                            {/* TINDAKAN PELULUS */}
                            {(userRole === "PELULUS" || userRole === "MASTER_ADMIN") && app.status === "DISOKONG" && (
                              <>
                                <button onClick={() => openActionModal(app, "DILULUSKAN")} className="bg-green-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-700 shadow-sm">
                                  Luluskan
                                </button>
                                <button onClick={() => openActionModal(app, "DITOLAK")} className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-bold hover:bg-red-700 shadow-sm">
                                  Tolak
                                </button>
                              </>
                            )}

                            {/* DOKUMEN RASMI */}
                            {app.status === "DILULUSKAN" && (
                              <button onClick={() => setSelectedAppForPrint(app)} className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-black flex items-center gap-1 shadow-sm">
                                🖨️ Surat / Slip PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BORANG PERMOHONAN BAHARU */}
      {mainTab === "new_app" && <div className="print:hidden"><ApplicationForm /></div>}

      {/* TAB 3: PROFIL SAYA */}
      {mainTab === "profile" && (
        <div className="print:hidden bg-white rounded-xl shadow-sm border p-6 max-w-2xl mx-auto">
          <h2 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Kemaskini Profil Pemohon</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Penuh Pegawai</label>
              <input type="text" value={profNama} onChange={(e) => setProfNama(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Jawatan</label>
              <input type="text" value={profJawatan} onChange={(e) => setProfJawatan(e.target.value)} placeholder="Contoh: Penolong Pengarah" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tempat Bertugas</label>
              <input type="text" value={profTempat} onChange={(e) => setProfTempat(e.target.value)} placeholder="Contoh: Jabatan Kehakiman Syariah Malaysia" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">No. Telefon</label>
              <input type="text" value={profNoTel} onChange={(e) => setProfNoTel(e.target.value)} placeholder="012-3456789" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <button type="submit" disabled={isSavingProf} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400">
              {isSavingProf ? "Menyimpan Profil..." : "Simpan Profil"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: PENGURUSAN PENGGUNA (MASTER ADMIN) */}
      {mainTab === "users" && userRole === "MASTER_ADMIN" && (
        <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="font-bold text-gray-800 mb-4">Tambah / Kemaskini Pengguna</h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pegawai</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Ahmad Albab" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Emel Pengguna</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="pegawai@esyariah.gov.my" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Peranan (Role)</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="PENYOKONG">PENYOKONG</option>
                  <option value="PELULUS">PELULUS</option>
                  <option value="MASTER_ADMIN">MASTER ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="AKTIF">AKTIF</option>
                  <option value="TIDAK_AKTIF">TIDAK AKTIF</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmittingUser} className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400">
                {isSubmittingUser ? "Menyimpan..." : "Simpan Pengguna"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50"><h2 className="font-semibold text-gray-700">Senarai Pengguna & Peranan</h2></div>
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Emel</th>
                  <th className="px-4 py-3">Peranan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-xs">{u.email}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${u.status === "AKTIF" ? "text-green-600" : "text-red-500"}`}>{u.status}</span></td>
                    <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteUser(u.email)} className="text-xs text-red-600 hover:underline">Padam</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ACTIONS: SOKONG / LULUS DENGAN TANDATANGAN DIGITAL */}
      {actionModalApp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white max-w-md w-full rounded-xl p-6 shadow-xl border">
            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
              Pengesahan {actionType === "DISOKONG" ? "Sokongan" : actionType === "DILULUSKAN" ? "Kelulusan" : "Penolakan"}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Pegawai Pengesah:</label>
                <input type="text" value={officerName} onChange={(e) => setOfficerName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" required />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Jawatan:</label>
                <input type="text" value={officerJawatan} onChange={(e) => setOfficerJawatan(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" required />
              </div>

              {actionType !== "DITOLAK" && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Muat Naik Tandatangan Digital (PNG/JPG):</label>
                    <input type="file" accept="image/*" onChange={handleSignatureFile} className="w-full text-xs" required />
                  </div>

                  {signatureBase64 && (
                    <div className="border p-2 rounded bg-gray-50 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">Pratonton Tandatangan:</p>
                      <img src={signatureBase64} alt="Preview Sign" className="h-12 mx-auto object-contain" />
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button onClick={handleConfirmAction} disabled={isSubmittingAction} className={`flex-1 text-white font-bold py-2 rounded text-sm disabled:bg-gray-400 ${
                  actionType === "DITOLAK" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}>
                  {isSubmittingAction ? "Menyimpan..." : "Sahkan & Hantar"}
                </button>
                <button onClick={() => setActionModalApp(null)} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded text-sm hover:bg-gray-300">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRATONTON DOKUMEN RASMI PEMOHON UNTUK PRINT / SAVE PDF */}
      {selectedAppForPrint && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start overflow-y-auto p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-white w-full max-w-4xl rounded-xl p-8 shadow-2xl relative border print:shadow-none print:border-none print:w-full print:p-0">
            
            <div className="print:hidden flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-bold text-gray-800 text-lg">Dokumen Permohonan Rasmi Kebenaran TNT & OT</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold hover:bg-blue-700 shadow">
                  🖨️ Cetak / Save PDF
                </button>
                <button onClick={() => setSelectedAppForPrint(null)} className="bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded font-semibold hover:bg-gray-300">
                  Tutup
                </button>
              </div>
            </div>

            {/* BINGKAI DOKUMEN RASMI */}
            <div className="border-2 border-black p-4 text-black text-xs font-sans leading-tight">
              
              <div className="bg-sky-200 border-b-2 border-black p-2 text-center font-bold text-sm uppercase">
                {selectedAppForPrint.type === "OT" && "PERMOHONAN KEBENARAN BEKERJA LEBIH MASA DI DALAM/ LUAR STESEN"}
                {selectedAppForPrint.type === "TNT" && "PERMOHONAN KEBENARAN MENJALANKAN TUGAS DI MAHKAMAH SYARIAH DAERAH-DAERAH/ LUAR STESEN"}
                {selectedAppForPrint.type === "BOTH" && "PERMOHONAN KEBENARAN MENJALANKAN TUGAS LUAR STESEN DAN BEKERJA LEBIH MASA (SERENTAK)"}
                
                <div className="text-xs font-medium mt-1">
                  BULAN: <span className="underline font-bold">{selectedAppForPrint.monthApplied}</span> | BIL. PERMOHONAN PADA BULAN INI: <span className="underline font-bold">{selectedAppForPrint.applicationId}</span>
                </div>
              </div>

              {/* MAKLUMAT PEGAWAI PEMOHON ASAL */}
              <div className="border-b-2 border-black p-3 space-y-1 font-semibold uppercase">
                <p>PEGAWAI: <span className="font-normal">{selectedApplicantProfile?.nama || selectedAppForPrint.applicantName || "PEMOHON"}</span></p>
                <p>JAWATAN: <span className="font-normal">{selectedApplicantProfile?.jawatan || selectedAppForPrint.applicantJawatan || "PEGAWAI"}</span></p>
                <p>TEMPAT BERTUGAS: <span className="font-normal">{selectedApplicantProfile?.tempatBertugas || selectedAppForPrint.applicantTempat || "JABATAN KEHAKIMAN SYARIAH MALAYSIA"}</span></p>
                <p>KENDERAAN DIGUNAKAN: <span className="font-normal underline">{selectedAppForPrint.vehicleType || "Kenderaan Sendiri"}</span></p>
              </div>

              <div className="border-b-2 border-black p-3 font-semibold">
                <p>Kepada;</p>
                <p>Pengarah</p>
                <p>Bahagian Pendaftaran, Keurusetiaan dan Rekod (BPKR)</p>
                <p>Jabatan Kehakiman Syariah Malaysia (JKSM)</p>
              </div>

              {/* JADUAL OT */}
              {(selectedAppForPrint.type === "OT" || selectedAppForPrint.type === "BOTH") && (
                <div className="my-2">
                  {selectedAppForPrint.type === "BOTH" && <p className="font-bold my-1 text-xs uppercase bg-gray-100 p-1 border">1. Perincian Kerja Lebih Masa (OT)</p>}
                  <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold border-b border-black">
                        <th className="border border-black p-1 w-8">BIL.</th>
                        <th className="border border-black p-1">TUGASAN</th>
                        <th className="border border-black p-1">LOKASI MAHKAMAH</th>
                        <th className="border border-black p-1">BIL. FAIL</th>
                        <th className="border border-black p-1">TEMPOH JAM</th>
                        <th className="border border-black p-1">TARIKH</th>
                        <th className="border border-black p-1">ALASAN PERMOHONAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseItems(selectedAppForPrint.otItems).map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border border-black p-1">{idx + 1}</td>
                          <td className="border border-black p-1 text-left">{item.tugasan}</td>
                          <td className="border border-black p-1">{item.lokasiMahkamah}</td>
                          <td className="border border-black p-1">{item.bilFail}</td>
                          <td className="border border-black p-1">{item.tempohJam}</td>
                          <td className="border border-black p-1">{formatDateOnly(item.tarikh)}</td>
                          <td className="border border-black p-1 text-left">{item.alasan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* JADUAL TNT */}
              {(selectedAppForPrint.type === "TNT" || selectedAppForPrint.type === "BOTH") && (
                <div className="my-2">
                  {selectedAppForPrint.type === "BOTH" && <p className="font-bold my-1 text-xs uppercase bg-gray-100 p-1 border">2. Perincian Tugas Luar Stesen (TNT)</p>}
                  <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold border-b border-black">
                        <th className="border border-black p-1 w-8">BIL.</th>
                        <th className="border border-black p-1">TUGASAN</th>
                        <th className="border border-black p-1">LOKASI MAHKAMAH</th>
                        <th className="border border-black p-1">JARAK DARI TEMPAT BERTUGAS (KM)</th>
                        <th className="border border-black p-1">BIL. FAIL</th>
                        <th className="border border-black p-1">ALAMAT LODGING / HOTEL</th>
                        <th className="border border-black p-1">TARIKH</th>
                        <th className="border border-black p-1">ALASAN PERMOHONAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseItems(selectedAppForPrint.tntItems).map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border border-black p-1">{idx + 1}</td>
                          <td className="border border-black p-1 text-left">{item.tugasan}</td>
                          <td className="border border-black p-1">{item.lokasiMahkamah}</td>
                          <td className="border border-black p-1">{item.jarakKm}</td>
                          <td className="border border-black p-1">{item.bilFail}</td>
                          <td className="border border-black p-1">{item.alamatLodging}</td>
                          <td className="border border-black p-1">{formatDateOnly(item.tarikh)}</td>
                          <td className="border border-black p-1 text-left">{item.alasan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RUANGAN TANDATANGAN TERAS */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black mt-8">
                
                {/* DISOKONG OLEH */}
                <div className="space-y-1 relative">
                  <p className="font-bold underline">Disokong Oleh:</p>
                  
                  <div className="h-16 relative flex items-end mb-2">
                    {selectedAppForPrint.supporterSignUrl ? (
                      <img 
                        src={selectedAppForPrint.supporterSignUrl} 
                        alt="Sign Supporter" 
                        className="h-14 object-contain absolute bottom-1 left-2 z-10"
                      />
                    ) : null}
                    <div className="w-full border-b border-dotted border-black"></div>
                  </div>

                  <p>Nama Pegawai : <span className="font-semibold">{selectedAppForPrint.supporterName || selectedAppForPrint.supporterEmail}</span></p>
                  <p>Jawatan : <span className="font-semibold">{selectedAppForPrint.supporterJawatan || "PENYOKONG / PENYEMAK"}</span></p>
                  <p>Tarikh : <span className="font-semibold">{formatDateOnly(selectedAppForPrint.tarikhMohon)}</span></p>
                </div>

                {/* DILULUSKAN OLEH */}
                <div className="space-y-1 relative">
                  <p className="font-bold underline">Diluluskan Oleh:</p>
                  
                  <div className="h-16 relative flex items-end mb-2">
                    {selectedAppForPrint.approverSignUrl ? (
                      <img 
                        src={selectedAppForPrint.approverSignUrl} 
                        alt="Sign Approver" 
                        className="h-14 object-contain absolute bottom-1 left-2 z-10" 
                      />
                    ) : null}
                    <div className="w-full border-b border-dotted border-black"></div>
                  </div>

                  <p className="font-semibold">{selectedAppForPrint.approverName || "Pengarah"}</p>
                  <p>Bahagian Keurusetiaan dan Rekod (BPKR)</p>
                  <p>Jabatan Kehakiman Syariah Malaysia (JKSM)</p>
                  <p>Tarikh : <span className="font-semibold">{formatDateOnly(selectedAppForPrint.tarikhMohon)}</span></p>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}