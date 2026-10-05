export function validateUserForm(name: string | null, email: string | null): string[] {
	const errors: string[] = [];
	if (!name || name.trim().length === 0) {
		errors.push("El nombre es requerido");
	}
	if (!email || !email.includes("@")) {
		errors.push("Se requiere un correo electrónico válido");
	}
	return errors;
}
