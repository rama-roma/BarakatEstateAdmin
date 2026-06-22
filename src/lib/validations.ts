import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Логин должен быть от 3 символов").max(50),
  password: z.string().min(6, "Пароль должен быть от 6 символов").max(100),
  name: z.string().min(2, "Имя должно быть от 2 символов").max(100),
  email: z.string().email("Неверный формат email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Имя должно быть от 2 символов").max(100).optional(),
  email: z.string().email("Неверный формат email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  telegram: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  avatar: z.string().url("Неверный URL аватара").optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  specializations: z.string().max(200).optional().or(z.literal("")),
  rating: z.number().min(0).max(5).optional(),
  dealsCount: z.number().min(0).optional(),
  experienceYears: z.number().min(0).optional(),
});

export const listingSchema = z.object({
  title: z.string().min(3, "Заголовок должен быть от 3 символов").max(100),
  dealType: z.enum(["sale", "rent"]),
  propertyType: z.string().min(1, "Укажите тип недвижимости"),
  currency: z.enum(["TJS", "USD"]).optional().default("TJS"),
  price: z.number().min(0, "Цена не может быть отрицательной"),
  district: z.string().min(1, "Укажите район"),
  address: z.string().min(1, "Укажите адрес"),
  rooms: z.number().min(1, "Количество комнат не может быть меньше 1"),
  area: z.number().min(1, "Укажите площадь"),
  floor: z.number().min(1, "Укажите этаж"),
  totalFloors: z.number().min(1, "Укажите всего этажей"),
  yearBuilt: z.number().min(1900, "Укажите год постройки"),
  description: z.string().optional().or(z.literal("")),
  features: z.string().optional().or(z.literal("")),
  latitude: z.number().optional().default(38.5598),
  longitude: z.number().optional().default(68.7870),
  mapX: z.number().optional().default(50),
  mapY: z.number().optional().default(50),
  mainImage: z.string().optional().or(z.literal("")),
  gallery: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});
