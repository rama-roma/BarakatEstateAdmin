export type PublishStatus = "draft" | "published";

export type Employee = {
  id: string;
  fullName: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar: string;
  bio: string;
  rating: number;
  dealsCount: number;
  experienceYears: number;
  specializations: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
};

export type Listing = {
  id: string;
  title: string;
  slug: string;
  dealType: "sale" | "rent";
  propertyType: string;
  price: number;
  currency: "TJS";
  district: string;
  address: string;
  rooms: number;
  area: number;
  floor: number;
  totalFloors: number;
  yearBuilt: number;
  description: string;
  features: string;
  constructionStage: string;
  renovation: string;
  landmark: string;
  latitude: number;
  longitude: number;
  mapX: number;
  mapY: number;
  mainImage: string;
  gallery: string;
  employeeId: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerAvatar: string;
  isFeatured: boolean;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceLabel: string;
  icon: string;
  sortOrder: number;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  name: string;
  description: string;
  phone: string;
  email: string;
  socials: {
    instagram: string;
    telegram: string;
    facebook: string;
    whatsapp: string;
  };
  logoUrl: string;
  avatarUrl: string;
  rating: number;
  dealsCount: number;
  experienceYears: number;
  specializations: string;
  districts: string;
  propertyTypes: string;
  dealTypes: string;
};

export type Application = {
  id: string;
  name: string;
  phone: string;
  service: string;
  message: string;
  status: "new" | "read" | "completed";
  createdAt: string;
  updatedAt: string;
};

export type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  facebook: string;
  avatar: string;
  bio: string;
  rating: number;
  dealsCount: number;
  experienceYears: number;
  specializations: string;
  role: "user" | "seller" | "admin";
};

export type AuthUser = Omit<User, "password">;

export type Review = {
  id: string;
  name: string;
  text: string;
  sellerId: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type CollectionName = "listings" | "employees" | "services" | "applications" | "users" | "reviews";

export type CollectionItem = Listing | Employee | ServiceItem | Application | User | Review;
