import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Profile() {
  const { user, userData, logout, fetchUserData } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userData?.name || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatMoney = (v) => new Intl.NumberFormat("fr-FR").format(v || 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name, phone });
      await fetchUserData(user.uid);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#003B7A] px-5 pt-10 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-white font-bold text-xl">Mon Profil</p>
              <p className="text-white/50 text-xs">Gérer mon compte</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Avatar flottant */}
      <div className="px-5 -mt-12 mb-4 flex justify-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#00AEEF] to-[#0055CC] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
          <span className="text-white font-bold text-3xl">
            {userData?.name?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
        {/* Nom et email */}
        <div className="text-center mb-2">
          <p className="text-gray-800 font-bold text-xl">{userData?.name}</p>
          <p className="text-gray-400 text-sm">{userData?.email}</p>
        </div>

        {/* Solde */}
        <div className="bg-[#003B7A] rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-white/60 text-xs">Solde du compte</p>
            <p className="text-white font-bold text-2xl">{formatMoney(userData?.solde)} FCFA</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Infos modifiables */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <p className="text-gray-800 font-bold text-base">Informations personnelles</p>

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
              <p className="text-green-600 text-sm">Profil mis à jour avec succès ✓</p>
            </div>
          )}

          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1">Nom complet</label>
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A]"
              />
            ) : (
              <p className="text-gray-800 font-semibold text-sm py-1">{userData?.name}</p>
            )}
          </div>

          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1">Email</label>
            <p className="text-gray-400 text-sm py-1">{userData?.email}</p>
          </div>

          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1">Téléphone</label>
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A]"
              />
            ) : (
              <p className="text-gray-800 font-semibold text-sm py-1">{userData?.phone || "Non renseigné"}</p>
            )}
          </div>

          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1">Numéro de carte</label>
            <p className="text-gray-400 font-mono text-sm py-1 tracking-widest">
              {userData?.cardNumber?.split(" ").map((g, i) => (i < 3 ? "••••" : g)).join(" ") || "Non disponible"}
            </p>
          </div>

          {editing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#003B7A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : "Sauvegarder"}
            </button>
          )}
        </div>

        {/* Compte créé le */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex justify-between items-center">
          <span className="text-gray-500 text-sm">Membre depuis</span>
          <span className="text-gray-700 font-semibold text-sm">
            {userData?.createdAt?.toDate
              ? userData.createdAt.toDate().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
              : "—"}
          </span>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 border border-red-100 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition mt-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}