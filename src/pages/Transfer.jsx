import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

const EXTERNAL_FEE_RATE = 0.01; // 1%

export default function Transfer() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [step, setStep] = useState(1);
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptId, setReceiptId] = useState("");

  const formatIbanInput = (value) => {
    const clean = value.replace(/\s/g, "").toUpperCase().slice(0, 28);
    return clean.match(/.{1,4}/g)?.join(" ") || clean;
  };

  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);

  const formatDateTime = () => {
    return new Date().toLocaleString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const generateReceiptId = () => {
    return "VIR" + Date.now().toString().slice(-8).toUpperCase();
  };

  const getFee = (isExternal) => {
    if (!isExternal) return 0;
    return Math.round(Number(amount) * EXTERNAL_FEE_RATE * 100) / 100;
  };

  const getTotal = (isExternal) => {
    return Math.round((Number(amount) + getFee(isExternal)) * 100) / 100;
  };

  const handleSearchReceiver = async () => {
    setError("");
    const cleanedIban = iban.replace(/\s/g, "");
    if (cleanedIban.length < 15) return setError("IBAN invalide");
    if (!bic || bic.length < 8) return setError("Code BIC/SWIFT invalide (minimum 8 caractères)");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError("Montant invalide");

    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("iban", "==", cleanedIban));
      const snap = await getDocs(q);

      if (snap.empty) {
        // IBAN externe
        if (!beneficiaryName.trim()) {
          setError("Le nom du bénéficiaire est requis pour un virement externe");
          setLoading(false);
          return;
        }

        const fee = Math.round(Number(amount) * EXTERNAL_FEE_RATE * 100) / 100;
        const total = Math.round((Number(amount) + fee) * 100) / 100;
        if (total > (userData?.solde || 0)) {
          setError(`Solde insuffisant (montant + frais 1% = ${formatMoney(total)})`);
          setLoading(false);
          return;
        }

        setReceiver({
          name: beneficiaryName.trim(),
          iban: cleanedIban,
          docId: null,
          external: true,
        });
        setStep(2);
        setLoading(false);
        return;
      }

      const receiverData = snap.docs[0].data();
      if (receiverData.uid === user.uid) {
        setError("Vous ne pouvez pas vous envoyer de l'argent à vous-même");
        setLoading(false);
        return;
      }

      if (Number(amount) > (userData?.solde || 0)) {
        setError("Solde insuffisant");
        setLoading(false);
        return;
      }

      setReceiver({ ...receiverData, docId: snap.docs[0].id, external: false });
      setStep(2);
    } catch (e) {
      setError("Erreur lors de la recherche. Réessayez.");
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const senderRef = doc(db, "users", user.uid);
      const fee = getFee(receiver.external);
      const total = getTotal(receiver.external);

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        if (!senderSnap.exists()) throw new Error("Compte expéditeur introuvable");

        const senderSolde = senderSnap.data().solde;
        if (senderSolde < total) throw new Error("Solde insuffisant");

        transaction.update(senderRef, { solde: senderSolde - total });

        if (!receiver.external) {
          const receiverRef = doc(db, "users", receiver.docId);
          const receiverSnap = await transaction.get(receiverRef);
          if (!receiverSnap.exists()) throw new Error("Compte bénéficiaire introuvable");
          transaction.update(receiverRef, {
            solde: receiverSnap.data().solde + Number(amount),
          });
        }
      });

      const id = generateReceiptId();
      setReceiptId(id);

      await addDoc(collection(db, "transactions"), {
        senderId: user.uid,
        senderName: userData?.name || "",
        senderIban: userData?.iban || "",
        receiverId: receiver.external ? null : receiver.uid,
        receiverName: receiver.name || "",
        receiverIban: iban.replace(/\s/g, ""),
        receiverBic: bic.toUpperCase(),
        amount: Number(amount),
        fee: fee,
        total: total,
        message: message || "",
        participants: receiver.external ? [user.uid] : [user.uid, receiver.uid],
        createdAt: serverTimestamp(),
        status: receiver.external ? "pending" : "success",
        type: receiver.external ? "external" : "internal",
        receiptId: id,
      });

      setStep(3);
    } catch (e) {
      setError(e.message || "Erreur lors du virement. Réessayez.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#003B7A] px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => (step > 1 && step < 3 ? setStep(step - 1) : navigate("/dashboard"))}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white font-bold text-xl">Virement</p>
            <p className="text-white/50 text-xs">
              {step === 1 ? "Renseignez les informations" : step === 2 ? "Confirmez le virement" : "Virement effectué"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-[#00AEEF]" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-6">

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-xs mb-1">Votre solde disponible</p>
              <p className="text-[#003B7A] font-bold text-2xl">{formatMoney(userData?.solde)}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">IBAN bénéficiaire</label>
                <input
                  type="text"
                  placeholder="ML13 ML09 0010 01..."
                  value={iban}
                  onChange={(e) => setIban(formatIbanInput(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A] tracking-widest font-mono"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Code BIC / SWIFT</label>
                <input
                  type="text"
                  placeholder="Ex: ECOCMLBAXXX"
                  value={bic}
                  onChange={(e) => setBic(e.target.value.toUpperCase())}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A] font-mono tracking-widest"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">
                  Nom du bénéficiaire
                  <span className="text-gray-400 font-normal ml-1">(requis si banque externe)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A]"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Montant (€)</label>
                <input
                  type="number"
                  placeholder="Ex: 50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A]"
                />
              </div>

              {/* Aperçu frais en temps réel */}
              {amount && Number(amount) > 0 && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Frais si banque externe (1%)</span>
                    <span className="text-[#003B7A] font-semibold">
                      {formatMoney(Math.round(Number(amount) * EXTERNAL_FEE_RATE * 100) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total max débité</span>
                    <span className="text-[#003B7A] font-bold">
                      {formatMoney(Math.round(Number(amount) * (1 + EXTERNAL_FEE_RATE) * 100) / 100)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">✓ Gratuit entre comptes du réseau</p>
                </div>
              )}

              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Motif (optionnel)</label>
                <textarea
                  placeholder="Ex: Remboursement déjeuner..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#003B7A] resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSearchReceiver}
              disabled={loading}
              className="w-full bg-[#003B7A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <>
                  <span>Continuer</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : Confirmation */}
        {step === 2 && receiver && (
          <div className="flex flex-col gap-4">
            {receiver.external && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                <p className="text-amber-700 text-xs">
                  Banque externe — frais de <strong>1%</strong> appliqués. Délai : <strong>1 à 3 jours ouvrés</strong>.
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${receiver.external ? "bg-amber-100" : "bg-[#003B7A]"}`}>
                {receiver.external ? (
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ) : (
                  <span className="text-white font-bold text-2xl">{receiver.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-gray-800 font-bold text-lg">{receiver.name}</p>
                <p className="text-gray-400 text-sm font-mono">{iban}</p>
                <p className="text-gray-400 text-xs mt-1">BIC : {bic.toUpperCase()}</p>
                {receiver.external && (
                  <span className="inline-block mt-2 bg-amber-100 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full">
                    Banque externe
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Montant</span>
                <span className="text-gray-800 font-bold">{formatMoney(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Frais {receiver.external ? "(1%)" : ""}</span>
                {receiver.external ? (
                  <span className="text-orange-500 font-semibold text-sm">{formatMoney(getFee(true))}</span>
                ) : (
                  <span className="text-green-500 font-semibold text-sm">Gratuit</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Délai</span>
                <span className="text-gray-700 text-sm">{receiver.external ? "1 à 3 jours ouvrés" : "Instantané"}</span>
              </div>
              {message && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Motif</span>
                  <span className="text-gray-700 text-sm max-w-[60%] text-right">{message}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-gray-800 font-bold">Total débité</span>
                <span className="text-[#003B7A] font-bold text-lg">{formatMoney(getTotal(receiver.external))}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-[#003B7A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : `Confirmer — ${formatMoney(getTotal(receiver.external))}`}
            </button>
          </div>
        )}

        {/* ÉTAPE 3 : Reçu */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${receiver?.external ? "bg-amber-50" : "bg-green-50"}`}>
                {receiver?.external ? (
                  <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-gray-800 font-bold text-2xl">
                {receiver?.external ? "Virement en cours" : "Virement réussi !"}
              </p>
              {receiver?.external && (
                <p className="text-amber-600 text-sm text-center px-4">
                  Votre virement sera traité sous 1 à 3 jours ouvrés.
                </p>
              )}
              <p className="text-gray-400 text-sm">{formatDateTime()}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#003B7A] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Reçu de virement</p>
                  <p className="text-white/60 text-xs mt-0.5">#{receiptId}</p>
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              <div className="py-5 text-center border-b border-dashed border-gray-100">
                <p className="text-gray-400 text-xs mb-1">Montant transféré</p>
                <p className="text-[#003B7A] font-bold text-3xl">{formatMoney(amount)}</p>
                {receiver?.external && (
                  <p className="text-orange-400 text-xs mt-1">+ {formatMoney(getFee(true))} de frais (1%)</p>
                )}
              </div>

              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Expéditeur</span>
                  <span className="text-gray-800 text-xs font-semibold">{userData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">IBAN expéditeur</span>
                  <span className="text-gray-800 text-xs font-mono">{userData?.iban?.match(/.{1,4}/g)?.join(" ")}</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between">
                  <span className="text-gray-400 text-xs">Bénéficiaire</span>
                  <span className="text-gray-800 text-xs font-semibold">{receiver?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">IBAN bénéficiaire</span>
                  <span className="text-gray-800 text-xs font-mono">{iban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">BIC / SWIFT</span>
                  <span className="text-gray-800 text-xs font-mono">{bic.toUpperCase()}</span>
                </div>
                {message && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Motif</span>
                    <span className="text-gray-700 text-xs max-w-[60%] text-right">{message}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Type</span>
                  <span className="text-gray-700 text-xs">{receiver?.external ? "Virement externe" : "Virement interne"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Frais</span>
                  {receiver?.external ? (
                    <span className="text-orange-500 text-xs font-semibold">{formatMoney(getFee(true))} (1%)</span>
                  ) : (
                    <span className="text-green-500 text-xs font-semibold">Gratuit</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Total débité</span>
                  <span className="text-[#003B7A] text-xs font-bold">{formatMoney(getTotal(receiver?.external))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Délai</span>
                  <span className="text-gray-700 text-xs">{receiver?.external ? "1 à 3 jours ouvrés" : "Instantané"}</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between">
                  <span className="text-gray-400 text-xs">Statut</span>
                  {receiver?.external ? (
                    <span className="text-amber-500 text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" />
                      En cours
                    </span>
                  ) : (
                    <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                      Exécuté
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-4 flex justify-between items-center">
                <span className="text-gray-500 text-sm">Nouveau solde</span>
                <span className="text-[#003B7A] font-bold text-lg">{formatMoney(userData?.solde)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-[#003B7A] text-white font-bold py-4 rounded-2xl active:scale-95 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}