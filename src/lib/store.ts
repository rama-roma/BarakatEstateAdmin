import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import type {
  User,
  AuthUser,
  CollectionName,
  Employee,
  Listing,
  Profile,
  ServiceItem,
} from './types';

type StoredListing = Omit<Listing, 'createdAt' | 'updatedAt'> & { createdAt: Date | string; updatedAt: Date | string };
type CollectionInput = Partial<Listing> | Partial<Employee> | Partial<ServiceItem>;

function publicUser(user: User): AuthUser {
  const safeUser: Partial<User> = { ...user };
  delete safeUser.password;
  return safeUser as AuthUser;
}

function normalizeSlug(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

export async function readUsers(): Promise<User[]> {
  const users = await prisma.user.findMany();
  return users as User[];
}

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return publicUser(user as User);
}

export async function getPublicSeller(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user ? publicUser(user as User) : null;
}

export async function updateUserProfile(userId: string, data: Partial<AuthUser>) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? String(data.name) : undefined,
        email: data.email !== undefined ? String(data.email) : undefined,
        phone: data.phone !== undefined ? String(data.phone) : undefined,
        whatsapp: data.whatsapp !== undefined ? String(data.whatsapp) : undefined,
        telegram: data.telegram !== undefined ? String(data.telegram) : undefined,
        instagram: data.instagram !== undefined ? String(data.instagram) : undefined,
        facebook: data.facebook !== undefined ? String(data.facebook) : undefined,
        avatar: data.avatar !== undefined ? String(data.avatar) : undefined,
        bio: data.bio !== undefined ? String(data.bio) : undefined,
        rating: data.rating !== undefined ? Number(data.rating) : undefined,
        dealsCount: data.dealsCount !== undefined ? Number(data.dealsCount) : undefined,
        experienceYears: data.experienceYears !== undefined ? Number(data.experienceYears) : undefined,
        specializations: data.specializations !== undefined ? String(data.specializations) : undefined,
      },
    });
    return publicUser(updated as User);
  } catch {
    return null;
  }
}

export async function readCollection(collection: CollectionName): Promise<unknown[]> {
  if (collection === 'listings') return await prisma.listing.findMany({ orderBy: { createdAt: 'desc' } });
  if (collection === 'employees') return await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
  if (collection === 'services') return await prisma.serviceItem.findMany({ orderBy: { sortOrder: 'asc' } });
  if (collection === 'reviews') return await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  return [];
}

export async function readProfile(): Promise<Profile> {
  let profile = await prisma.profile.findUnique({
    where: { id: 'default' },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: 'default',
        name: 'Barakat',
        description: '',
        phone: '',
        email: '',
        instagram: '',
        telegram: '',
        facebook: '',
        whatsapp: '',
        logoUrl: '/barakat.PNG',
        avatarUrl: '',
        rating: 5,
        dealsCount: 0,
        experienceYears: 1,
        specializations: '',
        districts: "Центр, Исмоили Сомони, Сино, Фирдавси, Шохмансур",
        propertyTypes: "Квартира, Вторичка, Новостройки, Котлован, Дома, Дом, Земельные участки, Коммерческая, Дача, Парковка, Комната",
        dealTypes: "sale:Продажа, rent:Аренда",
      },
    });
  }

  return {
    name: profile.name,
    description: profile.description,
    phone: profile.phone,
    email: profile.email,
    socials: {
      instagram: profile.instagram,
      telegram: profile.telegram,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
    },
    logoUrl: profile.logoUrl,
    avatarUrl: profile.avatarUrl,
    rating: profile.rating,
    dealsCount: profile.dealsCount,
    experienceYears: profile.experienceYears,
    specializations: profile.specializations,
    districts: profile.districts,
    propertyTypes: profile.propertyTypes,
    dealTypes: profile.dealTypes,
  };
}

