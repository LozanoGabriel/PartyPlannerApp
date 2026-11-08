import { supabase } from "../server";
import { RSVPerror } from "./invitation_logic";

// unpaid -> partial (e.g. a deposit is paid) -> paid
export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface NewBudgetItemInput {
  expense: string;
  budgeted?: number;               // what the host plans to spend (defaults to 0)
  actual?: number;                 // what it really cost (defaults to 0 until known)
  paymentStatus?: PaymentStatus;   // defaults to "unpaid"
}

// For PATCH: send only the fields that changed
export type PatchBudgetItemInput = Partial<NewBudgetItemInput>;

const ITEM_COLUMNS = "id, event_id, expense, budgeted, actual, payment_status, created_at";
const MAX_AMOUNT = 1000000000;

// ---------- helpers ----------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Accepts 250, 250.5 or "250" (text inputs often send strings). Rounds to cents.
function cleanAmount(v: unknown, field: string): number {
  const n: unknown = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > MAX_AMOUNT)
    throw new RSVPerror(`${field} must be a number between 0 and ${MAX_AMOUNT}`, 400);
  return round2(n);
}

// Validates and converts the fields to columns. Only includes what was sent.
function toRow(f: PatchBudgetItemInput) {
  const row: Record<string, unknown> = {};

  if (f.expense !== undefined) {
    if (typeof f.expense !== "string" || !f.expense.trim())
      throw new RSVPerror("Expense name cannot be empty", 400);
    if (f.expense.trim().length > 200)
      throw new RSVPerror("Expense name must be 200 characters or fewer", 400);
    row.expense = f.expense.trim();
  }
  if (f.budgeted !== undefined) row.budgeted = cleanAmount(f.budgeted, "budgeted");
  if (f.actual !== undefined) row.actual = cleanAmount(f.actual, "actual");
  if (f.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(f.paymentStatus))
      throw new RSVPerror(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(", ")}`, 400);
    row.payment_status = f.paymentStatus;
  }

  return row;
}

// The server uses the service-role key, which skips database permissions,
// so these checks are what keep hosts out of each other's budgets.
async function loadOwnedEvent(hostId: string, eventId: string): Promise<{ total_budget: number | null }> {
  if (!eventId) throw new RSVPerror("eventId is required", 400);

  const { data, error } = await supabase
    .from("events")
    .select("id, total_budget")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid eventId", 400);
    throw new RSVPerror(`Failed to load event: ${error.message}`, 500);
  }
  if (!data) throw new RSVPerror("Event not found", 404);
  return data as any;
}

async function assertHostOwnsItem(hostId: string, itemId: string) {
  if (!itemId) throw new RSVPerror("itemId is required", 400);

  const { data, error } = await supabase
    .from("budget_items")
    .select("id, events!inner(host_id)")
    .eq("id", itemId)
    .eq("events.host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid itemId", 400);
    throw new RSVPerror(`Failed to load budget item: ${error.message}`, 500);
  }
  // Same answer whether it doesn't exist or belongs to someone else
  if (!data) throw new RSVPerror("Budget item not found", 404);
}

// Totals for the top of the budget screen
function summarize(items: any[], eventBudget: number | null) {
  const totalBudgeted = round2(items.reduce((sum, i) => sum + Number(i.budgeted), 0));
  const totalActual = round2(items.reduce((sum, i) => sum + Number(i.actual), 0));

  const counts = { unpaid: 0, partial: 0, paid: 0 };
  for (const i of items) counts[i.payment_status as PaymentStatus]++;

  const cap = eventBudget === null || eventBudget === undefined ? null : Number(eventBudget);
  return {
    eventBudget: cap,                                           // the host's overall budget (events.total_budget)
    totalBudgeted,                                              // sum of every line's budgeted amount
    totalActual,                                                // sum of every line's actual amount
    unallocated: cap === null ? null : round2(cap - totalBudgeted), // negative = lines add up to more than the budget
    counts,                                                     // how many lines are unpaid / partial / paid
  };
}

// ---------- the budget ----------

// Get all the budget lines for an event, with totals
export async function getBudgetFromSupabase(hostId: string, eventId: string) {
  const event = await loadOwnedEvent(hostId, eventId);

  const { data, error } = await supabase
    .from("budget_items")
    .select(ITEM_COLUMNS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new RSVPerror(`Failed to load budget: ${error.message}`, 500);

  const items = data ?? [];
  return { items, summary: summarize(items, event.total_budget) };
}

// Add a budget line. Only the expense name is required.
export async function postBudgetToSupabase(hostId: string, eventId: string, input: NewBudgetItemInput) {
  await loadOwnedEvent(hostId, eventId);

  if (typeof input?.expense !== "string" || !input.expense.trim())
    throw new RSVPerror("Expense name is required", 400);

  const { data, error } = await supabase
    .from("budget_items")
    .insert({ event_id: eventId, ...toRow(input) })
    .select(ITEM_COLUMNS)
    .single();

  if (error || !data) throw new RSVPerror(`Failed to create budget item: ${error?.message}`, 500);
  return data; // data.id is the budget item ID
}

// Update a budget line: rename it, change the amounts, or change its payment status
export async function patchBudgetInSupabase(hostId: string, itemId: string, changes: PatchBudgetItemInput) {
  await assertHostOwnsItem(hostId, itemId);

  if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0)
    throw new RSVPerror("No changes provided", 400);

  const row = toRow(changes);
  if (Object.keys(row).length === 0) throw new RSVPerror("No valid fields to update", 400);

  const { data, error } = await supabase
    .from("budget_items")
    .update(row)
    .eq("id", itemId)
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to update budget item: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Budget item not found", 404);
  return data;
}

// Delete a budget line
export async function deleteBudgetItemFromSupabase(hostId: string, itemId: string) {
  await assertHostOwnsItem(hostId, itemId);

  const { error } = await supabase.from("budget_items").delete().eq("id", itemId);
  if (error) throw new RSVPerror(`Failed to delete budget item: ${error.message}`, 500);
}