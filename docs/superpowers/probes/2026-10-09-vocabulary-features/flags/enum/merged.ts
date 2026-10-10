/** Two declarations of one enum in one module. */
export enum Merged {
	Static = 1 << 0,
}
export enum Merged {
	Async = 1 << 1,
}
