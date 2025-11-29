import { tinyassert } from "@hiogawa/utils";
import { ShapeFlags } from "@vue/shared";
import {
	type AppContext,
	type ComponentInternalInstance,
	Static,
	type SuspenseBoundary,
	type VNode,
	type VNodeNormalizedChildren,
	createStaticVNode,
	createVNode,
	isVNode,
	// @ts-expect-error no type?
	ssrUtils,
} from "vue";

// https://github.com/hi-ogawa/js-utils/blob/5288c172b72699c769dc87e2f07e3ce6ec9b5199/packages/tiny-react/src/server/index.ts

//
// serialize
//

export type SerializeResult = {
	data: unknown;
	referenceIds: readonly string[];
	tags: readonly string[];
};

export async function serialize(
	input: unknown,
	context?: AppContext,
): Promise<SerializeResult> {
	const serializer = new Serializer(context);
	const data = await serializer.serialize(input);
	// console.log("serializing...", serializer.tagIds.toArray());
	return { data, referenceIds: serializer.referenceIds.toArray(), tags: serializer.tagIds.toArray() };
}

class Serializer {
	referenceIds = new UniqueList<string>();
	tagIds = new UniqueList<string>();
	constructor(private context?: AppContext) { }

	async serialize(v: unknown): Promise<unknown> {
		if (typeof v === "function") {
			throw new Error("cannot serialize function", { cause: v });
		}
		if (
			v === null ||
			typeof v === "undefined" ||
			typeof v === "string" ||
			typeof v === "boolean" ||
			typeof v === "number"
		) {
			return v;
		}
		if (isVNode(v)) {
			return this.serializeNode(v);
		}
		if (Array.isArray(v)) {
			return mapPromise(v, (v) => this.serialize(v));
		}
		return Object.fromEntries(
			await mapPromise(Object.entries(v), async ([k, v]) => [
				k,
				await this.serialize(v),
			]),
		);
	}

	// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/server-renderer/src/render.ts#L220
	async serializeNode(node: VNode) {
		if (typeof node.type === "symbol" || node.shapeFlag & ShapeFlags.ELEMENT) {
			return SNodeObjtoSNode({
				__snode: node?.staticCount || 1,
				type: this.tagIds.add(serializeNodeType(node.type)),
				props: await this.serialize({ ...(node.props ?? {}), key: node.key }).then((p) => Object.entries(p as Record<string, any>).filter(([k, v]) => v).map(([k, v]) => [this.tagIds.add(k), v])).then(v => v.length ? v : 0),
				children: await this.serialize(node.children).then(p => p ? [p] : null),
			} satisfies SNodeObj);
			// satisfies SNode;
		}
		if (node.shapeFlag & ShapeFlags.COMPONENT) {
			// client referencenull
			const id = (node.type as any).__reference_id;
			if (id) {
				return SNodeObjtoSNode({
					__snode: true,
					__reference_id: this.referenceIds.add(id),
					props: await this.serialize({ ...(node.props ?? {}), key: node.key }).then((p) => Object.entries(p as Record<string, any>).filter(([k, v]) => v).map(([k, v]) => [this.tagIds.add(k), v])).then(v => v.length ? v : 0),
					children: await this.serializeClientChildren(node.children).then(p => p ? [p] : null),
				} satisfies SNodeObj);
				// satisfies SNode;
			}
			// setup app context for app.provide/component
			// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/runtime-core/src/component.ts#L546-L548
			node.appContext = this.context ?? null;
			const instance = createComponentInstance(node, null, null);
			// make Vue think this instance is being SSR-rendered
			const prev = setCurrentRenderingInstance(instance)
			await setupComponent(instance, true);
			const child = renderComponentRoot(instance);
			setCurrentRenderingInstance(prev)
			return this.serialize(child);
		}
		console.error("[unexpected vnode]", [node.type, node.shapeFlag]);
		throw new Error("unexpected vnode", { cause: node });
	}

	async serializeClientChildren(children: VNodeNormalizedChildren) {
		if (children === null) {
			return null;
		}
		tinyassert(typeof children === "object" && !Array.isArray(children));
		let entries: [string, unknown][] = [];
		for (const [k, v] of Object.entries(children)) {
			if (typeof v === "function") {
				entries.push([k, await this.serialize(v())]);
			}
		}
		return Object.fromEntries(entries);
	}
}

// sequential for easier debugging for now
async function mapPromise<T, U>(
	xs: T[],
	f: (x: T) => Promise<U>,
): Promise<U[]> {
	let ys: U[] = [];
	for (const x of xs) {
		ys.push(await f(x));
	}
	return ys;
}

