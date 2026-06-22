import { jsonResponse } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonResponse({ error: "Файл не найден" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_URL) {
      const base64Data = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64Data}`;
      
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: "barakat",
      });
      
      return jsonResponse({ url: uploadResponse.secure_url });
    }

    // Fallback: Local upload
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return jsonResponse({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error", error);
    return jsonResponse({ error: "Ошибка загрузки файла" }, 500);
  }
}
