import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  path: string;
  category?: string;
}

export const syncCourseDriveFolder = action({
  args: {
    courseId: v.id("courses"),
    folderId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const items: DriveFileItem[] = [];

    // Helper to recursively scan folders
    async function scanFolder(currentFolderId: string, currentPath: string) {
      const query = encodeURIComponent(`'${currentFolderId}' in parents and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)&pageSize=1000`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${args.accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Error en Google Drive API: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const files = data.files || [];

      for (const file of files) {
        const filePath = `${currentPath}/${file.name}`;
        if (file.mimeType === "application/vnd.google-apps.folder") {
          await scanFolder(file.id, filePath);
        } else {
          let category = "other";
          const lower = file.name.toLowerCase();
          if (lower.includes("syllabus") || lower.includes("pda") || lower.includes("programa")) {
            category = "syllabus";
          } else if (file.mimeType.includes("presentation") || lower.includes("clase") || lower.includes("ppt")) {
            category = "slides";
          } else if (lower.includes("guia") || lower.includes("ejercicio") || lower.includes("taller") || lower.includes("practico")) {
            category = "guide";
          } else if (lower.includes("evaluacion") || lower.includes("prueba") || lower.includes("pauta") || lower.includes("rubrica") || lower.includes("examen")) {
            category = "assessment";
          }

          items.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            path: filePath,
            category,
          });
        }
      }
    }

    await scanFolder(args.folderId, "");

    // Persist manifest to Convex course table
    await ctx.runMutation(api.drive_sync.saveDriveManifest, {
      courseId: args.courseId,
      folderId: args.folderId,
      manifest: items,
    });

    return items;
  },
});

export const saveDriveManifest = mutation({
  args: {
    courseId: v.id("courses"),
    folderId: v.string(),
    folderName: v.optional(v.string()),
    manifest: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        mimeType: v.string(),
        path: v.string(),
        category: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.courseId, {
      drive_folder_id: args.folderId,
      ...(args.folderName ? { drive_folder_name: args.folderName } : {}),
      drive_files_manifest: args.manifest,
      last_drive_sync: Date.now(),
    });
  },
});
