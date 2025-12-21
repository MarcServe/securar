import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

let anthropicClient = null;
let openaiClient = null;

/**
 * Get the AI provider to use
 * Prioritizes: OPENAI_API_KEY > ANTHROPIC_API_KEY
 */
export function getAIProvider() {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

/**
 * Check if AI is enabled
 */
export function isAIEnabled() {
  return !!getAIProvider();
}

/**
 * Get or create the Anthropic client
 */
export function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Get or create the OpenAI client
 */
export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Call AI with structured output (provider-agnostic)
 * 
 * @param {Object} options - Call options
 * @param {string} options.systemPrompt - System prompt
 * @param {string} options.userPrompt - User message
 * @param {number} options.maxTokens - Max tokens (default 4096)
 * @returns {Promise<string>} AI response text
 */
export async function callAI({
  systemPrompt,
  userPrompt,
  maxTokens = 4096,
}) {
  const provider = getAIProvider();
  
  if (provider === "openai") {
    return callOpenAI({ systemPrompt, userPrompt, maxTokens });
  } else if (provider === "anthropic") {
    return callClaude({ systemPrompt, userPrompt, maxTokens });
  } else {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY");
  }
}

/**
 * Call OpenAI GPT-4
 */
async function callOpenAI({
  systemPrompt,
  userPrompt,
  maxTokens = 4096,
  model = "gpt-4o",
}) {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Call Anthropic Claude
 */
export async function callClaude({
  systemPrompt,
  userPrompt,
  maxTokens = 4096,
  model = "claude-sonnet-4-20250514",
}) {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: "user", content: userPrompt },
    ],
  });

  // Extract text from response
  const textContent = message.content.find((c) => c.type === "text");
  return textContent?.text || "";
}

/**
 * Call AI and parse JSON response (provider-agnostic)
 * 
 * @param {Object} options - Same as callAI
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function callClaudeJSON(options) {
  const response = await callAI(options);
  
  // Try to extract JSON from response
  try {
    // Look for JSON in code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try parsing the whole response
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse AI JSON response:", error);
    console.error("Response was:", response.substring(0, 500));
    throw new Error("Failed to parse AI response as JSON");
  }
}

// Alias for backwards compatibility
export { callClaudeJSON as callAIJSON };
