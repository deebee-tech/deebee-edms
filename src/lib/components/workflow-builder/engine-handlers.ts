import type { NodeExecutionContext, NodeExecutionResult, NodeType } from "./types";

export type NodeHandler = (ctx: NodeExecutionContext) => Promise<NodeExecutionResult>;

function resolveTemplates(value: unknown, state: Record<string, unknown>): unknown {
	if (typeof value === "string") {
		return value.replace(/\{\{state\.([^}]+)\}\}/g, (_match, path: string) => {
			const parts = path.split(".");
			let current: unknown = state;
			for (const part of parts) {
				if (current == null || typeof current !== "object") return "";
				current = (current as Record<string, unknown>)[part];
			}
			return current != null ? String(current) : "";
		});
	}
	if (Array.isArray(value)) {
		return value.map((item) => resolveTemplates(item, state));
	}
	if (value != null && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			result[k] = resolveTemplates(v, state);
		}
		return result;
	}
	return value;
}

function getStateValue(path: string, state: Record<string, unknown>): unknown {
	const cleanPath = path.replace(/^state\./, "");
	const parts = cleanPath.split(".");
	let current: unknown = state;
	for (const part of parts) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

const handleManualTrigger: NodeHandler = async () => {
	return { output: { triggered: true, triggeredAt: new Date().toISOString() } };
};

const handleWebhookTrigger: NodeHandler = async (ctx) => {
	return {
		output: {
			triggered: true,
			path: ctx.config.path,
			method: ctx.config.method,
			triggeredAt: new Date().toISOString(),
		},
	};
};

const handleApiCall: NodeHandler = async (ctx) => {
	const config = resolveTemplates(ctx.config, ctx.globalState) as Record<string, unknown>;
	const method = (config.method as string) || "GET";
	const url = config.url as string;
	const timeout = (config.timeout as number) || 30000;

	if (!url) throw new Error("API Call: URL is required");

	const headers: Record<string, string> = {};
	const rawHeaders = config.headers;
	if (rawHeaders && typeof rawHeaders === "object") {
		if (Array.isArray(rawHeaders)) {
			for (const pair of rawHeaders as { key: string; value: string }[]) {
				if (pair.key) headers[pair.key] = pair.value;
			}
		} else {
			Object.assign(headers, rawHeaders);
		}
	}

	const fetchOptions: RequestInit = { method, headers };
	if (method !== "GET" && method !== "HEAD" && config.body) {
		fetchOptions.body = typeof config.body === "string" ? config.body : JSON.stringify(config.body);
		if (!headers["Content-Type"]) {
			headers["Content-Type"] = "application/json";
		}
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);
	fetchOptions.signal = controller.signal;

	try {
		const response = await fetch(url, fetchOptions);
		clearTimeout(timeoutId);

		let responseBody: unknown;
		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			responseBody = await response.json();
		} else {
			responseBody = await response.text();
		}

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return {
			output: {
				status: response.status,
				statusText: response.statusText,
				body: responseBody,
				headers: Object.fromEntries(response.headers.entries()),
			},
			stateUpdates: { apiResponse: responseBody },
		};
	} catch (err) {
		clearTimeout(timeoutId);
		throw err;
	}
};

const handleCondition: NodeHandler = async (ctx) => {
	const field = ctx.config.field as string;
	const operator = ctx.config.operator as string;
	const compareValue = resolveTemplates(ctx.config.value as string, ctx.globalState) as string;

	const actualValue = getStateValue(field, ctx.globalState);

	let result = false;

	switch (operator) {
		case "eq":
			result = String(actualValue) === String(compareValue);
			break;
		case "neq":
			result = String(actualValue) !== String(compareValue);
			break;
		case "gt":
			result = Number(actualValue) > Number(compareValue);
			break;
		case "gte":
			result = Number(actualValue) >= Number(compareValue);
			break;
		case "lt":
			result = Number(actualValue) < Number(compareValue);
			break;
		case "lte":
			result = Number(actualValue) <= Number(compareValue);
			break;
		case "contains":
			result = String(actualValue).includes(String(compareValue));
			break;
		case "not-contains":
			result = !String(actualValue).includes(String(compareValue));
			break;
		case "exists":
			result = actualValue != null;
			break;
		case "not-exists":
			result = actualValue == null;
			break;
	}

	// For condition nodes, success = true, failure = false
	if (!result) {
		throw new ConditionFalseError("Condition evaluated to false");
	}

	return {
		output: { conditionResult: result, field, operator, actualValue, compareValue },
	};
};

export class ConditionFalseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConditionFalseError";
	}
}

const handleTransform: NodeHandler = async (ctx) => {
	const assignments = ctx.config.assignments as { key: string; value: string }[];
	if (!assignments?.length) return { output: {} };

	const stateUpdates: Record<string, unknown> = {};
	for (const { key, value } of assignments) {
		if (key) {
			stateUpdates[key] = resolveTemplates(value, ctx.globalState);
		}
	}

	return { output: stateUpdates, stateUpdates };
};

const handleDelay: NodeHandler = async (ctx) => {
	const duration = (ctx.config.duration as number) || 1;
	const unit = (ctx.config.unit as string) || "s";

	let ms = duration;
	switch (unit) {
		case "s":
			ms = duration * 1000;
			break;
		case "m":
			ms = duration * 60 * 1000;
			break;
		case "h":
			ms = duration * 60 * 60 * 1000;
			break;
	}

	await new Promise((resolve) => setTimeout(resolve, ms));
	return { output: { delayed: true, durationMs: ms } };
};