export async function writeProfile(data: Partial<Profile>): Promise<Profile> {
  const current = await readProfile();
  
  const updated = await prisma.profile.update({
    where: { id: 'default' },
    data: {
      name: data.name ?? current.name,
      description: data.description ?? current.description,
      phone: data.phone ?? current.phone,
      email: data.email ?? current.email,
      instagram: data.socials?.instagram ?? current.socials.instagram,
      telegram: data.socials?.telegram ?? current.socials.telegram,
      facebook: data.socials?.facebook ?? current.socials.facebook,
      whatsapp: data.socials?.whatsapp ?? current.socials.whatsapp,
      logoUrl: data.logoUrl ?? current.logoUrl,
      avatarUrl: data.avatarUrl ?? current.avatarUrl,
      rating: data.rating ?? current.rating,
      dealsCount: data.dealsCount ?? current.dealsCount,
      experienceYears: data.experienceYears ?? current.experienceYears,
      specializations: data.specializations ?? current.specializations,
      districts: data.districts ?? current.districts,
      propertyTypes: data.propertyTypes ?? current.propertyTypes,
      dealTypes: data.dealTypes ?? current.dealTypes,
    },
  });

  return {
    name: updated.name,
    description: updated.description,
    phone: updated.phone,
    email: updated.email,
    socials: {
      instagram: updated.instagram,
      telegram: updated.telegram,
      facebook: updated.facebook,
      whatsapp: updated.whatsapp,
    },
    logoUrl: updated.logoUrl,
    avatarUrl: updated.avatarUrl,
    rating: updated.rating,
    dealsCount: updated.dealsCount,
    experienceYears: updated.experienceYears,
    specializations: updated.specializations,
    districts: updated.districts,
    propertyTypes: updated.propertyTypes,
    dealTypes: updated.dealTypes,
  };
}

