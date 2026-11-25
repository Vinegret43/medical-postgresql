declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				role: 'admin' | 'doctor' | 'patient';
				subjectId: string;
			} | null;
		}
	}
}

export {};
