/**
 * Práctica 7 - Pipeline con UAT
 * Worker de Cloudflare con BD D1.
 *
 *  GET  /        -> saludo + registros de la tabla users
 *  GET  /health  -> estado del servicio (usado por las pruebas UAT)
 *  POST /user    -> crea un usuario desde un form HTML (name, email)
 */

import { validateUserForm } from "./validators";

export interface Env {
	p6: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/health") {
			return Response.json({ status: "ok" });
		}

		// Endpoint POST para crear un registro a partir de un form de HTML
		if (request.method === "POST" && url.pathname === "/user") {
			try {
				const formData = await request.formData();
				const name = formData.get("name") as string | null;
				const email = formData.get("email") as string | null;

				const errors = validateUserForm(name, email);

				if (errors.length > 0) {
					return Response.json({ errors }, { status: 400 });
				}

				await env.p6.prepare("INSERT INTO users (nombre, email) VALUES (?, ?)").bind(name, email).run();
				return Response.json({ message: "Usuario creado", user: { name, email } }, { status: 201 });
			} catch (error) {
				return Response.json({ errors: ["Formulario inválido"] }, { status: 400 });
			}
		}

		const data = await this.queryDatabase(env.p6);
		return Response.json({ message: "Hello World - Práctica 7 Karen", dbData: data });
	},

	// Lee todos los registros de la tabla users en la BD D1
	async queryDatabase(db: D1Database) {
		const { results } = await db.prepare("SELECT * FROM users").all();
		return results;
	},
} satisfies ExportedHandler<Env>;
