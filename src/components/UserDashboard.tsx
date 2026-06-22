"use client";

import {
  Building2,
  CheckCircle2,
  Contact,
  Eye,
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
      facebook: "",
      whatsapp: "",
    },
    avatarUrl: "",
    specializations: "",
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
      facebook: user.facebook,
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
  const [statusFilter, setStatusFilter] = useState("all");
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

  if (!authReady) return <main className="admin-shell" />;
  if (!currentUser) return <AuthScreen onAuth={(user) => setCurrentUser(user)} />;

  return (
    <main className="admin-shell">
      <div className="admin-frame">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/barakat.PNG" alt="Barakat" />
            </div>
          </div>
          <nav className="nav-list">
            {tabs.map((tab) => (
              <button
                className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                type="button"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <button className="btn danger sidebar-logout" onClick={handleLogout} type="button">
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        </aside>

        <section className="content">
          <header className="topbar">
            <div className="panel-title">
              <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            </div>
            {loading ? <div className="status-pill">Загрузка...</div> : null}
          </header>

          <div className={`work-grid${activeTab === "profile" ? " profile-work-grid" : ""}`}>
            <section className="panel">
              <div className="section-head">
                <h2>{activeTab === "profile" ? "Мой профиль" : editingId ? "Редактирование" : "Новое объявление"}</h2>
                {activeTab !== "profile" ? (
                  <button className="btn ghost" onClick={startCreate} type="button">
                    <Plus size={16} />
                    Сбросить
                  </button>
                ) : null}
              </div>
              <form key={`${activeTab}-${editingId || "new"}`} onSubmit={submitForm}>
                {renderForm(activeTab, form)}
              </form>
            </section>

            {activeTab === "listings" ? (
              <section className="panel">
                <div className="section-head">
                  <h2>Мои объявления</h2>
                </div>
                <div className="toolbar">
                  <input
                    aria-label="Поиск"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск..."
                    value={query}
                  />
                </div>
                <div className="list">
                  {filteredItems.length === 0 ? (
                    <div className="empty">
                      <Search size={24} />
                      <p>У вас пока нет объявлений</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <article className="item-card" key={item.id}>
                        {item.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="item-img" src={item.mainImage} alt={item.title} />
                        ) : (
                          <div className="item-img-placeholder" />
                        )}
                        <div className="item-body">
                          <h3>{item.title}</h3>
                          <div className="item-meta">
                            {item.price} TJS • {item.propertyType}
                          </div>
                          <div className="item-actions">
                            <button className="btn ghost" onClick={() => startEdit(item)} type="button">
                              <Pencil size={15} />Редактировать
                            </button>
                            <button className="btn ghost" onClick={() => togglePublish(item)} type="button">
                              <CheckCircle2 size={15} />
                              {item.status === "published" ? "Опубликовано" : "Скрыто"}
                            </button>
                            <button className="btn danger" onClick={() => removeItem(item.id)} type="button">
                              <Trash2 size={15} />Удалить
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}

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
    <main className="admin-login-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="login-mark">
          {isLogin ? <KeyRound size={24} /> : <UserPlus size={24} />}
        </div>
        <div>
          <h1>{isLogin ? "Вход" : "Регистрация"}</h1>
          <p>{isLogin ? "С возвращением!" : "Создайте аккаунт продавца"}</p>
        </div>
        <label className="field">
          <span>Логин</span>
          <input required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        {!isLogin && (
          <label className="field">
            <span>Имя</span>
            <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Пароль</span>
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <div className="login-error">{error}</div> : null}
        <button className="btn primary login-submit" disabled={loading} type="submit">
          {loading ? "Загрузка..." : (isLogin ? "Войти" : "Зарегистрироваться")}
        </button>
        <button type="button" className="btn ghost" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </main>
  );
}

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
      facebook: String(data.get("facebook") || ""),
      avatar: String(data.get("avatar") || ""),
      specializations: String(data.get("specializations") || ""),
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

function Field({ name, title, value, type = "text", className = "" }: any) {
  return (
    <label className={`field ${className}`}>
      <span>{title}</span>
      <input defaultValue={value ?? ""} name={name} type={type} step={type === "number" ? "any" : undefined} />
    </label>
  );
}

function TextArea({ name, title, value }: any) {
  return (
    <label className="field full">
      <span>{title}</span>
      <textarea defaultValue={value ?? ""} name={name} rows={3} />
    </label>
  );
}

function Select({ name, title, value, options }: any) {
  return (
    <label className="field">
      <span>{title}</span>
      <select defaultValue={value} name={name}>
        {options.map(([val, label]: any) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function renderForm(tab: Tab, form: FormState) {
  const values = form[tab];

  if (tab === "profile") {
    const item = values as Partial<Profile>;
    return (
      <div className="form-grid">
        <Field name="name" title="Имя" value={item.name} />
        <label className="field full">
          <span>Загрузить новое фото / аватар</span>
          <input name="avatarFile" type="file" accept="image/*" />
        </label>
        <Field className="full" name="avatar" title="Или укажите URL аватара" value={item.avatarUrl} />
        <TextArea name="description" title="О себе" value={item.description} />
        <Field name="phone" title="Телефон" value={item.phone} />
        <Field name="email" title="Email" value={item.email} />
        <Field name="whatsapp" title="WhatsApp" value={item.socials?.whatsapp} />
        <Field name="telegram" title="Telegram" value={item.socials?.telegram} />
        <Field name="specializations" title="Специализация" value={item.specializations} />
        <div className="full submit-bar">
          <button className="btn primary" type="submit">Сохранить</button>
        </div>
      </div>
    );
  }

  const item = values as Partial<Listing>;
  return (
    <div className="form-grid">
      <Field name="title" title="Название" value={item.title} />
      <Select name="dealType" title="Тип сделки" value={item.dealType} options={[["sale", "Продажа"], ["rent", "Аренда"]]} />
      <Field name="propertyType" title="Тип недвижимости" value={item.propertyType} />
      <Field name="price" title="Цена (TJS)" type="number" value={item.price} />
      <Field name="district" title="Район" value={item.district} />
      <Field name="address" title="Адрес" value={item.address} />
      <Field name="rooms" title="Комнаты" type="number" value={item.rooms} />
      <Field name="area" title="Площадь" type="number" value={item.area} />
      <Field name="floor" title="Этаж" type="number" value={item.floor} />
      <Field name="totalFloors" title="Всего этажей" type="number" value={item.totalFloors} />
      <Field name="yearBuilt" title="Год постройки" type="number" value={item.yearBuilt} />
      <label className="field full">
        <span>Главное фото: загрузить файл</span>
        <input name="mainImageFile" type="file" accept="image/*" />
      </label>
      <Field className="full" name="mainImage" title="Или URL главного фото" value={item.mainImage} />
      <label className="field full">
        <span>Галерея: загрузить файлы</span>
        <input name="galleryFiles" type="file" accept="image/*" multiple />
      </label>
      <TextArea name="gallery" title="Или URL галереи (каждый с новой строки)" value={item.gallery} />
      <TextArea name="description" title="Описание" value={item.description} />
      <Select name="status" title="Статус" value={item.status} options={[["draft", "Черновик"], ["published", "Опубликовано"]]} />
      <div className="full submit-bar">
        <button className="btn primary" type="submit">Сохранить</button>
      </div>
    </div>
  );
}
