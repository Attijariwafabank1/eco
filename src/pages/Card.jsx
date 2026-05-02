import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Card() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [showNumber, setShowNumber] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  const maskedCard = userData?.cardNumber
    ? userData.cardNumber.split(" ").map((g, i) => (i < 3 ? "••••" : g)).join(" ")
    : "•••• •••• •••• ••••";

  // ✅ Euros
  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#003B7A] px-5 pt-10 pb-6">
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
            <p className="text-white font-bold text-xl">Ma Carte</p>
            {/* ✅ Ecobank */}
            <p className="text-white/50 text-xs">Carte Ecobank Virtuelle</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6">
        {/* Carte 3D */}
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setCardFlipped(!cardFlipped)}
        >
          <div
            className="relative w-full transition-all duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              height: "200px",
            }}
          >
            {/* Face avant */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#00AEEF] to-[#0055CC] rounded-2xl p-5 shadow-xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  {/* ✅ Ecobank */}
                  <p className="text-white/60 text-xs mb-1">Carte Ecobank</p>
                  <p className="text-white font-semibold">{userData?.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <div className="w-7 h-7 rounded-full bg-white/30" />
                    <div className="w-7 h-7 rounded-full bg-white/50 -ml-3" />
                  </div>
                  <p className="text-white/60 text-[10px]">VISA</p>
                </div>
              </div>

              {/* Puce */}
              <div className="w-10 h-7 bg-yellow-300/80 rounded-md mb-4 flex items-center justify-center">
                <div className="w-6 h-5 border border-yellow-600/40 rounded-sm grid grid-cols-3 gap-px p-0.5">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-yellow-500/50 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <p className="text-white tracking-widest text-sm font-mono">
                  {showNumber ? (userData?.cardNumber || "•••• •••• •••• ••••") : maskedCard}
                </p>
                <p className="text-white/60 text-xs">{userData?.cardExpiry || "MM/YY"}</p>
              </div>
            </div>

            {/* Face arrière */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#002855] to-[#003B7A] rounded-2xl shadow-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="w-full h-10 bg-black/50 mt-6 mb-4" />
              <div className="px-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-white/90 rounded flex items-center px-3">
                    <p className="text-gray-400 text-xs tracking-widest">
                      {showNumber ? "123" : "•••"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px]">CVV</p>
                  </div>
                </div>
                {/* ✅ Ecobank */}
                <p className="text-white/30 text-[9px] mt-4 text-center">
                  Cette carte est virtuelle et sécurisée par Ecobank
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs">Appuyez sur la carte pour la retourner</p>

        {/* Bouton afficher numéro */}
        <button
          onClick={() => setShowNumber(!showNumber)}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl py-3 shadow-sm text-sm font-medium text-gray-700 active:scale-95 transition"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {showNumber ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
          {showNumber ? "Masquer les informations" : "Afficher les informations"}
        </button>

        {/* Infos carte */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <span className="text-gray-500 text-sm">Titulaire</span>
            <span className="text-gray-800 font-semibold text-sm">{userData?.name}</span>
          </div>
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <span className="text-gray-500 text-sm">Numéro</span>
            <span className="text-gray-800 font-mono text-sm">
              {showNumber ? userData?.cardNumber : maskedCard}
            </span>
          </div>
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <span className="text-gray-500 text-sm">Expiration</span>
            <span className="text-gray-800 font-semibold text-sm">{userData?.cardExpiry}</span>
          </div>
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-gray-500 text-sm">Solde disponible</span>
            {/* ✅ Euros, sans FCFA */}
            <span className="text-[#003B7A] font-bold text-sm">{formatMoney(userData?.solde)}</span>
          </div>
        </div>

        {/* Statut */}
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <div>
            <p className="text-green-700 font-semibold text-sm">Carte active</p>
            <p className="text-green-500 text-xs">Toutes les transactions sont autorisées</p>
          </div>
        </div>
      </div>
    </div>
  );
}