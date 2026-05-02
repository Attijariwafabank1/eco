import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function Dashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userData.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    });

    return unsub;
  }, [userData]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const getTransactionLabel = (tx) => {
    if (!userData) return "";
    return tx.senderId === userData.uid ? tx.receiverName : tx.senderName;
  };

  const getTransactionAmount = (tx) => {
    if (!userData) return 0;
    return tx.senderId === userData.uid ? -tx.amount : tx.amount;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="bg-[#003B7A] px-5 pt-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/60 text-sm">Bonjour,</p>
            <p className="text-white font-bold text-xl">{userData?.name || "Utilisateur"} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00AEEF] rounded-full" />
            </button>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Solde */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-1">Solde disponible</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-white text-4xl font-bold">
              {showBalance ? formatMoney(userData?.solde) : "•••••• €"}
            </p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/50 hover:text-white transition">
              {showBalance ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Carte bancaire flottante */}
      <div className="px-5 -mt-16 mb-5">
        <div className="bg-[#00AEEF] to-[#0055CC] rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-white/60 text-xs mb-1">Carte Ecobank</p>
              <p className="text-white font-semibold">{userData?.name || "Utilisateur"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1">
                <div className="w-7 h-7 rounded-full bg-white/30" />
                <div className="w-7 h-7 rounded-full bg-white/50 -ml-3" />
              </div>
              <p className="text-white/60 text-[10px]">VISA</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-white tracking-widest text-sm">
              {userData?.cardNumber || "•••• •••• •••• ••••"}
            </p>
            <p className="text-white/60 text-xs">{userData?.cardExpiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Envoyer",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              ),
              route: "/transfer",
              color: "bg-[#003B7A]",
            },
            {
              label: "Recevoir",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ),
              route: "/bank-details",
              color: "bg-[#00AEEF]",
            },
            {
              label: "Carte",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
              route: "/card",
              color: "bg-emerald-500",
            },
            {
              label: "Historique",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              route: "/history",
              color: "bg-orange-500",
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-md active:scale-95 transition`}>
                {action.icon}
              </div>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-800 font-bold text-base">Transactions récentes</p>
          <button onClick={() => navigate("/history")} className="text-[#00AEEF] text-sm font-medium">
            Voir tout
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <svg className="w-8 h-8 animate-spin text-[#003B7A]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((tx) => {
              const amount = getTransactionAmount(tx);
              const isDebit = amount < 0;
              return (
                <div key={tx.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
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
                    <p className="text-gray-800 font-semibold text-sm truncate">
                      {getTransactionLabel(tx)}
                    </p>
                    <p className="text-gray-400 text-xs">{formatDate(tx.createdAt)}</p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${isDebit ? "text-red-500" : "text-green-500"}`}>
                    {isDebit ? "-" : "+"}{formatMoney(Math.abs(amount))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 mt-6">
        <div className="flex justify-around">
          {[
            {
              label: "Accueil",
              route: "/dashboard",
              active: true,
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              ),
            },
            {
              label: "Virement",
              route: "/transfer",
              active: false,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ),
            },
            {
              label: "Carte",
              route: "/card",
              active: false,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
            },
            {
              label: "Profil",
              route: "/profile",
              active: false,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center gap-1 transition ${item.active ? "text-[#003B7A]" : "text-gray-400"}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}