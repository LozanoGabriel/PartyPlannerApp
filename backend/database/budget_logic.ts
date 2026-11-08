import { mockBudget, mockOk } from "../mock-data"

export function getBudgetFromSupabase(jwt, event_id) {
    return mockBudget
}

export function postBudgetToSupabase(jwt, budget_data) {
    return mockOk
}

export function patchBudgetInSupabase(jwt, budget_data) {
    return mockOk
}