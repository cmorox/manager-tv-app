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
  Copy, // Nuevo icono para copiar mensaje
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

// --- Utilidades y Constantes ---

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

  // Estado para Plataformas Dinámicas
  const [userPlatforms, setUserPlatforms] = useState(DEFAULT_PLATFORMS);
  const [showSettings, setShowSettings] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState(
    AVAILABLE_COLORS[0].class
  );

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

  // Nuevo estado para Notificaciones
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Carga de Plataformas Personalizadas
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
        if (docSnap.exists() && docSnap.data().platforms) {
          setUserPlatforms(docSnap.data().platforms);
        } else {
          setUserPlatforms(DEFAULT_PLATFORMS);
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    fetchSettings();
  }, [user]);

  const savePlatformsToDB = async (updatedPlatforms) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "settings", "general"),
        {
          platforms: updatedPlatforms,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error guardando plataformas:", error);
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
    savePlatformsToDB(updated);
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
      savePlatformsToDB(updated);
    }
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

  // --- FUNCIÓN WHATSAPP OPTIMIZADA (Móvil/PC) ---
  const openWhatsApp = (client, type = "default") => {
    if (!client || !client.contact) return;

    const cleanPhone = client.contact.replace(/\D/g, "");
    if (!cleanPhone) return;

    const days = getDaysRemaining(client.expiryDate);
    let message = "";

    if (type === "reminder-tomorrow") {
      message = `Hola ${client.name}, recordatorio amable: tu servicio de ${
        client.platform
      } vence MAÑANA (${formatDate(
        client.expiryDate
      )}). ¿Deseas renovar para no perder la señal? 📺`;
    } else if (type === "recovery-15") {
      message = `Hola ${client.name}, te extrañamos. Han pasado 15 días desde que venció tu cuenta de ${client.platform}. ¿Te gustaría reactivar el servicio hoy? 👋`;
    } else {
      // Lógica por defecto (Botón tabla)
      if (days < 0) {
        message = `Hola ${client.name}, tu servicio de ${
          client.platform
        } venció el ${formatDate(
          client.expiryDate
        )}. ¿Te gustaría reactivarlo?`;
      } else if (days <= 5) {
        message = `Hola ${client.name}, recordatorio: tu cuenta de ${
          client.platform
        } vence pronto, el ${formatDate(
          client.expiryDate
        )} (en ${days} días). ¿Deseas renovar?`;
      } else {
        message = `Hola ${client.name}, aquí tienes los datos de tu cuenta ${client.platform}:\nUsuario: ${client.username}`;
      }
    }

    const encodedMessage = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Móvil: Deep Link a la API (dispara la app nativa)
      window.open(
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        "_blank"
      );
    } else {
      // Escritorio: WhatsApp Web (evita la landing page de "Download")
      window.open(
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        "_blank"
      );
    }
  };

  // --- LÓGICA DE EXPORTACIÓN CSV ---
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

  // --- CÁLCULO DE NOTIFICACIONES PENDIENTES ---
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

  // --- RENDERIZADO CONDICIONAL ---

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

  // --- APP PRINCIPAL ---
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
              {/* BOTÓN NOTIFICACIONES */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg transition-all relative ${
                    showNotifications
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {pendingNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      {pendingNotifications.length}
                    </span>
                  )}
                </button>

                {/* DROPDOWN NOTIFICACIONES */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-400" /> Tareas
                        Pendientes
                      </h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {pendingNotifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          ¡Todo al día! No hay alertas hoy.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-700">
                          {pendingNotifications.map((client) => {
                            const days = getDaysRemaining(client.expiryDate);
                            const isUrgent = days === 1; // Vence mañana
                            return (
                              <div
                                key={client.id}
                                className="p-3 hover:bg-slate-700/30 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-white font-medium text-sm">
                                      {client.name}
                                    </p>
                                    <p className="text-slate-400 text-xs">
                                      {client.platform} • {client.contact}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                      isUrgent
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-blue-500/20 text-blue-400"
                                    }`}
                                  >
                                    {isUrgent ? "Vence Mañana" : "Recuperación"}
                                  </span>
                                </div>
                                {client.contact && (
                                  <button
                                    onClick={() =>
                                      openWhatsApp(
                                        client,
                                        isUrgent
                                          ? "reminder-tomorrow"
                                          : "recovery-15"
                                      )
                                    }
                                    className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <MessageCircle className="w-3 h-3" /> Enviar
                                    Recordatorio
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  const platformColor =
                    userPlatforms.find((p) => p.id === client.platform)
                      ?.color || "bg-slate-600";

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
                          {client.platform}
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
                          <button
                            onClick={() => openModal(client)}
                            className="p-1.5 text-slate-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* --- MODAL CONFIGURACIÓN PLATAFORMAS --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    Gestionar Plataformas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Personaliza tus servicios
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

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

              {/* Lista Existente */}
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
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${plat.color}`}
                        ></div>
                        <span className="font-bold text-white text-sm">
                          {plat.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePlatform(plat.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* --- MODAL DETALLES (El Ojito) --- */}
      {viewDetailsClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative h-24 bg-gradient-to-r from-blue-900 to-slate-900 p-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    userPlatforms.find(
                      (p) => p.id === viewDetailsClient.platform
                    )?.color || "bg-slate-700"
                  }`}
                >
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {viewDetailsClient.name}
                  </h2>
                  <p className="text-blue-200 text-sm font-mono">
                    {viewDetailsClient.username}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailItem
                  icon={<Tv className="w-4 h-4" />}
                  label="Plataforma"
                  value={viewDetailsClient.platform}
                />
                <DetailItem
                  icon={<Hash className="w-4 h-4" />}
                  label="ID Sistema"
                  value={viewDetailsClient.customId || "N/A"}
                />
                <DetailItem
                  icon={<Activity className="w-4 h-4" />}
                  label="Estado"
                  value={
                    getDaysRemaining(viewDetailsClient.expiryDate) < 0
                      ? "Vencido"
                      : "Activo"
                  }
                  valueColor={
                    getDaysRemaining(viewDetailsClient.expiryDate) < 0
                      ? "text-red-400"
                      : "text-emerald-400"
                  }
                />
              </div>
              <div className="h-px bg-slate-700 my-2"></div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Detalles de Suscripción
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />{" "}
                    <span className="text-xs font-semibold uppercase">
                      Inicio
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {formatDate(viewDetailsClient.startDate)}
                  </p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <AlertCircle className="w-4 h-4" />{" "}
                    <span className="text-xs font-semibold uppercase">
                      Expiración
                    </span>
                  </div>
                  <p className="text-white font-medium text-lg">
                    {formatDate(viewDetailsClient.expiryDate)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 p-3 rounded-lg flex items-center justify-between border border-slate-700/30">
                  <span className="text-slate-400 text-sm">Conexiones</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-400" />{" "}
                    {viewDetailsClient.connections}
                  </span>
                </div>
                <div className="bg-slate-700/30 p-3 rounded-lg flex items-center justify-between border border-slate-700/30">
                  <span className="text-slate-400 text-sm">Contrataciones</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-green-400" />{" "}
                    {viewDetailsClient.renewals}
                  </span>
                </div>
                <div
                  className="bg-slate-700/30 p-3 rounded-lg flex items-center justify-between border border-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => openWhatsApp(viewDetailsClient)}
                >
                  <span className="text-slate-400 text-sm">Contacto</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />{" "}
                    {viewDetailsClient.contact || "-"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    closeDetailsModal();
                    handleOpenRenewalModal(viewDetailsClient);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Renovar Ahora
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openModal(viewDetailsClient);
                  }}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDICIÓN/CREACIÓN --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                {editingClient ? "Editar Cliente" : "Nuevo Registro"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Plataforma
                  </label>
                  <select
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white"
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
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Usuario / ID
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="Ej. USER123"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Nombre Cliente
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="Nombre completo"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    ID Personalizado
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="Opcional"
                    value={formData.customId}
                    onChange={(e) =>
                      setFormData({ ...formData, customId: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="Solo números"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Dispositivos
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-lg border-slate-600 bg-slate-900 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition-all outline-none text-white"
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
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                    Inicio
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-300 [color-scheme:dark]"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
                  <label className="block text-xs font-bold text-blue-400 mb-1.5 uppercase">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-blue-300 font-bold [color-scheme:dark]"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors text-sm border border-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all transform active:scale-[0.98] text-sm"
                >
                  Guardar
                </button>
              </div>
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
