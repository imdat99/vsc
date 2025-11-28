import { getExportNames, transformWrapExport } from "@hiogawa/transforms";
import { type Plugin, parseAstAsync } from "vite";

export async function transformClientReference(input: string, id: string) {
	const ast = await parseAstAsync(input+`\n`);
	const { output } = await transformWrapExport(input + `\n`, ast, {
		runtime: (v, n, _meta) => `$$wrap(${v}, ${JSON.stringify(id)}, ${JSON.stringify(n)})`,
		ignoreExportAllDeclaration: true,
	});
	// output.append(`\n`);
	output.prepend(`\
import { registerClientReference as $$wrap1 } from "@/integrations/serialize";
const $$wrap = (v, id, name) => $$wrap1(v, name.toLowerCase() !== 'default' ? id + "#" + name : id);
`);
	return output;
}

export async function transformEmptyExports(input: string) {
	const ast = await parseAstAsync(input);
	const { exportNames } = getExportNames(ast, {
		ignoreExportAllDeclaration: true,
	});
	const stmts = exportNames.map((name) =>
		name === "default"
			? "export default undefined"
			: `export const ${name} = undefined`,
	);
	return [...stmts, ""].join(";\n");
}

export function vitePluginSilenceDirectiveBuildWarning(): Plugin {
	return {
		name: vitePluginSilenceDirectiveBuildWarning.name,
		enforce: "post",
		config(config, _env) {
			return {
				build: {
					rollupOptions: {
						onwarn(warning, defaultHandler) {
							// https://github.com/vitejs/vite/issues/15012#issuecomment-1948550039
							if (
								warning.code === "SOURCEMAP_ERROR" &&
								warning.loc?.line === 1 &&
								warning.loc.column === 0
							) {
								return;
							}
							// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
							if (
								(warning.code === "MODULE_LEVEL_DIRECTIVE" &&
									warning.message.includes(`"use client"`)) ||
								warning.message.includes(`"use server"`)
							) {
								return;
							}
							if (config.build?.rollupOptions?.onwarn) {
								config.build.rollupOptions.onwarn(warning, defaultHandler);
							} else {
								defaultHandler(warning);
							}
						},
					},
				},
			};
		},
	};
}
