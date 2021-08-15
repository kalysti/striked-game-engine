
export class List<T> {
    resources: Map<string, T> = new Map<string, T>();

    add(name: string, resource: T) {
        if (this.resources.has(name)) {
            return;
        }
        else {
            this.resources.set(name, resource);
        }
    }
    getOrNull(name: string): T|null {

        if (!this.resources.has(name))
            return null;

        return this.resources.get(name) as T;
    }
    get(name: string): T {

        if (!this.resources.has(name))
            throw new Error("Cant find resource: "  + name );

        return this.resources.get(name) as T;
    }

    has(name: string): boolean {
        return this.resources.has(name);
    }
}