"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUserDirectAction, registerUserDirectAction, resetPasswordDirectAction } from "@/app/actions/dashboard";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (mode === "login") {
      const res = await loginUserDirectAction({ email, password });
      setLoading(false);

      if (res.success && res.user) {
        localStorage.setItem("myotnt_user", JSON.stringify(res.user));
        alert(`Selamat datang, ${res.user.name}! 🎉`);
        router.push("/dashboard");
      } else {
        setErrorMsg(res.error || "Gagal log masuk.");
      }
    } else if (mode === "register") {
      if (!name) {
        setLoading(false);
        return setErrorMsg("Sila isi Nama Penuh.");
      }

      const res = await registerUserDirectAction({ name, email, password });
      setLoading(false);

      if (res.success) {
        alert("Pendaftaran berjaya! Sila log masuk dengan akaun baharu anda. 🎉");
        setMode("login");
        setPassword("");
      } else {
        setErrorMsg(res.error || "Gagal mendaftar akaun.");
      }
    } else if (mode === "forgot") {
      if (!newPassword) {
        setLoading(false);
        return setErrorMsg("Sila masukkan kata laluan baharu.");
      }

      const res = await resetPasswordDirectAction({ email, newPassword });
      setLoading(false);

      if (res.success) {
        setSuccessMsg("Kata laluan berjaya ditukar! Sila log masuk menggunakan kata laluan baharu.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setNewPassword("");
          setSuccessMsg("");
        }, 2000);
      } else {
        setErrorMsg(res.error || "Gagal mengemaskini kata laluan.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white w-full max-w-md p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
        
        {/* Header App */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Sistem MyOTNT (JKSM)</h1>
          <p className="text-xs text-slate-500 mt-1">Pengurusan Tuntutan Overtime & Travel</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              mode === "login" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Log Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              mode === "register" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Daftar Akaun
          </button>
        </div>

        {/* Mesej Ralat & Kejayaan */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Form Pendaftaran */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penuh Pegawai</label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Albab Bin Bakar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          )}

          {/* Medan Emel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emel Rasmi / Pengguna</label>
            <input
              type="email"
              placeholder="pegawai@esyariah.gov.my"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Mode Login / Register: Medan Kata Laluan */}
          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Kata Laluan</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setErrorMsg(""); setSuccessMsg(""); }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Lupa Kata Laluan?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>
          )}

          {/* Mode Forgot Password: Medan Kata Laluan Baharu */}
          {mode === "forgot" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Laluan Baharu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata laluan baharu"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>
          )}

          {/* Butang Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-blue-700 disabled:bg-slate-300 shadow transition-all mt-2"
          >
            {loading ? "Sedang Memproses..." : mode === "login" ? "Log Masuk" : mode === "register" ? "Daftar Akaun" : "Kemaskini Kata Laluan"}
          </button>

          {/* Pautan Kembali jika dalam mod Forgot Password */}
          {mode === "forgot" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
              >
                ← Kembali ke Log Masuk
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}