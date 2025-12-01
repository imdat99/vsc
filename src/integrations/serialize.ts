import { tinyassert } from "@hiogawa/utils";
import { ShapeFlags } from "@vue/shared";
import {
    type AppContext,
    type ComponentInternalInstance,
    Fragment,
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
    typeIndex = new Set<number>(); //reference
    /**
     * Đánh dấu kiểu của giá trị đã serialize \n default type = 0 (node)
     * @param v
     * @param type 0: node | 1: reference | 2: tags
     */
    // nodeIds = new UniqueList<unknown>();
    constructor(private context?: AppContext) {}

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
            return mapPromiseAll(v, (v) => this.serialize(v));
        }
        return mapPromiseAll(
            Object.entries(v).filter(([, v]) => v),
            async ([k, v]) => [
                this.referenceIds.add(k),
                await this.serialize(v),
            ],
        );
    }

    // https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/server-renderer/src/render.ts#L220
    async serializeProps(node: VNode) {
        return await this.serialize({
            ...(node.props ?? {}),
            key: node.key,
        }).then((r) =>
            (r as any).length
                ? this.referenceIds.add(
                      Array.isArray(r) && r.length === 1 ? r[0] : r,
                  )
                : 0,
        );
    }
    async serializeNode(node: VNode) {
        if (
            typeof node.type === "symbol" ||
            node.shapeFlag & ShapeFlags.ELEMENT
        ) {
            const sNode = SNodeObjtoSNode({
                __snode: (node as any)?.staticCount || 1,
                type: this.referenceIds.add(serializeNodeType(node.type)),
                props: 0,
                children: 0,
            } satisfies SNodeObj);
            const nodeIdx = this.referenceIds.add(sNode);
            sNode[3] = await this.serializeProps(node);
            sNode[4] = (await this.serialize(node.children)) ?? 0;
            return nodeIdx;
        }
        if (node.shapeFlag & ShapeFlags.COMPONENT) {
            // client referencenull
            const id = (node.type as any).__reference_id;
            if (id) {
                const sNode = SNodeObjtoSNode({
                    __snode: true,
                    __reference_id: this.referenceIds.add(id),
                    props: 0,
                    children: 0,
                } satisfies SNodeObj);
                const nodeIdx = this.referenceIds.add(sNode);
                sNode[3] = await this.serializeProps(node);
                sNode[4] =
                    (await this.serializeClientChildren(node.children)) ?? 0;
                this.typeIndex.add(sNode[1]);
                // satisfies SNode;
                return nodeIdx;
            }
            // setup app context for app.provide/component
            // https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/runtime-core/src/component.ts#L546-L548
            node.appContext = this.context ?? null;
            const instance = createComponentInstance(node, null, null);
            // make Vue think this instance is being SSR-rendered
            const prev = setCurrentRenderingInstance(instance);
            await setupComponent(instance, true);
            const child = renderComponentRoot(instance);
            setCurrentRenderingInstance(prev);
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
        // throw new Error("unexpected vnode", { cause: node });
    }

    async serializeClientChildren(children: VNodeNormalizedChildren) {
        if (children === null) {
            return null;
        }
        tinyassert(typeof children === "object" && !Array.isArray(children));
        let entries: [number, unknown][] = [];
        for (const [k, v] of Object.entries(children)) {
            if (typeof v === "function") {
                entries.push([
                    this.referenceIds.add(k),
                    await this.serialize(v()),
                ]);
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
    children: any, // 4
];
function SNodeObjtoSNode(o: SNodeObj): SNode {
    return [
        Number(o.__snode),
        o.__reference_id,
        o.type,
        o.props,
        o.children,
    ].map((v) => v ?? 0) as SNode;
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
    return deserializer.deserialize(
        data.find((i) => Array.isArray(i) && i.length === 5),
    ); //root
}

class Deserializer {
    constructor(
        private referenceMap: ReferenceMap,
        private appMap: unknown[],
    ) {}
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
        if (Array.isArray(v) && v.length === 5 && v[0] >= 1 /* __snode */) {
            return this.setCache(v, this.deserializeNode(v as SNode));
        }
        if (Array.isArray(v)) {
            return this.setCache(
                v,
                v.map((v) => this.deserialize(v)),
            );
        }
        return this.setCache(
            v,
            Object.fromEntries(
                Object.entries(v).map(([k, v]) => [k, this.deserialize(v)]),
            ),
        );
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
            return createVNode(
                Component,
                this.deserialize(
                    this.buildProps(this.deserializeNodeType(node[3])),
                ) as any,
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
    private cacheObj = new WeakMap<any, any>();
    private cachePrim = new Map<any, any>();
    deserializeNodeType1<T = unknown>(s: any): T {
        if (s == 0) {
            return "" as any;
        }
        if (typeof s === "string") return s as any;
        if (Array.isArray(s)) {
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
    deserializeNodeType<T = unknown>(input: any): T {
        // --- 1. Cache lookup ---
        if (input !== null && typeof input === "object") {
            const cached = this.cacheObj.get(input);
            if (cached !== undefined) return cached;
        } else {
            const cached = this.cachePrim.get(input);
            if (cached !== undefined) return cached;
        }

        // Fast return cho case đơn giản
        if (input === 0) {
            this.cachePrim.set(0, "");
            return "" as any;
        }
        if (typeof input === "string") {
            this.cachePrim.set(input, input);
            return input as any;
        }

        // --- 2. Chuẩn bị iterative stack ---
        // Mỗi phần tử: { source, target, index }
        const stack: Array<any> = [];

        // rootResult có 3 dạng: primitive | symbol | array
        let rootResult: any;

        // --- 3. Xử lý root ---
        if (Array.isArray(input)) {
            rootResult = new Array(input.length);
            this.cacheObj.set(input, rootResult);

            stack.push({
                source: input,
                target: rootResult,
                index: 0,
            });
        } else {
            // dạng số → lookup this.appMap
            let result = this.appMap[input];

            if (typeof result === "string" && result.startsWith("$")) {
                result = Symbol.for(result.slice(1));
            }

            this.cachePrim.set(input, result);
            return result as T;
        }

        // --- 4. Vòng lặp iterative ---
        while (stack.length > 0) {
            const frame = stack.pop();
            const src = frame.source;
            const tgt = frame.target;

            let i = frame.index;

            while (i < src.length) {
                const value = src[i];

                // Cache primitive
                if (value === 0) {
                    tgt[i] = "";
                    this.cachePrim.set(0, "");
                    i++;
                    continue;
                }

                if (typeof value !== "object" || value === null) {
                    // primitive
                    if (typeof value === "string") {
                        tgt[i] = value;
                        this.cachePrim.set(value, value);
                    } else {
                        // number → appMap
                        let mapped = this.appMap[value];
                        if (
                            typeof mapped === "string" &&
                            mapped.startsWith("$")
                        ) {
                            mapped = Symbol.for(mapped.slice(1));
                        }
                        tgt[i] = mapped;
                        this.cachePrim.set(value, mapped);
                    }
                    i++;
                    continue;
                }

                // object/array → kiểm tra cache
                const cached = this.cacheObj.get(value);
                if (cached !== undefined) {
                    tgt[i] = cached;
                    i++;
                    continue;
                }

                // Là array → tạo target array
                if (Array.isArray(value)) {
                    const newArr = new Array(value.length);
                    tgt[i] = newArr;
                    this.cacheObj.set(value, newArr);

                    // Đẩy frame hiện tại ngược lên stack để xử lý tiếp
                    frame.index = i + 1;
                    stack.push(frame);

                    // Tạo frame mới cho mảng con
                    stack.push({
                        source: value,
                        target: newArr,
                        index: 0,
                    });
                    break;
                }

                // Object bình thường không được hỗ trợ, dùng appMap
                let mapped = this.appMap[value];
                if (typeof mapped === "string" && mapped.startsWith("$")) {
                    mapped = Symbol.for(mapped.slice(1));
                }
                this.cacheObj.set(value, mapped);
                tgt[i] = mapped;

                i++;
            }
        }

        return rootResult as T;
    }
    buildProps(props: [key: string, value: any][]): Record<string, any> {
        try {
            return Array.isArray(props)
                ? Object.fromEntries(
                      props.map(([k, v]) => [this.deserializeNodeType(k), v]),
                  )
                : {};
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
    setCurrentRenderingInstance,
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
    setCurrentRenderingInstance: (
        instance: ComponentInternalInstance | null,
    ) => ComponentInternalInstance | null;
} = ssrUtils;

// list lookup
export class UniqueList<T> {
    private arr: T[] = [];
    private indexMap: Map<T, number> = new Map();

    add(value: T): number {
        if (value === null || typeof value === "undefined") {
            return 0;
        }
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
