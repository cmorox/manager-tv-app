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
  CheckSquare,
  Square,
  Shield,
  HeartHandshake, // Icono para recuperación
  HelpCircle, // Icono para seguimiento
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
  // AUTOMÁTICOS (Tabla)
  expired:
    "Hola {nombre}, tu servicio de {plataforma} venció el {fecha}. ¿Te gustaría reactivarlo?",
  expiringSoon:
    "Hola {nombre}, recordatorio: tu cuenta de {plataforma} vence pronto ({fecha}). ¿Deseas renovar?",
  active:
    "Hola {nombre}, aquí tienes los datos de tu cuenta {plataforma}:\nUsuario: {usuario}",

  // ESPECÍFICOS (Notificaciones)
  reminderTomorrow:
    "Hola {nombre}, tu servicio de {plataforma} vence MAÑANA ({fecha}). ¿Deseas renovar para no perder la señal? 📺",
  checkIn15Days:
    "Hola {nombre}, faltan 15 días para que venza tu {plataforma}. ¿Todo va bien con el servicio? Queremos asegurarnos de que lo disfrutas. 🛠️",
  recoveryLost:
    "Hola {nombre}, te extrañamos. Han pasado días desde que venció tu {plataforma}. ¿Te gustaría regresar con una promo especial? 🎁",
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
  } catch (e) {}
  return new Date().toISOString().split("T")[0];
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
      setError("Error: " + err.message);
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
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Correo
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-blue-500 outline-none"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-blue-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-rose-400 text-sm p-2 bg-rose-500/10 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg mt-4 disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : isRegistering
              ? "Registrarse"
              : "Iniciar Sesión"}
          </button>
        </form>
        <div className="mt-8 text-center pt-6 border-t border-slate-800">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
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

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [viewingAsUser, setViewingAsUser] = useState(null);

  const [userPlatforms, setUserPlatforms] = useState(DEFAULT_PLATFORMS);
  const [userTemplates, setUserTemplates] = useState(DEFAULT_TEMPLATES);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("platforms");
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState(
    AVAILABLE_COLORS[0].class
  );
  const [editingPlatform, setEditingPlatform] = useState(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
    }
  }, [user]);

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
        console.error(error);
      }
    };
    fetchSettings();
  }, [user]);

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
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, viewingAsUser]);

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

  const handleLogout = async () => {
    await signOut(auth);
  };

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
      console.error(error);
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
      alert("Ya existe.");
      return;
    }
    const updated = [...userPlatforms, newPlat];
    setUserPlatforms(updated);
    saveSettingsToDB(updated, null);
    setNewPlatformName("");
  };

  const handleDeletePlatform = (id) => {
    if (confirm("¿Eliminar plataforma?")) {
      const updated = userPlatforms.filter((p) => p.id !== id);
      setUserPlatforms(updated);
      saveSettingsToDB(updated, null);
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

  const insertIntoTemplate = (key, variable) => {
    const currentText = userTemplates[key] || "";
    handleUpdateTemplate(key, currentText + " " + variable);
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
      setRenewingClient(null);
      if (viewDetailsClient && viewDetailsClient.id === renewingClient.id)
        closeDetailsModal();
    } catch (error) {
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
    link.download = `clientes_proview_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
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
      setFormData({ ...client });
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

  const openDetailsModal = (client) => setViewDetailsClient(client);
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
      const days = getDaysRemaining(client.expiryDate);
      // Días clave: 15 días antes (15), 1 día antes (1), 15 días después (-15)
      return days === 15 || days === 1 || days === -15;
    });
  }, [clients]);

  const activeNotificationsCount = pendingNotifications.filter(
    (n) => !completedTasks.includes(n.id)
  ).length;

  if (authChecking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-400">
        Cargando...
      </div>
    );
  if (!user) return <LoginScreen />;

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
                {isAdmin ? (
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-700/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Privado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate w-32 md:w-auto flex items-center gap-1">
                <User className="w-3 h-3" />{" "}
                {viewingAsUser ? `Viendo: ${viewingAsUser.email}` : user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:border-blue-500 text-slate-200 text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 items-center">
              {isAdmin && !viewingAsUser && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  title="Panel de Admin"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
              {viewingAsUser && (
                <button
                  onClick={() => setViewingAsUser(null)}
                  className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <LogOut className="w-4 h-4" /> Salir de {viewingAsUser.email}
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative"
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

              {!viewingAsUser && (
                <>
                  <button
                    onClick={triggerFileUpload}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-600/50"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-600/50"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-600/50"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openModal()}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </>
              )}

              <button
                onClick={handleLogout}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
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

        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 overflow-hidden">
          {/* Header Tabla */}
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
                  className="pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 text-xs font-medium focus:border-blue-500 outline-none"
                >
                  <option value="expiryDate">Expiración</option>
                  <option value="name">Nombre</option>
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
                  const platformObj = userPlatforms.find(
                    (p) => p.id === client.platform
                  );
                  const platformColor = platformObj?.color || "bg-slate-600";
                  const platformName = platformObj?.name || client.platform;

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
                          <button
                            onClick={() => openWhatsApp(client)}
                            className="p-1.5 text-emerald-400 bg-emerald-900/20 rounded-lg hover:bg-emerald-900/40 border border-emerald-900/30 transition-colors group-hover:scale-105"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-700 mx-1"></div>
                          <button
                            onClick={() => openDetailsModal(client)}
                            className="p-1.5 text-blue-400 bg-blue-900/20 rounded-lg hover:bg-blue-900/40 border border-blue-900/30 transition-colors group-hover:scale-105"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRenewalModal(client)}
                            title="Renovar"
                            className="p-1.5 text-purple-400 bg-purple-900/20 rounded-lg hover:bg-purple-900/40 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {!viewingAsUser && (
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh] flex flex-col">
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
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setSettingsTab("platforms")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                  settingsTab === "platforms"
                    ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-200"
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
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Mensajes
                </div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {settingsTab === "platforms" ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">
                      Agregar Nueva
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre"
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
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
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
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ) : (
                <div className="space-y-5">
                  {/* Vence Mañana */}
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

                  {/* Check-In 15 Días Antes */}
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

                  {/* Recuperación 15 Días Después */}
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

                  {/* Vencido */}
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
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => applyRenewalPreset(1)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"
              >
                +1 Mes
              </button>
              <button
                onClick={() => applyRenewalPreset(3)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"
              >
                +3 Meses
              </button>
              <button
                onClick={() => applyRenewalPreset(6)}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-blue-900 to-slate-900">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {viewDetailsClient.name}
                </h2>
                <p className="text-blue-200">{viewDetailsClient.platform}</p>
              </div>
              <button onClick={closeDetailsModal}>
                <X className="w-6 h-6 text-white/70 hover:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Usuario
                  </p>
                  <p className="text-white text-lg">
                    {viewDetailsClient.username}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Contraseña
                  </p>
                  <p className="text-white text-lg">••••••</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Expiración
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      getDaysRemaining(viewDetailsClient.expiryDate) < 0
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {formatDate(viewDetailsClient.expiryDate)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Contacto
                  </p>
                  <p className="text-white text-lg">
                    {viewDetailsClient.contact}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    closeDetailsModal();
                    handleOpenRenewalModal(viewDetailsClient);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold"
                >
                  Renovar
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openModal(viewDetailsClient);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notificaciones
              </h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {pendingNotifications.length === 0 && (
                <p className="text-center text-slate-500 py-4">
                  Sin notificaciones pendientes.
                </p>
              )}
              {pendingNotifications.map((c) => {
                const days = getDaysRemaining(c.expiryDate);
                // Determinar tipo de alerta
                let type = "reminderTomorrow";
                let label = "Vence Mañana";
                let style =
                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

                if (days === 15) {
                  type = "checkIn15Days";
                  label = "Seguimiento";
                  style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                } else if (days === -15) {
                  type = "recoveryLost";
                  label = "Recuperación";
                  style =
                    "bg-purple-500/10 text-purple-400 border-purple-500/20";
                }

                const isCompleted = completedTasks.includes(c.id);

                return (
                  <div
                    key={c.id}
                    className={`p-4 transition-colors rounded border border-slate-700 ${
                      isCompleted
                        ? "bg-slate-900/50 opacity-60"
                        : "bg-slate-800"
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
                          {c.name}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {c.platform} • {c.contact}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${style}`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {c.contact ? (
                        <button
                          onClick={() => openWhatsApp(c, type)}
                          disabled={isCompleted}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            isCompleted
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:scale-[1.02]"
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Enviar WhatsApp
                        </button>
                      ) : (
                        <div className="flex-1 text-xs text-slate-600 text-center italic p-2 bg-slate-900 rounded border border-slate-800">
                          Sin contacto
                        </div>
                      )}
                      <button
                        onClick={() => toggleCompleteTask(c.id)}
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
          </div>
        </div>
      )}

      {/* Nuevo/Editar Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 p-6">
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
                  NOMBRE
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
                    CONTACTO
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
