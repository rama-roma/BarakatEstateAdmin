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

  return await prisma.serviceItem.findMany({ where, orderBy: { sortOrder: 'asc' } });
}

export async function createItem(collection: CollectionName, data: CollectionInput) {
  const title = String('title' in data ? data.title || '' : 'fullName' in data ? data.fullName || '' : '');
  const idStr = `${collection.slice(0, -1)}-${Date.now()}`;

  if (collection === 'listings') {
    const slug = normalizeSlug(String('slug' in data && data.slug ? data.slug : title), idStr);
    const baseData = {
      ...data,
      slug,
      status: data.status || 'draft',
    } as Prisma.ListingUncheckedCreateInput;
    baseData.currency = 'TJS';
    if (!baseData.id) delete baseData.id;
    return await prisma.listing.create({ data: baseData });
  } else if (collection === 'employees') {
    const baseData = {
      ...data,
      status: data.status || 'draft',
    } as Prisma.EmployeeUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    return await prisma.employee.create({ data: baseData });
  } else if (collection === 'services') {
    const slug = normalizeSlug(String('slug' in data && data.slug ? data.slug : title), idStr);
    const baseData = {
      ...data,
      slug,
      status: data.status || 'draft',
    } as Prisma.ServiceItemUncheckedCreateInput;
    if (!baseData.id) delete baseData.id;
    if (baseData.sortOrder !== undefined) baseData.sortOrder = Number(baseData.sortOrder);
    return await prisma.serviceItem.create({ data: baseData });
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
