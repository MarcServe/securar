import Anthropic from "@anthropic-ai/sdk";

let anthropicClient = null;

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
 * Call Claude with structured output
 * 
 * @param {Object} options - Call options
 * @param {string} options.systemPrompt - System prompt
 * @param {string} options.userPrompt - User message
 * @param {number} options.maxTokens - Max tokens (default 4096)
 * @param {string} options.model - Model to use (default claude-sonnet-4-20250514)
 * @returns {Promise<string>} Claude's response text
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
 * Call Claude and parse JSON response
 * 
 * @param {Object} options - Same as callClaude
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function callClaudeJSON(options) {
  const response = await callClaude(options);
  
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
    console.error("Failed to parse Claude JSON response:", error);
    console.error("Response was:", response);
    throw new Error("Failed to parse AI response as JSON");
  }
}

