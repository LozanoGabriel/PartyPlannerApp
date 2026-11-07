export type EventFields = {
    /**
     * Name of the field (I.E Budget, Dress Code)
     */
    fieldName: string | EventFieldSuggestions,
    /**
     * Description of the field (I.E $1,000 if the fieldName is Budget, 10/10/2026 1PM).
     */
    fieldDescription: string


    /**
     * If this field will collect data from guest, this will be the question asked.
     */
    fieldQuestion?: string,
    /**
     * If this field will collect data, this is the format the question can be answered in
     */
    fieldOption?: "textBox" | "options" | "checkMark",
    /**
     * If options is chosen as fieldOption, this determines what options are selectable by the user
     */
    optionChoices?: string[]

}