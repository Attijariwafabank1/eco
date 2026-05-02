import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function BankDetails() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");

  const iban = userData?.iban || "ML00ML090010010000000000";
  const ibanFormatted = iban.match(/.{1,4}/g)?.join(" ") || iban;
  const accountNumber = iban.slice(-10);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const fields = [
    { label: "IBAN", value: ibanFormatted, copyValue: iban },
    { label: "Code du pays", value: "ML" },
    { label: "Chiffres de vérification", value: iban.slice(2, 4) },
    { label: "Code bancaire", value: "ML09" },
    { label: "Code de l'agence", value: "001001" },
    { label: "Numéro de compte", value: accountNumber },
    { label: "Nom de la banque", value: "ECOBANK MALI" },
    { label: "Code succursale", value: "XXX" },
    { label: "Adresse bancaire", value: "PLACE DE LA NATION" },
    { label: "Ville", value: "BAMAKO" },
    { label: "Province / État", value: "BAMAKO" },
    { label: "Pays", value: "MALI" },
    { label: "Code SWIFT", value: "ECOCMLBAXXX", copyValue: "ECOCMLBAXXX" },
  ];

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
            <p className="text-white font-bold text-xl">Coordonnées bancaires</p>
            <p className="text-white/50 text-xs">Pour recevoir un virement</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-4">

        {/* Titulaire */}
        <div className="bg-[#003B7A]/5 border border-[#003B7A]/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#003B7A] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {userData?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Titulaire du compte</p>
            <p className="text-gray-800 font-bold">{userData?.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">{userData?.email}</p>
          </div>
        </div>

        {/* Champs bancaires */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {fields.map((field, i) => (
            <div
              key={field.label}
              className={`px-4 py-3 flex items-center justify-between gap-3 ${
                i !== fields.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-gray-400 text-xs">{field.label}</p>
                <p className="text-gray-800 font-semibold text-sm mt-0.5 break-all">{field.value}</p>
              </div>
              {field.copyValue && (
                <button
                  onClick={() => copyToClipboard(field.copyValue, field.label)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    copied === field.label
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-gray-50 border-gray-200 text-gray-500 active:scale-95"
                  }`}
                >
                  {copied === field.label ? "Copié ✓" : "Copier"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-amber-700 text-xs leading-relaxed">
            📋 Communiquez ces informations à votre expéditeur pour recevoir un virement bancaire sur votre compte Ecobank.
          </p>
        </div>
      </div>
    </div>
  );
}