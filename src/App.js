import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Monitor,
  RefreshCw,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  LogOut,
  Filter,
  Globe,
  FileSpreadsheet,
  Tv,
  Wifi,
  Eye,
  EyeOff,
  X,
  Calendar,
  Phone,
  Hash,
  Activity,
  ArrowUpDown,
  Lock,
  Mail,
  User,
  Settings,
  Palette,
  Download,
  Bell,
  Copy,
  Check,
  MessageSquare,
  CheckSquare,
  Square,
  Shield,
  HeartHandshake,
  HelpCircle,
  CreditCard,
  PartyPopper,
  FileDown,
  Menu, // Icono para menú móvil si fuera necesario
  MoreVertical,
  Trash, // Nuevo icono para borrar completados
  AlertTriangle, // Nuevo icono para alarma de vencidos
  DollarSign,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  getDocs,
  setDoc,
  getDoc,
} from "firebase/firestore";

// ------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// ------------------------------------------------------------------

const ADMIN_EMAIL = "cristianmoro482@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyBlMkxT9etzHa9m0Iv7UI6a8IyM2sT7rVI",
  authDomain: "control-proviewtv.firebaseapp.com",
  projectId: "control-proviewtv",
  storageBucket: "control-proviewtv.firebasestorage.app",
  messagingSenderId: "988883777942",
  appId: "1:988883777942:web:82dbb67139de08d02685b7",
  measurementId: "G-9MS2M1MH7F",
};

const APP_ID_NEGOCIO = "control-proviewtv";

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  app = initializeApp(firebaseConfig, "NEXUSCRM_APP_" + Math.random());
}

const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== "undefined" ? __app_id : APP_ID_NEGOCIO;

// --- Constantes y Defaults ---

const DEFAULT_PLATFORMS = [
  { id: "LOTV", name: "LOTV", color: "bg-blue-600", url: "" },
  { id: "KAELUS", name: "KAELUS", color: "bg-rose-600", url: "" },
  { id: "DIGITAL", name: "DIGITAL", color: "bg-cyan-600", url: "" },
  { id: "MAGIS", name: "MAGIS", color: "bg-violet-600", url: "" },
  { id: "NANO", name: "NANO", color: "bg-orange-500", url: "" },
  { id: "ICOMPLAY", name: "ICOMPLAY", color: "bg-indigo-500", url: "" },
  { id: "LATAMPLUS", name: "LATAMPLUS", color: "bg-pink-600", url: "" },
  { id: "OTRO", name: "OTRO", color: "bg-emerald-600", url: "" },
];

const DEFAULT_TEMPLATES = {
  expired:
    "Hola {nombre}, tu servicio de {plataforma} venció el {fecha}. ¿Te gustaría reactivarlo?",
  expiringSoon:
    "Hola {nombre}, recordatorio: tu cuenta de {plataforma} vence pronto ({fecha}). ¿Deseas renovar?",
  active:
    "Hola {nombre}, aquí tienes los datos de tu cuenta {plataforma}:\nUsuario: {usuario}",
  reminderTomorrow:
    "Hola {nombre}, tu servicio de {plataforma} vence MAÑANA ({fecha}). ¿Deseas renovar para no perder la señal? 📺",
  checkIn15Days:
    "Hola {nombre}, faltan 15 días para que venza tu {plataforma}. ¿Todo va bien con el servicio? Queremos asegurarnos de que lo disfrutas. 🛠️",
  recoveryLost:
    "Hola {nombre}, te extrañamos. Han pasado días desde que venció tu {plataforma}. ¿Te gustaría regresar con una promo especial? 🎁",
};

const DEFAULT_NOTIFICATION_PREFS = {
  checkIn15Days: true,
  reminderTomorrow: true,
  recovery15Days: true,
};

const AVAILABLE_COLORS = [
  { name: "Azul", class: "bg-blue-600" },
  { name: "Rojo", class: "bg-red-600" },
  { name: "Rosa", class: "bg-rose-600" },
  { name: "Pink", class: "bg-pink-600" },
  { name: "Verde", class: "bg-emerald-600" },
  { name: "Lima", class: "bg-lime-600" },
  { name: "Morado", class: "bg-violet-600" },
  { name: "Indigo", class: "bg-indigo-600" },
  { name: "Naranja", class: "bg-orange-500" },
  { name: "Ambar", class: "bg-amber-500" },
  { name: "Cian", class: "bg-cyan-600" },
  { name: "Sky", class: "bg-sky-600" },
  { name: "Gris", class: "bg-slate-500" },
  { name: "Negro", class: "bg-slate-900" },
];

// --- Helpers ---
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { year: "numeric", month: "short", day: "numeric" };
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString(
    "es-MX",
    options
  );
};

const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + "T00:00:00");
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const parseCSVDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  let cleanDateStr = dateStr.trim();
  try {
    if (cleanDateStr.includes("/")) {
      const parts = cleanDateStr.split("/");
      if (parts.length === 3)
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
          2,
          "0"
        )}`;
    }
    const d = new Date(cleanDateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch (e) { } image.png
  return new Date().toISOString().split("T")[0];
};

// --- ESTILOS GLOBALES ---
const GlobalStyles = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

// --- COMPONENTES UI MEJORADOS PARA MOVIL ---

const NavButton = ({ onClick, icon, label, colorClass, badge }) => (
  <div className="relative group/btn flex items-center">
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative border border-white/5 ${colorClass}`}
      aria-label={label}
    >
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-slate-900 animate-bounce">
          {badge}
        </span>
      )}
    </button>
    <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[999] border border-slate-700 shadow-xl backdrop-blur-sm hidden md:block">
      {label}
    </div>
  </div>
);

