interface User {
	id: number;
	name: string;
	email: string;
}

function createUser(id: number, name: string, email: string): User {
	return { id, name, email };
}

class UserStore {
	private users: User[] = [];

	add(user: User): void {
		this.users.push(user);
	}

	findById(id: number): User | undefined {
		return this.users.find((u) => u.id === id);
	}
}
