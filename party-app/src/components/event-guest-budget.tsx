import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EventFlowButtons } from "./event-flow";
import { BudgetChoice, useEventSettings } from "./event-settings-context";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";
import { GalaAssistant } from "./gala-assistant";

const gala = require("../../assets/images/gala_front_facing.png");
const MAX_GUESTS = 999999999;

type StepProps = { onBack: () => void; onContinue: () => void; eventDetails: Record<string, unknown> };

export function GuestStep({ onBack, onContinue, eventDetails }: StepProps) {
  const { darkMode } = useAppPreferences();
  const { guestCount, setGuestCount } = useEventSettings();
  const valid = guestCount === "" || (/^\d+$/.test(guestCount) && Number(guestCount) <= MAX_GUESTS);
  const count = valid && guestCount !== "" ? Number(guestCount) : 0;

  return (
    <>
      <View style={styles.intro}>
        <Text style={styles.title} accessibilityRole="header">Who&apos;s Invited?</Text>
        <Text style={styles.subtitle}>Set an expected headcount now. Individual guests can be added after the event is created.</Text>
      </View>
      <GalaAssistant
        context="Guest List"
        eventDetails={eventDetails}
        hint="Ask Gala for help estimating attendance."
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">Expected Attendance</Text>
        <Text style={styles.subtitle}>What is the total headcount of attendees (not including plus ones)?</Text>
        <View style={styles.counter}>
          <Pressable accessibilityRole="button" accessibilityLabel="Decrease guest count" accessibilityState={{ disabled: count === 0 }} disabled={count === 0} onPress={() => setGuestCount(String(count - 1))} style={[styles.counterButton, darkMode && styles.darkPanel, count === 0 && styles.disabled]}>
            <Ionicons name="remove" size={24} color={darkMode ? darkPalette.accent : "#c65d58"} />
          </Pressable>
          <TextInput accessibilityLabel="Guest headcount" value={guestCount} onChangeText={setGuestCount} keyboardType="number-pad" maxLength={9} placeholder="Count" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.countInput, darkMode && styles.darkInput]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Increase guest count" accessibilityState={{ disabled: count >= MAX_GUESTS }} disabled={count >= MAX_GUESTS} onPress={() => setGuestCount(String(count + 1))} style={[styles.counterButton, darkMode && styles.darkPanel, count >= MAX_GUESTS && styles.disabled]}>
            <Ionicons name="add" size={24} color={darkMode ? darkPalette.accent : "#c65d58"} />
          </Pressable>
        </View>
        {!valid && <Text style={styles.error} accessibilityRole="alert">Enter a whole number of guests.</Text>}
        <Text style={styles.subtitle}>Leave blank to add guests later. This is a headcount, not a guest list.</Text>
      </View>
      <EventFlowButtons onBack={onBack} onContinue={onContinue} disabled={!valid} disabledHint="Enter a whole number of guests." />
    </>
  );
}

