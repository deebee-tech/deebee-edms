export const NODE_TYPES = [
	"manual-trigger",
	"webhook-trigger",
	"api-call",
	"condition",
	"transform",
	"delay",
	"email",
	"loop",
	"supabase-query",
	"custom-script",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export type NodeCategory = "trigger" | "action" | "logic" | "integration";

export type GlobalVariableType = "string" | "number" | "boolean" | "object" | "array";

export interface GlobalVariable {
	key: string;
	type: GlobalVariableType;
	defaultValue?: unknown;
	description?: string;
}

export interface WorkflowNodeDefinition {
	id: string;
	type: NodeType;
	label: string;
	position: { x: number; y: number };
	config: Record<string, unknown>;
}

export interface WorkflowEdgeDefinition {
	id: string;
	source: string;
	target: string;
	sourceHandle: "success" | "failure";
	label?: string;
}

export interface WorkflowDefinition {
	id: string;
	name: string;
	description?: string;
	version: number;
	globalState: GlobalVariable[];
	nodes: WorkflowNodeDefinition[];
	edges: WorkflowEdgeDefinition[];
	viewport?: { x: number; y: number; zoom: number };
}

// --- Per-node config interfaces ---

export interface ApiCallConfig {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	url: string;
	headers: Record<string, string>;
	body: string;
	timeout: number;
}

export interface ConditionConfig {
	field: string;
	operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not-contains" | "exists" | "not-exists";
	value: string;
}

export interface TransformConfig {
	assignments: { key: string; value: string }[];
}

export interface DelayConfig {
	duration: number;
	unit: "ms" | "s" | "m" | "h";
}

export interface EmailConfig {
	to: string;
	subject: string;
	body: string;
	from?: string;
}

export interface LoopConfig {
	collection: string;
	itemVariable: string;
	indexVariable: string;
}

export interface SupabaseQueryConfig {
	table: string;
	operation: "select" | "insert" | "update" | "delete";
	filters: string;
	body: string;
	resultVariable: string;
}

export interface CustomScriptConfig {
	code: string;
}

export interface ManualTriggerConfig {
	description: string;
}

export interface WebhookTriggerConfig {
	path: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
}

// --- Config field schema (drives the properties panel) ---

export type ConfigFieldType = "text" | "select" | "number" | "textarea" | "json" | "expression" | "switch" | "kv-pairs";

export interface ConfigFieldOption {
	label: string;
	value: string;
}

export interface ConfigField {
	name: string;
	label: string;
	type: ConfigFieldType;
	placeholder?: string;
	description?: string;
	required?: boolean;
	defaultValue?: unknown;
	options?: ConfigFieldOption[];
}

// --- Execution types ---

export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed";
export type StepRunStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowRunResult {
	id: string;
	workflowId: string;
	status: WorkflowRunStatus;
	globalState: Record<string, unknown>;
	steps: StepRunResult[];
	startedAt: string;
	completedAt?: string;
	error?: string;
}

export interface StepRunResult {
	nodeId: string;
	nodeType: NodeType;
	status: StepRunStatus;
	input?: Record<string, unknown>;
	output?: Record<string, unknown>;
	startedAt: string;
	completedAt?: string;
	error?: string;
}

export interface NodeExecutionContext {
	config: Record<string, unknown>;
	globalState: Record<string, unknown>;
	input?: Record<string, unknown>;
}

export interface NodeExecutionResult {
	output: Record<string, unknown>;
	stateUpdates?: Record<string, unknown>;
}
