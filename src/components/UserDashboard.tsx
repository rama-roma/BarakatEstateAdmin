"use client";

import {
  Building2,
  CheckCircle2,
  Contact,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuthUser, Listing, Profile, PublishStatus } from "@/lib/types";

type Tab = "listings" | "profile";

type FormState = {
  listings: Partial<Listing>;
  profile: Partial<Profile>;
};

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "listings", label: "Мои объявления", icon: <Building2 size={18} /> },
  { id: "profile", label: "Мой профиль", icon: <Contact size={18} /> },
];

const emptyForms: FormState = {
  listings: {
    title: "",
    dealType: "sale",
    propertyType: "Квартира",
    price: 0,
    district: "Душанбе",
    address: "",
    rooms: 1,
    area: 0,
    floor: 1,
    totalFloors: 1,
    yearBuilt: new Date().getFullYear(),
    description: "",
    features: "",
    latitude: 38.5598,
    longitude: 68.787,
    mapX: 50,
    mapY: 50,
    mainImage: "",
    gallery: "",
    isFeatured: false,
    status: "draft",
  },
  profile: {
    name: "",
    description: "",
    phone: "",
    email: "",
    socials: {
      instagram: "",
      telegram: "",
      whatsapp: "",
    },
    avatarUrl: "",
    specializations: "",
    rating: 5,
    dealsCount: 0,
    experienceYears: 0,
  },
};

function cloneForm<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toNumber(value: FormDataEntryValue | null) {
  return Number(value || 0);
}

function toStatus(value: FormDataEntryValue | null): PublishStatus {
  return value === "published" ? "published" : "draft";
}

async function uploadFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