export function BudgetStep({ onBack, onContinue, eventDetails }: StepProps) {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { budgetChoice, setBudgetChoice, budgetAmount, setBudgetAmount } = useEventSettings();
  const validAmount = /^\d{1,9}(\.\d{1,2})?$/.test(budgetAmount);
  const invalidManualBudget = budgetChoice === "manual" && !validAmount;

  function option(choice: Exclude<BudgetChoice, null>, label: string, detail: string, icon: "gala" | "pencil") {
    const selected = budgetChoice === choice;
    return (
      <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityHint={detail} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => setBudgetChoice(choice)} style={[styles.budgetOption, choice === "generate" ? styles.generate : styles.manual, darkMode && choice === "manual" && styles.darkPanel, selected && styles.selected, selected && darkMode && styles.darkSelected]}>
        {icon === "gala" ? <View style={styles.galaFrame}><Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} /></View> : <Ionicons name="pencil-outline" size={25} color={darkMode ? darkPalette.accent : "#c65d58"} />}
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, choice === "manual" && styles.coral, darkMode && choice === "manual" && styles.darkText]}>{label}</Text>
          <Text style={[styles.optionDetail, choice === "manual" && styles.coral, darkMode && choice === "manual" && styles.darkText]}>{detail}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <Text style={styles.title} accessibilityRole="header">Set Your Budget</Text>
      <GalaAssistant
        context="Budget"
        eventDetails={eventDetails}
        hint="Ask Gala for budget categories—no prices needed."
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">How much would you like to spend?</Text>
        <Text style={styles.subtitle}>{aiSuggestions ? "Set an overall budget. Ask Gala for relevant expense categories." : "Set an overall budget for your event, or skip this step."}</Text>
        <View style={[styles.total, darkMode && styles.darkPanel]}>
          <Text style={[styles.totalTitle, darkMode && styles.darkText]}>Your Total Budget</Text>
          {budgetChoice === "manual" ? (
            <>
              <View style={styles.amountEntry}>
                <Text style={[styles.amount, darkMode && styles.darkText]}>$</Text>
                <TextInput accessibilityLabel="Your total budget in dollars" value={budgetAmount} onChangeText={setBudgetAmount} keyboardType="decimal-pad" maxLength={12} placeholder="0.00" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.budgetInput, darkMode && styles.darkText]} />
              </View>
              <Text style={[styles.example, darkMode && styles.darkText]}>Enter an amount in dollars, with up to two decimal places.</Text>
            </>
          ) : (
            <>
              <Text style={[styles.amount, darkMode && styles.darkText]}>Not set</Text>
              <Text style={[styles.example, darkMode && styles.darkText]}>
                {budgetChoice === "generate" ? "Gala can suggest expense categories below." : "Choose a budget option or skip."}
              </Text>
            </>
          )}
        </View>
        <Text style={styles.helpTitle}>{aiSuggestions ? "Would you like Gala to help?" : "Choose a budget approach"}</Text>
        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Budget approach">
          {aiSuggestions && option("generate", "Get Budget Suggestions", "Ask Gala for relevant expense categories. No prices or expenses are saved.", "gala")}
          {option("manual", "I'll Do It Myself", "Enter a total budget manually.", "pencil")}
          <Pressable accessibilityRole="radio" accessibilityLabel="Skip for now" accessibilityState={{ checked: budgetChoice === "skip" }} aria-checked={budgetChoice === "skip"} onPress={() => setBudgetChoice("skip")} style={[styles.skip, budgetChoice === "skip" && styles.selected]}>
            <Text style={styles.optionTitle}>Skip for now</Text>
          </Pressable>
        </View>
        {invalidManualBudget && <Text style={styles.error} accessibilityLiveRegion="polite">Enter a valid budget amount to continue.</Text>}
        <Text style={styles.budgetNotice}>
          {budgetChoice === "manual"
            ? "This total will be saved with the event."
            : budgetChoice === "generate"
              ? "Gala's suggestions are guidance only; no expense items will be saved."
              : "You can set a budget later."}
        </Text>
      </View>
      <EventFlowButtons onBack={onBack} onContinue={onContinue} disabled={invalidManualBudget} disabledHint="Enter a valid budget amount to continue." />
    </>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  darkText: { color: darkPalette.text },
  darkSelected: { borderColor: "#ffffff" },
  intro: { gap: 5, alignItems: "center" },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 24, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" },
  card: { backgroundColor: "#c65d58", borderRadius: 28, padding: 18, gap: 10 },
  cardTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 19, textAlign: "center" },
  counter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginVertical: 8 },
  counterButton: { width: 48, height: 48, backgroundColor: "#ffffff", borderRadius: 24, justifyContent: "center", alignItems: "center" },
  disabled: { opacity: 0.55 },
  countInput: { minWidth: 96, maxWidth: "50%", minHeight: 48, borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 20, textAlign: "center" },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13, textAlign: "center" },
  total: { backgroundColor: "#ffffff", borderRadius: 16, alignItems: "center", padding: 12, gap: 3 },
  totalTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  amount: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 22 },
  amountEntry: { flexDirection: "row", alignItems: "center", gap: 4 },
  budgetInput: { minWidth: 140, minHeight: 48, borderWidth: 1, borderColor: "#888888", borderRadius: 8, color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 20, paddingHorizontal: 10, textAlign: "center" },
  example: { color: "#555555", fontFamily: "DMSans_400Regular", fontSize: 12 },
  helpTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16, textAlign: "center" },
  options: { gap: 8 },
  budgetOption: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 2, borderColor: "transparent", padding: 10, minHeight: 48 },
  generate: { backgroundColor: "#686868" },
  manual: { backgroundColor: "#ffffff" },
  selected: { borderColor: "#1e1e1e" },
  optionText: { flex: 1, gap: 3 },
  optionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center" },
  optionDetail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 16, textAlign: "center" },
  coral: { color: "#a33f3a" },
  galaFrame: { width: 48, height: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 80, height: 80 },
  skip: { minHeight: 48, backgroundColor: "#ffa49f", borderRadius: 16, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center", padding: 8 },
  budgetNotice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center" },
});
