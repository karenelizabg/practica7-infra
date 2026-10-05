import { describe, it, expect, vi, beforeEach } from "vitest";
import worker, { type Env } from "../src/index";

// Mock de la BD D1: solo implementamos lo que usa el worker
function createMockEnv(rows: unknown[] = []) {
	const run = vi.fn().mockResolvedValue({ success: true });
	const bind = vi.fn(() => ({ run }));
	const all = vi.fn().mockResolvedValue({ results: rows });
	const prepare = vi.fn(() => ({ bind, all }));
	const env = { p6: { prepare } } as unknown as Env;
	return { env, prepare, bind, run, all };
}

const ctx = {} as ExecutionContext;
const BASE = "https://practica7.example.com";

function postUser(fields: Record<string, string>) {
	const form = new FormData();
	for (const [k, v] of Object.entries(fields)) form.append(k, v);
	return new Request(`${BASE}/user`, { method: "POST", body: form });
}

describe("Worker - GET /", () => {
	it("regresa el saludo y los registros de la tabla users", async () => {
		const rows = [{ id: 1, nombre: "Karen", email: "karen@iteso.mx" }];
		const { env, prepare } = createMockEnv(rows);

		const res = await worker.fetch(new Request(`${BASE}/`), env, ctx);
		const body = (await res.json()) as { message: string; dbData: unknown[] };

		expect(res.status).toBe(200);
		expect(body.message).toContain("Práctica 7");
		expect(body.dbData).toEqual(rows);
		expect(prepare).toHaveBeenCalledWith("SELECT * FROM users");
	});
});

describe("Worker - GET /health", () => {
	it("responde status ok sin consultar la BD", async () => {
		const { env, prepare } = createMockEnv();

		const res = await worker.fetch(new Request(`${BASE}/health`), env, ctx);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok" });
		expect(prepare).not.toHaveBeenCalled();
	});
});

describe("Worker - POST /user", () => {
	let mock: ReturnType<typeof createMockEnv>;
	beforeEach(() => {
		mock = createMockEnv();
	});

	it("crea el usuario (201) e inserta en la BD con datos válidos", async () => {
		const res = await worker.fetch(postUser({ name: "Karen", email: "karen@iteso.mx" }), mock.env, ctx);

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({
			message: "Usuario creado",
			user: { name: "Karen", email: "karen@iteso.mx" },
		});
		expect(mock.prepare).toHaveBeenCalledWith("INSERT INTO users (nombre, email) VALUES (?, ?)");
		expect(mock.bind).toHaveBeenCalledWith("Karen", "karen@iteso.mx");
		expect(mock.run).toHaveBeenCalledOnce();
	});

	it("regresa 400 con errores de validación y no toca la BD", async () => {
		const res = await worker.fetch(postUser({ name: "", email: "sin-arroba" }), mock.env, ctx);

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			errors: ["El nombre es requerido", "Se requiere un correo electrónico válido"],
		});
		expect(mock.prepare).not.toHaveBeenCalled();
	});

	it("regresa 400 'Formulario inválido' si el body no es un form", async () => {
		const req = new Request(`${BASE}/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Karen" }),
		});

		const res = await worker.fetch(req, mock.env, ctx);

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ errors: ["Formulario inválido"] });
	});

	it("regresa 400 'Formulario inválido' si falla la BD", async () => {
		mock.run.mockRejectedValueOnce(new Error("D1 caída"));

		const res = await worker.fetch(postUser({ name: "Karen", email: "karen@iteso.mx" }), mock.env, ctx);

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ errors: ["Formulario inválido"] });
	});
});
