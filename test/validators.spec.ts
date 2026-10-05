import { describe, it, expect } from "vitest";
import { validateUserForm } from "../src/validators";

describe("validateUserForm", () => {
	it("no regresa errores con nombre y email válidos", () => {
		expect(validateUserForm("Karen", "karen@iteso.mx")).toEqual([]);
	});

	it("marca error si el nombre es null", () => {
		expect(validateUserForm(null, "karen@iteso.mx")).toEqual(["El nombre es requerido"]);
	});

	it("marca error si el nombre está vacío", () => {
		expect(validateUserForm("", "karen@iteso.mx")).toEqual(["El nombre es requerido"]);
	});

	it("marca error si el nombre solo tiene espacios", () => {
		expect(validateUserForm("   ", "karen@iteso.mx")).toEqual(["El nombre es requerido"]);
	});

	it("marca error si el email es null", () => {
		expect(validateUserForm("Karen", null)).toEqual(["Se requiere un correo electrónico válido"]);
	});

	it("marca error si el email no tiene @", () => {
		expect(validateUserForm("Karen", "karen.iteso.mx")).toEqual(["Se requiere un correo electrónico válido"]);
	});

	it("regresa ambos errores si nombre y email son inválidos", () => {
		expect(validateUserForm(null, null)).toEqual([
			"El nombre es requerido",
			"Se requiere un correo electrónico válido",
		]);
	});
});
