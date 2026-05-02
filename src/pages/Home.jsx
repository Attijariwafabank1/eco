import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countryCodes } from "../data/countryCodes";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE  = "service_p68f14c";
const EMAILJS_TEMPLATE = "template_bisvtes";
const EMAILJS_KEY      = "KcxGOCDI7HkrPtheP";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Home() {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState("form");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    city: "", address: "", birthDate: "", password: "",
  });

  const [dialCode, setDialCode] = useState(countryCodes.find(c => c.code === "FR"));
  const [dialSearch, setDialSearch] = useState("");
  const [showDialDropdown, setShowDialDropdown] = useState(false);

  const [emailCode, setEmailCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeExpiry, setCodeExpiry] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const filteredCountries = countryCodes.filter(c =>
    c.name.toLowerCase().includes(dialSearch.toLowerCase()) ||
    c.dial.includes(dialSearch)
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFirebaseError = (err) => {
    const messages = {
      "auth/user-not-found": "Email ou mot de passe incorrect.",
      "auth/wrong-password": "Email ou mot de passe incorrect.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
      "auth/email-already-in-use": "Cet email est déjà utilisé.",
      "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
      "auth/invalid-email": "Adresse email invalide.",
    };
    setError(messages[err.code] || "Une erreur est survenue. Réessayez.");
  };

  const sendEmailCode = async (email, name) => {
    const code = generateCode();
    setGeneratedCode(code);
    setCodeExpiry(Date.now() + 10 * 60 * 1000);
    setEmailCode("");
    await emailjs.send(
      EMAILJS_SERVICE, EMAILJS_TEMPLATE,
      { to_email: email, name: name, code: code },
      EMAILJS_KEY
    );
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const fullPhone = `${dialCode.dial}${form.phone.replace(/^0/, "")}`;
      const fullName = `${form.firstName} ${form.lastName}`;
      await register(fullName, form.email, fullPhone, form.password);
      await sendEmailCode(form.email, form.firstName);
      setStep("code-email");
      setSuccessMsg(`Code envoyé à ${form.email}`);
    } catch (err) {
      handleFirebaseError(err);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      const name = form.email.split("@")[0];
      await sendEmailCode(form.email, name);
      setStep("code-email");
      setSuccessMsg(`Code envoyé à ${form.email}`);
    } catch (err) {
      handleFirebaseError(err);
    }
    setLoading(false);
  };

  const handleVerifyCode = () => {
    if (Date.now() > codeExpiry) {
      setError("Code expiré. Cliquez sur Renvoyer.");
      return;
    }
    if (emailCode === generatedCode) {
      navigate("/dashboard");
    } else {
      setError("Code incorrect. Réessayez.");
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const name = tab === "register" ? form.firstName : form.email.split("@")[0];
      await sendEmailCode(form.email, name);
      setSuccessMsg("Nouveau code envoyé !");
      setError("");
    } catch {
      setError("Erreur lors de l'envoi. Réessayez.");
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === "login") handleLogin();
    else handleRegister();
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition placeholder:text-gray-300";
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5";

  const DialDropdown = () => (
    <div className="relative">
      <button type="button" onClick={() => setShowDialDropdown(!showDialDropdown)}
        className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 whitespace-nowrap text-sm h-full">
        <span className="text-lg">{dialCode.flag}</span>
        <span className="text-gray-600">{dialCode.dial}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showDialDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus placeholder="Rechercher un pays..." value={dialSearch}
              onChange={(e) => setDialSearch(e.target.value)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#00AEEF]" />
          </div>
          <div className="overflow-y-auto max-h-44">
            {filteredCountries.map(c => (
              <button key={c.code} type="button"
                onClick={() => { setDialCode(c); setShowDialDropdown(false); setDialSearch(""); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm">
                <span>{c.flag}</span>
                <span className="flex-1 text-gray-700 truncate">{c.name}</span>
                <span className="text-gray-400 text-xs">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Spinner = () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  const CodeInput = ({ value, onChange }) => {
    const inputs = useRef([]);
    const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);
    const handleKey = (i, e) => {
      if (e.key === "Backspace") {
        onChange(value.slice(0, i) + value.slice(i + 1));
        if (i > 0) inputs.current[i - 1].focus();
      }
    };
    const handleInput = (i, e) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1);
      if (!char) return;
      const arr = digits.map(d => d);
      arr[i] = char;
      const next = arr.join("").slice(0, 6);
      onChange(next);
      if (i < 5) inputs.current[i + 1].focus();
    };
    return (
      <div className="flex gap-2 justify-center w-full">
        {digits.map((d, i) => (
          <input key={i} ref={el => inputs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleInput(i, e)} onKeyDown={e => handleKey(i, e)}
            className="w-11 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold text-[#003B7A] focus:outline-none focus:border-[#00AEEF] transition" />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#003B7A] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <img src="/images/L1.jpeg" alt="Logo EcoBank" className="h-12 w-auto object-contain" />
          <p className="text-[#00AEEF] text-[11px] tracking-wider font-semibold">BANQUE PANAFRICAINE</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#00AEEF] animate-pulse" />
          <span className="text-white/50 text-xs">Sécurisé</span>
        </div>
      </div>

      {/* Carte décorative */}
      <div className="flex flex-col items-center px-6 pb-6">
        <div className="relative w-full max-w-xs">
          <div className="bg-gradient-to-br from-[#00AEEF] to-[#0066CC] rounded-2xl p-5 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/60 text-xs">Solde disponible</p>
                <p className="text-white text-2xl font-bold mt-1">•••• €</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-white/80 text-sm tracking-widest">•••• •••• •••• 4521</p>
              <p className="text-white/60 text-xs">12/27</p>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[#003B7A] text-xs font-semibold">Compte actif</span>
          </div>
        </div>
      </div>

      {/* Panneau blanc */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">

        {/* ══════ ÉCRAN CODE EMAIL ══════ */}
        {step === "code-email" && (
          <div className="flex flex-col items-center gap-5 pt-6">
            <div className="w-20 h-20 bg-[#003B7A]/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#003B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#003B7A] font-bold text-xl mb-1">Vérification email</p>
              <p className="text-gray-500 text-sm">Code envoyé à</p>
              <p className="font-semibold text-gray-700 text-sm">{form.email}</p>
              {successMsg && <p className="text-green-600 text-sm mt-1">{successMsg}</p>}
            </div>

            <CodeInput value={emailCode} onChange={setEmailCode} />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button onClick={handleVerifyCode} disabled={emailCode.length < 6}
              className="w-full bg-[#003B7A] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60">
              Confirmer
            </button>

            <button onClick={handleResend} disabled={loading}
              className="text-[#00AEEF] text-sm font-medium underline">
              {loading ? "Envoi..." : "Renvoyer le code"}
            </button>

            <button onClick={() => { setStep("form"); setError(""); setSuccessMsg(""); }}
              className="text-gray-400 text-sm underline">
              Retour
            </button>
          </div>
        )}

        {/* ══════ FORMULAIRE PRINCIPAL ══════ */}
        {step === "form" && (
          <>
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${tab === "login" ? "bg-[#003B7A] text-white shadow-md" : "text-gray-500"}`}>
                Connexion
              </button>
              <button onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${tab === "register" ? "bg-[#003B7A] text-white shadow-md" : "text-gray-500"}`}>
                Inscription
              </button>
            </div>

            <div className="mb-5">
              <h1 className="text-[#003B7A] text-xl font-bold">
                {tab === "login" ? "Bon retour 👋" : "Créer un compte"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {tab === "login" ? "Connectez-vous à votre espace bancaire" : "Rejoignez EcoBank en quelques secondes"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Prénom</label>
                      <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                        placeholder="Jean" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Nom</label>
                      <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="Dupont" required className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Date de naissance</label>
                    <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange}
                      required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone</label>
                    <div className="flex gap-2">
                      <DialDropdown />
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="06 00 00 00 00" required
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition placeholder:text-gray-300" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Ville</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange}
                      placeholder="Abidjan" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Adresse</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange}
                      placeholder="Cocody, Rue des Jardins" required className={inputClass} />
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Adresse email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="exemple@email.com" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password}
                    onChange={handleChange} placeholder="••••••••" required minLength={6}
                    className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
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

              {tab === "login" && (
                <div className="text-right -mt-2">
                  <a href="#" className="text-[#00AEEF] text-xs font-medium hover:underline">Mot de passe oublié ?</a>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#003B7A] hover:bg-[#002d5e] active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#003B7A]/30 flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
                {loading ? <Spinner /> : (
                  <>
                    <span>{tab === "login" ? "Se connecter" : "Créer mon compte"}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {tab === "register" && (
                <p className="text-center text-xs text-gray-400 leading-relaxed">
                  En créant un compte, vous acceptez nos{" "}
                  <a href="#" className="text-[#00AEEF] font-medium">conditions d'utilisation</a>.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}