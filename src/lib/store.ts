import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminUser, AuthUser, CollectionItem, CollectionName, Employee, Listing, Profile, ServiceItem } from "./types";

type CollectionMap = {
  listings: Listing;
  employees: Employee;
  services: ServiceItem;
};

const DATA_DIR = path.join(process.cwd(), "data");

const files: Record<CollectionName, string> = {
  listings: "listings.json",
  employees: "employees.json",
  services: "services.json",
};

const profileFile = "profile.json";
const usersFile = "users.json";

const defaultProfile: Profile = {
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
};

function filePath(collection: CollectionName) {
  return path.join(DATA_DIR, files[collection]);
}

function profilePath() {
  return path.join(DATA_DIR, profileFile);
}

function usersPath() {
  return path.join(DATA_DIR, usersFile);
}

function now() {
  return new Date().toISOString();
}

function normalizeSlug(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function itemSlug(item: CollectionItem) {
  return "slug" in item ? item.slug : item.id;
}

function publicUser(user: AdminUser): AuthUser {
  const safeUser: Partial<AdminUser> = { ...user };
  delete safeUser.password;
  return safeUser as AuthUser;
}

const defaultUsers: AdminUser[] = [
  {
    id: "seller-1",
    username: "seller",
    password: "barakat123",
    name: "Рамзия",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    instagram: "",
    facebook: "",
    avatar: "",
    bio: "",
    rating: 5,
    dealsCount: 0,
    experienceYears: 1,
    specializations: "",
    role: "seller",
  },
];

function normalizeUser(user: AdminUser): AdminUser {
  return {
    ...defaultUsers[0],
    ...user,
    telegram: user.telegram || "",
    instagram: user.instagram || "",
    facebook: user.facebook || "",
  };
}

export async function readUsers(): Promise<AdminUser[]> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await readFile(usersPath(), "utf8");
    return (JSON.parse(raw) as AdminUser[]).map(normalizeUser);
  } catch {
    await writeFile(usersPath(), `${JSON.stringify(defaultUsers, null, 2)}\n`, "utf8");
    return defaultUsers;
  }
}

export async function authenticateUser(username: string, password: string) {
  const users = await readUsers();
  const user = users.find((item) => item.username === username && item.password === password);
  return user ? publicUser(user) : null;
}

export async function getPublicSeller(id: string) {
  const users = await readUsers();
  const user = users.find((item) => item.id === id);
  return user ? publicUser(user) : null;
}

export async function updateUserProfile(userId: string, data: Partial<AuthUser>) {
  const users = await readUsers();
  let updated: AuthUser | null = null;
  const nextUsers = users.map((user) => {
    if (user.id !== userId) {
      return user;
    }

    const nextUser: AdminUser = {
      ...user,
      name: String(data.name || user.name),
      email: String(data.email || ""),
      phone: String(data.phone || ""),
      whatsapp: String(data.whatsapp || ""),
      telegram: String(data.telegram || ""),
      instagram: String(data.instagram || ""),
      facebook: String(data.facebook || ""),
      avatar: String(data.avatar || ""),
      bio: String(data.bio || ""),
      rating: Number(data.rating || user.rating || 5),
      dealsCount: Number(data.dealsCount || user.dealsCount || 0),
      experienceYears: Number(data.experienceYears || user.experienceYears || 0),
      specializations: String(data.specializations || ""),
    };

    updated = publicUser(nextUser);
    return nextUser;
  });

  if (!updated) {
    return null;
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(usersPath(), `${JSON.stringify(nextUsers, null, 2)}\n`, "utf8");
  return updated;
}

export async function readCollection<TName extends CollectionName>(
  collection: TName,
): Promise<CollectionMap[TName][]> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await readFile(filePath(collection), "utf8");
    return JSON.parse(raw) as CollectionMap[TName][];
  } catch {
    await writeFile(filePath(collection), "[]", "utf8");
    return [];
  }
}

export async function readProfile(): Promise<Profile> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await readFile(profilePath(), "utf8");
    return { ...defaultProfile, ...JSON.parse(raw) } as Profile;
  } catch {
    const profile = { ...defaultProfile };
    await writeFile(profilePath(), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
    return profile;
  }
}

