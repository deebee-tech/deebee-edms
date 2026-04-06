import type {
	WorkflowDefinition,
	WorkflowNodeDefinition,
	WorkflowEdgeDefinition,
	WorkflowRunResult,
	StepRunResult,
} from "./types";
import { nodeHandlers, ConditionFalseError } from "./engine-handlers";

export async function executeWorkflow(
	definition: WorkflowDefinition,
	initialState?: Record<string, unknown>,
): Promise<WorkflowRunResult> {
	const runId = crypto.randomUUID();
	const startedAt = new Date().toISOString();
	const steps: StepRunResult[] = [];

	// Initialize global state from definition defaults + overrides
	const globalState: Record<string, unknown> = {};
	for (const v of definition.globalState) {
		if (v.defaultValue !== undefined) {
			globalState[v.key] = v.defaultValue;
		}
	}
	if (initialState) {
		Object.assign(globalState, initialState);
	}

	// Build adjacency map: nodeId -> { success: targetNodeId[], failure: targetNodeId[] }
	const adjacency = buildAdjacencyMap(definition.edges);

	// Find trigger node (entry point)
	const triggerNode = definition.nodes.find((n) => n.type === "manual-trigger" || n.type === "webhook-trigger");

	if (!triggerNode) {
		return {
			id: runId,
			workflowId: definition.id,
			status: "failed",
			globalState,
			steps,
			startedAt,
			completedAt: new Date().toISOString(),
			error: "No trigger node found in workflow",
		};
	}

	const nodeMap = new Map(definition.nodes.map((n) => [n.id, n]));

	try {
		await executeNode(triggerNode, nodeMap, adjacency, globalState, steps);

		return {
			id: runId,
			workflowId: definition.id,
			status: "completed",
			globalState,
			steps,
			startedAt,
			completedAt: new Date().toISOString(),
		};
	} catch (err) {
		return {
			id: runId,
			workflowId: definition.id,
			status: "failed",
			globalState,
			steps,
			startedAt,
			completedAt: new Date().toISOString(),
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

interface AdjacencyEntry {
	success: string[];
	failure: string[];
}

function buildAdjacencyMap(edges: WorkflowEdgeDefinition[]): Map<string, AdjacencyEntry> {
	const map = new Map<string, AdjacencyEntry>();

	for (const edge of edges) {
		if (!map.has(edge.source)) {
			map.set(edge.source, { success: [], failure: [] });
		}
		const entry = map.get(edge.source)!;
		if (edge.sourceHandle === "failure") {
			entry.failure.push(edge.target);
		} else {
			entry.success.push(edge.target);
		}
	}

	return map;
}

async function executeNode(
	node: WorkflowNodeDefinition,
	nodeMap: Map<string, WorkflowNodeDefinition>,
	adjacency: Map<string, AdjacencyEntry>,
	globalState: Record<string, unknown>,
	steps: StepRunResult[],
	input?: Record<string, unknown>,
	visited: Set<string> = new Set(),
): Promise<void> {
	// Cycle detection
	if (visited.has(node.id)) return;
	visited.add(node.id);

	const stepResult: StepRunResult = {
		nodeId: node.id,
		nodeType: node.type,
		status: "running",
		input,
		startedAt: new Date().toISOString(),
	};
	steps.push(stepResult);

	const handler = nodeHandlers[node.type];
	if (!handler) {
		stepResult.status = "failed";
		stepResult.error = `No handler for node type: ${node.type}`;
		stepResult.completedAt = new Date().toISOString();
		throw new Error(stepResult.error);
	}

	try {
		const result = await handler({
			config: node.config,
			globalState,
			input,
		});

		// Merge state updates
		if (result.stateUpdates) {
			Object.assign(globalState, result.stateUpdates);
		}

		stepResult.status = "completed";
		stepResult.output = result.output;
		stepResult.completedAt = new Date().toISOString();

		// Follow success edges
		const edges = adjacency.get(node.id);
		if (edges?.success.length) {
			for (const targetId of edges.success) {
				const targetNode = nodeMap.get(targetId);
				if (targetNode) {
					await executeNode(targetNode, nodeMap, adjacency, globalState, steps, result.output, visited);
				}
			}
		}
	} catch (err) {
		const isConditionFalse = err instanceof ConditionFalseError;

		stepResult.status = isConditionFalse ? "completed" : "failed";
		stepResult.error = err instanceof Error ? err.message : String(err);
		stepResult.completedAt = new Date().toISOString();

		if (isConditionFalse) {
			stepResult.output = { conditionResult: false };
		}

		// Follow failure edges
		const edges = adjacency.get(node.id);
		if (edges?.failure.length) {
			for (const targetId of edges.failure) {
				const targetNode = nodeMap.get(targetId);
				if (targetNode) {
					await executeNode(targetNode, nodeMap, adjacency, globalState, steps, { error: stepResult.error }, visited);
				}
			}
		} else if (!isConditionFalse) {
			// No failure edge and not a condition-false: propagate the error
			throw err;
		}
	}
}