const handleEmail: NodeHandler = async (ctx) => {
	const config = resolveTemplates(ctx.config, ctx.globalState) as Record<string, unknown>;

	const to = config.to as string;
	const subject = config.subject as string;
	const body = config.body as string;
	const from = config.from as string;

	if (!to) throw new Error("Email: recipient (to) is required");
	if (!subject) throw new Error("Email: subject is required");

	// Placeholder: in production, integrate with an email service (Resend, SendGrid, etc.)
	// `body` is kept for SendGrid (HTML/text); log length only to avoid noisy console output.
	console.log(
		`[Workflow Email] To: ${to}, From: ${from || "system"}, Subject: ${subject}, Body: ${(body ?? "").length} chars`,
	);

	return {
		output: {
			sent: true,
			to,
			from: from || "system",
			subject,
			sentAt: new Date().toISOString(),
		},
		stateUpdates: { notificationSent: true },
	};
};

const handleLoop: NodeHandler = async (ctx) => {
	const collectionPath = ctx.config.collection as string;
	const collection = getStateValue(collectionPath, ctx.globalState);

	if (!Array.isArray(collection)) {
		throw new Error(`Loop: ${collectionPath} is not an array`);
	}

	const itemVar = (ctx.config.itemVariable as string) || "item";
	const indexVar = (ctx.config.indexVariable as string) || "index";

	// The loop node sets up iteration variables; the actual sub-graph execution
	// is handled by the engine's graph walker
	return {
		output: {
			collectionLength: collection.length,
			itemVariable: itemVar,
			indexVariable: indexVar,
		},
		stateUpdates: {
			[`${itemVar}`]: collection[0],
			[`${indexVar}`]: 0,
			_loopCollection: collection,
			_loopItemVar: itemVar,
			_loopIndexVar: indexVar,
			_loopIndex: 0,
		},
	};
};

const handleSupabaseQuery: NodeHandler = async (ctx) => {
	const config = resolveTemplates(ctx.config, ctx.globalState) as Record<string, unknown>;
	const table = config.table as string;
	const operation = config.operation as string;
	const resultVariable = (config.resultVariable as string) || "queryResult";

	if (!table) throw new Error("Supabase Query: table is required");

	// Dynamic import to avoid circular deps and keep this server-only
	const { getSupabaseForDynamicTables } = await import("$lib/database/supabase.client");
	const supabase = getSupabaseForDynamicTables();

	let result: unknown;

	switch (operation) {
		case "select": {
			const filtersStr = config.filters as string;
			let query = supabase.from(table).select();

			if (filtersStr) {
				try {
					const filters = JSON.parse(filtersStr) as Record<string, unknown>;
					for (const [col, val] of Object.entries(filters)) {
						query = query.eq(col, val as string);
					}
				} catch {
					// If not valid JSON, skip filters
				}
			}

			const { data, error } = await query;
			if (error) throw new Error(`Supabase select error: ${error.message}`);
			result = data;
			break;
		}
		case "insert": {
			const bodyStr = config.body as string;
			let body: Record<string, unknown>;
			try {
				body = JSON.parse(bodyStr);
			} catch {
				throw new Error("Supabase insert: invalid body JSON");
			}

			const { data, error } = await supabase.from(table).insert(body).select();
			if (error) throw new Error(`Supabase insert error: ${error.message}`);
			result = data;
			break;
		}
		case "update": {
			const bodyStr = config.body as string;
			const filtersStr = config.filters as string;
			let body: Record<string, unknown>;
			try {
				body = JSON.parse(bodyStr);
			} catch {
				throw new Error("Supabase update: invalid body JSON");
			}

			let query = supabase.from(table).update(body);
			if (filtersStr) {
				try {
					const filters = JSON.parse(filtersStr) as Record<string, unknown>;
					for (const [col, val] of Object.entries(filters)) {
						query = query.eq(col, val as string);
					}
				} catch {
					// skip
				}
			}

			const { data, error } = await query.select();
			if (error) throw new Error(`Supabase update error: ${error.message}`);
			result = data;
			break;
		}
		case "delete": {
			const filtersStr = config.filters as string;
			let query = supabase.from(table).delete();
			if (filtersStr) {
				try {
					const filters = JSON.parse(filtersStr) as Record<string, unknown>;
					for (const [col, val] of Object.entries(filters)) {
						query = query.eq(col, val as string);
					}
				} catch {
					// skip
				}
			}

			const { error } = await query;
			if (error) throw new Error(`Supabase delete error: ${error.message}`);
			result = { deleted: true };
			break;
		}
		default:
			throw new Error(`Supabase Query: unknown operation "${operation}"`);
	}

	return {
		output: { result },
		stateUpdates: { [resultVariable]: result },
	};
};

const handleCustomScript: NodeHandler = async (ctx) => {
	const code = ctx.config.code as string;
	if (!code?.trim()) return { output: {} };

	try {
		const fn = new Function("state", "input", code);
		const result = await fn(ctx.globalState, ctx.input ?? {});
		const stateUpdates = result && typeof result === "object" ? result : {};

		return {
			output: stateUpdates,
			stateUpdates,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Custom Script error: ${message}`, { cause: err });
	}
};

export const nodeHandlers: Record<NodeType, NodeHandler> = {
	"manual-trigger": handleManualTrigger,
	"webhook-trigger": handleWebhookTrigger,
	"api-call": handleApiCall,
	condition: handleCondition,
	transform: handleTransform,
	delay: handleDelay,
	email: handleEmail,
	loop: handleLoop,
	"supabase-query": handleSupabaseQuery,
	"custom-script": handleCustomScript,
};