// RESPONSIVE: Oculta el texto en pantallas pequeñas (hidden sm:inline)
const TextNavButton = ({ onClick, icon, label, colorClass }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 border border-white/5 font-medium text-xs sm:text-sm whitespace-nowrap ${colorClass}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// RESPONSIVE: Tarjeta de Cliente para Móvil
const MobileClientCard = ({
  client,
  platforms,
  onWhatsApp,
  onDetails,
  onRenew,
  onDelete,
  isViewOnly,
}) => {
  const days = getDaysRemaining(client.expiryDate);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 5;
  const platformObj = platforms.find((p) => p.id === client.platform);
  const platformColor = platformObj?.color || "bg-slate-600";
  const platformUrl = platformObj?.url;

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm relative overflow-hidden">
      {/* Indicador de estado lateral */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${isExpired
          ? "bg-rose-500"
          : isExpiringSoon
            ? "bg-yellow-400"
            : "bg-emerald-500"
          }`}
      ></div>

      <div className="pl-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            {platformUrl ? (
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${platformColor} text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide hover:opacity-80 transition-opacity flex items-center gap-1 w-fit`}
              >
                {client.platform} <Tv className="w-3 h-3" />
              </a>
            ) : (
              <span
                className={`${platformColor} text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide`}
              >
                {client.platform}
              </span>
            )}
            <h3 className="text-white font-bold text-lg mt-1">{client.name}</h3>
          </div>
          <div className="text-right">
            <p
              className={`font-bold text-sm ${isExpired
                ? "text-rose-400"
                : isExpiringSoon
                  ? "text-yellow-400"
                  : "text-emerald-400"
                }`}
            >
              {formatDate(client.expiryDate)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Vencimiento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Usuario
            </p>
            <p className="text-slate-300 text-xs truncate font-mono">
              {client.username}
            </p>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Días
            </p>
            <p
              className={`text-xs font-bold ${days < 0 ? "text-rose-400" : "text-slate-300"
                }`}
            >
              {days < 0 ? "VENCIDO" : `${days} días`}
            </p>
          </div>
          {client.lastPaymentAmount > 0 && (
            <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 col-span-2 flex justify-between items-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                Último Pago
              </p>
              <p className="text-emerald-400 font-bold text-xs">
                ${client.lastPaymentAmount}
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción grandes para dedo */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onWhatsApp(client)}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400 rounded-lg p-2 flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDetails(client)}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-lg p-2 flex items-center justify-center"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRenew(client)}
            className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 text-purple-400 rounded-lg p-2 flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {!isViewOnly && (
            <button
              onClick={() => onDelete(client.id)}
              className="bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/30 text-rose-400 rounded-lg p-2 flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const VariableToolbar = ({ onInsert }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    <button
      onClick={() => onInsert("{nombre}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded border border-slate-600"
    >
      <User className="w-3 h-3" /> Nombre
    </button>
    <button
      onClick={() => onInsert("{plataforma}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded border border-slate-600"
    >
      <Tv className="w-3 h-3" /> Plataforma
    </button>
    <button
      onClick={() => onInsert("{fecha}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded border border-slate-600"
    >
      <Calendar className="w-3 h-3" /> Fecha
    </button>
    <button
      onClick={() => onInsert("{usuario}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded border border-slate-600"
    >
      <Hash className="w-3 h-3" /> Usuario
    </button>
    <button
      onClick={() => onInsert("{dias}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded border border-slate-600"
    >
      <Activity className="w-3 h-3" /> Días Restantes
    </button>
  </div>
);

// --- COMPONENTE ANALYTICS DASHBOARD ---
const AnalyticsDashboard = ({ clients }) => {
  const data = useMemo(() => {
    const platformCounts = {};
    clients.forEach((c) => {
      const p = c.platform || "OTRO";
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    return Object.keys(platformCounts).map((key) => ({
      name: key,
      value: platformCounts[key],
    }));
  }, [clients]);

  const totalRevenue = useMemo(() => {
    return clients.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  }, [clients]);

  const estimatedRevenue = useMemo(() => {
    return clients
      .filter((c) => getDaysRemaining(c.expiryDate) >= 0)
      .reduce((acc, curr) => acc + (curr.lastPaymentAmount || 0), 0);
  }, [clients]);

  const upcoming = useMemo(() => {
    return clients
      .filter((c) => {
        const d = getDaysRemaining(c.expiryDate);
        return d >= 0 && d <= 3;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 5);
  }, [clients]);

  const platformRevenue = useMemo(() => {
    const revenue = {};
    clients.forEach((c) => {
      // Consideramos solo clientes activos para el desglose mensual
      if (getDaysRemaining(c.expiryDate) >= 0) {
        const p = c.platform || "OTRO";
        revenue[p] = (revenue[p] || 0) + (c.lastPaymentAmount || 0);
      }
    });
    return Object.keys(revenue)
      .map((key) => ({
        name: key,
        value: revenue[key],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [clients]);

  const CHART_COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
      {/* Col 1: Finanzas (Mensual + Gráfica) */}
      <div className="bg-[#111827] p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-800 shadow-xl flex flex-col relative overflow-hidden group min-h-[160px]">
        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 md:gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg md:rounded-xl text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Ingreso Mensual
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                ${estimatedRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={60}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f3f4f6",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(value) => [`$${value}`, 'Ingresos']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Col 2: Atención Requerida */}
      <div className="bg-[#111827] p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-[160px]">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg md:rounded-xl text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
            Atención
          </h3>
          <span className="ml-auto bg-amber-500/10 text-amber-400 text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border border-amber-500/20">
            {upcoming.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 max-h-[150px] md:max-h-none">
          {upcoming.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 py-4">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
              <p className="text-[10px] md:text-xs font-medium">Todo en orden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((client) => {
                const days = getDaysRemaining(client.expiryDate);
                return (
                  <div key={client.id} className="flex items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                        {client.name}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold truncate">
                        {client.platform}
                      </p>
                    </div>
                    <div className={`text-right px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold border ${days <= 1
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                      {days === 0 ? 'Vence hoy' : days === 1 ? 'Vence en 1 día' : `Vence en ${days} días`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Col 3: Distribución (Pie Chart) */}
      <div className="bg-[#111827] p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-800 shadow-xl flex flex-col items-center justify-center relative md:col-span-2 lg:col-span-1 min-h-[160px]">
        <h3 className="absolute top-4 left-4 md:top-5 md:left-5 text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
          Plataformas
        </h3>
        <div className="w-full h-[140px] md:h-[160px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "#f3f4f6",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                }}
                itemStyle={{ color: "#f3f4f6" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Centro del Pie Chart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
          <div className="text-center">
            <span className="text-xl md:text-2xl font-bold text-white">{clients.length}</span>
            <p className="text-[8px] md:text-[9px] text-gray-500 uppercase font-bold">Total</p>
          </div>
        </div>
      </div>
    </div >
  );
};

// --- COMPONENTE LOGIN ---
function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/30 mb-4 animate-pulse">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            NexusCRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Correo
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-4 pr-10 text-white focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg mt-4 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading
              ? "Procesando..."
              : isRegistering
                ? "Registrarse"
                : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-sm mb-2">
            {isRegistering ? "¿Ya tienes una cuenta?" : "¿Eres nuevo aquí?"}
          </p>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline transition-colors"
          >
            {isRegistering ? "Inicia Sesión" : "Crear Cuenta Gratis"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [viewingAsUser, setViewingAsUser] = useState(null);

  // Config States
  const [userPlatforms, setUserPlatforms] = useState(DEFAULT_PLATFORMS);
  const [userTemplates, setUserTemplates] = useState(DEFAULT_TEMPLATES);
  const [userNotificationPrefs, setUserNotificationPrefs] = useState(
    DEFAULT_NOTIFICATION_PREFS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("platforms");
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState(
    AVAILABLE_COLORS[0].class
  );
  const [newPlatformUrl, setNewPlatformUrl] = useState("");
  const [editingPlatform, setEditingPlatform] = useState(null);

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewDetailsClient, setViewDetailsClient] = useState(null);

  const [editingClient, setEditingClient] = useState(null);
  const [renewingClient, setRenewingClient] = useState(null);
  const [renewalData, setRenewalData] = useState({
    newExpiryDate: "",
    baseDateUsed: null,
    isReactivation: false,
    paymentAmount: 0,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]); // Estado para notificaciones "borradas"
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOption, setSortOption] = useState("expiryDate");
  const fileInputRef = useRef(null);
  const sampleDataLoadedRef = useRef(false); // Para rastrear si ya se cargaron datos de prueba

  const [formData, setFormData] = useState({
    platform: "LOTV",
    customId: "",
    username: "",
    password: "",
    name: "",
    contact: "",
    connections: 1,
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date().toISOString().split("T")[0],
    renewals: 1,
    paymentAmount: 0,
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      if (currentUser && currentUser.email === ADMIN_EMAIL) setIsAdmin(true);
      else setIsAdmin(false);
    });
    return () => unsubscribe();
  }, []);

  // Registro
  useEffect(() => {
    if (user) {
      const registerUser = async () => {
        try {
          await setDoc(
            doc(db, "artifacts", appId, "user_directory", user.uid),
            {
              email: user.email,
              lastSeen: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error(e);
        }
      };
      registerUser();
      // Resetear el flag cuando cambia el usuario para permitir carga de datos de prueba
      sampleDataLoadedRef.current = false;
    }
  }, [user]);

  // Config
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "settings",
          "general"
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.platforms) setUserPlatforms(data.platforms);
          if (data.templates) setUserTemplates(data.templates);
          if (data.notificationPrefs)
            setUserNotificationPrefs(data.notificationPrefs);
          if (data.dismissedIds) setDismissedIds(data.dismissedIds);
        } else {
          setUserPlatforms(DEFAULT_PLATFORMS);
          setUserTemplates(DEFAULT_TEMPLATES);
          setUserNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSettings();
  }, [user]);

  // Función para cargar datos de prueba automáticamente
  const loadSampleData = useCallback(async () => {
    if (!user || viewingAsUser || sampleDataLoadedRef.current) return;

    try {
      const response = await fetch("/datos_prueba.csv");
      const csvText = await response.text();
      const lines = csvText.split("\n");
      const newClients = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(",");
        if (cols.length >= 8 && cols[0]?.trim()) {
          newClients.push({
            platform: cols[1]?.replace(/"/g, "").trim() || "OTRO",
            customId: cols[2]?.replace(/"/g, "").trim() || "",
            username: cols[3]?.replace(/"/g, "").trim() || "Sin Usuario",
            name: cols[4]?.replace(/"/g, "").trim() || "Sin Nombre",
            expiryDate: parseCSVDate(cols[5]?.replace(/"/g, "")),
            startDate: parseCSVDate(cols[6]?.replace(/"/g, "")),
            contact: cols[7]?.replace(/"/g, "").trim() || "",
            connections: parseInt(cols[8]?.replace(/"/g, "")) || 1,
            renewals: parseInt(cols[9]?.replace(/"/g, "")) || 1,
            password: "",
            createdAt: serverTimestamp(),
          });
        }
      }

      if (newClients.length > 0) {
        const batch = writeBatch(db);
        const targetUid = user.uid;
        const collectionRef = collection(db, "artifacts", appId, "users", targetUid, "clients");
        // Limitar a 500 documentos por batch (límite de Firestore)
        newClients.slice(0, 500).forEach((c) => {
          batch.set(doc(collectionRef), c);
        });
        await batch.commit();
        sampleDataLoadedRef.current = true;
      }
    } catch (error) {
      console.error("Error cargando datos de prueba:", error);
    }
  }, [user, viewingAsUser]);

  // Clientes
  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }
    setLoading(true);
    const targetUid = viewingAsUser ? viewingAsUser.id : user.uid;
    const q = query(
      collection(db, "artifacts", appId, "users", targetUid, "clients")
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
        setLoading(false);

        // Cargar datos de prueba automáticamente si el usuario no tiene clientes
        // y no se está viendo como otro usuario
        if (
          clientsData.length === 0 &&
          !viewingAsUser &&
          !sampleDataLoadedRef.current
        ) {
          loadSampleData();
        }
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, viewingAsUser, loadSampleData]);

  useEffect(() => {
    if (isAdmin && showAdminPanel) {
      const fetchAllUsers = async () => {
        try {
          const q = query(collection(db, "artifacts", appId, "user_directory"));
          const snapshot = await getDocs(q);
          setAllUsers(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        } catch (e) {
          console.error(e);
        }
      };
      fetchAllUsers();
    }
  }, [isAdmin, showAdminPanel]);

  // Funciones
  const handleLogout = async () => {
    await signOut(auth);
  };

  const saveSettingsToDB = async (
    newPlatforms,
    newTemplates,
    newPrefs,
    newDismissedIds
  ) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "settings", "general"),
        {
          platforms: newPlatforms || userPlatforms,
          templates: newTemplates || userTemplates,
          notificationPrefs: newPrefs || userNotificationPrefs,
          dismissedIds: newDismissedIds || dismissedIds,
        },
        { merge: true }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddPlatform = () => {
    if (!newPlatformName.trim()) return;
    const newPlat = {
      id: newPlatformName.toUpperCase().replace(/\s/g, ""),
      name: newPlatformName.toUpperCase(),
      color: newPlatformColor,
      url: newPlatformUrl.trim(),
    };
    if (userPlatforms.some((p) => p.name === newPlat.name)) {
      alert("Ya existe.");
      return;
    }
    const updated = [...userPlatforms, newPlat];
    setUserPlatforms(updated);
    saveSettingsToDB(updated, null, null, null);
    setNewPlatformName("");
    setNewPlatformUrl("");
  };

  const handleDeletePlatform = (id) => {
    if (confirm("¿Eliminar plataforma?")) {
      const updated = userPlatforms.filter((p) => p.id !== id);
      setUserPlatforms(updated);
      saveSettingsToDB(updated, null, null);
    }
  };

  const startEditingPlatform = (plat) => setEditingPlatform({ ...plat });
  const cancelEditingPlatform = () => setEditingPlatform(null);
  const saveEditedPlatform = () => {
    if (!editingPlatform.name.trim()) return;
    const updatedPlatforms = userPlatforms.map((p) =>
      p.id === editingPlatform.id
        ? {
          ...p,
          name: editingPlatform.name.toUpperCase(),
          color: editingPlatform.color,
          url: editingPlatform.url,
        }
        : p
    );
    setUserPlatforms(updatedPlatforms);
    saveSettingsToDB(updatedPlatforms, null, null, null);
    setEditingPlatform(null);
  };

  const handleUpdateTemplate = (key, value) => {
    const updated = { ...userTemplates, [key]: value };
    setUserTemplates(updated);
    saveSettingsToDB(null, updated, null);
  };

  const insertIntoTemplate = (key, variable) => {
    const currentText = userTemplates[key] || "";
    handleUpdateTemplate(key, currentText + " " + variable);
  };

  const toggleNotificationPreference = (key) => {
    const updated = {
      ...userNotificationPrefs,
      [key]: !userNotificationPrefs[key],
    };
    setUserNotificationPrefs(updated);
    saveSettingsToDB(null, null, updated);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "STATUS",
      "PLATAFORMA",
      "ID",
      "USUARIO",
      "NOMBRE",
      "EXPIRACION",
      "INICIO",
      "CONTACTO",
      "CONEXIONES",
      "CONTRATACIONES",
    ];
    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_nexuscrm.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTargetCollection = () => {
    const targetUid = viewingAsUser ? viewingAsUser.id : user.uid;
    return collection(db, "artifacts", appId, "users", targetUid, "clients");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const collectionRef = getTargetCollection();
      const payment = parseFloat(formData.paymentAmount) || 0;

      if (editingClient) {
        const newTotal = (editingClient.totalRevenue || 0) + payment;
        const updates = {
          ...formData,
          totalRevenue: newTotal,
        };
        if (payment > 0) updates.lastPaymentAmount = payment;
        // Remove paymentAmount from updates to avoid saving it as a persistent field if not needed, 
        // but keeping it is harmless. We'll keep it simple.

        await updateDoc(doc(collectionRef, editingClient.id), updates);
      } else {
        await addDoc(collectionRef, {
          ...formData,
          totalRevenue: payment,
          lastPaymentAmount: payment,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      const targetUid = viewingAsUser ? viewingAsUser.id : user.uid;
      await deleteDoc(
        doc(db, "artifacts", appId, "users", targetUid, "clients", id)
      );
      if (viewDetailsClient && viewDetailsClient.id === id) closeDetailsModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAll = async () => {
    if (clients.length === 0) return;
    if (!confirm("¿ELIMINAR TODOS?")) return;
    try {
      setLoading(true);
      const collectionRef = getTargetCollection();
      const snapshot = await getDocs(collectionRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRenewalModal = (client) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryParts = client.expiryDate.split("-");
    const currentExpiry = new Date(
      expiryParts[0],
      expiryParts[1] - 1,
      expiryParts[2]
    );
    let baseDate = currentExpiry < today ? today : currentExpiry;
    const defaultNewExpiry = new Date(baseDate);
    defaultNewExpiry.setMonth(defaultNewExpiry.getMonth() + 1);

    setRenewingClient(client);
    setRenewalData({
      newExpiryDate: defaultNewExpiry.toISOString().split("T")[0],
      baseDateUsed: baseDate,
      isReactivation: currentExpiry < today,
      paymentAmount: 0,
    });
  };

  const applyRenewalPreset = (months) => {
    if (!renewalData.baseDateUsed) return;
    const newDate = new Date(renewalData.baseDateUsed);
    newDate.setMonth(newDate.getMonth() + months);
    setRenewalData((prev) => ({
      ...prev,
      newExpiryDate: newDate.toISOString().split("T")[0],
    }));
  };

  const confirmRenewal = async () => {
    if (!renewingClient || !user) return;
    try {
      const payment = parseFloat(renewalData.paymentAmount) || 0;
      const newTotal = (renewingClient.totalRevenue || 0) + payment;

      const updates = {
        expiryDate: renewalData.newExpiryDate,
        renewals: (parseInt(renewingClient.renewals) || 0) + 1,
        totalRevenue: newTotal,
      };
      if (payment > 0) updates.lastPaymentAmount = payment;
      if (renewalData.isReactivation)
        updates.startDate = renewalData.baseDateUsed
          .toISOString()
          .split("T")[0];

      const targetUid = viewingAsUser ? viewingAsUser.id : user.uid;
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          targetUid,
          "clients",
          renewingClient.id
        ),
        updates
      );

      // Si el cliente estaba en la lista de ignorados, lo sacamos porque se renovó
      if (dismissedIds.includes(renewingClient.id)) {
        const updatedDismissed = dismissedIds.filter(
          (id) => id !== renewingClient.id
        );
        setDismissedIds(updatedDismissed);
        saveSettingsToDB(null, null, null, updatedDismissed);
      }

      setRenewingClient(null);
      if (viewDetailsClient && viewDetailsClient.id === renewingClient.id)
        closeDetailsModal();
    } catch (error) {
      console.error(error);
      alert("Error al renovar.");
    }
  };

  const handleQuickRenew = async (client) => handleOpenRenewalModal(client);

  const openWhatsApp = (client, type = "default") => {
    if (!client || !client.contact) return;
    const cleanPhone = client.contact.replace(/\D/g, "");
    if (!cleanPhone) return;
    const days = getDaysRemaining(client.expiryDate);
    let message = "";
    const formattedDate = formatDate(client.expiryDate);
    const platformObj = userPlatforms.find((p) => p.id === client.platform);
    const platformName = platformObj ? platformObj.name : client.platform;
    const processTemplate = (template) =>
      template
        .replace("{nombre}", client.name)
        .replace("{plataforma}", platformName)
        .replace("{fecha}", formattedDate)
        .replace("{usuario}", client.username)
        .replace("{dias}", days);

    if (type === "reminderTomorrow")
      message = processTemplate(userTemplates.reminderTomorrow);
    else if (type === "checkIn15Days")
      message = processTemplate(userTemplates.checkIn15Days);
    else if (type === "recoveryLost")
      message = processTemplate(userTemplates.recoveryLost);
    else {
      if (days < 0) message = processTemplate(userTemplates.expired);
      else if (days <= 5) message = processTemplate(userTemplates.expiringSoon);
      else message = processTemplate(userTemplates.active);
    }
    const encodedMessage = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    window.open(
      isMobile
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
        : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
      "_blank"
    );
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      alert("Nada para exportar.");
      return;
    }
    const headers = [
      "STATUS",
      "PLATAFORMA",
      "ID",
      "USUARIO",
      "NOMBRE",
      "EXPIRACION",
      "INICIO",
      "CONTACTO",
      "CONEXIONES",
      "CONTRATACIONES",
    ];
    const rows = clients.map((client) => {
      const days = getDaysRemaining(client.expiryDate);
      return [
        days < 0 ? "OFF" : "ON",
        client.platform,
        client.customId || "",
        client.username,
        client.name,
        client.expiryDate,
        client.startDate,
        client.contact || "",
        client.connections,
        client.renewals,
      ]
        .map((f) => `"${String(f || "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      })
    );
    link.download = `clientes_nexuscrm_${new Date().toISOString().split("T")[0]
      }.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.split("\n");
      const newClients = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(",");
        if (cols.length >= 8) {
          newClients.push({
            platform: cols[1]?.replace(/"/g, "").trim() || "OTRO",
            customId: cols[2]?.replace(/"/g, "").trim() || "",
            username: cols[3]?.replace(/"/g, "").trim() || "Sin Usuario",
            name: cols[4]?.replace(/"/g, "").trim() || "Sin Nombre",
            expiryDate: parseCSVDate(cols[5]?.replace(/"/g, "")),
            startDate: parseCSVDate(cols[6]?.replace(/"/g, "")),
            contact: cols[7]?.replace(/"/g, "").trim() || "",
            connections: parseInt(cols[8]?.replace(/"/g, "")) || 1,
            renewals: parseInt(cols[9]?.replace(/"/g, "")) || 1,
            password: cols[10]?.replace(/"/g, "").trim() || "",
            createdAt: serverTimestamp(),
          });
        }
      }
      if (newClients.length > 0 && confirm(`¿Importar ${newClients.length}?`)) {
        const batch = writeBatch(db);
        const collectionRef = getTargetCollection();
        newClients
          .slice(0, 490)
          .forEach((c) => batch.set(doc(collectionRef), c));
        await batch.commit();
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => fileInputRef.current.click();

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ ...client, password: client.password || "", paymentAmount: 0 });
    } else {
      setEditingClient(null);
      const today = new Date();
      const nextMonth = new Date(new Date().setMonth(today.getMonth() + 1));
      const defaultPlatform =
        Array.isArray(userPlatforms) && userPlatforms.length > 0
          ? userPlatforms[0].id
          : "OTRO";
      setFormData({
        platform: defaultPlatform,
        customId: "",
        username: "",
        password: "",
        name: "",
        contact: "",
        connections: 1,
        startDate: today.toISOString().split("T")[0],
        expiryDate: nextMonth.toISOString().split("T")[0],
        renewals: 1,
        paymentAmount: 0,
      });
    }
    setShowModal(true);
  };

  const openDetailsModal = (client) => {
    setViewDetailsClient(client);
    setShowClientPassword(false);
  };
  const closeDetailsModal = () => setViewDetailsClient(null);
  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const toggleCompleteTask = (id) => {
    setCompletedTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Función para borrar las tareas completadas (agregarlas a la lista de ignoradas)
  const handleClearCompleted = () => {
    if (completedTasks.length === 0) return;
    if (confirm("¿Borrar las notificaciones marcadas como completadas?")) {
      const updatedDismissed = [...dismissedIds, ...completedTasks];
      setDismissedIds(updatedDismissed);
      setCompletedTasks([]);
      saveSettingsToDB(null, null, null, updatedDismissed);
    }
  };

  const filteredClients = useMemo(() => {
    let result = clients.filter((c) => {
      const days = getDaysRemaining(c.expiryDate);
      const search =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.platform.toLowerCase().includes(searchTerm.toLowerCase());
      if (!search) return false;
      if (filterStatus === "active") return days >= 0;
      if (filterStatus === "expired") return days < 0;
      if (filterStatus === "expiring") return days >= 0 && days <= 5;
      return true;
    });
    result.sort((a, b) =>
      sortOption === "name"
        ? a.name.localeCompare(b.name)
        : sortOption === "platform"
          ? a.platform.localeCompare(b.platform)
          : new Date(a.expiryDate) - new Date(b.expiryDate)
    );
    return result;
  }, [clients, searchTerm, filterStatus, sortOption]);

  const stats = useMemo(() => {
    const active = clients.filter(
      (c) => getDaysRemaining(c.expiryDate) >= 0
    ).length;
    const expired = clients.filter(
      (c) => getDaysRemaining(c.expiryDate) < 0
    ).length;
    const expiringSoon = clients.filter((c) => {
      const d = getDaysRemaining(c.expiryDate);
      return d >= 0 && d <= 5;
    }).length;
    return { active, expired, expiringSoon, total: clients.length };
  }, [clients]);

  const pendingNotifications = useMemo(() => {
    if (!clients.length) return [];

    return clients.filter((client) => {
      // Si el cliente ya fue borrado de las notificaciones, lo ignoramos
      if (dismissedIds.includes(client.id)) return false;

      const days = getDaysRemaining(client.expiryDate);

      // LOGICA 1: Seguimiento (Estricto 15 días)
      if (days === 15 && userNotificationPrefs.checkIn15Days) return true;

      // LOGICA 2: Urgencia / Vencidos (Persistente desde 1 día antes hacia atrás)
      // Si userNotificationPrefs.reminderTomorrow está activo, mostramos
      // todos los que tengan 1 día o menos (incluyendo vencidos).
      if (days <= 1 && userNotificationPrefs.reminderTomorrow) return true;

      // LOGICA 3: Recuperación (Estricto -15 días - "Hace 15 días venció")
      // Nota: Si la lógica 2 ya cubre los vencidos, esta podría duplicarse visualmente
      // si no tenemos cuidado, pero conceptualmente es una "acción" distinta.
      // Para evitar duplicados en la lista visual (si la lógica 2 cubre todo <=1),
      // podemos hacer que la lógica 2 cubra hasta -14 y la lógica 3 tome el relevo en -15.
      // PERO, el usuario quiere "Vencido" como estatus.
      // Dejaremos la recuperación separada si queremos un mensaje específico.
      if (days === -15 && userNotificationPrefs.recovery15Days) return true;

      return false;
    });
  }, [clients, userNotificationPrefs, dismissedIds]);

  const activeNotificationsCount = pendingNotifications.filter(
    (n) => !completedTasks.includes(n.id)
  ).length;

  const [showClientPassword, setShowClientPassword] = useState(false);

  if (authChecking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-400">
        Cargando...
      </div>
    );
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-gray-100 pb-20 transition-colors duration-300">
      <GlobalStyles />
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* Navbar RESPONSIVE */}
      <div className="bg-slate-800/90 border-b border-slate-700 p-3 md:p-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20 shrink-0">
              <Monitor className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap">
                  NexusCRM
                </h1>
                {isAdmin ? (
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <Shield className="w-3 h-3" />{" "}
                    <span className="hidden sm:inline">Admin</span>
                  </span>
                ) : (
                  <span className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-700/30 flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" />{" "}
                    <span className="hidden sm:inline">Privado</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <User className="w-3 h-3" />{" "}
                {viewingAsUser ? `Viendo: ${viewingAsUser.email}` : user.email}
              </p>
            </div>

            {/* Mobile Logout Button (Visible only on very small screens if needed, otherwise part of toolbar) */}
            <div className="md:hidden">
              <NavButton
                onClick={handleLogout}
                icon={<LogOut className="w-4 h-4 text-rose-400" />}
                label="Salir"
                colorClass="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          {/* Top Right Controls - Scrolable on mobile */}
          <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max">
              {isAdmin && !viewingAsUser && (
                <NavButton
                  onClick={() => setShowAdminPanel(true)}
                  icon={<Shield className="w-5 h-5 text-amber-500" />}
                  label="Admin Panel"
                  colorClass="bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                />
              )}
              {viewingAsUser && (
                <button
                  onClick={() => setViewingAsUser(null)}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm font-bold shadow-md whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" /> Salir de {viewingAsUser.email}
                </button>
              )}

              <NavButton
                onClick={() => setShowNotifications(true)}
                icon={<Bell className="w-5 h-5 text-white" />}
                label="Notificaciones"
                colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700"
                badge={activeNotificationsCount}
              />

              <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>

              {!viewingAsUser && (
                <>
                  <TextNavButton
                    onClick={handleDownloadTemplate}
                    icon={<FileDown className="w-4 h-4 text-emerald-400" />}
                    label="Plantilla"
                    colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  />
                  <TextNavButton
                    onClick={triggerFileUpload}
                    icon={
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    }
                    label="Importar"
                    colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  />
                  <TextNavButton
                    onClick={handleExportCSV}
                    icon={<Download className="w-4 h-4 text-blue-400" />}
                    label="Exportar"
                    colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  />
                  <TextNavButton
                    onClick={handleDeleteAll}
                    icon={<Trash2 className="w-4 h-4 text-rose-400" />}
                    label="Borrar"
                    colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  />
                  <NavButton
                    onClick={() => setShowSettings(true)}
                    icon={<Settings className="w-5 h-5 text-slate-400" />}
                    label="Configuración"
                    colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700"
                  />
                </>
              )}

              <div className="hidden md:block">
                <NavButton
                  onClick={handleLogout}
                  icon={<LogOut className="w-5 h-5 text-rose-400" />}
                  label="Cerrar Sesión"
                  colorClass="bg-slate-800 hover:bg-slate-700 border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Grid - Responsive Grid */}
        {/* Stats Grid - Responsive Grid */}
        <AnalyticsDashboard clients={clients} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <StatsCard
            title="Total Clientes"
            value={stats.total}
            icon={<Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
            color="border-blue-500"
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
          />
          <StatsCard
            title="Activos"
            value={stats.active}
            icon={
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            }
            color="border-emerald-500"
            active={filterStatus === "active"}
            onClick={() => setFilterStatus("active")}
          />
          <StatsCard
            title="Por Vencer"
            value={stats.expiringSoon}
            icon={
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            }
            color="border-yellow-500"
            active={filterStatus === "expiring"}
            onClick={() => setFilterStatus("expiring")}
          />
          <StatsCard
            title="Vencidos"
            value={stats.expired}
            icon={<LogOut className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />}
            color="border-rose-500"
            active={filterStatus === "expired"}
            onClick={() => setFilterStatus("expired")}
          />
        </div>

        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 md:overflow-hidden">
          {/* Controls Bar */}
          <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4 sticky top-[73px] md:top-0 z-10 shadow-md md:shadow-none">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:border-blue-500 text-slate-200 text-sm outline-none transition-all focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {!viewingAsUser && (
                <button
                  onClick={() => openModal()}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />{" "}
                  <span className="sm:hidden md:inline">Agregar</span>{" "}
                  <span className="hidden sm:inline md:hidden">Agregar</span>{" "}
                  <span className="hidden lg:inline">Cliente</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4 justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs md:text-sm">
                <Filter className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Ordenar:</span>
              </div>
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowUpDown className="w-3 h-3" />
                </div>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full sm:w-auto pl-8 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 text-xs font-medium focus:border-blue-500 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="expiryDate">Expiración</option>
                  <option value="name">Nombre</option>
                  <option value="platform">Plataforma</option>
                </select>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
                {loading ? "..." : `${filteredClients.length} regs`}
              </span>
            </div>
          </div>

          {/* VISTA MÓVIL: Lista de Tarjetas (Visible solo en móvil) */}
          <div className="block md:hidden p-3 space-y-3">
            {filteredClients.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500">
                No se encontraron clientes.
              </div>
            )}
            {filteredClients.map((client) => (
              <MobileClientCard
                key={client.id}
                client={client}
                platforms={userPlatforms}
                onWhatsApp={openWhatsApp}
                onDetails={openDetailsModal}
                onRenew={handleOpenRenewalModal}
                onDelete={handleDelete}
                isViewOnly={!!viewingAsUser}
              />
            ))}
          </div>

          {/* VISTA ESCRITORIO: Tabla (Oculta en móvil) */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Plataforma</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Expiración</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredClients.map((client) => {
                  const daysRemaining = getDaysRemaining(client.expiryDate);
                  const isExpired = daysRemaining < 0;
                  const isExpiringSoon =
                    daysRemaining >= 0 && daysRemaining <= 5;
                  const platformObj = userPlatforms.find(
                    (p) => p.id === client.platform
                  );
                  const platformColor = platformObj?.color || "bg-slate-600";
                  const platformName = platformObj?.name || client.platform;
                  const platformUrl = platformObj?.url;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-700/40 transition-colors group"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex justify-center items-center">
                          {isExpired ? (
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-rose"></div>
                          ) : isExpiringSoon ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-emerald"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {platformUrl ? (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${platformColor} text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase shadow-sm hover:opacity-80 transition-opacity flex items-center gap-1 w-fit`}
                          >
                            {platformName} <Tv className="w-3 h-3" />
                          </a>
                        ) : (
                          <span
                            className={`${platformColor} text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase shadow-sm`}
                          >
                            {platformName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="font-mono text-slate-300 text-xs">
                          {client.customId || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="text-slate-200 text-xs font-medium">
                          {client.username}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold text-white text-sm">
                          {client.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {client.lastPaymentAmount > 0 ? (
                          <span className="text-emerald-400 font-bold text-xs bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30">
                            ${client.lastPaymentAmount}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`font-bold text-xs ${isExpired
                            ? "text-rose-400"
                            : isExpiringSoon
                              ? "text-yellow-400"
                              : "text-slate-300"
                            }`}
                        >
                          {formatDate(client.expiryDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <NavButton
                            onClick={() => openWhatsApp(client)}
                            icon={<MessageCircle className="w-4 h-4" />}
                            label="WhatsApp"
                            colorClass="text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/30"
                          />
                          <div className="w-px h-4 bg-slate-700 mx-1"></div>
                          <NavButton
                            onClick={() => openDetailsModal(client)}
                            icon={<Eye className="w-4 h-4" />}
                            label="Ver Detalles"
                            colorClass="text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border-blue-900/30"
                          />
                          <NavButton
                            onClick={() => handleOpenRenewalModal(client)}
                            icon={<RefreshCw className="w-4 h-4" />}
                            label="Renovar"
                            colorClass="text-purple-400 bg-purple-900/20 hover:bg-purple-900/40 border-purple-900/30"
                          />

                          {!viewingAsUser && (
                            <NavButton
                              onClick={() => handleDelete(client.id)}
                              icon={<Trash2 className="w-4 h-4" />}
                              label="Eliminar"
                              colorClass="text-rose-400 hover:text-rose-300 bg-transparent border-transparent hover:bg-rose-900/20"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL ADMIN --- */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-700 overflow-hidden h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" /> Panel de
                Administración
              </h3>
              <button onClick={() => setShowAdminPanel(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all"
                    onClick={() => {
                      setViewingAsUser(u);
                      setShowAdminPanel(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-900/30 p-2 rounded-lg text-blue-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          {u.email}
                        </p>
                        <p className="text-slate-500 text-xs">
                          ID: {u.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Configuración</h3>
                  <p className="text-xs text-slate-400">
                    Personaliza plataformas y mensajes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setSettingsTab("platforms")}
                className={`flex-1 py-3 text-xs md:text-sm font-medium text-center transition-colors ${settingsTab === "platforms"
                  ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Tv className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">Plataformas</span>
                </div>
              </button>
              <button
                onClick={() => setSettingsTab("messages")}
                className={`flex-1 py-3 text-xs md:text-sm font-medium text-center transition-colors ${settingsTab === "messages"
                  ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">Mensajes</span>
                </div>
              </button>
              <button
                onClick={() => setSettingsTab("notifications")}
                className={`flex-1 py-3 text-xs md:text-sm font-medium text-center transition-colors ${settingsTab === "notifications"
                  ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">Notificaciones</span>
                </div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {settingsTab === "platforms" ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">
                      Agregar Nueva
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none uppercase"
                        value={newPlatformName}
                        onChange={(e) => setNewPlatformName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="URL (http...)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        value={newPlatformUrl}
                        onChange={(e) => setNewPlatformUrl(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
                          value={newPlatformColor}
                          onChange={(e) => setNewPlatformColor(e.target.value)}
                        >
                          {AVAILABLE_COLORS.map((c) => (
                            <option key={c.class} value={c.class}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddPlatform}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center justify-center min-w-[48px]"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {userPlatforms.map((plat) => (
                      <div
                        key={plat.id}
                        className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 group hover:border-slate-600"
                      >
                        {editingPlatform?.id === plat.id ? (
                          <div className="flex gap-2 w-full items-center">
                            <input
                              type="text"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs uppercase"
                              value={editingPlatform.name}
                              onChange={(e) =>
                                setEditingPlatform({
                                  ...editingPlatform,
                                  name: e.target.value,
                                })
                              }
                            />
                            <input
                              type="text"
                              placeholder="URL"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                              value={editingPlatform.url || ""}
                              onChange={(e) =>
                                setEditingPlatform({
                                  ...editingPlatform,
                                  url: e.target.value,
                                })
                              }
                            />
                            <select
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                              value={editingPlatform.color}
                              onChange={(e) =>
                                setEditingPlatform({
                                  ...editingPlatform,
                                  color: e.target.value,
                                })
                              }
                            >
                              {AVAILABLE_COLORS.map((c) => (
                                <option key={c.class} value={c.class}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={saveEditedPlatform}
                              className="text-emerald-400 p-1"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditingPlatform}
                              className="text-rose-400 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded-full ${plat.color}`}
                              ></div>
                              <span className="font-bold text-white text-sm">
                                {plat.name}
                              </span>
                            </div>
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingPlatform(plat)}
                                className="text-slate-500 hover:text-blue-400 p-1"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePlatform(plat.id)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : settingsTab === "messages" ? (
                <div className="space-y-5">
                  {/* Messages settings content remains same */}
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <div className="mb-2">
                      <label className="text-sm font-bold text-yellow-400">
                        Vence Mañana (1 día)
                      </label>
                    </div>
                    <VariableToolbar
                      onInsert={(v) =>
                        insertIntoTemplate("reminderTomorrow", v)
                      }
                    />
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-yellow-500 outline-none min-h-[80px]"
                      value={userTemplates.reminderTomorrow}
                      onChange={(e) =>
                        handleUpdateTemplate("reminderTomorrow", e.target.value)
                      }
                    />
                  </div>
                  {/* ... other message blocks ... */}
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <div className="mb-2">
                      <label className="text-sm font-bold text-blue-400 flex gap-2">
                        <HelpCircle className="w-4 h-4" /> Seguimiento (Faltan
                        15 días)
                      </label>
                    </div>
                    <VariableToolbar
                      onInsert={(v) => insertIntoTemplate("checkIn15Days", v)}
                    />
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-blue-500 outline-none min-h-[80px]"
                      value={userTemplates.checkIn15Days}
                      onChange={(e) =>
                        handleUpdateTemplate("checkIn15Days", e.target.value)
                      }
                    />
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <div className="mb-2">
                      <label className="text-sm font-bold text-purple-400 flex gap-2">
                        <HeartHandshake className="w-4 h-4" /> Recuperación
                        (Hace 15 días)
                      </label>
                    </div>
                    <VariableToolbar
                      onInsert={(v) => insertIntoTemplate("recoveryLost", v)}
                    />
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-purple-500 outline-none min-h-[80px]"
                      value={userTemplates.recoveryLost}
                      onChange={(e) =>
                        handleUpdateTemplate("recoveryLost", e.target.value)
                      }
                    />
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <div className="mb-2">
                      <label className="text-sm font-bold text-rose-400">
                        Vencido
                      </label>
                    </div>
                    <VariableToolbar
                      onInsert={(v) => insertIntoTemplate("expired", v)}
                    />
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-rose-500 outline-none min-h-[80px]"
                      value={userTemplates.expired}
                      onChange={(e) =>
                        handleUpdateTemplate("expired", e.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* TAB NOTIFICACIONES */}
                  {/* ... same notification content ... */}
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-400" />{" "}
                        Seguimiento Preventivo
                      </h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Avisar 15 días antes del vencimiento.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        toggleNotificationPreference("checkIn15Days")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userNotificationPrefs.checkIn15Days
                        ? "bg-blue-600"
                        : "bg-slate-700"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userNotificationPrefs.checkIn15Days
                          ? "translate-x-6"
                          : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />{" "}
                        Alerta de Urgencia
                      </h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Avisar desde 1 día antes y mantener si vence.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        toggleNotificationPreference("reminderTomorrow")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userNotificationPrefs.reminderTomorrow
                        ? "bg-blue-600"
                        : "bg-slate-700"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userNotificationPrefs.reminderTomorrow
                          ? "translate-x-6"
                          : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-purple-400" />{" "}
                        Recuperación
                      </h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Intentar recuperar al cliente 15 días después.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        toggleNotificationPreference("recovery15Days")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userNotificationPrefs.recovery15Days
                        ? "bg-blue-600"
                        : "bg-slate-700"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userNotificationPrefs.recovery15Days
                          ? "translate-x-6"
                          : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Renovación */}
      {renewingClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 p-6">
            <h3 className="text-white font-bold mb-4">
              Renovar a {renewingClient.name}
            </h3>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white mb-4 [color-scheme:dark]"
              value={renewalData.newExpiryDate}
              onChange={(e) =>
                setRenewalData({
                  ...renewalData,
                  newExpiryDate: e.target.value,
                })
              }
            />
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">
                Monto Pagado ($)
              </label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white font-bold text-lg"
                placeholder="0.00"
                value={renewalData.paymentAmount}
                onChange={(e) =>
                  setRenewalData({
                    ...renewalData,
                    paymentAmount: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => applyRenewalPreset(1)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 text-sm"
              >
                +1 Mes
              </button>
              <button
                onClick={() => applyRenewalPreset(3)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 text-sm"
              >
                +3 Meses
              </button>
              <button
                onClick={() => applyRenewalPreset(6)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 text-sm"
              >
                +6 Meses
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmRenewal}
                className="flex-1 bg-emerald-600 text-white p-3 rounded font-bold"
              >
                Confirmar
              </button>
              <button
                onClick={() => setRenewingClient(null)}
                className="flex-1 bg-slate-700 text-white p-3 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalles */}
      {viewDetailsClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom duration-200 h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${userPlatforms.find(
                    (p) => p.id === viewDetailsClient.platform
                  )?.color || "bg-slate-700"
                    }`}
                >
                  <Monitor className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                    {viewDetailsClient.name}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm">
                    <span className="uppercase font-bold tracking-wider">
                      {viewDetailsClient.platform}
                    </span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                    <span className="font-mono">
                      {viewDetailsClient.customId || "SIN ID"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeDetailsModal}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Body Grid - Scrollable */}
            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 overflow-y-auto">
              {/* Columna 1: Accesos */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Credenciales
                </h3>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div>
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Usuario
                    </label>
                    <div className="flex items-center gap-2 text-white font-mono text-base md:text-lg bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="truncate">
                        {viewDetailsClient.username}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Contraseña
                    </label>
                    <div className="flex items-center gap-2 text-white font-mono text-base md:text-lg bg-slate-900/50 p-2 rounded border border-slate-700/50 justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span className="truncate">
                          {showClientPassword
                            ? viewDetailsClient.password || "N/A"
                            : "••••••••"}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setShowClientPassword(!showClientPassword)
                        }
                        className="text-slate-400 hover:text-white p-1"
                      >
                        {showClientPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna 2: Fechas y Estado */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Estado del Servicio
                </h3>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                        Inicio
                      </label>
                      <p className="text-white font-medium">
                        {formatDate(viewDetailsClient.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                        Renovaciones
                      </label>
                      <span className="inline-flex items-center justify-center bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                        {viewDetailsClient.renewals}{" "}
                        <RefreshCw className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Expiración
                    </label>
                    <p
                      className={`text-xl md:text-2xl font-bold ${getDaysRemaining(viewDetailsClient.expiryDate) < 0
                        ? "text-rose-500"
                        : "text-emerald-400"
                        }`}
                    >
                      {formatDate(viewDetailsClient.expiryDate)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {getDaysRemaining(viewDetailsClient.expiryDate) < 0
                        ? "Servicio Vencido"
                        : `${getDaysRemaining(
                          viewDetailsClient.expiryDate
                        )} días restantes`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Columna 3: Contacto y Conexión */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contacto y Uso
                </h3>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div
                    onClick={() => openWhatsApp(viewDetailsClient)}
                    className="cursor-pointer group"
                  >
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-1 group-hover:text-emerald-400 transition-colors">
                      WhatsApp
                    </label>
                    <div className="flex items-center gap-2 text-white text-base md:text-lg bg-slate-900/50 p-2 rounded border border-slate-700/50 group-hover:border-emerald-500/50 transition-colors">
                      <MessageCircle className="w-5 h-5 text-emerald-500" />
                      <span>{viewDetailsClient.contact || "Sin número"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Dispositivos
                    </label>
                    <div className="flex items-center gap-2 text-white text-base md:text-lg">
                      <Wifi className="w-5 h-5 text-blue-500" />
                      <span>
                        {viewDetailsClient.connections} Pantalla
                        {viewDetailsClient.connections !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions - Sticky Bottom */}
            <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800 flex gap-4 shrink-0">
              <button
                onClick={() => {
                  closeDetailsModal();
                  handleOpenRenewalModal(viewDetailsClient);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <RefreshCw className="w-5 h-5" /> Renovar
              </button>
              <button
                onClick={() => {
                  closeDetailsModal();
                  openModal(viewDetailsClient);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Edit2 className="w-5 h-5" /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0 gap-3">
              <div className="flex-1">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Notificaciones
                </h3>
              </div>

              {/* Nuevo Botón de Borrar Completados */}
              {completedTasks.length > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs bg-slate-800 hover:bg-rose-900/40 text-rose-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Borrar ({completedTasks.length})
                </button>
              )}

              <button onClick={() => setShowNotifications(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-white" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {pendingNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                  <CheckCircle className="w-12 h-12 opacity-20" />
                  <p>¡Todo al día!</p>
                  <p className="text-xs text-slate-600 text-center px-4">
                    No tienes alertas pendientes. Las tareas completadas se han
                    limpiado.
                  </p>
                </div>
              )}
              {pendingNotifications.map((c) => {
                const days = getDaysRemaining(c.expiryDate);

                // Determinar tipo de alerta dinámico
                let type = "default"; // CORREGIDO: Default para que use la lógica automática de openWhatsApp
                let label = "";
                let style = "";
                let Icon = AlertCircle;

                if (days === 15) {
                  type = "checkIn15Days";
                  label = "Seguimiento";
                  style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  Icon = HelpCircle;
                } else if (days === -15) {
                  type = "recoveryLost";
                  label = "Recuperación";
                  style =
                    "bg-purple-500/10 text-purple-400 border-purple-500/20";
                  Icon = HeartHandshake;
                } else if (days === 1) {
                  type = "reminderTomorrow"; // Solo explícito si falta 1 día
                  label = "Vence Mañana";
                  style =
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                  Icon = AlertCircle;
                } else if (days === 0) {
                  type = "default"; // Dejar que openWhatsApp detecte <= 5 días
                  label = "Vence HOY";
                  style =
                    "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse";
                  Icon = AlertCircle;
                } else if (days < 0) {
                  type = "default"; // Dejar que openWhatsApp detecte < 0 días (expired)
                  label = "VENCIDO";
                  style =
                    "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold";
                  Icon = AlertTriangle;
                }

                const isCompleted = completedTasks.includes(c.id);

                return (
                  <div
                    key={c.id}
                    className={`p-4 transition-all duration-300 rounded border border-slate-700 ${isCompleted
                      ? "bg-slate-900/30 opacity-50 scale-[0.98]"
                      : "bg-slate-800"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p
                          className={`font-bold text-sm ${isCompleted
                            ? "text-slate-500 line-through"
                            : "text-white"
                            }`}
                        >
                          {c.name}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {c.platform} • {c.contact}
                        </p>
                      </div>
                      <div
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase border flex items-center gap-1.5 ${style}`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {c.contact ? (
                        <button
                          onClick={() => openWhatsApp(c, type)}
                          disabled={isCompleted}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${isCompleted
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                            : "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:scale-[1.02]"
                            }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </button>
                      ) : (
                        <div className="flex-1 text-xs text-slate-600 text-center italic p-2 bg-slate-900 rounded border border-slate-800">
                          Sin contacto
                        </div>
                      )}
                      <button
                        onClick={() => toggleCompleteTask(c.id)}
                        className={`px-3 py-2 rounded-lg border transition-all ${isCompleted
                          ? "bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                          }`}
                        title={
                          isCompleted
                            ? "Desmarcar"
                            : "Marcar como listo (para borrar después)"
                        }
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nuevo/Editar Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <button onClick={closeModal}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    PLATAFORMA
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                  >
                    {userPlatforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    USUARIO
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  ID (Opcional) --
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  value={formData.customId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, customId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  CONTRASEÑA DE SERVICIO (Opcional)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  placeholder="Contraseña de la cuenta IPTV"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  NOMBRE CLIENTE
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    CONTACTO (WhatsApp)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    CONEXIONES
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    value={formData.connections}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        connections: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    INICIO
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white [color-scheme:dark]"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-400 mb-1">
                    EXPIRACIÓN
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold [color-scheme:dark]"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-emerald-400 mb-1 font-bold">
                  MONTO PAGADO ($) {editingClient ? "- AGREGAR AL TOTAL" : ""}
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                  placeholder="0.00"
                  value={formData.paymentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentAmount: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4"
              >
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color, active, onClick }) {
  const activeClass = active
    ? "bg-slate-800 ring-1"
    : "bg-slate-800/60 hover:bg-slate-800";
  const ringColor = active ? color.replace("border-", "ring-") : "";

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer p-3 md:p-4 rounded-xl shadow-lg 
        border-b-4 transition-all duration-200
        ${color} 
        ${activeClass} 
        ${ringColor}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
            {value}
          </h3>
        </div>
        <div className="opacity-90 p-1.5 md:p-2 bg-slate-900/40 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
