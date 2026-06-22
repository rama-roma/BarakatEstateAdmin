"use client";

import {
  Building2,
  CheckCircle2,
  Contact,
  Eye,
  Home,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuthUser, CollectionName, Employee, Listing, Profile, PublishStatus, ServiceItem } from "@/lib/types";

type Tab = CollectionName | "profile";

type FormState = {
  listings: Partial<Listing>;
  employees: Partial<Employee>;
  services: Partial<ServiceItem>;
  profile: Partial<Profile>;
};

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "listings", label: "Объявления", icon: <Building2 size={18} /> },
  { id: "profile", label: "Профиль", icon: <Contact size={18} /> },
];

const emptyForms: FormState = {
  listings: {
    title: "",
    slug: "",
    dealType: "sale",
    propertyType: "Квартира",
    price: 0,
    currency: "TJS",
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
    employeeId: "",
    sellerId: "",
    sellerName: "",
    sellerPhone: "",
    sellerWhatsapp: "",
    sellerAvatar: "",
    isFeatured: false,
    status: "draft",
  },
  employees: {
    fullName: "",
    position: "Специалист по недвижимости",
    phone: "",
    whatsapp: "",
    email: "",
    avatar: "",
    bio: "",
    rating: 5,
    dealsCount: 0,
    experienceYears: 1,
    specializations: "Квартиры, новостройки",
    status: "published",
  },
  services: {
    title: "",
    slug: "",
    description: "",
    priceLabel: "",
    icon: "home",
    sortOrder: 0,
    status: "published",
  },
  profile: {
    name: "Barakat",
    description: "",
    phone: "",
    email: "",
    socials: {
      instagram: "",
      telegram: "",
      facebook: "",
      whatsapp: "",
    },
    logoUrl: "/barakat.PNG",
    avatarUrl: "",
    rating: 5,
    dealsCount: 0,
    experienceYears: 1,
    specializations: "",
  },
};

function cloneForm<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatMoney(value?: number) {
  const amount = Number(value || 0).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  return `${amount} сомони`;
}

function toNumber(value: FormDataEntryValue | null) {
  return Number(value || 0);
}

