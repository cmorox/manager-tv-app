import React, { useState, useEffect, useMemo, useRef } from "react";
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
  CheckSquare, // Nuevo icono para completar tarea
  Square,
} from "lucide-react";
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

// Inicialización de la App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== "undefined" ? __app_id : APP_ID_NEGOCIO;

// --- Constantes y Defaults ---

const DEFAULT_PLATFORMS = [
  { id: "LOTV", name: "LOTV", color: "bg-blue-600" },
  { id: "KAELUS", name: "KAELUS", color: "bg-rose-600" },
  { id: "DIGITAL", name: "DIGITAL", color: "bg-cyan-600" },
  { id: "MAGIS", name: "MAGIS", color: "bg-violet-600" },
  { id: "NANO", name: "NANO", color: "bg-orange-500" },
  { id: "ICOMPLAY", name: "ICOMPLAY", color: "bg-indigo-500" },
  { id: "LATAMPLUS", name: "LATAMPLUS", color: "bg-pink-600" },
  { id: "OTRO", name: "OTRO", color: "bg-emerald-600" },
];

const DEFAULT_TEMPLATES = {
  reminderTomorrow:
    "Hola {nombre}, tu servicio de {plataforma} vence MAÑANA ({fecha}). ¿Deseas renovar para no perder la señal? 📺",
  recovery15Days:
    "Hola {nombre}, te extrañamos. Tu cuenta de {plataforma} venció hace 15 días. ¿Quieres reactivar hoy? 👋",
  expired:
    "Hola {nombre}, tu servicio de {plataforma} venció el {fecha}. ¿Te gustaría reactivarlo?",
  expiringSoon:
    "Hola {nombre}, recordatorio: tu cuenta de {plataforma} vence pronto ({fecha}). ¿Deseas renovar?",
  active:
    "Hola {nombre}, aquí tienes los datos de tu cuenta {plataforma}:\nUsuario: {usuario}",
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
  if (cleanDateStr.includes("/")) {
    const parts = cleanDateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
        2,
        "0"
      )}`;
    }
  }
  if (cleanDateStr.includes(" de ")) {
    const parts = cleanDateStr.toLowerCase().split(" de ");
    if (parts.length === 3) {
      const day = parts[0].replace(/\D/g, "").padStart(2, "0");
      const year = parts[2].replace(/\D/g, "");
      const months = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12",
      };
      const monthName = parts[1].trim();
      const month = months[monthName] || "01";
      return `${year}-${month}-${day}`;
    }
  }
  try {
    const d = new Date(cleanDateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (e) {
    console.warn("Fecha inválida en CSV:", dateStr);
  }
  return new Date().toISOString().split("T")[0];
};

// --- COMPONENTE HELPER: BARRA DE VARIABLES ---
const VariableToolbar = ({ onInsert }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    <button
      onClick={() => onInsert("{nombre}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded transition-colors border border-slate-600"
    >
      <User className="w-3 h-3" /> Nombre
    </button>
    <button
      onClick={() => onInsert("{plataforma}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded transition-colors border border-slate-600"
    >
      <Tv className="w-3 h-3" /> Plataforma
    </button>
    <button
      onClick={() => onInsert("{fecha}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded transition-colors border border-slate-600"
    >
      <Calendar className="w-3 h-3" /> Fecha
    </button>
    <button
      onClick={() => onInsert("{usuario}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded transition-colors border border-slate-600"
    >
      <Hash className="w-3 h-3" /> Usuario
    </button>
    <button
      onClick={() => onInsert("{dias}")}
      className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs rounded transition-colors border border-slate-600"
    >
      <Activity className="w-3 h-3" /> Días Restantes
    </button>
  </div>
);

// --- COMPONENTE LOGIN ---
function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
            Proview TV
          </h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
              Correo Electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors hover:underline"
          >
            {isRegistering ? "Inicia Sesión" : "Crear Cuenta Gratis"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para Configuración (Plataformas y Mensajes)
  const [userPlatforms, setUserPlatforms] = useState(DEFAULT_PLATFORMS);
  const [userTemplates, setUserTemplates] = useState(DEFAULT_TEMPLATES);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("platforms");
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState(
    AVAILABLE_COLORS[0].class
  );

  // Estado para Editar Plataforma
  const [editingPlatform, setEditingPlatform] = useState(null);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewDetailsClient, setViewDetailsClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [renewingClient, setRenewingClient] = useState(null);
  const [renewalData, setRenewalData] = useState({
    newExpiryDate: "",
    baseDateUsed: null,
    isReactivation: false,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  // Estado para tareas completadas en notificaciones (guardado localmente por sesión por ahora)
  const [completedTasks, setCompletedTasks] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOption, setSortOption] = useState("expiryDate");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    platform: "LOTV",
    customId: "",
    username: "",
    name: "",
    contact: "",
    connections: 1,
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date().toISOString().split("T")[0],
    renewals: 1,
  });

  // Listener de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Carga de Configuración Personalizada (Plataformas y Mensajes)
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
        } else {
          setUserPlatforms(DEFAULT_PLATFORMS);
          setUserTemplates(DEFAULT_TEMPLATES);
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    fetchSettings();
  }, [user]);

  // Guardar Configuración en DB
  const saveSettingsToDB = async (newPlatforms, newTemplates) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "settings", "general"),
        {
          platforms: newPlatforms || userPlatforms,
          templates: newTemplates || userTemplates,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error guardando configuración:", error);
    }
  };

  const handleAddPlatform = () => {
    if (!newPlatformName.trim()) return;
    const newPlat = {
      id: newPlatformName.toUpperCase().replace(/\s/g, ""),
      name: newPlatformName.toUpperCase(),
      color: newPlatformColor,
    };
    if (userPlatforms.some((p) => p.name === newPlat.name)) {
      alert("Esa plataforma ya existe.");
      return;
    }
    const updated = [...userPlatforms, newPlat];
    setUserPlatforms(updated);
    saveSettingsToDB(updated, null);
    setNewPlatformName("");
  };

  const handleDeletePlatform = (id) => {
    if (
      confirm(
        "¿Eliminar esta plataforma de la lista? (No afectará a clientes ya creados)"
      )
    ) {
      const updated = userPlatforms.filter((p) => p.id !== id);
      setUserPlatforms(updated);
      saveSettingsToDB(updated, null);
    }
  };

  // Lógica para Editar Plataforma
  const startEditingPlatform = (plat) => {
    setEditingPlatform({ ...plat });
  };

  const cancelEditingPlatform = () => {
    setEditingPlatform(null);
  };

  const saveEditedPlatform = () => {
    if (!editingPlatform.name.trim()) return;

    const updatedPlatforms = userPlatforms.map((p) =>
      p.id === editingPlatform.id
        ? {
            ...p,
            name: editingPlatform.name.toUpperCase(),
            color: editingPlatform.color,
          }
        : p
    );

    setUserPlatforms(updatedPlatforms);
    saveSettingsToDB(updatedPlatforms, null);
    setEditingPlatform(null);
  };

  const handleUpdateTemplate = (key, value) => {
    const updated = { ...userTemplates, [key]: value };
    setUserTemplates(updated);
    saveSettingsToDB(null, updated);
  };

  // Helper para insertar variable en el cursor o al final
  const insertIntoTemplate = (key, variable) => {
    const currentText = userTemplates[key] || "";
    const updatedText = currentText + " " + variable;
    handleUpdateTemplate(key, updatedText);
  };

  // Carga de Clientes
  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "artifacts", appId, "users", user.uid, "clients")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error leyendo clientes:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const collectionRef = collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "clients"
      );
      if (editingClient) {
        await updateDoc(doc(collectionRef, editingClient.id), formData);
      } else {
        await addDoc(collectionRef, {
          ...formData,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este cliente permanentemente?"))
      return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", user.uid, "clients", id)
      );
      if (viewDetailsClient && viewDetailsClient.id === id) {
        closeDetailsModal();
      }
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (clients.length === 0) return;
    if (
      !confirm(
        "⚠️ ¡PELIGRO! ¿Estás seguro de que quieres ELIMINAR TODOS los clientes?\n\nEsta acción no se puede deshacer."
      )
    )
      return;
    if (
      !confirm("¿De verdad? Se borrarán todos los registros permanentemente.")
    )
      return;

    try {
      setLoading(true);
      const collectionRef = collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "clients"
      );
      const snapshot = await getDocs(collectionRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      alert("Se han eliminado todos los clientes.");
    } catch (error) {
      console.error("Error eliminando todo:", error);
      alert("Error al eliminar: " + error.message);
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

    let baseDate;
    let isReactivation = false;

    if (currentExpiry < today) {
      baseDate = today;
      isReactivation = true;
    } else {
      baseDate = currentExpiry;
    }

    const defaultNewExpiry = new Date(baseDate);
    defaultNewExpiry.setMonth(defaultNewExpiry.getMonth() + 1);

    setRenewingClient(client);
    setRenewalData({
      newExpiryDate: defaultNewExpiry.toISOString().split("T")[0],
      baseDateUsed: baseDate,
      isReactivation: isReactivation,
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
      const updates = {
        expiryDate: renewalData.newExpiryDate,
        renewals: (parseInt(renewingClient.renewals) || 0) + 1,
      };

      if (renewalData.isReactivation) {
        updates.startDate = renewalData.baseDateUsed
          .toISOString()
          .split("T")[0];
      }

      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "clients",
          renewingClient.id
        ),
        updates
      );
      setRenewingClient(null);
      if (viewDetailsClient && viewDetailsClient.id === renewingClient.id) {
        closeDetailsModal();
      }
    } catch (error) {
      console.error("Error renovando:", error);
      alert("Error al guardar la renovación.");
    }
  };

  const handleQuickRenew = async (client) => {
    handleOpenRenewalModal(client);
  };

  // --- FUNCIÓN WHATSAPP INTELIGENTE (Usa las plantillas del estado) ---
  const openWhatsApp = (client, type = "default") => {
    if (!client || !client.contact) return;

    const cleanPhone = client.contact.replace(/\D/g, "");
    if (!cleanPhone) return;

    const days = getDaysRemaining(client.expiryDate);
    let message = "";
    const formattedDate = formatDate(client.expiryDate);
    const platformObj = userPlatforms.find((p) => p.id === client.platform);
    const platformName = platformObj ? platformObj.name : client.platform;

    const processTemplate = (template) => {
      return template
        .replace("{nombre}", client.name)
        .replace("{plataforma}", platformName)
        .replace("{fecha}", formattedDate)
        .replace("{usuario}", client.username)
        .replace("{dias}", days);
    };

    if (type === "reminderTomorrow") {
      message = processTemplate(userTemplates.reminderTomorrow);
    } else if (type === "recovery15Days") {
      message = processTemplate(userTemplates.recovery15Days);
    } else {
      if (days < 0) {
        message = processTemplate(userTemplates.expired);
      } else if (days <= 5) {
        message = processTemplate(userTemplates.expiringSoon);
      } else {
        message = processTemplate(userTemplates.active);
      }
    }

    const encodedMessage = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.open(
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        "_blank"
      );
    } else {
      window.open(
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        "_blank"
      );
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      alert("No hay clientes para exportar.");
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
      let status = "ON";
      if (days < 0) status = "OFF";

      return [
        status,
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
        .map((field) => `"${String(field || "").replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clientes_proview_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const newClients = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",");
        if (cols.length >= 8) {
          const clientData = {
            platform: cols[1]?.replace(/"/g, "").trim() || "OTRO",
            customId: cols[2]?.replace(/"/g, "").trim() || "",
            username: cols[3]?.replace(/"/g, "").trim() || "Sin Usuario",
            name: cols[4]?.replace(/"/g, "").trim() || "Sin Nombre",
            expiryDate: parseCSVDate(cols[5]?.replace(/"/g, "")),
            startDate: parseCSVDate(cols[6]?.replace(/"/g, "")),
            contact: cols[7]?.replace(/"/g, "").trim() || "",
            connections: parseInt(cols[8]?.replace(/"/g, "")) || 1,
            renewals: parseInt(cols[9]?.replace(/"/g, "")) || 1,
            createdAt: serverTimestamp(),
          };
          newClients.push(clientData);
        }
      }

      if (newClients.length > 0) {
        if (confirm(`¿Importar ${newClients.length} clientes?`)) {
          try {
            const batch = writeBatch(db);
            const collectionRef = collection(
              db,
              "artifacts",
              appId,
              "users",
              user.uid,
              "clients"
            );
            const batchClients = newClients.slice(0, 490);
            batchClients.forEach((client) => {
              const newDocRef = doc(collectionRef);
              batch.set(newDocRef, client);
            });
            await batch.commit();
            alert(
              `¡Importación exitosa! Se subieron ${batchClients.length} clientes.`
            );
          } catch (error) {
            console.error("Error importando:", error);
            alert("Hubo un error al subir los datos.");
          }
        }
      } else {
        alert(
          "No se encontraron datos válidos. Verifica el orden de columnas."
        );
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => fileInputRef.current.click();

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        platform: client.platform,
        customId: client.customId || "",
        username: client.username,
        name: client.name,
        contact: client.contact,
        connections: client.connections,
        startDate: client.startDate,
        expiryDate: client.expiryDate,
        renewals: client.renewals,
      });
    } else {
      setEditingClient(null);
      const today = new Date();
      const nextMonth = new Date(new Date().setMonth(today.getMonth() + 1));
      const defaultPlatform =
        userPlatforms.length > 0 ? userPlatforms[0].id : "OTRO";
      setFormData({
        platform: defaultPlatform,
        customId: "",
        username: "",
        name: "",
        contact: "",
        connections: 1,
        startDate: today.toISOString().split("T")[0],
        expiryDate: nextMonth.toISOString().split("T")[0],
        renewals: 1,
      });
    }
    setShowModal(true);
  };

  const openDetailsModal = (client) => {
    setViewDetailsClient(client);
  };

  const closeDetailsModal = () => {
    setViewDetailsClient(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  // Marcar/Desmarcar notificación como completada
  const toggleCompleteTask = (id) => {
    setCompletedTasks((prev) => {
      if (prev.includes(id)) {
        return prev.filter((taskId) => taskId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const pendingNotifications = useMemo(() => {
    if (!clients.length) return [];
    return clients.filter((client) => {
      const days = getDaysRemaining(client.expiryDate);
      return days === 1 || days === -15;
    });
  }, [clients]);

  const filteredClients = useMemo(() => {
    let result = clients.filter((client) => {
      const days = getDaysRemaining(client.expiryDate);
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.customId && client.customId.toString().includes(searchTerm));

      if (!matchesSearch) return false;
      if (filterStatus === "active") return days >= 0;
      if (filterStatus === "expired") return days < 0;
      if (filterStatus === "expiring") return days >= 0 && days <= 5;
      return true;
    });

    result.sort((a, b) => {
      if (sortOption === "platform") {
        return a.platform.localeCompare(b.platform);
      } else if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
    });

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

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-400 font-medium">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Filtrar notificaciones pendientes no completadas para el badge
  const activeNotificationsCount = pendingNotifications.filter(
    (n) => !completedTasks.includes(n.id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-gray-100 pb-20 transition-colors duration-300">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* Navbar */}
      <div className="bg-slate-800/90 border-b border-slate-700 p-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Proview TV
                </h1>
                <span className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-700/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Privado
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate w-32 md:w-auto flex items-center gap-1">
                <User className="w-3 h-3" /> {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder-slate-500 transition-all text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 items-center">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="p-2 rounded-lg transition-all relative bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <Bell className="w-5 h-5" />
                  {activeNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                      {activeNotificationsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>

              <button
                onClick={triggerFileUpload}
                className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm border border-slate-600/50 shadow-sm whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Importar</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm border border-slate-600/50 shadow-sm whitespace-nowrap"
                title="Exportar Clientes a CSV"
              >
                <Download className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Exportar</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm border border-slate-600/50 shadow-sm whitespace-nowrap"
                title="Configurar Plataformas"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => openModal()}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Nuevo</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Total Clientes"
            value={stats.total}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            color="border-blue-500"
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
          />
          <StatsCard
            title="Activos"
            value={stats.active}
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            color="border-emerald-500"
            active={filterStatus === "active"}
            onClick={() => setFilterStatus("active")}
          />
          <StatsCard
            title="Por Vencer"
            value={stats.expiringSoon}
            icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
            color="border-yellow-500"
            active={filterStatus === "expiring"}
            onClick={() => setFilterStatus("expiring")}
          />
          <StatsCard
            title="Vencidos"
            value={stats.expired}
            icon={<LogOut className="w-5 h-5 text-rose-400" />}
            color="border-rose-500"
            active={filterStatus === "expired"}
            onClick={() => setFilterStatus("expired")}
          />
        </div>

        {/* Tabla */}
        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <Filter className="w-4 h-4" /> <span>Ordenar por:</span>
              </div>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowUpDown className="w-3 h-3" />
                </div>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="expiryDate">Expiración (Fecha)</option>
                  <option value="name">Nombre (A-Z)</option>
                  <option value="platform">Plataforma</option>
                </select>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
              {loading ? "Cargando..." : `${filteredClients.length} registros`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Plataforma</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nombre</th>
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
                  // Buscar plataforma en la lista personalizada del usuario
                  const platformObj = userPlatforms.find(
                    (p) => p.id === client.platform
                  );
                  const platformColor = platformObj?.color || "bg-slate-600";
                  const platformName = platformObj?.name || client.platform; // Nombre real para display

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-700/40 transition-colors group"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex justify-center items-center">
                          {isExpired ? (
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                          ) : isExpiringSoon ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                              <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`${platformColor} text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase shadow-sm`}
                        >
                          {platformName}
                        </span>
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
                        <span
                          className={`font-bold text-xs ${
                            isExpired
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
                          {/* Botón WhatsApp DIRECTO */}
                          <button
                            onClick={() => openWhatsApp(client)}
                            className="p-1.5 text-emerald-400 bg-emerald-900/20 rounded-lg hover:bg-emerald-900/40 border border-emerald-900/30 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <div className="w-px h-4 bg-slate-700 mx-1"></div>

                          <button
                            onClick={() => openDetailsModal(client)}
                            className="p-1.5 text-blue-400 bg-blue-900/20 rounded-lg hover:bg-blue-900/40 border border-blue-900/30 transition-colors group-hover:scale-105"
                            title="Ver Detalles Completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenRenewalModal(client)}
                            title="Renovar Suscripción"
                            className="p-1.5 text-purple-400 bg-purple-900/20 rounded-lg hover:bg-purple-900/40 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* ELIMINADO EL LÁPIZ (EDITAR) DE AQUÍ */}

                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <Search className="w-10 h-10 opacity-20" />
                        <p className="text-sm">No se encontraron clientes.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL CONFIGURACIÓN (PLATAFORMAS Y MENSAJES) --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
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

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setSettingsTab("platforms")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                  settingsTab === "platforms"
                    ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Tv className="w-4 h-4" /> Plataformas
                </div>
              </button>
              <button
                onClick={() => setSettingsTab("messages")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                  settingsTab === "messages"
                    ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Mensajes WhatsApp
                </div>
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB PLATAFORMAS */}
              {settingsTab === "platforms" && (
                <div className="space-y-6">
                  {/* Agregar Nueva */}
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">
                      Agregar Nueva Plataforma
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre (ej: NETFLIX)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 text-white text-sm focus:border-blue-500 outline-none uppercase"
                        value={newPlatformName}
                        onChange={(e) => setNewPlatformName(e.target.value)}
                      />
                      <select
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 text-white text-sm outline-none"
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
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Lista Existente con Edición */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">
                      Plataformas Activas
                    </h4>
                    <div className="space-y-2">
                      {userPlatforms.map((plat) => (
                        <div
                          key={plat.id}
                          className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors"
                        >
                          {editingPlatform?.id === plat.id ? (
                            // MODO EDICIÓN
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
                                className="text-emerald-400 hover:text-emerald-300 p-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditingPlatform}
                                className="text-rose-400 hover:text-rose-300 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            // MODO VISUALIZACIÓN
                            <>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded-full ${plat.color}`}
                                ></div>
                                <span className="font-bold text-white text-sm">
                                  {plat.name}
                                </span>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditingPlatform(plat)}
                                  className="text-slate-500 hover:text-blue-400 p-1 rounded-md transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePlatform(plat.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                                  title="Eliminar"
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
                </div>
              )}

              {/* TAB MENSAJES */}
              {settingsTab === "messages" && (
                <div className="space-y-6">
                  <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg mb-4">
                    <h4 className="text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Variables Disponibles
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">
                      Usa estas "palabras mágicas" en tus mensajes y se
                      reemplazarán automáticamente:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs font-mono text-blue-200">{`{nombre}`}</span>
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs font-mono text-blue-200">{`{plataforma}`}</span>
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs font-mono text-blue-200">{`{fecha}`}</span>
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs font-mono text-blue-200">{`{usuario}`}</span>
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs font-mono text-blue-200">{`{dias}`}</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Recordatorio Mañana */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Vence Mañana (1
                          día)
                        </label>
                      </div>
                      <VariableToolbar
                        onInsert={(v) =>
                          insertIntoTemplate("reminderTomorrow", v)
                        }
                      />
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none min-h-[80px]"
                        value={userTemplates.reminderTomorrow}
                        onChange={(e) =>
                          handleUpdateTemplate(
                            "reminderTomorrow",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    {/* Por Vencer */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-blue-400 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Por Vencer (≤ 5 días)
                        </label>
                      </div>
                      <VariableToolbar
                        onInsert={(v) => insertIntoTemplate("expiringSoon", v)}
                      />
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px]"
                        value={userTemplates.expiringSoon}
                        onChange={(e) =>
                          handleUpdateTemplate("expiringSoon", e.target.value)
                        }
                      />
                    </div>

                    {/* Ya Vencido */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-rose-400 flex items-center gap-2">
                          <X className="w-4 h-4" /> Ya Vencido (Hoy o antes)
                        </label>
                      </div>
                      <VariableToolbar
                        onInsert={(v) => insertIntoTemplate("expired", v)}
                      />
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none min-h-[80px]"
                        value={userTemplates.expired}
                        onChange={(e) =>
                          handleUpdateTemplate("expired", e.target.value)
                        }
                      />
                    </div>

                    {/* Recuperación */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-purple-400 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" /> Recuperación (Hace
                          15 días)
                        </label>
                      </div>
                      <VariableToolbar
                        onInsert={(v) =>
                          insertIntoTemplate("recovery15Days", v)
                        }
                      />
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none min-h-[80px]"
                        value={userTemplates.recovery15Days}
                        onChange={(e) =>
                          handleUpdateTemplate("recovery15Days", e.target.value)
                        }
                      />
                    </div>

                    {/* Activo */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Activo (Datos de
                          cuenta)
                        </label>
                      </div>
                      <VariableToolbar
                        onInsert={(v) => insertIntoTemplate("active", v)}
                      />
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[80px]"
                        value={userTemplates.active}
                        onChange={(e) =>
                          handleUpdateTemplate("active", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOTIFICACIONES (Ventana Flotante) --- */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notificaciones
                Pendientes
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {pendingNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <CheckCircle className="w-10 h-10 opacity-30 mb-2" />
                  <p>¡Todo al día! No hay alertas hoy.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {pendingNotifications.map((client) => {
                    const days = getDaysRemaining(client.expiryDate);
                    const isUrgent = days === 1;
                    const isCompleted = completedTasks.includes(client.id);

                    return (
                      <div
                        key={client.id}
                        className={`p-4 transition-colors ${
                          isCompleted
                            ? "bg-slate-900/50 opacity-60"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p
                              className={`font-bold text-sm ${
                                isCompleted
                                  ? "text-slate-400 line-through"
                                  : "text-white"
                              }`}
                            >
                              {client.name}
                            </p>
                            <p className="text-slate-400 text-xs mt-0.5">
                              {client.platform} • {client.contact}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                              isUrgent
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {isUrgent ? "Vence Mañana" : "Recuperación"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {client.contact ? (
                            <button
                              onClick={() =>
                                openWhatsApp(
                                  client,
                                  isUrgent
                                    ? "reminderTomorrow"
                                    : "recovery15Days"
                                )
                              }
                              disabled={isCompleted}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                isCompleted
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                  : "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:scale-[1.02]"
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                            </button>
                          ) : (
                            <div className="flex-1 text-xs text-slate-600 text-center italic p-2 bg-slate-900 rounded border border-slate-800">
                              Sin contacto
                            </div>
                          )}

                          <button
                            onClick={() => toggleCompleteTask(client.id)}
                            className={`p-2 rounded-lg border transition-all ${
                              isCompleted
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                            }`}
                            title={
                              isCompleted
                                ? "Marcar como pendiente"
                                : "Marcar como completado"
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
              )}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-slate-500 text-xs hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL RENOVACIÓN --- */}
      {renewingClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600/20 p-2 rounded-lg text-emerald-500">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Renovar Suscripción</h3>
                  <p className="text-xs text-slate-400">
                    Cliente: {renewingClient.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRenewingClient(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-sm">
                <p className="text-slate-400 mb-1">
                  Fecha de vencimiento actual:
                </p>
                <div className="flex items-center gap-2 text-white font-mono">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {formatDate(renewingClient.expiryDate)}
                  {renewalData.isReactivation && (
                    <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded ml-auto">
                      Vencido
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                  Nueva Fecha de Expiración
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none [color-scheme:dark]"
                  value={renewalData.newExpiryDate}
                  onChange={(e) =>
                    setRenewalData({
                      ...renewalData,
                      newExpiryDate: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-slate-500 mt-2">
                  {renewalData.isReactivation
                    ? "Calculado desde HOY (Reactivación)"
                    : "Calculado desde su vencimiento anterior (Continuidad)"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyRenewalPreset(1)}
                  className="py-2 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 rounded-lg text-sm font-medium transition-all"
                >
                  +1 Mes
                </button>
                <button
                  onClick={() => applyRenewalPreset(3)}
                  className="py-2 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-lg text-sm font-medium transition-all"
                >
                  +3 Meses
                </button>
                <button
                  onClick={() => applyRenewalPreset(6)}
                  className="py-2 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-purple-400 rounded-lg text-sm font-medium transition-all"
                >
                  +6 Meses
                </button>
              </div>
              <button
                onClick={confirmRenewal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value, valueColor = "text-white" }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase">
        {icon} <span>{label}</span>
      </div>
      <div className={`text-sm font-medium ${valueColor}`}>{value}</div>
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
        cursor-pointer p-4 rounded-xl shadow-lg 
        border-b-4 transition-all duration-200
        ${color} 
        ${activeClass} 
        ${ringColor}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className="opacity-90 p-2 bg-slate-900/40 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
