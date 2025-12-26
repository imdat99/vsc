import {
	exposeTinyRpc,
	httpServerAdapter,
	validateFn,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import { MiddlewareHandler, type Context, type Next } from "hono";
import { getContext } from "hono/context-storage";
import { register } from "module";
import { z } from "zod";
import { authMethods } from "./auth";
import { jwt } from "hono/jwt";
import { secret } from "./commom";
import { abortChunk, chunkedUpload, completeChunk, createPresignedUrls, imageContentTypes, nanoid, presignedPut, videoContentTypes } from "./s3_handle";
// import { createElement } from "react";

let counter = 0;
const listCourses = [
	{
		id: 1,
		title: "Lập trình Web Fullstack",
		description:
			"Học cách xây dựng ứng dụng web hoàn chỉnh từ frontend đến backend. Khóa học bao gồm HTML, CSS, JavaScript, React, Node.js và MongoDB.",
		category: "Lập trình",
		rating: 4.9,
		price: "1.200.000 VNĐ",
		icon: "fas fa-code",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Web%20Fullstack",
		slug: "lap-trinh-web-fullstack",
	},
	{
		id: 2,
		title: "Phân tích dữ liệu với Python",
		description:
			"Khám phá sức mạnh của Python trong việc phân tích và trực quan hóa dữ liệu. Sử dụng Pandas, NumPy, Matplotlib và Seaborn.",
		category: "Phân tích dữ liệu",
		rating: 4.8,
		price: "900.000 VNĐ",
		icon: "fas fa-chart-bar",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Data%20Analysis",
		slug: "phan-tich-du-lieu-voi-python",
	},
	{
		id: 3,
		title: "Thiết kế UI/UX chuyên nghiệp",
		description:
			"Học các nguyên tắc thiết kế giao diện và trải nghiệm người dùng hiện đại. Sử dụng Figma và Adobe XD.",
		category: "Thiết kế",
		rating: 4.7,
		price: "800.000 VNĐ",
		icon: "fas fa-paint-brush",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=UI/UX%20Design",
		slug: "thiet-ke-ui-ux-chuyen-nghiep",
	},
	{
		id: 4,
		title: "Machine Learning cơ bản",
		description:
			"Nhập môn Machine Learning với Python. Tìm hiểu về các thuật toán học máy cơ bản như Linear Regression, Logistic Regression, Decision Trees.",
		category: "AI/ML",
		rating: 4.6,
		price: "1.500.000 VNĐ",
		icon: "fas fa-brain",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Machine%20Learning",
		slug: "machine-learning-co-ban",
	},
	{
		id: 5,
		title: "Digital Marketing toàn diện",
		description:
			"Chiến lược Marketing trên các nền tảng số. SEO, Google Ads, Facebook Ads và Content Marketing.",
		category: "Marketing",
		rating: 4.5,
		price: "700.000 VNĐ",
		icon: "fas fa-bullhorn",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Digital%20Marketing",
		slug: "digital-marketing-toan-dien",
	},
	{
		id: 6,
		title: "Lập trình Mobile với Flutter",
		description:
			"Xây dựng ứng dụng di động đa nền tảng (iOS & Android) với Flutter và Dart.",
		category: "Lập trình",
		rating: 4.8,
		price: "1.100.000 VNĐ",
		icon: "fas fa-mobile-alt",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Flutter%20Mobile",
		slug: "lap-trinh-mobile-voi-flutter",
	},
	{
		id: 7,
		title: "Tiếng Anh giao tiếp công sở",
		description:
			"Cải thiện kỹ năng giao tiếp tiếng Anh trong môi trường làm việc chuyên nghiệp.",
		category: "Ngoại ngữ",
		rating: 4.4,
		price: "600.000 VNĐ",
		icon: "fas fa-language",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Business%20English",
		slug: "tieng-anh-giao-tiep-cong-so",
	},
	{
		id: 8,
		title: "Quản trị dự án Agile/Scrum",
		description:
			"Phương pháp quản lý dự án linh hoạt Agile và khung làm việc Scrum.",
		category: "Kỹ năng mềm",
		rating: 4.7,
		price: "950.000 VNĐ",
		icon: "fas fa-tasks",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Agile%20Scrum",
		slug: "quan-tri-du-an-agile-scrum",
	},
	{
		id: 9,
		title: "Nhiếp ảnh cơ bản",
		description:
			"Làm chủ máy ảnh và nghệ thuật nhiếp ảnh. Bố cục, ánh sáng và chỉnh sửa ảnh.",
		category: "Nghệ thuật",
		rating: 4.9,
		price: "500.000 VNĐ",
		icon: "fas fa-camera",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Photography",
		slug: "nhiep-anh-co-ban",
	},
	{
		id: 10,
		title: "Blockchain 101",
		description:
			"Hiểu về công nghệ Blockchain, Bitcoin, Ethereum và Smart Contracts.",
		category: "Công nghệ",
		rating: 4.6,
		price: "1.300.000 VNĐ",
		icon: "fas fa-link",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Blockchain",
		slug: "blockchain-101",
	},
	{
		id: 11,
		title: "ReactJS Nâng cao",
		description:
			"Các kỹ thuật nâng cao trong React: Hooks, Context, Redux, Performance Optimization.",
		category: "Lập trình",
		rating: 4.9,
		price: "1.000.000 VNĐ",
		icon: "fas fa-code",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Advanced%20React",
		slug: "reactjs-nang-cao",
	},
	{
		id: 12,
		title: "Viết Content Marketing thu hút",
		description:
			"Kỹ thuật viết bài chuẩn SEO, thu hút người đọc và tăng tỷ lệ chuyển đổi.",
		category: "Marketing",
		rating: 4.5,
		price: "550.000 VNĐ",
		icon: "fas fa-pen-nib",
		bgImg: "https://placehold.co/600x400/EEE/31343C?font=playfair-display&text=Content%20Marketing",
		slug: "viet-content-marketing",
	}
];

const courseContent = [
	{
		id: 1,
		title: "Giới thiệu khóa học",
		type: "video",
		duration: "5:00",
		completed: true,
	},
	{
		id: 2,
		title: "Cài đặt môi trường",
		type: "video",
		duration: "15:00",
		completed: false,
	},
	{
		id: 3,
		title: "Kiến thức cơ bản",
		type: "video",
		duration: "25:00",
		completed: false,
	},
	{
		id: 4,
		title: "Bài tập thực hành 1",
		type: "quiz",
		duration: "10:00",
		completed: false,
	},
];

const routes = {
	// define as a bare function
	checkId: (id: string) => {
		const context = getContext();
		console.log(context.req.raw.headers);
		return id === "good";
	},

	checkIdThrow: (id: string) => {
		tinyassert(id === "good", "Invalid ID");
		return null;
	},

	getCounter: () => {
		const context = getContext();
		console.log(context.get("jwtPayload"));
		return counter;
	},

	// define with zod validation + input type inference
	incrementCounter: validateFn(z.object({ delta: z.number().default(1) }))(
		(input) => {
			// expectTypeOf(input).toEqualTypeOf<{ delta: number }>();
			counter += input.delta;
			return counter;
		}
	),

	// access context
	components: async () => {},
	getHomeCourses: async () => {
		return listCourses.slice(0, 3);
	},
	getCourses: validateFn(
		z.object({
			page: z.number().default(1),
			limit: z.number().default(6),
			search: z.string().optional(),
			category: z.string().optional(),
		})
	)(async ({ page, limit, search, category }) => {
		let filtered = listCourses;

		if (search) {
			const lowerSearch = search.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.title.toLowerCase().includes(lowerSearch) ||
					c.description.toLowerCase().includes(lowerSearch)
			);
		}

		if (category && category !== "All") {
			filtered = filtered.filter((c) => c.category === category);
		}

		const start = (page - 1) * limit;
		const end = start + limit;
		const paginated = filtered.slice(start, end);

		return {
			data: paginated,
			total: filtered.length,
			page,
			totalPages: Math.ceil(filtered.length / limit),
		};
	}),
	getCourseBySlug: validateFn(z.object({ slug: z.string() }))(async ({ slug }) => {
		const course = listCourses.find((c) => c.slug === slug);
		if (!course) {
			throw new Error("Course not found");
		}
		return course;
	}),
	getCourseContent: validateFn(z.object({ slug: z.string() }))(async ({ slug }) => {
		// In a real app, we would fetch content specific to the course
		return courseContent;
	}),
	presignedPut: validateFn(z.object({ fileName: z.string(), contentType: z.string().refine((val) => imageContentTypes.includes(val), { message: "Invalid content type" }) }))(async ({ fileName, contentType }) => {
		return await presignedPut(fileName, contentType);
	}),
	chunkedUpload: validateFn(z.object({ fileName: z.string(), contentType: z.string().refine((val) => videoContentTypes.includes(val), { message: "Invalid content type" }), fileSize: z.number().min(1024 * 10).max(3 * 1024 * 1024 * 1024).default(1024 * 256) }))(async ({ fileName, contentType, fileSize }) => {
		const key = nanoid() + "_" + fileName;
		const { UploadId } = await chunkedUpload(key, contentType, fileSize);
		const chunkSize = 1024 * 1024 * 20; // 20MB
		const presignedUrls = await createPresignedUrls({
			key,
			uploadId: UploadId!,
			totalParts: Math.ceil(fileSize / chunkSize),
		});
		return { uploadId: UploadId!, presignedUrls, chunkSize, key, totalParts: presignedUrls.length };
	}),
	completeChunk: validateFn(z.object({ key: z.string(), uploadId: z.string(), parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })) }))(async ({ key, uploadId, parts }) => {
		await completeChunk(key, uploadId, parts);
		return { success: true };
	}),
	abortChunk: validateFn(z.object({ key: z.string(), uploadId: z.string() }))(async ({ key, uploadId }) => {
		await abortChunk(key, uploadId);
		return { success: true };
	}),
	...authMethods
};
export type RpcRoutes = typeof routes;
export const endpoint = "/rpc";
export const pathsForGET: (keyof typeof routes)[] = ["getCounter"];
export const jwtRpc: MiddlewareHandler = async (c, next) => {
	const publicPaths: (keyof typeof routes)[] = ["getHomeCourses", "getCourses", "getCourseBySlug", "getCourseContent", "login", "register"];
	const isPublic = publicPaths.some((path) => c.req.path.split("/").includes(path));
	c.set("isPublic", isPublic);
	// return await next();
	if (c.req.path !== endpoint && !c.req.path.startsWith(endpoint + "/") || isPublic) {
		return await next();
	}
	console.log("JWT RPC Middleware:", c.req.path);
	const jwtMiddleware = jwt({
		secret,
		cookie: 'auth_token',
		verification: {
			aud: "ez.lms_users",
		}
	})
	return jwtMiddleware(c, next)
}
export const rpcServer = async (c: Context, next: Next) => {
	if (c.req.path !== endpoint && !c.req.path.startsWith(endpoint + "/")) {
		return await next();
	}
	// c.get("redis").has(`auth_token:${}`)
	const handler = exposeTinyRpc({
		routes,
		adapter: httpServerAdapter({ endpoint }),
	});
	const res = await handler({ request: c.req.raw });
	if (res) {
		return res;
	}
	return await next();
};
