import type { Plugin, Hooks } from "@opencode-ai/plugin"
import { renderMermaidAscii } from "beautiful-mermaid"

/**
 * Regex to match mermaid code blocks
 * Matches: ```mermaid\n..content..\n```
 */
const MERMAID_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g

/**
 * OpenCode plugin that renders mermaid diagrams as ASCII art
 * 
 * Supported diagram types:
 * - Flowcharts (graph TD/LR/BT/RL)
 * - State diagrams (stateDiagram-v2)
 * - Sequence diagrams (sequenceDiagram)
 * - Class diagrams (classDiagram)
 * - ER diagrams (erDiagram)
 */
export const MermaidRenderer: Plugin = async () => {
  return {
    "experimental.text.complete": async (
      _input: { sessionID: string; messageID: string; partID: string },
      output: { text: string }
    ) => {
      try {
        output.text = renderMermaidBlocks(output.text)
      } catch (error) {
        // If something goes catastrophically wrong, keep original text
        // and add a comment for debugging
        output.text =
          output.text +
          "\n\n<!-- mermaid-renderer: unexpected error - " +
          (error as Error).message +
          " -->"
      }
    },
  } as Hooks
}

/**
 * Find and render all mermaid code blocks in the text
 */
function renderMermaidBlocks(text: string): string {
  return text.replace(MERMAID_BLOCK_REGEX, (_match, mermaidCode: string) => {
    return renderSingleBlock(mermaidCode.trim())
  })
}

/**
 * Render a single mermaid diagram to ASCII
 * On error, returns the original code block with an error comment
 */
function renderSingleBlock(mermaidCode: string): string {
  try {
    const ascii = renderMermaidAscii(mermaidCode)
    
    // Wrap in a code block for proper formatting
    return "```\n" + ascii + "\n```"
  } catch (error) {
    // Keep original mermaid block and add error as comment
    const errorMessage = (error as Error).message || "Unknown error"
    return (
      "```mermaid\n" +
      mermaidCode +
      "\n```\n<!-- mermaid render failed: " +
      escapeHtmlComment(errorMessage) +
      " -->"
    )
  }
}

/**
 * Escape characters that could break HTML comments
 */
function escapeHtmlComment(text: string): string {
  return text.replace(/--/g, "- -").replace(/>/g, "&gt;")
}

// Default export for OpenCode plugin system
export default MermaidRenderer
