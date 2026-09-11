import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Endpoint de sincronización desde Ubuntu Server (Playwright / n8n)
http.route({
    path: "/api/duoc-sync",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const authHeader = request.headers.get("Authorization");
        const secret = process.env.DUOC_SYNC_SECRET;

        // Si se definió DUOC_SYNC_SECRET en variables de Convex, se exige autenticación
        if (secret && authHeader !== `Bearer ${secret}`) {
            return new Response(JSON.stringify({ error: "No autorizado. Token inválido." }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        try {
            const body = await request.json();

            if (!body.teacherEmail || !body.courseCode || !body.courseName) {
                return new Response(
                    JSON.stringify({
                        error: "Faltan campos requeridos: teacherEmail, courseCode, courseName",
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            const result = await ctx.runMutation(api.courses.syncDuocData, {
                teacherEmail: body.teacherEmail,
                courseCode: body.courseCode,
                courseName: body.courseName,
                courseDescription: body.courseDescription,
                section: body.section,
                students: body.students || [],
                evaluaciones: body.evaluaciones || [],
            });

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err?.message || "Error interno de sincronización" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }),
});

export default http;

