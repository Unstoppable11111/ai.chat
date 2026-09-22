// Per-provider backoff is short; client errors never disable the service.
const stateKey = Symbol.for("chen-workflow-image-cooldowns");
const states = globalThis[stateKey] || (globalThis[stateKey] = new Map());

export function getImageCooldownStatus(provider = "default") {
  const state = states.get(provider);
  const remainingSeconds = Math.max(0, Math.ceil(((state?.cooldownUntil || 0) - Date.now()) / 1000));
  return { active: remainingSeconds > 0, remainingSeconds, tier: state?.tier || 0 };
}

export function triggerImageCooldown(reason = "TIMEOUT", provider = "default", retryAfterSeconds = 0) {
  const code = String(reason);
  if (!/429|50[0234]|TIMEOUT|NETWORK/.test(code)) return getImageCooldownStatus(provider);
  const previous = states.get(provider);
  const tier = previous && Date.now() - previous.lastTriggered < 5 * 60 * 1000 ? Math.min(previous.tier + 1, 3) : 1;
  const baseSeconds = code.includes("429") ? 15 : code.includes("TIMEOUT") ? 10 : 5;
  const seconds = Math.min(120, Math.max(baseSeconds * 2 ** (tier - 1), Number(retryAfterSeconds) || 0));
  const state = { cooldownUntil: Date.now() + seconds * 1000, lastTriggered: Date.now(), tier };
  states.set(provider, state);
  return { ...getImageCooldownStatus(provider), cooldownUntil: state.cooldownUntil, reason };
}

export function reportImageSuccess(provider = "default") {
  states.delete(provider);
}