function toStatus(value: FormDataEntryValue | null): PublishStatus {
  return value === "published" ? "published" : "draft";
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

async function prepareImageFields(data: FormData) {
  const mainImageFile = data.get("mainImageFile");
  if (mainImageFile instanceof File && mainImageFile.size > 0) {
    data.set("mainImage", await readFileAsDataURL(mainImageFile));
  }

  const galleryFiles = data.getAll("galleryFiles").filter((item) => item instanceof File && item.size > 0) as File[];
  const uploadedGalleryUrls: string[] = [];

  for (const file of galleryFiles) {
    uploadedGalleryUrls.push(await readFileAsDataURL(file));
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
    logoUrl: "/barakat.PNG",
    avatarUrl: user.avatar,
    rating: user.rating,
    dealsCount: user.dealsCount,
    experienceYears: user.experienceYears,
    specializations: user.specializations,
  };
}

export default function AdminApp() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(cloneForm(emptyForms));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<Listing | Employee | ServiceItem | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("barakat-admin-auth");
      if (raw) {
        const user = JSON.parse(raw) as AuthUser;
        setCurrentUser(user);
        setForm((prev) => ({ ...prev, profile: userToProfile(user) }));
      }
    } finally {
      setAuthReady(true);
    }
  }, []);

  const currentItems = useMemo(() => {
    if (activeTab === "profile") {
      return [];
    }

    return activeTab === "listings" ? listings : [];
  }, [activeTab, listings]);

  const filteredItems = useMemo(() => {
    return currentItems.filter((item) => {
      const text = JSON.stringify(item).toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentItems, query, statusFilter]);

  const stats = useMemo(() => {
    const all = [...listings];
    return {
      listings: listings.length,
      published: all.filter((item) => item.status === "published").length,
      drafts: all.filter((item) => item.status === "draft").length,
    };
  }, [listings]);

  useEffect(() => {
    if (!currentUser) return;
    void loadAll();
    // loadAll reads currentUser and should only run when that session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadAll() {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [listingRes, employeeRes] = await Promise.all([
        fetch("/api/listings?admin=1"),
        fetch("/api/employees?admin=1"),
      ]);
      const [listingPayload, employeePayload] = await Promise.all([
        listingRes.json(),
        employeeRes.json(),
      ]);
      const allListings = (listingPayload.data || []) as Listing[];

      setListings(allListings.filter((item) => !item.sellerId || item.sellerId === currentUser.id));
      setEmployees(employeePayload.data || []);
      setForm((prev) => ({ ...prev, profile: userToProfile(currentUser) }));
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(user: AuthUser) {
    window.localStorage.setItem("barakat-admin-auth", JSON.stringify(user));
    setCurrentUser(user);
    setForm((prev) => ({ ...prev, profile: userToProfile(user) }));
    setToast("Данные сохранены");
  }

  function handleLogout() {
    window.localStorage.removeItem("barakat-admin-auth");
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

  function startEdit(item: Listing | Employee | ServiceItem) {
    setEditingId(item.id);
    setForm((prev) => ({ ...prev, [activeTab]: cloneForm(item) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(id: string) {
    if (!window.confirm("Удалить запись?")) return;
    await fetch(`/api/${activeTab}/${id}`, { method: "DELETE" });
    await loadAll();
    setToast("Данные сохранены");
  }

  async function togglePublish(item: Listing | Employee | ServiceItem) {
    const status: PublishStatus = item.status === "published" ? "draft" : "published";
    await fetch(`/api/${activeTab}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAll();
    setToast(status === "published" ? "Опубликовано" : "Перенесено в черновик");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;

    const data = new FormData(event.currentTarget);
    if (activeTab === "listings") {
      await prepareImageFields(data);
    }

    const payload = buildPayload(activeTab, data, currentUser);

    if (activeTab === "profile") {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const profilePayload = await response.json();
      if (!response.ok) {
        setToast(profilePayload.error || "Профиль не сохранен");
        return;
      }

      const user = profilePayload.user as AuthUser;
      window.localStorage.setItem("barakat-admin-auth", JSON.stringify(user));
      setCurrentUser(user);
      setForm((prev) => ({ ...prev, profile: userToProfile(user) }));
      setToast("Данные сохранены");
      return;
    }

    const url = editingId ? `/api/${activeTab}/${editingId}` : `/api/${activeTab}`;
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await loadAll();
    startCreate();
    setToast(editingId ? "Измени данные этой записи." : "Заполни поля и выбери статус публикации.");
  }

  if (!authReady) {
    return <main className="admin-shell" />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="admin-shell">
      <div className="admin-frame">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/barakat.PNG" alt="Barakat Estate" />
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
            {loading ? <div className="status-pill">Загружается</div> : null}
          </header>

          {activeTab !== "profile" ? <div className="stats-grid">
            <div className="stat-card">
              <span>Всего записей</span>
              <strong>{stats.listings}</strong>
            </div>
            <div className="stat-card">
              <span>Опубликовано</span>
              <strong>{stats.published}</strong>
            </div>
            <div className="stat-card">
              <span>Черновики</span>
              <strong>{stats.drafts}</strong>
            </div>
          </div> : null}

          <div className={`work-grid${activeTab === "profile" ? " profile-work-grid" : ""}`}>
            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>{activeTab === "profile" ? "Профиль продавца" : editingId ? "Редактирование" : "Объявления"}</h2>
                  {activeTab !== "profile" ? (
                    <p>{editingId ? "Измени данные этой записи." : "Заполни поля и выбери статус публикации."}</p>
                  ) : null}
                </div>
                {activeTab !== "profile" ? <button className="btn ghost" onClick={startCreate} type="button">
                  <Plus size={16} />
                  Выйти
                </button> : null}
              </div>

              <form key={`${activeTab}-${editingId || "new"}-${JSON.stringify(form[activeTab])}`} onSubmit={submitForm}>
                {renderForm(activeTab, form)}
              </form>
            </section>

            {activeTab !== "profile" ? (
              <section className="panel">
                <div className="section-head">
                  <div>
                    <h2>Объявления</h2>
                  </div>
                </div>

                <div className="toolbar">
                  <input
                    aria-label="Поиск"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск"
                    value={query}
                  />
                  <select
                    aria-label="Фильтр"
                    onChange={(event) => setStatusFilter(event.target.value)}
                    value={statusFilter}
                  >
                    <option value="all">Все</option>
                    <option value="published">Опубликовано</option>
                    <option value="draft">Черновики</option>
                  </select>
                </div>

                <div className="list">
                  {filteredItems.length === 0 ? (
                  <div className="empty">
                    <Search size={24} />
                    <p>Пока данных нет</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <article className="item-card" key={item.id}>
                      {renderItemMedia(item)}
                      <div className="item-body">
                        {renderItemBody(item, employees)}
                        <div className="item-actions">
                          <button className="btn ghost" onClick={() => startEdit(item)} type="button">
                            <Pencil size={15} />Редактировать</button>
                          <button className="btn ghost" onClick={() => setPreviewItem(item)} type="button">
                            <Eye size={15} />Просмотреть</button>
                          <button className="btn ghost" onClick={() => togglePublish(item)} type="button">
                            <CheckCircle2 size={15} />
                            {item.status === "published" ? "Опубликовано" : "Черновик"}
                          </button>
                          <button className="btn danger" onClick={() => removeItem(item.id)} type="button">
                            <Trash2 size={15} />Удалить</button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>) : null}
            {activeTab === "profile" ? (
              <section className="panel">
                <div className="section-head">
                  <div>
                    <h2>Предпросмотр профиля</h2>
                    <p>Так ваши контакты будут выглядеть в объявлениях.</p>
                  </div>
                </div>
                <div className="profile-preview-container">
                  <div className="seller-card-preview">
                    <div className="seller-avatar">
                      {form.profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.profile.avatarUrl} alt={form.profile.name} />
                      ) : (
                        <Contact size={40} />
                      )}
                    </div>
                    <div className="seller-info">
                      <h3>{form.profile.name || "Имя не указано"}</h3>
                      <p className="seller-pos">{form.profile.specializations || "Специалист по недвижимости"}</p>
                      <div className="seller-stats">
                        <span><b>{form.profile.experienceYears || 0}</b> лет опыта</span>
                        <span><b>{form.profile.dealsCount || 0}</b> сделок</span>
                      </div>
                      <div className="seller-contacts">
                        {form.profile.phone && <span className="contact-item">{form.profile.phone}</span>}
                        {form.profile.email && <span className="contact-item">{form.profile.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
            
          </div>
        </section>
      </div>
      {previewItem ? <PreviewModal item={previewItem} employees={employees} onClose={() => setPreviewItem(null)} /> : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Войти не удалось");
        return;
      }

      onLogin(payload.user as AuthUser);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="login-mark">
          <KeyRound size={24} />
        </div>
        <div>
          <h1>Вход</h1>
          <p>Введите логин и пароль продавца.</p>
        </div>
        <label className="field">
          <span>Логин</span>
          <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <div className="login-error">{error}</div> : null}
        <button className="btn primary login-submit" disabled={loading} type="submit">
          {loading ? "Проверяем" : "Войти"}
        </button>
      </form>
    </main>
  );
}

function buildPayload(tab: Tab, data: FormData, user: AuthUser) {
  if (tab === "profile") {
    return {
      userId: user.id,
      name: String(data.get("name") || ""),
      bio: String(data.get("description") || ""),
      phone: String(data.get("phone") || ""),
      email: String(data.get("email") || ""),
      whatsapp: String(data.get("whatsapp") || ""),
      telegram: String(data.get("telegram") || ""),
      instagram: String(data.get("instagram") || ""),
      facebook: String(data.get("facebook") || ""),
      avatar: String(data.get("avatarUrl") || ""),
      rating: toNumber(data.get("rating")),
      dealsCount: toNumber(data.get("dealsCount")),
      experienceYears: toNumber(data.get("experienceYears")),
      specializations: String(data.get("specializations") || ""),
    };
  }

  if (tab === "listings") {
    return {
      title: String(data.get("title") || ""),
      dealType: data.get("dealType") === "rent" ? "rent" : "sale",
      propertyType: String(data.get("propertyType") || "Квартира"),
      price: toNumber(data.get("price")),
      currency: "TJS",
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
      employeeId: "",
      sellerId: user.id,
      sellerName: user.name,
      sellerPhone: user.phone,
      sellerWhatsapp: user.whatsapp,
      sellerAvatar: user.avatar,
      isFeatured: data.get("isFeatured") === "on",
      status: toStatus(data.get("status")),
    };
  }

  if (tab === "employees") {
    return {
      fullName: String(data.get("fullName") || ""),
      position: String(data.get("position") || ""),
      phone: String(data.get("phone") || ""),
      whatsapp: String(data.get("whatsapp") || ""),
      email: String(data.get("email") || ""),
      avatar: String(data.get("avatar") || ""),
      bio: String(data.get("bio") || ""),
      rating: toNumber(data.get("rating")),
      dealsCount: toNumber(data.get("dealsCount")),
      experienceYears: toNumber(data.get("experienceYears")),
      specializations: String(data.get("specializations") || ""),
      status: toStatus(data.get("status")),
    };
  }

  return {
    title: String(data.get("title") || ""),
    description: String(data.get("description") || ""),
    priceLabel: String(data.get("priceLabel") || ""),
    icon: String(data.get("icon") || "home"),
    sortOrder: toNumber(data.get("sortOrder")),
    status: toStatus(data.get("status")),
  };
}

function renderForm(tab: Tab, form: FormState) {
  const values = form[tab];

  if (tab === "profile") {
    const item = values as Partial<Profile>;
    return (
      <>
        <div className="form-grid">
          <div className="profile-form-title">Основное</div>
          <Field name="name" title="Имя и фамилия" value={item.name} />
          <Field className="full" name="avatarUrl" title="Фото / аватар URL" value={item.avatarUrl} />
          <TextArea name="description" title="Описание" value={item.description} />

          <div className="profile-form-title">Контакты</div>
          <Field name="phone" title="Телефон" value={item.phone} />
          <Field name="email" title="Email" value={item.email} />

          <div className="profile-form-title">Соцсети</div>
          <Field name="whatsapp" title="WhatsApp" value={item.socials?.whatsapp} />
          <Field name="telegram" title="Telegram" value={item.socials?.telegram} />
          <Field name="instagram" title="Instagram" value={item.socials?.instagram} />
          <Field name="facebook" title="Facebook" value={item.socials?.facebook} />

          <div className="profile-form-title">Показатели</div>
          <Field name="rating" title="Рейтинг" type="number" value={item.rating} />
          <Field name="dealsCount" title="Сделок" type="number" value={item.dealsCount} />
          <Field name="experienceYears" title="Стаж, лет" type="number" value={item.experienceYears} />
          <Field name="specializations" title="Специализация" value={item.specializations} />
          <Field name="logoUrl" title="Логотип URL" value={item.logoUrl} />
        </div>
        <SubmitActions />
      </>
    );
  }

  if (tab === "listings") {
    const item = values as Partial<Listing>;
    return (
      <>
        <div className="form-grid">
          <Field name="title" title="Название" value={item.title} />
          <Select name="dealType" title="Тип сделки" value={item.dealType} options={[["sale", "Продажа"], ["rent", "Аренда"]]} />
          <Field name="propertyType" title="Тип недвижимости" value={item.propertyType} />
          <Field name="price" title="Цена" type="number" value={item.price} />
          <Field name="district" title="Район" value={item.district} />
          <Field name="address" title="Адрес" value={item.address} />
          <Field name="rooms" title="Комнаты" type="number" value={item.rooms} />
          <Field name="area" title="Площадь" type="number" value={item.area} />
          <Field name="floor" title="Этаж" type="number" value={item.floor} />
          <Field name="totalFloors" title="Всего этажей" type="number" value={item.totalFloors} />
          <Field name="yearBuilt" title="Год постройки" type="number" value={item.yearBuilt} />
          <Field name="latitude" title="Latitude" type="number" value={item.latitude} />
          <Field name="longitude" title="Longitude" type="number" value={item.longitude} />
          <Field name="mapX" title="Позиция на карте X (%)" type="number" value={item.mapX} />
          <Field name="mapY" title="Позиция на карте Y (%)" type="number" value={item.mapY} />
          <Field className="full" name="mainImage" title="Главное фото URL" value={item.mainImage} />
          <label className="field full">
            <span>Главное фото: загрузить файл</span>
            <input name="mainImageFile" type="file" accept="image/*" />
          </label>
          <TextArea name="gallery" title="Галерея URL, каждый с новой строки" value={item.gallery} />
          <label className="field full">
            <span>Галерея: загрузить файлы</span>
            <input name="galleryFiles" type="file" accept="image/*" multiple />
          </label>
          <TextArea name="features" title="Удобства через запятую" value={item.features} />
          <TextArea name="description" title="Описание" value={item.description} />
          <Select name="status" title="Статус" value={item.status} options={[["draft", "Черновик"], ["published", "Опубликовано"]]} />
          <label className="field">
            <span>Выделить</span>
            <input defaultChecked={item.isFeatured} name="isFeatured" type="checkbox" />
          </label>
        </div>
        <SubmitActions />
      </>
    );
  }

  if (tab === "employees") {
    const item = values as Partial<Employee>;
    return (
      <>
        <div className="form-grid">
          <Field name="fullName" title="Имя сотрудника" value={item.fullName} />
          <Field name="position" title="Должность" value={item.position} />
          <Field name="phone" title="Телефон" value={item.phone} />
          <Field name="whatsapp" title="WhatsApp" value={item.whatsapp} />
          <Field name="email" title="Email" value={item.email} />
          <Field name="avatar" title="Аватар URL" value={item.avatar} />
          <Field name="rating" title="Рейтинг" type="number" value={item.rating} />
          <Field name="dealsCount" title="Сделок" type="number" value={item.dealsCount} />
          <Field name="experienceYears" title="Стаж, лет" type="number" value={item.experienceYears} />
          <Field name="specializations" title="Специализация" value={item.specializations} />
          <TextArea name="bio" title="Описание профиля" value={item.bio} />
          <Select name="status" title="Статус" value={item.status} options={[["draft", "Черновик"], ["published", "Опубликовано"]]} />
        </div>
        <SubmitActions />
      </>
    );
  }

  const item = values as Partial<ServiceItem>;
  return (
    <>
      <div className="form-grid">
        <Field name="title" title="Название" value={item.title} />
        <Field name="priceLabel" title="Цена" value={item.priceLabel} />
        <Field name="icon" title="Иконка" value={item.icon} />
        <Field name="sortOrder" title="Порядок" type="number" value={item.sortOrder} />
        <Select name="status" title="Статус" value={item.status} options={[["draft", "Черновик"], ["published", "Опубликовано"]]} />
        <TextArea name="description" title="Описание" value={item.description} />
      </div>
      <SubmitActions />
    </>
  );
}

function SubmitActions() {
  return (
    <div className="actions">
      <button className="btn primary" type="submit">
        <Save size={16} />Сохранить</button>
    </div>
  );
}

function Field({
  className,
  name,
  title,
  type = "text",
  value,
}: {
  className?: string;
  name: string;
  title: string;
  type?: string;
  value?: string | number;
}) {
  return (
    <label className={`field ${className || ""}`}>
      <span>{title}</span>
      <input defaultValue={value ?? ""} name={name} type={type} />
    </label>
  );
}

function TextArea({ name, title, value }: { name: string; title: string; value?: string }) {
  return (
    <label className="field full">
      <span>{title}</span>
      <textarea defaultValue={value || ""} name={name} />
    </label>
  );
}

function Select({
  name,
  options,
  title,
  value,
}: {
  name: string;
  options: Array<[string, string]>;
  title: string;
  value?: string;
}) {
  return (
    <label className="field">
      <span>{title}</span>
      <select defaultValue={value || ""} name={name}>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PreviewModal({
  employees,
  item,
  onClose,
}: {
  employees: Employee[];
  item: Listing | Employee | ServiceItem;
  onClose: () => void;
}) {
  return (
    <div className="preview-backdrop" onClick={onClose} role="presentation">
      <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="preview-head">
          <h2>Просмотр карточки</h2>
          <button className="btn ghost preview-close" onClick={onClose} type="button">
            <X size={16} />Удалить</button>
        </div>
        <article className="item-card preview-card">
          {renderItemMedia(item)}
          <div className="item-body">
            {renderItemBody(item, employees)}
          </div>
        </article>
      </div>
    </div>
  );
}

function renderItemMedia(item: Listing | Employee | ServiceItem) {
  const image =
    "mainImage" in item
      ? item.mainImage
      : "avatar" in item
        ? item.avatar
        : "";

  return (
    <div className="item-media">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={"title" in item ? item.title : "fullName" in item ? item.fullName : "Изображение"} src={image} />
      ) : (
        <Home size={34} />
      )}
    </div>
  );
}

function renderItemBody(item: Listing | Employee | ServiceItem, employees: Employee[]) {
  const title = "title" in item ? item.title : item.fullName;
  const subtitle =
    "address" in item
      ? item.address
      : "position" in item
        ? item.position
        : item.description;
  const employee = "employeeId" in item ? employees.find((person) => person.id === item.employeeId) : null;
  const sellerName = "sellerName" in item ? item.sellerName : "";

  return (
    <>
      <div className="item-kicker">
        <span className={`badge ${item.status === "published" ? "live" : "draft"}`}>
          {item.status === "published" ? "Опубликовано" : "Черновик"}
        </span>
        {"dealType" in item ? <span className="badge">{item.dealType === "rent" ? "Аренда" : "Продажа"}</span> : null}
      </div>
      <h3>{title || "Без названия"}</h3>
      <p>{subtitle || "Описание не заполнено"}</p>
      <div className="item-meta">
        {"price" in item ? <span>{formatMoney(item.price)}</span> : null}
        {"rooms" in item ? <span>{item.rooms} комн.</span> : null}
        {"area" in item ? <span>{item.area} м²</span> : null}
        {sellerName ? <span>{sellerName}</span> : employee ? <span>{employee.fullName}</span> : null}
        {"phone" in item && item.phone ? <span>{item.phone}</span> : null}
        {"priceLabel" in item ? <span>{item.priceLabel}</span> : null}
      </div>
    </>
  );
}