async function prepareImageFields(data: FormData) {
  const mainImageFile = data.get("mainImageFile");
  if (mainImageFile instanceof File && mainImageFile.size > 0) {
    const url = await uploadFile(mainImageFile);
    if (url) data.set("mainImage", url);
  }

  const galleryFiles = data.getAll("galleryFiles").filter((item) => item instanceof File && item.size > 0) as File[];
  const uploadedGalleryUrls: string[] = [];

  for (const file of galleryFiles) {
    const url = await uploadFile(file);
    if (url) uploadedGalleryUrls.push(url);
  }

  const textGallery = String(data.get("gallery") || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (uploadedGalleryUrls.length > 0 || textGallery.length > 0) {
    data.set("gallery", [...uploadedGalleryUrls, ...textGallery].join("\n"));
  }
}

function userToProfile(user: AuthUser): Partial<Profile> {
  return {
    name: user.name,
    description: user.bio,
    phone: user.phone,
    email: user.email,
    socials: {
      instagram: user.instagram,
      telegram: user.telegram,
      whatsapp: user.whatsapp,
    },
    avatarUrl: user.avatar,
    rating: user.rating,
    dealsCount: user.dealsCount,
    experienceYears: user.experienceYears,
    specializations: user.specializations,
  };
}

export default function UserDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(cloneForm(emptyForms));
  const [query, setQuery] = useState("");
  const [statusFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not auth");
      })
      .then((data) => {
        setCurrentUser(data.user);
        setForm((prev) => ({ ...prev, profile: userToProfile(data.user) }));
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === "profile") return [];
    return listings.filter((item) => {
      const text = JSON.stringify(item).toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listings, query, statusFilter, activeTab]);

  useEffect(() => {
    if (!currentUser) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadAll() {
    setLoading(true);
    try {
      const listingRes = await fetch("/api/listings?admin=1");
      const listingPayload = await listingRes.json();
      setListings(listingPayload.data || []);
      setForm((prev) => ({ ...prev, profile: userToProfile(currentUser!) }));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setListings([]);
    setEditingId(null);
    setActiveTab("listings");
    setForm(cloneForm(emptyForms));
  }

  function startCreate() {
    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      [activeTab]: activeTab === "profile" && currentUser ? userToProfile(currentUser) : cloneForm(emptyForms[activeTab]),
    }));
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      [tab]: tab === "profile" && currentUser ? userToProfile(currentUser) : cloneForm(emptyForms[tab]),
    }));
  }

  function startEdit(item: Listing) {
    setEditingId(item.id);
    setForm((prev) => ({ ...prev, [activeTab]: cloneForm(item) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(id: string) {
    if (!window.confirm("Удалить объявление?")) return;
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    await loadAll();
    setToast("Удалено");
  }

  async function togglePublish(item: Listing) {
    const status: PublishStatus = item.status === "published" ? "draft" : "published";
    await fetch(`/api/listings/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAll();
    setToast(status === "published" ? "Опубликовано" : "Скрыто");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    const data = new FormData(event.currentTarget);
    if (activeTab === "profile") {
      const avatarFile = data.get("avatarFile");
      if (avatarFile instanceof File && avatarFile.size > 0) {
        const url = await uploadFile(avatarFile);
        if (url) data.set("avatar", url);
      }
    } else if (activeTab === "listings") {
      await prepareImageFields(data);
    }

    const payload = buildPayload(activeTab, data);

    if (activeTab === "profile") {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const profilePayload = await response.json();
      if (!response.ok) {
        setToast(profilePayload.error || "Профиль не сохранен");
        setLoading(false);
        return;
      }
      setCurrentUser(profilePayload.user);
      setForm((prev) => ({ ...prev, profile: userToProfile(profilePayload.user) }));
      setToast("Профиль обновлен");
      setLoading(false);
      return;
    }

    const url = editingId ? `/api/listings/${editingId}` : `/api/listings`;
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      setToast(err.error || "Ошибка сохранения");
      setLoading(false);
      return;
    }

    await loadAll();
    startCreate();
    setToast("Сохранено");
    setLoading(false);
  }

  if (!authReady) return <main className="min-h-screen bg-slate-50" />;
  if (!currentUser) return <AuthScreen onAuth={(user) => setCurrentUser(user)} />;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex justify-center">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sticky top-8 h-auto lg:h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/barakat.PNG" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-bold text-xl tracking-tight">Barakat</div>
          </div>
          
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                type="button"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
                  activeTab === tab.id ? "bg-yellow-50 text-yellow-800 shadow-inner" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={handleLogout} 
              type="button"
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition font-medium text-sm"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <section className="flex-1 min-w-0 flex flex-col gap-8">
          
          {/* TOPBAR */}
          <header className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h1>
            {loading && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Загрузка...
              </div>
            )}
          </header>

          {/* MAIN FORMS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {activeTab === "profile" ? "Настройки профиля" : editingId ? "Редактирование объявления" : "Создать объявление"}
              </h2>
              {activeTab !== "profile" && (
                <button 
                  onClick={startCreate} 
                  type="button" 
                  className="flex items-center gap-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 px-4 py-2 rounded-lg transition"
                >
                  <Plus size={16} /> Новое
                </button>
              )}
            </div>

            <form key={`${activeTab}-${editingId || "new"}`} onSubmit={submitForm}>
              {renderForm(activeTab, form)}
            </form>
          </div>

          {/* LISTINGS DATA GRID */}
          {activeTab === "listings" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-semibold text-slate-800">Список объявлений</h2>
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    aria-label="Поиск"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск объявлений..."
                    value={query}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Search className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-slate-500 font-medium">Ничего не найдено</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <article key={item.id} className="group flex flex-col sm:flex-row bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200">
                      
                      {/* Image Thumbnail */}
                      <div className="w-full sm:w-64 h-48 sm:h-auto shrink-0 bg-slate-100 overflow-hidden relative">
                        {item.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="w-full h-full object-cover group-hover:scale-105 transition duration-500" src={item.mainImage} alt={item.title} />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <Building2 size={32} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {item.status === "published" ? "Опубликовано" : "Черновик"}
                          </span>
                          {item.isFeatured && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm bg-yellow-100 text-yellow-700">
                              В Избранном
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 truncate mb-1">{item.title}</h3>
                          <div className="text-slate-500 text-sm font-medium mb-4 flex gap-2 items-center">
                            <span className="text-slate-800 font-bold">{item.price} TJS</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{item.propertyType}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{item.district}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                          <button onClick={() => startEdit(item)} type="button" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-yellow-600 transition bg-slate-50 hover:bg-yellow-50 px-3 py-1.5 rounded-lg">
                            <Pencil size={14} /> Редактировать
                          </button>
                          <button onClick={() => togglePublish(item)} type="button" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-green-600 transition bg-slate-50 hover:bg-green-50 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 size={14} /> {item.status === "published" ? "Скрыть" : "Опубликовать"}
                          </button>
                          <button onClick={() => removeItem(item.id)} type="button" className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 transition bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg ml-auto">
                            <Trash2 size={14} /> Удалить
                          </button>
                        </div>
                      </div>

                    </article>
                  ))
                )}
              </div>
            </div>
          )}

        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl font-medium text-sm animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </main>
  );
}

// -------------------------------------------------------------
// AUTH SCREEN
// -------------------------------------------------------------
function AuthScreen({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { username, password } : { username, password, name };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Ошибка");
        return;
      }
      onAuth(payload.user as AuthUser);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-5">
        <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
          {isLogin ? <KeyRound size={28} /> : <UserPlus size={28} />}
        </div>
        
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{isLogin ? "С возвращением" : "Регистрация"}</h1>
          <p className="text-sm text-slate-500 mt-1">{isLogin ? "Войдите в панель управления" : "Создайте аккаунт продавца"}</p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Логин</span>
            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          
          {!isLogin && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Имя</span>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Пароль</span>
            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl text-center">{error}</div>}
        
        <button className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold rounded-xl transition shadow-sm" disabled={loading} type="submit">
          {loading ? "Загрузка..." : (isLogin ? "Войти" : "Зарегистрироваться")}
        </button>
        
        <button type="button" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </main>
  );
}

// -------------------------------------------------------------
// DATA BUILDER
// -------------------------------------------------------------
function buildPayload(tab: Tab, data: FormData) {
  if (tab === "profile") {
    return {
      name: String(data.get("name") || ""),
      bio: String(data.get("description") || ""),
      phone: String(data.get("phone") || ""),
      email: String(data.get("email") || ""),
      whatsapp: String(data.get("whatsapp") || ""),
      telegram: String(data.get("telegram") || ""),
      instagram: String(data.get("instagram") || ""),
      avatar: String(data.get("avatar") || ""),
      specializations: String(data.get("specializations") || ""),
      rating: toNumber(data.get("rating")),
      dealsCount: toNumber(data.get("dealsCount")),
      experienceYears: toNumber(data.get("experienceYears")),
    };
  }

  return {
    title: String(data.get("title") || ""),
    dealType: data.get("dealType") === "rent" ? "rent" : "sale",
    propertyType: String(data.get("propertyType") || "Квартира"),
    price: toNumber(data.get("price")),
    district: String(data.get("district") || ""),
    address: String(data.get("address") || ""),
    rooms: toNumber(data.get("rooms")),
    area: toNumber(data.get("area")),
    floor: toNumber(data.get("floor")),
    totalFloors: toNumber(data.get("totalFloors")),
    yearBuilt: toNumber(data.get("yearBuilt")),
    description: String(data.get("description") || ""),
    features: String(data.get("features") || ""),
    latitude: toNumber(data.get("latitude")),
    longitude: toNumber(data.get("longitude")),
    mapX: toNumber(data.get("mapX")),
    mapY: toNumber(data.get("mapY")),
    mainImage: String(data.get("mainImage") || ""),
    gallery: String(data.get("gallery") || ""),
    isFeatured: data.get("isFeatured") === "on",
    status: toStatus(data.get("status")),
  };
}

// -------------------------------------------------------------
// FORM COMPONENTS
// -------------------------------------------------------------
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
}

function Field({ name, title, value, type = "text", colSpan = 1 }: { name: string; title: string; value?: string | number; type?: string; colSpan?: 1 | 2 | 3 | "full" }) {
  const spanClass = colSpan === "full" ? "col-span-1 md:col-span-2 lg:col-span-3" : colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";
  return (
    <label className={`flex flex-col gap-1.5 ${spanClass}`}>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <input 
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition text-sm text-slate-900"
        defaultValue={value ?? ""} 
        name={name} 
        type={type} 
        step={type === "number" ? "any" : undefined} 
      />
    </label>
  );
}

function TextArea({ name, title, value, rows = 3, colSpan = "full" }: { name: string; title: string; value?: string; rows?: number; colSpan?: 1 | 2 | 3 | "full" }) {
  const spanClass = colSpan === "full" ? "col-span-1 md:col-span-2 lg:col-span-3" : colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";
  return (
    <label className={`flex flex-col gap-1.5 ${spanClass}`}>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <textarea 
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition text-sm text-slate-900 resize-y"
        defaultValue={value ?? ""} 
        name={name} 
        rows={rows} 
      />
    </label>
  );
}

function Select({ name, title, value, options, colSpan = 1 }: { name: string; title: string; value?: string; options: Array<[string, string]>; colSpan?: 1 | 2 | 3 | "full" }) {
  const spanClass = colSpan === "full" ? "col-span-1 md:col-span-2 lg:col-span-3" : colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";
  return (
    <label className={`flex flex-col gap-1.5 ${spanClass}`}>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <select 
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition text-sm text-slate-900 appearance-none"
        defaultValue={value} 
        name={name}
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function FileUpload({ name, title, multiple = false, colSpan = "full" }: { name: string; title: string; multiple?: boolean; colSpan?: 1 | 2 | 3 | "full" }) {
  const spanClass = colSpan === "full" ? "col-span-1 md:col-span-2 lg:col-span-3" : colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";
  return (
    <label className={`flex flex-col gap-1.5 ${spanClass}`}>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <input 
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 cursor-pointer"
        name={name} 
        type="file" 
        accept="image/*" 
        multiple={multiple}
      />
    </label>
  );
}

function renderForm(tab: Tab, form: FormState) {
  const values = form[tab];

  if (tab === "profile") {
    const item = values as Partial<Profile>;
    return (
      <div className="flex flex-col gap-8">
        <FormSection title="Основная информация">
          <Field name="name" title="Имя" value={item.name} colSpan={2} />
          <Field name="specializations" title="Специализация" value={item.specializations} colSpan={1} />
          
          <FileUpload name="avatarFile" title="Загрузить новое фото / аватар" colSpan={2} />
          <Field name="avatar" title="Или укажите URL аватара" value={item.avatarUrl} colSpan={1} />
          
          <TextArea name="description" title="О себе" value={item.description} rows={4} colSpan="full" />
        </FormSection>

        <FormSection title="Контакты и Соцсети">
          <Field name="phone" title="Телефон" value={item.phone} />
          <Field name="email" title="Email" value={item.email} />
          <Field name="whatsapp" title="WhatsApp" value={item.socials?.whatsapp} />
          <Field name="telegram" title="Telegram" value={item.socials?.telegram} />
          <Field name="instagram" title="Instagram" value={item.socials?.instagram} />
        </FormSection>

        <FormSection title="Статистика (Достижения)">
          <Field name="rating" title="Средняя оценка (0-5)" type="number" value={item.rating} />
          <Field name="dealsCount" title="Успешные сделки" type="number" value={item.dealsCount} />
          <Field name="experienceYears" title="Стаж работы (лет)" type="number" value={item.experienceYears} />
        </FormSection>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold rounded-xl transition shadow-sm text-sm" type="submit">
            Сохранить настройки
          </button>
        </div>
      </div>
    );
  }

  const item = values as Partial<Listing>;
  return (
    <div className="flex flex-col gap-8">
      <FormSection title="Общая информация">
        <Field name="title" title="Название объявления" value={item.title} colSpan={2} />
        <Select name="dealType" title="Тип сделки" value={item.dealType} options={[["sale", "Продажа"], ["rent", "Аренда"]]} />
        <Field name="propertyType" title="Тип недвижимости" value={item.propertyType} />
        <Field name="price" title="Цена (TJS)" type="number" value={item.price} colSpan={2} />
      </FormSection>

      <FormSection title="Параметры объекта">
        <Field name="rooms" title="Комнаты" type="number" value={item.rooms} />
        <Field name="area" title="Площадь (м²)" type="number" value={item.area} />
        <Field name="yearBuilt" title="Год постройки" type="number" value={item.yearBuilt} />
        <Field name="floor" title="Этаж" type="number" value={item.floor} />
        <Field name="totalFloors" title="Всего этажей" type="number" value={item.totalFloors} />
      </FormSection>

      <FormSection title="Расположение">
        <Field name="district" title="Район" value={item.district} />
        <Field name="address" title="Адрес" value={item.address} colSpan={2} />
        <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <Field name="latitude" title="Latitude (Широта)" type="number" value={item.latitude} />
          <Field name="longitude" title="Longitude (Долгота)" type="number" value={item.longitude} />
          <Field name="mapX" title="Карта X (%)" type="number" value={item.mapX} />
          <Field name="mapY" title="Карта Y (%)" type="number" value={item.mapY} />
        </div>
      </FormSection>

      <FormSection title="Медиа и Описание">
        <FileUpload name="mainImageFile" title="Главное фото (Файл)" colSpan={1} />
        <Field name="mainImage" title="Или URL главного фото" value={item.mainImage} colSpan={2} />
        
        <FileUpload name="galleryFiles" title="Галерея (Множественный выбор)" multiple colSpan={1} />
        <TextArea name="gallery" title="Или URL галереи (каждый с новой строки)" value={item.gallery} rows={3} colSpan={2} />
        
        <TextArea name="features" title="Удобства (обязательно через запятую)" value={item.features} rows={2} colSpan="full" />
        <TextArea name="description" title="Детальное описание" value={item.description} rows={5} colSpan="full" />
      </FormSection>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 bg-slate-50 -mx-8 -mb-8 px-8 py-6 rounded-b-2xl">
        <div className="flex items-center gap-6">
          <Select name="status" title="Статус публикации" value={item.status} options={[["draft", "Черновик"], ["published", "Опубликовано"]]} />
          
          <label className="flex items-center gap-3 cursor-pointer group mt-6">
            <input 
              type="checkbox" 
              name="isFeatured" 
              defaultChecked={item.isFeatured} 
              className="w-5 h-5 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-slate-700 group-hover:text-yellow-600 transition">В Избранное (Featured)</span>
          </label>
        </div>

        <button className="px-8 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold rounded-xl transition shadow-sm text-sm w-full sm:w-auto mt-6 sm:mt-0" type="submit">
          Сохранить объявление
        </button>
      </div>
    </div>
  );
}
