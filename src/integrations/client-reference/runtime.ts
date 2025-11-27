import type { ReferenceMap } from "@/integrations/serialize";

export async function createReferenceMap(ids: string[]): Promise<ReferenceMap> {
	return Object.fromEntries(
		await Promise.all(ids.map(async (id) => [id, await resolveReference(id)])),
	);
}

async function resolveReference(id: string) {
	let [file, name] = id.split("#");
	let mod: any;
	if (import.meta.env.DEV) {
		if (import.meta.env.SSR) {
			// import { pathToFileURL } from "url";
			const { pathToFileURL } = await import("node:url");
			file = pathToFileURL(file).href;
			// console.log("ssr import", file);
		}
		// console.log("file", file)
		mod = await import(/* @vite-ignore */ file);
	} else {
		const mods = await import("virtual:client-references" as string);
		mod = await mods.default[file]();
	}
	return mod[name];
}
