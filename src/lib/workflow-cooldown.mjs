/**
 * 生图接口阶梯式熔断与冷却保护控制器 (指数退避: 5 分钟 -> 30 分钟)
 */

// 全局内存单例
const state = {
  cooldownUntil: 0, // 冷却解禁时间戳 (毫秒)
  penaltyTier: 0,   // 惩罚等级: 0: 无, 1: 5分钟, 2: 30分钟
  lastTriggered: 0, // 上次触发熔断的时间戳
};

/**
 * 检查当前生图通道是否处于冷却锁定中
 */
export function getImageCooldownStatus() {
  const now = Date.now();
  if (now < state.cooldownUntil) {
    const remainingSeconds = Math.ceil((state.cooldownUntil - now) / 1000);
    return {
      active: true,
      remainingSeconds,
      tier: state.penaltyTier,
    };
  }

  // 冷却时间已过
  return {
    active: false,
    remainingSeconds: 0,
    tier: state.penaltyTier,
  };
}

/**
 * 触发超时/并发上限熔断惩罚 (5 分钟 -> 30 分钟)
 */
export function triggerImageCooldown(reason = "TIMEOUT_OR_CONCURRENCY") {
  const now = Date.now();

  // 如果距离上次触发在 45 分钟以内，或者当前已有等级 1 惩罚，升级到 30 分钟
  if (state.penaltyTier === 1 && now - state.lastTriggered < 45 * 60 * 1000) {
    state.penaltyTier = 2;
    state.cooldownUntil = now + 30 * 60 * 1000; // 30 分钟
  } else {
    // 首次或常规惩罚: 5 分钟
    state.penaltyTier = 1;
    state.cooldownUntil = now + 5 * 60 * 1000;  // 5 分钟
  }

  state.lastTriggered = now;
  const remainingSeconds = Math.ceil((state.cooldownUntil - now) / 1000);

  console.warn(
    `[Workflow Image Cooldown] 触发熔断保护 (Tier ${state.penaltyTier})，暂停生图 ${
      state.penaltyTier === 2 ? 30 : 5
    } 分钟。原因: ${reason}`
  );

  return {
    cooldownUntil: state.cooldownUntil,
    remainingSeconds,
    tier: state.penaltyTier,
    reason,
  };
}

/**
 * 成功生成后且远离受罚期时重置
 */
export function reportImageSuccess() {
  const now = Date.now();
  if (now > state.cooldownUntil + 60 * 60 * 1000) {
    state.penaltyTier = 0;
  }
}
