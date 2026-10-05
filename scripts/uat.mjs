// Pruebas UAT (User Acceptance Testing) contra el ambiente de producción.
// Uso: node scripts/uat.mjs https://practica7-prod.<subdominio>.workers.dev
// Genera uat-report.md y termina con código 1 si algún caso falla.
import { writeFileSync } from "node:fs";

const BASE_URL = (process.argv[2] || process.env.UAT_URL || "").replace(/\/$/, "");
if (!BASE_URL) {
	console.error("Falta la URL. Uso: node scripts/uat.mjs <url>");
	process.exit(1);
}

const form = (fields) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(fields)) f.append(k, v);
	return f;
};

const stamp = Date.now();
const cases = [
	{
		id: "UAT-01",
		historia: "Como usuario quiero saber que el servicio está disponible",
		paso: "GET /health",
		esperado: "200 y { status: 'ok' }",
		run: async () => {
			const r = await fetch(`${BASE_URL}/health`);
			const b = await r.json();
			return { ok: r.status === 200 && b.status === "ok", obtenido: `${r.status} ${JSON.stringify(b)}` };
		},
	},
	{
		id: "UAT-02",
		historia: "Como usuario quiero ver el saludo y la lista de usuarios",
		paso: "GET /",
		esperado: "200, message y dbData (arreglo)",
		run: async () => {
			const r = await fetch(`${BASE_URL}/`);
			const b = await r.json();
			return {
				ok: r.status === 200 && typeof b.message === "string" && Array.isArray(b.dbData),
				obtenido: `${r.status} message="${b.message}", dbData=${Array.isArray(b.dbData) ? b.dbData.length + " registros" : "N/A"}`,
			};
		},
	},
	{
		id: "UAT-03",
		historia: "Como usuario quiero registrarme con nombre y correo",
		paso: "POST /user (name, email válidos)",
		esperado: "201 'Usuario creado'",
		run: async () => {
			const email = `uat${stamp}@iteso.mx`;
			const r = await fetch(`${BASE_URL}/user`, { method: "POST", body: form({ name: "UAT Bot", email }) });
			const b = await r.json();
			return { ok: r.status === 201 && b.message === "Usuario creado", obtenido: `${r.status} ${JSON.stringify(b)}` };
		},
	},
	{
		id: "UAT-04",
		historia: "Como usuario quiero que el registro aparezca en la lista",
		paso: "GET / después del POST",
		esperado: `dbData contiene uat${stamp}@iteso.mx`,
		run: async () => {
			const r = await fetch(`${BASE_URL}/`);
			const b = await r.json();
			const found = Array.isArray(b.dbData) && b.dbData.some((u) => u.email === `uat${stamp}@iteso.mx`);
			return { ok: r.status === 200 && found, obtenido: found ? "Registro encontrado" : "Registro NO encontrado" };
		},
	},
	{
		id: "UAT-05",
		historia: "Como usuario quiero ver errores si dejo datos inválidos",
		paso: "POST /user (name vacío, email sin @)",
		esperado: "400 con 2 errores de validación",
		run: async () => {
			const r = await fetch(`${BASE_URL}/user`, { method: "POST", body: form({ name: "", email: "sin-arroba" }) });
			const b = await r.json();
			return { ok: r.status === 400 && Array.isArray(b.errors) && b.errors.length === 2, obtenido: `${r.status} ${JSON.stringify(b)}` };
		},
	},
];

const results = [];
for (const c of cases) {
	const t0 = Date.now();
	let res;
	try {
		res = await c.run();
	} catch (e) {
		res = { ok: false, obtenido: `Error: ${e.message}` };
	}
	results.push({ ...c, ...res, ms: Date.now() - t0 });
	console.log(`${res.ok ? "✅" : "❌"} ${c.id} ${c.paso} -> ${res.obtenido}`);
}

const passed = results.filter((r) => r.ok).length;
const esc = (s) => String(s).replace(/\|/g, "\\|");
const md = [
	"# Reporte UAT - Práctica 7",
	"",
	`- **Ambiente:** Producción (\`practica7-prod\`)`,
	`- **URL:** ${BASE_URL}`,
	`- **Fecha:** ${new Date().toISOString()}`,
	`- **Commit:** ${process.env.GITHUB_SHA ?? "local"}`,
	`- **Resultado:** ${passed}/${results.length} casos aprobados ${passed === results.length ? "✅ APROBADO" : "❌ RECHAZADO"}`,
	"",
	"| ID | Historia de usuario | Paso | Esperado | Obtenido | Tiempo | Estado |",
	"|---|---|---|---|---|---|---|",
	...results.map((r) => `| ${r.id} | ${esc(r.historia)} | ${esc(r.paso)} | ${esc(r.esperado)} | ${esc(r.obtenido)} | ${r.ms} ms | ${r.ok ? "✅ Pass" : "❌ Fail"} |`),
	"",
].join("\n");

writeFileSync("uat-report.md", md);
console.log(`\n${passed}/${results.length} casos aprobados. Reporte: uat-report.md`);
process.exit(passed === results.length ? 0 : 1);
