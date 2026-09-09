import { executeQuery, executeWrite, getDbPool } from "@/lib/db";

export interface UserHolding {
  id: number; user_id: string; stock_code: string; stock_name: string;
  quantity: number; cost_price: number; hold_type: "core" | "trend" | "attack" | "trial";
  notes?: string; created_at?: string; updated_at?: string;
}
type HoldingInput = Omit<UserHolding, "id" | "user_id" | "created_at" | "updated_at">;
export async function getUserHoldings(userId: string): Promise<UserHolding[]> {
  if (!getDbPool()) throw new Error("Portfolio database is unavailable");
  const rows = await executeQuery<UserHolding>("SELECT id,user_id,stock_code,stock_name,quantity,CAST(cost_price AS DOUBLE) AS cost_price,hold_type,notes,created_at,updated_at FROM user_portfolios WHERE user_id=? ORDER BY id DESC", [userId]);
  if (!rows) throw new Error("Portfolio query failed");
  return rows;
}
export async function addUserHolding(userId: string, item: HoldingInput): Promise<UserHolding> {
  const result = await executeWrite("INSERT INTO user_portfolios (user_id,stock_code,stock_name,quantity,cost_price,hold_type,notes) VALUES (?,?,?,?,?,?,?)", [userId,item.stock_code,item.stock_name,item.quantity,item.cost_price,item.hold_type,item.notes || ""]);
  if (result.affectedRows !== 1 || !result.insertId) throw new Error("Portfolio insert failed");
  return { ...item, user_id: userId, id: result.insertId };
}
export async function updateUserHolding(id: number, userId: string, patch: Partial<HoldingInput>): Promise<boolean> {
  const fields = (["stock_name", "quantity", "cost_price", "hold_type", "notes"] as const).filter(key => patch[key] !== undefined);
  if (!fields.length) return false;
  const result = await executeWrite(`UPDATE user_portfolios SET ${fields.map(key => `${key}=?`).join(",")},updated_at=NOW() WHERE id=? AND user_id=?`, [...fields.map(key => patch[key]!),id,userId]);
  return result.affectedRows === 1;
}
export async function deleteUserHolding(id: number, userId: string): Promise<boolean> {
  return (await executeWrite("DELETE FROM user_portfolios WHERE id=? AND user_id=?", [id,userId])).affectedRows === 1;
}
