export function postTaskToSupabase(jwt, event_id) {
    return 0 // Return task ID here
}
export function deleteTaskFromSupabase(jwt, task_id) {
    return mockOk
}

export function patchTaskInSupabase(jwt, task_data) {
    return mockOk
}

export function getTasksFromSupabase(jwt, event_id?) {
    return [mockTaskDetails,mockTaskDetails]
}