type SNodeObj = {
	__snode: true;
	__reference_id?: number;
	type?: any;
	props: any;
	children: any;
};
type SNode = [
	__snode: 1, // 0
	__reference_id: string, // 1
	type: any, // 2
	props: any, // 3
	children: any // 4
];
function SNodeObjtoSNode(o: SNodeObj): SNode {
	return [
		Number(o.__snode),
		o.__reference_id,
		o.type,
		o.props,
		o.children,
	].map(v => v ?? 0) as SNode;
}
function serializeNodeType(s: any): string {
	if (typeof s === "symbol") {
		return "$" + s.description;
	}
	return s as "$";
}

export function registerClientReference(v: any, __reference_id: string) {
	return Object.assign(v, { __reference_id });
}

//
// deserialize
//

export type ReferenceMap = Record<string, unknown>;

export function deserialize(data: unknown, referenceMap: ReferenceMap, tagMap: string[]) {
	const deserializer = new Deserializer(referenceMap, tagMap);
	return deserializer.deserialize(data);
}

class Deserializer {
	constructor(private referenceMap: ReferenceMap, private tagMap: string[]) { }

	deserialize(v: unknown): unknown {
		if (typeof v === "function") {
			throw new Error("cannot serialize function", { cause: v });
		}
		if (
			v === null ||
			typeof v === "undefined" ||
			typeof v === "string" ||
			typeof v === "boolean" ||
			typeof v === "number"
		) {
			return v;
		}
		if (Array.isArray(v) && v[0] >= 1 /* __snode */) {
			return this.deserializeNode(v as SNode);
		}
		if (Array.isArray(v)) {
			return v.map((v) => this.deserialize(v));
		}
		return Object.fromEntries(
			Object.entries(v).map(([k, v]) => [k, this.deserialize(v)]),
		);
	}

	deserializeNode(node: SNode) {
		if (node[1] /* __reference_id */) {
			const Component = this.referenceMap[node[1]];
			if (!Component) {
				console.log(this.referenceMap)
				console.error(node);
				throw new Error("reference not found: " + node[1], {
					cause: node,
				});
			}
			return createVNode(
				Component,
				this.deserialize(this.buildProps(node[3])) as any,
				this.deserializeClientChildren(node[4][0]),
			);
		}
		const type = this.deserializeNodeType(node[2]);
		if (type === Static && typeof node[4][0] === "string") {
			return createStaticVNode(node[4][0], node[0]);
		}
		return createVNode(
			type,
			this.deserialize(this.buildProps(node[3])) as any,
			this.deserialize(node[4][0]),
		);
	}

	deserializeClientChildren(children: VNodeNormalizedChildren) {
		if (children === null) {
			return null;
		}
		tinyassert(typeof children === "object" && !Array.isArray(children));
		return Object.fromEntries(
			Object.entries(children).map(([k, v]) => [k, () => this.deserialize(v)]),
		);
	}
	deserializeNodeType(s: any) {
		s = this.tagMap[s - 1];
		if (typeof s === "string" && s.startsWith("$")) {
			return Symbol.for(s.slice(1));
		}
		return s;
	}
	buildProps(props: [key: string, value: any][]): Record<string, any> {
		try {
			return Array.isArray(props) ? Object.fromEntries(props.map(([k, v]) => [this.deserializeNodeType(k), v])) : {};
		} catch (e) {
			return {};
		}
	}
}
//
// vue utilsany
//

// https://github.com/vuejs/core/blob/10d34a5624775f20437ccad074a97270ef74c3fb/packages/runtime-core/src/index.ts#L362-L383
const {
	createComponentInstance,
	setupComponent,
	renderComponentRoot,
	setCurrentRenderingInstance
}: {
	createComponentInstance: (
		vnode: VNode,
		parent: ComponentInternalInstance | null,
		suspense: SuspenseBoundary | null,
	) => ComponentInternalInstance;
	setupComponent: (
		instance: ComponentInternalInstance,
		isSSR?: boolean,
	) => Promise<void> | undefined;
	renderComponentRoot: (instance: ComponentInternalInstance) => VNode;
	setCurrentRenderingInstance: (instance: ComponentInternalInstance | null) => ComponentInternalInstance | null;
} = ssrUtils;

// list lookup
export class UniqueList<T> {
	private arr: T[] = [];
	private indexMap: Map<T, number> = new Map();

	add(value: T): number {
		const existing = this.indexMap.get(value);
		if (existing !== undefined) return existing;

		this.arr.push(value);
		const idx = this.arr.length;
		this.indexMap.set(value, idx);
		return idx;
	}

	indexOf(value: T): number | undefined {
		return this.indexMap.get(value);
	}

	has(value: T): boolean {
		return this.indexMap.has(value);
	}

	get(index: number): T | undefined {
		return this.arr[index];
	}

	toArray(): readonly T[] {
		return this.arr;
	}

	get size(): number {
		return this.arr.length;
	}
}
