export * from './declaration.ts';
export * from './identifier.ts';

/** Methods: functions declared as members of a type, called on an instance of it. */
export interface Methods {
	readonly methods: true;
}
