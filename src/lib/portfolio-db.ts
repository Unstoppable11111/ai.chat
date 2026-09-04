import fs from "fs";
import path from "path";
import { executeQuery, getDbPool } from "@/lib/db";

export interface UserHolding {
  id: number;
  user_id: string;
  stock_code: string;
  stock_name: string;
  quantity: number;
  cost_price: number;
  hold_type: "core" | "trend" | "attack" | "trial";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PORTFOLIO_FILE = path.join(process.cwd(), "src", "data", "user-portfolios.json");

function ensureLocalFile(): UserHolding[] {
  try {
    const dir = path.dirname(LOCAL_PORTFOLIO_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_PORTFOLIO_FILE)) {
      // 预设默认持仓示例（方便初次体验）
      const initial: UserHolding[] = [
        {
          id: 1,
          user_id: "default_user",
          stock_code: "600584",
          stock_name: "长电科技",
          quantity: 1000,
          cost_price: 72.5,
          hold_type: "core",
          notes: "半导体封测龙头，主线持股",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(LOCAL_PORTFOLIO_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(LOCAL_PORTFOLIO_FILE, "utf8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

function saveLocalHoldings(holdings: UserHolding[]) {
  try {
    const dir = path.dirname(LOCAL_PORTFOLIO_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_PORTFOLIO_FILE, JSON.stringify(holdings, null, 2), "utf8");
  } catch (err) {
    console.error("保存本地持仓文件异常:", err);
  }
}

let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  const pool = getDbPool();
  if (!pool) return;
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_portfolios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
        stock_code VARCHAR(16) NOT NULL,
        stock_name VARCHAR(64) NOT NULL,
        quantity INT NOT NULL DEFAULT 100,
        cost_price DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
        hold_type VARCHAR(32) NOT NULL DEFAULT 'core',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_stock_code (stock_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch {
    // 忽略异常，自动降级
  }
}

export async function getUserHoldings(userId = "default_user"): Promise<UserHolding[]> {
  await ensureTable();
  const rows = await executeQuery<UserHolding>(
    "SELECT id, user_id, stock_code, stock_name, quantity, CAST(cost_price AS DOUBLE) as cost_price, hold_type, notes, created_at, updated_at FROM user_portfolios WHERE user_id = ? ORDER BY id DESC",
    [userId]
  );
  if (rows && Array.isArray(rows)) {
    return rows;
  }
  // 本地降级存储
  const all = ensureLocalFile();
  return all.filter((item) => item.user_id === userId);
}

export async function addUserHolding(
  userId = "default_user",
  item: Omit<UserHolding, "id" | "user_id" | "created_at" | "updated_at">
): Promise<UserHolding> {
  await ensureTable();
  const pool = getDbPool();
  if (pool) {
    try {
      const res = (await executeQuery<Record<string, unknown>>(
        "INSERT INTO user_portfolios (user_id, stock_code, stock_name, quantity, cost_price, hold_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          item.stock_code,
          item.stock_name,
          item.quantity,
          item.cost_price,
          item.hold_type,
          item.notes || "",
        ]
      )) as unknown as { insertId?: number } | null;
      if (res && res.insertId) {
        return {
          id: res.insertId,
          user_id: userId,
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // 降级本地写入
    }
  }

  // 本地文件存储
  const list = ensureLocalFile();
  const newId = list.length > 0 ? Math.max(...list.map((h) => h.id)) + 1 : 1;
  const newHolding: UserHolding = {
    id: newId,
    user_id: userId,
    ...item,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  list.unshift(newHolding);
  saveLocalHoldings(list);
  return newHolding;
}

export async function updateUserHolding(
  id: number,
  userId = "default_user",
  patch: Partial<Omit<UserHolding, "id" | "user_id">>
): Promise<boolean> {
  await ensureTable();
  const pool = getDbPool();
  if (pool) {
    try {
      const fields: string[] = [];
      const values: (string | number | boolean | null | undefined)[] = [];
      if (patch.stock_name !== undefined) {
        fields.push("stock_name = ?");
        values.push(patch.stock_name);
      }
      if (patch.quantity !== undefined) {
        fields.push("quantity = ?");
        values.push(patch.quantity);
      }
      if (patch.cost_price !== undefined) {
        fields.push("cost_price = ?");
        values.push(patch.cost_price);
      }
      if (patch.hold_type !== undefined) {
        fields.push("hold_type = ?");
        values.push(patch.hold_type);
      }
      if (patch.notes !== undefined) {
        fields.push("notes = ?");
        values.push(patch.notes);
      }
      if (fields.length > 0) {
        values.push(id, userId);
        await executeQuery(
          `UPDATE user_portfolios SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
          values
        );
        return true;
      }
    } catch {
      // 降级本地
    }
  }

  // 本地更新
  const list = ensureLocalFile();
  const idx = list.findIndex((h) => h.id === id && h.user_id === userId);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    saveLocalHoldings(list);
    return true;
  }
  return false;
}

export async function deleteUserHolding(id: number, userId = "default_user"): Promise<boolean> {
  await ensureTable();
  const pool = getDbPool();
  if (pool) {
    try {
      await executeQuery("DELETE FROM user_portfolios WHERE id = ? AND user_id = ?", [id, userId]);
      return true;
    } catch {
      // 降级本地
    }
  }

  // 本地删除
  let list = ensureLocalFile();
  const beforeLen = list.length;
  list = list.filter((h) => !(h.id === id && h.user_id === userId));
  if (list.length !== beforeLen) {
    saveLocalHoldings(list);
    return true;
  }
  return false;
}
