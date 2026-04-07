import { executeWorkflow } from "$lib/components/workflow-builder/engine";
import type { WorkflowDefinition } from "$lib/components/workflow-builder/types";
import { supabase } from "$lib/database/supabase.client";
import type { Json } from "$lib/database/supabase.types";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	// Load workflow definition from database
	const { data: workflow, error: dbError } = await supabase
		.from("workflows")
		.select("*")
		.eq("id", id)
		.eq("is_active", true)
		.single();

	if (dbError || !workflow) {
		error(404, "Workflow not found or inactive");
	}

	const definition = workflow.definition as unknown as WorkflowDefinition;

	// Parse optional initial state from request body
	let initialState: Record<string, unknown> | undefined;
	try {
		const body = await request.json();
		if (body?.initialState && typeof body.initialState === "object") {
			initialState = body.initialState;
		}
	} catch {
		// No body or invalid JSON is fine
	}

	// Create a run record
	const { data: run, error: runError } = await supabase
		.from("workflow_runs")
		.insert({
			workflow_id: id,
			status: "running",
			global_state: {},
		})
		.select("id")
		.single();

	if (runError || !run) {
		error(500, "Failed to create workflow run");
	}

	// Execute the workflow
	const result = await executeWorkflow(definition, initialState);

	// Update run record with results
	await supabase
		.from("workflow_runs")
		.update({
			status: result.status,
			global_state: result.globalState as unknown as Json,
			completed_at: result.completedAt,
			error: result.error,
		})
		.eq("id", run.id);

	// Log individual step results
	if (result.steps.length > 0) {
		const stepRecords = result.steps.map((step) => ({
			run_id: run.id,
			node_id: step.nodeId,
			node_type: step.nodeType,
			status: step.status,
			input: (step.input ?? null) as unknown as Json,
			output: (step.output ?? null) as unknown as Json,
			started_at: step.startedAt,
			completed_at: step.completedAt ?? null,
			error: step.error ?? null,
		}));

		await supabase.from("workflow_run_steps").insert(stepRecords);
	}

	return json({
		runId: run.id,
		status: result.status,
		globalState: result.globalState,
		steps: result.steps,
		error: result.error,
	});
};