export async function writeProfile(data: Partial<Profile>): Promise<Profile> {
  const current = await readProfile();
  const profile: Profile = {
    ...current,
    ...data,
    socials: {
      ...current.socials,
      ...(data.socials || {}),
    },
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(profilePath(), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  return profile;
}

async function writeCollection<TName extends CollectionName>(
  collection: TName,
  items: CollectionMap[TName][],
) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePath(collection), `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

export async function listItems<TName extends CollectionName>(
  collection: TName,
  publicOnly = false,
) {
  const items = await readCollection(collection);

  if (!publicOnly) {
    return items;
  }

  return items.filter((item) => item.status === "published");
}

export async function createItem<TName extends CollectionName>(
  collection: TName,
  data: Partial<CollectionMap[TName]>,
) {
  const items = await readCollection(collection);
  const date = now();
  const id = `${collection.slice(0, -1)}-${Date.now()}`;
  const title = String("title" in data ? data.title || "" : "fullName" in data ? data.fullName || "" : "");
  const base = {
    ...data,
    id,
    slug: normalizeSlug(String("slug" in data ? data.slug || title : title), id),
    status: data.status || "draft",
    createdAt: date,
    updatedAt: date,
  } as CollectionMap[TName];

  const nextItems = [base, ...items] as CollectionMap[TName][];
  await writeCollection(collection, nextItems);
  return base;
}

export async function updateItem<TName extends CollectionName>(
  collection: TName,
  id: string,
  data: Partial<CollectionMap[TName]>,
) {
  const items = await readCollection(collection);
  let updated: CollectionMap[TName] | null = null;
  const nextItems = items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    updated = {
      ...item,
      ...data,
      slug: normalizeSlug(
        String("slug" in data ? data.slug || itemSlug(item) : itemSlug(item)),
        item.id,
      ),
      updatedAt: now(),
    } as CollectionMap[TName];
    return updated;
  });

  if (!updated) {
    return null;
  }

  await writeCollection(collection, nextItems);
  return updated;
}

export async function deleteItem(collection: CollectionName, id: string) {
  const items = await readCollection(collection);
  const nextItems = items.filter((item) => item.id !== id);
  await writeCollection(collection, nextItems as CollectionItem[]);
  return nextItems.length !== items.length;
}

export async function getPublicPayload(collection: CollectionName) {
  const items = await listItems(collection, true);
  const employees = collection === "listings" ? await readCollection("employees") : [];
  const users = collection === "listings" ? await readUsers() : [];

  if (collection !== "listings") {
    return {
      data: items,
      meta: { pagination: { page: 1, pageSize: items.length, pageCount: 1, total: items.length } },
    };
  }

  const listings = (items as Listing[]).map((listing) => {
    const employee = employees.find((item) => item.id === listing.employeeId);
    const seller = users.find((item) => item.id === listing.sellerId);
    return {
      ...listing,
      mainImage: listing.mainImage ? { url: listing.mainImage } : null,
      gallery: listing.gallery
        ? listing.gallery
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean)
            .map((url) => ({ url }))
        : [],
      employee: employee
        ? {
            ...employee,
            avatar: employee.avatar ? { url: employee.avatar } : null,
          }
        : null,
      seller: {
        id: listing.sellerId,
        name: seller?.name || listing.sellerName,
        phone: seller?.phone || listing.sellerPhone,
        whatsapp: seller?.whatsapp || listing.sellerWhatsapp,
        telegram: seller?.telegram || "",
        instagram: seller?.instagram || "",
        facebook: seller?.facebook || "",
        avatar: (seller?.avatar || listing.sellerAvatar) ? { url: seller?.avatar || listing.sellerAvatar } : null,
        rating: seller?.rating || 5,
        dealsCount: seller?.dealsCount || 0,
        experienceYears: seller?.experienceYears || 0,
        specializations: seller?.specializations || "",
      },
    };
  });

  return {
    data: listings,
    meta: { pagination: { page: 1, pageSize: listings.length, pageCount: 1, total: listings.length } },
  };
}
