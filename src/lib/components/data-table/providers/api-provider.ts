import type { DataProvider, DataProviderParams, DataProviderResult } from "../types.js";

export interface ApiProviderConfig<T> {
	/** URL string or function that produces the URL from the current params. */
	endpoint: string | ((params: DataProviderParams) => string);
	/** HTTP method. Defaults to "GET". */
	method?: "GET" | "POST";
	/** Static headers or a factory returning headers (useful for auth tokens). */
	headers?: Record<string, string> | (() => Record<string, string>);
	/**
	 * Transforms generic DataProviderParams into whatever the API expects.
	 * For GET: returns a Record<string, string> merged into query params.
	 * For POST: returns the JSON body object.
	 */
	mapParams: (params: DataProviderParams) => Record<string, unknown>;
	/** Extracts rows, totalCount, and hasMore from the API response JSON. */
	mapResponse: (json: unknown) => DataProviderResult<T>;
	/** Optional custom fetch implementation (defaults to global fetch). */
	fetchFn?: typeof fetch;
}

export function createApiProvider<T>(config: ApiProviderConfig<T>): DataProvider<T> {
	return async (params: DataProviderParams) => {
		const { endpoint, method = "GET", headers, mapParams, mapResponse, fetchFn = fetch } = config;

		const resolvedHeaders = typeof headers === "function" ? headers() : (headers ?? {});
		const mappedParams = mapParams(params);
		const url = typeof endpoint === "function" ? endpoint(params) : endpoint;

		let response: Response;

		if (method === "GET") {
			const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : undefined);
			for (const [key, val] of Object.entries(mappedParams)) {
				if (val !== undefined && val !== null) {
					urlObj.searchParams.set(key, String(val));
				}
			}
			response = await fetchFn(urlObj.toString(), {
				method: "GET",
				headers: { ...resolvedHeaders },
			});
		} else {
			response = await fetchFn(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...resolvedHeaders,
				},
				body: JSON.stringify(mappedParams),
			});
		}

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		return mapResponse(json);
	};
}

// ── Presets ──

/**
 * Preset for standard REST-style APIs.
 * Maps filters as `filter[column]=value`, sort as `sort=col:asc`, pagination as `offset` and `limit`.
 */
export function restPreset<T>(
	baseUrl: string,
): Pick<ApiProviderConfig<T>, "endpoint" | "method" | "mapParams" | "mapResponse"> {
	return {
		endpoint: baseUrl,
		method: "GET",
		mapParams: (params) => {
			const result: Record<string, unknown> = {
				offset: String(params.offset),
				limit: String(params.limit),
			};

			for (const f of params.filters) {
				result[`filter[${f.column}][${f.operator}]`] = f.value;
			}

			if (params.sort.length > 0) {
				result.sort = params.sort.map((s) => `${s.column}:${s.ascending ? "asc" : "desc"}`).join(",");
			}

			return result;
		},
		mapResponse: (json) => {
			const data = json as { rows: T[]; totalCount: number; hasMore?: boolean };
			return {
				rows: data.rows ?? [],
				totalCount: data.totalCount ?? 0,
				hasMore: data.hasMore ?? false,
			};
		},
	};
}

/**
 * Preset for internal SvelteKit +server.ts endpoints.
 * Uses POST with a JSON body containing the full DataProviderParams.
 */
export function sveltekitPreset<T>(
	routePath: string,
): Pick<ApiProviderConfig<T>, "endpoint" | "method" | "mapParams" | "mapResponse"> {
	return {
		endpoint: routePath,
		method: "POST",
		mapParams: (params) => ({
			filters: params.filters,
			filterGroups: params.filterGroups,
			sort: params.sort,
			offset: params.offset,
			limit: params.limit,
		}),
		mapResponse: (json) => {
			const data = json as DataProviderResult<T>;
			return {
				rows: data.rows ?? [],
				totalCount: data.totalCount ?? 0,
				hasMore: data.hasMore ?? false,
			};
		},
	};
}

/**
 * Preset for GraphQL APIs.
 * Wraps params into a GraphQL query with variables.
 */
export function graphqlPreset<T>(
	endpointUrl: string,
	query: string,
	options?: {
		/** How to map DataProviderParams to GraphQL variables. Defaults to passing params directly. */
		mapVariables?: (params: DataProviderParams) => Record<string, unknown>;
		/** Path to extract the result from the GraphQL response. E.g., "data.users" */
		resultPath?: string;
	},
): Pick<ApiProviderConfig<T>, "endpoint" | "method" | "mapParams" | "mapResponse"> {
	return {
		endpoint: endpointUrl,
		method: "POST",
		mapParams: (params) => ({
			query,
			variables: options?.mapVariables
				? options.mapVariables(params)
				: {
						filters: params.filters,
						sort: params.sort,
						offset: params.offset,
						limit: params.limit,
					},
		}),
		mapResponse: (json) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let result: any = json;
			if (options?.resultPath) {
				for (const key of options.resultPath.split(".")) {
					result = result?.[key];
				}
			} else {
				result = (json as { data: unknown }).data;
			}
			const data = result as { rows: T[]; totalCount: number; hasMore?: boolean };
			return {
				rows: data.rows ?? [],
				totalCount: data.totalCount ?? 0,
				hasMore: data.hasMore ?? false,
			};
		},
	};
}
