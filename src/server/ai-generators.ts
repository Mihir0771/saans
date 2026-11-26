import type { FactSheet } from "@/engine/schema";
import { extractInteractionText, runWithModelFallback } from "./gemini";
import { executeEngineTool, GEMINI_TOOL_DECLARATIONS, type EngineToolContext } from "./tools";

export async function defaultExplainGenerator(prompt: string): Promise<string> {
  return runWithModelFallback(async (client, model) => {
    const res = await client.interactions.create({
      model,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            summary: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  actionIds: { type: "array", items: { type: "string" } },
                },
                required: ["title", "body", "actionIds"],
              },
            },
            tips: {
              type: "array",
              items: {
                type: "object",
                properties: { actionId: { type: "string" }, why: { type: "string" } },
                required: ["actionId", "why"],
              },
            },
          },
          required: ["headline", "summary", "sections", "tips"],
        },
      },
      store: false,
    });
    return extractInteractionText(res.outputs);
  });
}

export async function defaultChatGenerator(
  prompt: string,
  ctx: EngineToolContext,
): Promise<{ text: string; factSheet: FactSheet }> {
  return runWithModelFallback(async (client, model) => {
    const first = await client.interactions.create({
      model,
      input: prompt,
      tools: GEMINI_TOOL_DECLARATIONS,
      generation_config: { max_output_tokens: 600 },
      store: false,
    });

    const toolCalls = (first.outputs ?? []).filter(
      (o): o is Extract<typeof o, { type: "function_call" }> => o.type === "function_call",
    );
    if (toolCalls.length === 0) {
      return { text: extractInteractionText(first.outputs), factSheet: ctx.factSheet };
    }

    const toolResults = toolCalls.map((call) => {
      const exec = executeEngineTool(call.name, call.arguments, ctx);
      Object.assign(ctx.factSheet.facts, exec.newFacts);
      return {
        type: "function_result" as const,
        call_id: call.id,
        name: call.name,
        result: JSON.stringify(exec.result),
      };
    });

    const followUp = await client.interactions.create({
      model,
      input: `${prompt}\n\nTool outputs:\n${JSON.stringify(toolResults)}\nUpdated FactSheet:\n${JSON.stringify(ctx.factSheet)}`,
      generation_config: { max_output_tokens: 600 },
      store: false,
    });
    return { text: extractInteractionText(followUp.outputs), factSheet: ctx.factSheet };
  });
}
