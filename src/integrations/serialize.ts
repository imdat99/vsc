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
	referenceIds: readonly unknown[];
	typeIndex: readonly number[];
};

export async function serialize(
	input: unknown,
	context?: AppContext,
): Promise<readonly unknown[]> {
	const serializer = new Serializer(context);
	await serializer.serialize(input);
	const data = serializer.referenceIds.toArray();
	(data as any).unshift(Array.from(serializer.typeIndex));
	return data;
}

class Serializer {
	referenceIds = new UniqueList<unknown>();
	typeIndex = new Set<number>() //reference
	/**
	 * Đánh dấu kiểu của giá trị đã serialize \n default type = 0 (node)
	 * @param v
	 * @param type 0: node | 1: reference | 2: tags
	 */
	// nodeIds = new UniqueList<unknown>();
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
            switch (typeof v) {
                case "number": return String(v);
                case "boolean": return v ? !0 : !1;
                default: return v;
            }
			// return typeof v === "number" ? String(v) : v;
		}
		if (isVNode(v)) {
			return this.serializeNode(v);
		}
		if (Array.isArray(v)) {
			return mapPromiseAll(v, (v) => this.serialize(v));
		}
		return Object.fromEntries(
			await mapPromiseAll(Object.entries(v), async ([k, v]) => [
				k,
				await this.serialize(v),
			]),
		);
	}

	// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/server-renderer/src/render.ts#L220
	async serializeProps(node: VNode) {
		return await this.serialize({ ...(node.props ?? {}), key: node.key }).then((p) => Object.entries(p as Record<string, any>).filter(([k, v]) => v).map(([k, v]) => [this.referenceIds.add(k), v])).then(v => v.length ? v : 0)
	}
	async serializeNode(node: VNode) {

		if (typeof node.type === "symbol" || node.shapeFlag & ShapeFlags.ELEMENT) {
			const sNode = SNodeObjtoSNode({
				__snode: (node as any)?.staticCount || 1,
				type: this.referenceIds.add(serializeNodeType(node.type)),
				props: {},
				children: [],
			} satisfies SNodeObj);
			const nodeIdx = this.referenceIds.add(sNode);
			sNode[3] = await this.serializeProps(node);
			sNode[4] = await this.serialize(node.children) ?? 0
			return nodeIdx;
		}
		if (node.shapeFlag & ShapeFlags.COMPONENT) {
			// client referencenull
			const id = (node.type as any).__reference_id;
			if (id) {
				const sNode = SNodeObjtoSNode({
					__snode: true,
					__reference_id: this.referenceIds.add(id),
					props: {},
					children: [],
				} satisfies SNodeObj);
				const nodeIdx = this.referenceIds.add(sNode);
				sNode[3] = await this.serializeProps(node);
				sNode[4] = await this.serializeClientChildren(node.children) ?? 0;
				this.typeIndex.add(sNode[1]);
				// satisfies SNode;
				return nodeIdx;
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
			return await this.serialize(child);
		}
		if (node.shapeFlag & ShapeFlags.TELEPORT) {
			throw new Error("Teleport vnode is only supported on client side");
		}
		if (node.shapeFlag & ShapeFlags.SUSPENSE) {
			const Comp: VNode = await (node.children as any).default().at(-1);
			Comp.shapeFlag = ShapeFlags.COMPONENT;
			return await this.serialize(Comp);
		}
		console.error("[unexpected vnode]", [node.type, node.shapeFlag]);
		throw new Error("unexpected vnode", { cause: node });

	}

	async serializeClientChildren(children: VNodeNormalizedChildren) {
		if (children === null) {
			return null;
		}
		tinyassert(typeof children === "object" && !Array.isArray(children));
		let entries: [number, unknown][] = [];
		for (const [k, v] of Object.entries(children)) {
			if (typeof v === "function") {
				entries.push([this.referenceIds.add(k), await this.serialize(v())]);
			}
		}
		return entries;
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
async function mapPromiseAll<T, U>(
	xs: T[],
	f: (x: T) => Promise<U>,
): Promise<U[]> {
	return Promise.all(xs.map(f));
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
	__reference_id: number, // 1
	type: any, // 2
	props: any, // 3
	children: any // 4
];
function SNodeObjtoSNode(o: SNodeObj): SNode {
	const res = [
		Number(o.__snode),
		o.__reference_id,
		o.type,
		o.props,
		o.children,
	].map(v => v ?? 0) as SNode;
	return res;
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

export function deserialize(data: unknown[], referenceMap: ReferenceMap) {
	const deserializer = new Deserializer(referenceMap, data as any[]); //tagMap
	return deserializer.deserialize(data.find(i => Array.isArray(i) && i.length === 5)); //root
}

class Deserializer {
	constructor(private referenceMap: ReferenceMap, private appMap: string[]) { }
	private cache = new WeakMap<Object, unknown>();
	private setCache(k: Object, v: unknown) {
		this.cache.set(k, v);
		return v;
	}
	private getCache(k: Object): unknown {
		return this.cache.get(k);
	}
	deserialize(v: unknown): unknown {
		// console.log("deserializing", v);
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
		const r = this.getCache(v as Object);
		if (r !== undefined) {
			return r;
		}
		if (Array.isArray(v) && v[0] >= 1 /* __snode */) {
			return this.setCache(v, this.deserializeNode(v as SNode));
		}
		if (Array.isArray(v)) {
			return this.setCache(v, v.map((v) => this.deserialize(v)));
		}
		return this.setCache(v, Object.fromEntries(
			Object.entries(v).map(([k, v]) => [k, this.deserialize(v)]),
		));
	}

	deserializeNode(node: SNode) {
		// console.log("node[4]", node[4])
		const type = this.deserializeNodeType<any>(node[2]);
		const oldchild = node[4];
		node[4] = this.deserializeNodeType<any>(node[4]) ?? oldchild;
		if (node[1] /* __reference_id */) {
			const Component = tryCatchWrap(
				() => this.referenceMap[node[1]],
				(e) => {
					console.error("reference not found: " + node);
				},
			);
			if (!Component) {
				console.error(node);
				throw new Error("reference not found: " + node[1], {
					cause: node,
				});
			}
			const props = this.deserialize(
					this.buildProps(this.deserializeNodeType(node[3])),
				) as any
			return createVNode(
				Component,
				props,
				this.deserializeClientChildren(node[4]),
			);
		}
		if (type === Static && typeof node[4] === "string") {
			return createStaticVNode(node[4], node[0]);
		}
		return createVNode(
			type === 0 ? null : type,
			this.deserialize(
				this.buildProps(this.deserializeNodeType(node[3])),
			) as any,
			this.deserialize(node[4]),
		);
	}
	// nó là array key và value của VNodeNormalizedChildren => Array<[key, VNode]>
	deserializeClientChildren(children: Array<[number, VNode]> | number) {
		if (children === null || children === 0 || !children) {
			return null;
		}
		tinyassert(
			Array.isArray(children) &&
			children.every(([k, v]) => typeof k === "string"),
			"invalid client children " + JSON.stringify(children, null, 2),
		);
		const res = Object.fromEntries(
			children.map(([k, v]) => [
				this.deserializeNodeType(k),
				() => this.deserialize(v),
			]),
		);
		return res;
	}
	deserializeNodeType1<T = unknown>(s: any): T {
		if (typeof s === "symbol") return s as any;
		if (typeof s === "string") return s as any;
		try {

			if (s == 0) {
				return "" as any;
			}
		} catch (e) {
			console.error("deserializeNodeType error", e, s);
			throw e;
		}
		if (Array.isArray(s)) {
			if (s.length === 5) {
				return s as any;
			}
			return s.map((v: any) => this.deserializeNodeType(v)) as T;
		}
		s = this.appMap[s];
		// if (!s) {
		// 	throw new Error("tag not found: " + s);
		// }
		if (typeof s === "string" && s.startsWith("$")) {
			return Symbol.for(s.slice(1)) as any;
		}
		return s;
	}
	deserializeNodeType<T = unknown>(rootS: any): T {
		// Tạo một wrapper để giữ kết quả cuối cùng.
		// Chúng ta cần tham chiếu 'parent' để gán giá trị vào đúng vị trí.
		const rootHolder: Record<string, any> = { result: null as any };

		// Stack lưu trữ trạng thái:
		// s: giá trị cần xử lý
		// parent: mảng hoặc object chứa giá trị này
		// key: vị trí (index hoặc key) trong parent để gán kết quả sau khi xử lý
		const stack = [{ s: rootS, parent: rootHolder, key: 'result' }];

		while (stack.length > 0) {
			const { s, parent, key } = stack.pop()!;

			// 1. Xử lý trường hợp s == 0
			try {

				if (s == 0) {
					parent[key] = "" as any;
					continue;
				}
			} catch (e) {
				console.error({ s, parent, key });
				// parent[key] = "" as any;
				throw e;
			}

			// 2. Xử lý chuỗi (String)
			if (typeof s === "string") {
				parent[key] = s as any;
				continue;
			}
			if (typeof s === "object" && !Array.isArray(s)) {
				// 2.a Xử lý Object
				// dùng Object trực tiếp để tránh đệ quy
				// const newObj: Record<string, any> = {};
				// parent[key] = newObj;

				// // Đẩy các cặp key-value vào stack để xử lý sau.
				// // Duyệt ngược (reverse) để khi pop ra khỏi stack,
				// // chúng ta xử lý theo thứ tự từ đầu đến cuối (tuy không bắt buộc nhưng tốt cho debug).
				// const entries = Object.entries(s);
				// for (let i = entries.length - 1; i >= 0; i--) {
				// 	const [k, v] = entries[i];
				// 	stack.push({ s: v, parent: newObj, key: k });
				// }
				parent[key] = s;
				continue;
			}
			// 3. Xử lý Mảng (Array) - Đây là phần thay thế đệ quy
			if (Array.isArray(s)) {
				if (s.length === 5) {
					// Nếu là SNode, xử lý như bình thường
					parent[key] = this.deserializeNodeType1<T>(s);
					continue;
				}
				// Tạo một mảng mới để chứa kết quả đã deserialize
				const newArr = new Array(s.length);
				parent[key] = newArr;

				// Đẩy các phần tử con vào stack để xử lý sau.
				// Duyệt ngược (reverse) để khi pop ra khỏi stack,
				// chúng ta xử lý theo thứ tự từ 0 -> n (tuy không bắt buộc nhưng tốt cho debug).
				for (let i = s.length - 1; i >= 0; i--) {
					stack.push({ s: s[i], parent: newArr, key: String(i) });
				}
				continue;
			}

			// 4. Xử lý AppMap lookup (Logic gốc)
			// Nếu không phải mảng, string, hay 0, thì tra cứu trong map
			let mappedValue: string | symbol = this.appMap[s];

			// Xử lý logic Symbol đặc biệt
			if (typeof mappedValue === "string" && mappedValue.startsWith("$")) {
				mappedValue = Symbol.for(mappedValue.slice(1));
			}

			// Gán giá trị đã map vào parent
			parent[key] = mappedValue;
		}

		return rootHolder.result as T;
	}
	buildProps(props: [key: string, value: any][]): Record<string, any> {
		try {
			return Array.isArray(props) ? Object.fromEntries(props.map(([k, v]) => [this.deserializeNodeType(k), v])) : {};
		} catch (e) {
			return {};
		}
	}
}
function tryCatchWrap<T>(fn: () => T, onError: (e: unknown) => T): T {
	try {
		return fn();
	} catch (e) {
		return onError(e);
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
