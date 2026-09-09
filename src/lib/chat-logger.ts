// Raw prompts, replies and IP addresses are not retained by the application.
// Operational metrics must not contain conversation content.
export function logChatMetric(status: string, durationMs: number) {
  console.info(JSON.stringify({ event: "chat_request", status, durationMs }));
}
