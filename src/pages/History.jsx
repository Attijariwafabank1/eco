import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function History() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | sent | received

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    });

    return unsub;
  }, [userData]);

  const formatMoney = (v) => new Intl.NumberFormat("fr-FR").format(v || 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAmount = (tx) =>
    tx.senderId === userData?.uid ? -tx.amount : tx.amount;

  const getLabel = (tx) =>
    tx.senderId === userData?.uid ? tx.receiverName : tx.senderName;

  const filtered = transactions.filter((tx) => {
    if (filter === "sent") return tx.senderId === userData?.uid;
    if (filter === "received") return tx.receiverId === userData?.uid;
    return true;
  });

  const totalEnvoye = transactions
    .filter((tx) => tx.senderId === userData?.uid)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalRecu = transactions
    .filter((tx) => tx.receiverId === userData?.uid)
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#003B7A] px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white font-bold text-xl">Historique</p>
            <p className="text-white/50 text-xs">{transactions.length} transaction(s)</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-white/60 text-xs mb-1">Total envoyé</p>
            <p className="text-red-300 font-bold text-lg">{formatMoney(totalEnvoye)} F</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-white/60 text-xs mb-1">Total reçu</p>
            <p className="text-green-300 font-bold text-lg">{formatMoney(totalRecu)} F</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-5 py-4 flex gap-2">
        {[
          { key: "all", label: "Tout" },
          { key: "sent", label: "Envoyés" },
          { key: "received", label: "Reçus" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === f.key
                ? "bg-[#003B7A] text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="flex-1 px-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <svg className="w-8 h-8 animate-spin text-[#003B7A]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Aucune transaction</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((tx) => {
              const amount = getAmount(tx);
              const isDebit = amount < 0;
              return (
                <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isDebit ? "bg-red-50" : "bg-green-50"}`}>
                      <svg className={`w-5 h-5 ${isDebit ? "text-red-500" : "text-green-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isDebit ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-semibold text-sm truncate">{getLabel(tx)}</p>
                      <p className="text-gray-400 text-xs">{formatDate(tx.createdAt)}</p>
                      {tx.message && (
                        <p className="text-gray-400 text-xs italic mt-0.5 truncate">"{tx.message}"</p>
                      )}
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${isDebit ? "text-red-500" : "text-green-500"}`}>
                      {isDebit ? "-" : "+"}{formatMoney(Math.abs(amount))} F
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}