export async function listItems(collection: CollectionName, publicOnly = false) {
  const where = publicOnly ? { status: 'published' } : {};
  
  if (collection === 'listings') {
    return await prisma.listing.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  if (collection === 'employees') {
    return await prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  if (collection === 'applications') {
    return await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
  }

  if (collection === 'reviews') {
    const reviewWhere = publicOnly ? { status: 'approved' } : {};
    return await prisma.review.findMany({ where: reviewWhere, orderBy: { createdAt: 'desc' } });
  }

  if (collection === 'users') {
    const users = await prisma.user.findMany({ orderBy: { username: 'asc' } });
    return users.map((u) => publicUser(u as any));
  }

  return await prisma.serviceItem.findMany({ where, orderBy: { sortOrder: 'asc' } });
}

export async function createItem(collection: CollectionName, data: CollectionInput) {
  const title = String('title' in data ? data.title || '' : 'fullName' in data ? data.fullName || '' : '');
  const idStr = `${collection.slice(0, -1)}-${Date.now()}`;

  if (collection === 'listings') {
    const anyData = data as any;
    const slug = normalizeSlug(String('slug' in anyData && anyData.slug ? anyData.slug : title), idStr);
    const baseData = {
      ...anyData,
      slug,
      status: anyData.status || 'draft',
      currency: ('currency' in anyData && anyData.currency) ? anyData.currency : 'TJS',
    } as Prisma.ListingUncheckedCreateInput;
    
    if (baseData.sellerId) {
      const user = await prisma.user.findUnique({ where: { id: baseData.sellerId } });
      if (user) {
        baseData.sellerName = user.name || "Unknown";
        baseData.sellerPhone = user.phone || "";
        baseData.sellerWhatsapp = user.whatsapp || "";
        baseData.sellerAvatar = user.avatar || "";
        baseData.employeeId = user.id;
      }
    } else {
      baseData.sellerId = "system";
      baseData.sellerName = "Admin";
      baseData.sellerPhone = "";
      baseData.sellerWhatsapp = "";
      baseData.sellerAvatar = "";
      baseData.employeeId = "system";
    }

    if (!baseData.id) delete baseData.id;
    return await prisma.listing.create({ data: baseData });
  } else if (collection === 'employees') {
    const anyData = data as any;
    const baseData = {
      ...anyData,
      status: anyData.status || 'draft',
    } as Prisma.EmployeeUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    return await prisma.employee.create({ data: baseData });
  } else if (collection === 'services') {
    const anyData = data as any;
    const slug = normalizeSlug(String('slug' in anyData && anyData.slug ? anyData.slug : title), idStr);
    const baseData = {
      ...anyData,
      slug,
      status: anyData.status || 'draft',
    } as Prisma.ServiceItemUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    if (baseData.sortOrder !== undefined) baseData.sortOrder = Number(baseData.sortOrder);
    return await prisma.serviceItem.create({ data: baseData });
  } else if (collection === 'applications') {
    const anyData = data as any;
    const baseData = { ...anyData, status: anyData.status || 'new' } as Prisma.ApplicationUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    return await prisma.application.create({ data: baseData });

  } else if (collection === 'reviews') {
    const anyData = data as any;
    const baseData = { ...anyData, status: anyData.status || 'pending' } as Prisma.ReviewUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    return await prisma.review.create({ data: baseData });

  } else if (collection === 'users') {
    const userData = data as any;
    const baseData = {
      ...userData,
      role: userData.role || "seller",
      email: userData.email || "",
      phone: userData.phone || "",
      whatsapp: userData.whatsapp || "",
      telegram: userData.telegram || "",
      instagram: userData.instagram || "",
      facebook: userData.facebook || "",
      avatar: userData.avatar || "",
      bio: userData.bio || "",
      specializations: userData.specializations || "",
      rating: userData.rating || 5,
      dealsCount: userData.dealsCount || 0,
      experienceYears: userData.experienceYears || 0
    } as Prisma.UserUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    if (baseData.password) {
      baseData.password = await bcrypt.hash(baseData.password, 10);
    } else {
      baseData.password = await bcrypt.hash("barakat123", 10); // default password
    }
    return await prisma.user.create({ data: baseData });
  }
}

export async function updateItem(collection: CollectionName, id: string, data: CollectionInput) {
  try {
    const slug = 'slug' in data ? normalizeSlug(String(data.slug || ''), id) : undefined;
    const updateData: Record<string, unknown> = { ...data };
    if (slug) updateData.slug = slug;

    if (collection === 'listings') {
      return await prisma.listing.update({ where: { id }, data: updateData as Prisma.ListingUncheckedUpdateInput });
    } else if (collection === 'employees') {
      return await prisma.employee.update({ where: { id }, data: updateData as Prisma.EmployeeUncheckedUpdateInput });
    } else if (collection === 'services') {
      if (updateData.sortOrder !== undefined) updateData.sortOrder = Number(updateData.sortOrder);
      return await prisma.serviceItem.update({ where: { id }, data: updateData as Prisma.ServiceItemUncheckedUpdateInput });
    } else if (collection === 'applications') {
      return await prisma.application.update({ where: { id }, data: updateData as Prisma.ApplicationUncheckedUpdateInput });
    } else if (collection === 'reviews') {
      return await prisma.review.update({ where: { id }, data: updateData as Prisma.ReviewUncheckedUpdateInput });
    } else if (collection === 'users') {
      const updateUserData = { ...updateData } as Record<string, any>;
      if (updateUserData.password && typeof updateUserData.password === "string") {
        updateUserData.password = await bcrypt.hash(updateUserData.password, 10);
      } else {
        delete updateUserData.password;
      }
      return await prisma.user.update({ where: { id }, data: updateUserData as Prisma.UserUncheckedUpdateInput });
    }
  } catch {
    return null;
  }
}

export async function deleteItem(collection: CollectionName, id: string) {
  try {
    if (collection === 'listings') {
      await prisma.listing.delete({ where: { id } });
    } else if (collection === 'employees') {
      await prisma.employee.delete({ where: { id } });
    } else if (collection === 'services') {
      await prisma.serviceItem.delete({ where: { id } });
    } else if (collection === 'applications') {
      await prisma.application.delete({ where: { id } });
    } else if (collection === 'reviews') {
      await prisma.review.delete({ where: { id } });
    } else if (collection === 'users') {
      await prisma.user.delete({ where: { id } });
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPublicPayload(collection: CollectionName) {
  const items = await listItems(collection, true);

  if (collection !== 'listings') {
    return {
      data: items,
      meta: { pagination: { page: 1, pageSize: items.length, pageCount: 1, total: items.length } },
    };
  }

  const employees = await prisma.employee.findMany();
  const users = await prisma.user.findMany();

  const listings = (items as StoredListing[]).map((listing) => {
    const employee = employees.find((item) => item.id === listing.employeeId);
    const seller = users.find((item) => item.id === listing.sellerId);
    return {
      ...listing,
      mainImage: listing.mainImage ? { url: listing.mainImage } : null,
      gallery: listing.gallery
        ? listing.gallery
            .split('\n')
            .map((url: string) => url.trim())
            .filter(Boolean)
            .map((url: string) => ({ url }))
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
        telegram: seller?.telegram || '',
        instagram: seller?.instagram || '',
        facebook: seller?.facebook || '',
        avatar: (seller?.avatar || listing.sellerAvatar) ? { url: seller?.avatar || listing.sellerAvatar } : null,
        rating: seller?.rating || 5,
        dealsCount: seller?.dealsCount || 0,
        experienceYears: seller?.experienceYears || 0,
        specializations: seller?.specializations || '',
      },
    };
  });

  return {
    data: listings,
    meta: { pagination: { page: 1, pageSize: listings.length, pageCount: 1, total: listings.length } },
  };
}
