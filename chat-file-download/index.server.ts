import type { PluginServerContext } from "@getpaseo/plugin/server";
import { findReferencedFiles, latestAssistantText, readChunk } from "./server/files";
import { FILES_ROW_KIND, readFileChunk } from "./shared/files";

export default function contribute(server: PluginServerContext) {
  server.on("agent.turn_ended", async (event, { paseo }) => {
    try {
      const files = await findReferencedFiles(latestAssistantText(event.timeline), event.agent.cwd);
      if (files.length === 0) return;
      await paseo.agents.ref(event.agent.id).timeline.append({
        type: "plugin",
        id: `files-${Date.now()}`,
        kind: FILES_ROW_KIND,
        version: 1,
        data: { files },
      });
      console.log(`chat-file-download: ${files.length} download chip(s) for agent ${event.agent.id}`);
    } catch (error) {
      console.error("chat-file-download: could not append download row", error);
    }
  });
  server.handle(readFileChunk, readChunk);
  return () => {};
}
