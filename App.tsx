import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  AccessibilityInfo,
  TextInput,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { colors as C, fonts as F } from "./src/theme";
import {
  Icon,
  IconName,
  Orb,
  Tap,
  Glass,
  Button,
  Chip,
  T,
  Heading,
  Field,
  Avatar,
  Section,
  Enter,
  Motion,
  u,
} from "./src/ui";
import { Area, dayKey } from "./src/model";
import {
  State,
  Responsibility,
  Essential,
  initialState,
  validDay,
  complete,
  parseDraft,
} from "./src/domain";
const STORAGE = "lifeos-glossy-v2";
const areaColors: Record<Area, string> = {
  Home: C.mint,
  Personal: C.apricot,
  Family: C.lavender,
  Wellbeing: "#E9F1D7",
};
const areaIcons: Record<Area, IconName> = {
  Home: "home",
  Personal: "spark",
  Family: "people",
  Wellbeing: "leaf",
};
type Page =
  | "Today"
  | "My Life"
  | "Circle"
  | "Support"
  | "Chat"
  | "Essentials"
  | "Inbox"
  | "Settings";
type Sheet =
  null | "task" | "essential" | "member" | "onboarding" | "delete" | "reset";
const newTask = (): Responsibility => ({
  id: "",
  title: "",
  day: dayKey(),
  time: "09:00",
  area: "Personal",
  owner: "You",
  backup: "",
  notes: "",
  done: false,
  repeat: "Never",
});
export default function App() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.paper,
        }}
      >
        <Orb />
      </View>
    );
  return (
    <SafeAreaProvider>
      <LifeOS />
    </SafeAreaProvider>
  );
}
function LifeOS() {
  const insets = useSafeAreaInsets(),
    { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const [state, setState] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  const [page, setPage] = useState<Page>("Today"),
    [sheet, setSheet] = useState<Sheet>(null),
    [notice, setNotice] = useState("");
  const [day, setDay] = useState(dayKey()),
    [filter, setFilter] = useState("All"),
    [area, setArea] = useState<Area | null>(null),
    [search, setSearch] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [actor, setActor] = useState("You");
  const [task, setTask] = useState<Responsibility>(newTask),
    [essential, setEssential] = useState<Essential>({
      id: "",
      title: "",
      category: "Contacts",
      detail: "",
      shared: false,
    }),
    [essentialFilter, setEssentialFilter] = useState("All");
  const [memberName, setMemberName] = useState(""),
    [memberRelation, setMemberRelation] = useState("Family"),
    [memberEmail, setMemberEmail] = useState(""),
    [memberError, setMemberError] = useState("");
  const [chatText, setChatText] = useState(""),
    [thinking, setThinking] = useState(false),
    [voiceDemo, setVoiceDemo] = useState(false),
    [onboardStep, setOnboardStep] = useState(0);
  const [supportStep, setSupportStep] = useState(0),
    [supportDay, setSupportDay] = useState(dayKey()),
    [supportIds, setSupportIds] = useState<string[]>([]),
    [shareIds, setShareIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const motion = {
    reduced: systemReduced || state.reduced,
    haptics: state.haptics,
  };
  const update = (patch: Partial<State>) =>
    setState((v) => ({ ...v, ...patch }));
  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (raw) {
          const d = JSON.parse(raw);
          if (Array.isArray(d.tasks) && Array.isArray(d.members))
            setState({ ...initialState(), ...d });
        }
      })
      .catch(() => setNotice("Saved preview data could not be loaded."))
      .finally(() => setReady(true));
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReduced,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (ready)
      AsyncStorage.setItem(STORAGE, JSON.stringify(state)).catch(() =>
        setNotice("Could not save changes on this device."),
      );
  }, [state, ready]);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(""), 4200);
      return () => clearTimeout(id);
    }
  }, [notice]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    setSearch("");
  }, [page]);
  useEffect(() => {
    if (!voiceDemo) return;
    const id = setTimeout(() => {
      setVoiceDemo(false);
      setChatText("Remind me to plan the week tomorrow");
      setNotice("Sample voice phrase added. No microphone was used.");
    }, 2200);
    return () => clearTimeout(id);
  }, [voiceDemo]);
  const nav = (p: Page) => {
    setPage(p);
    setSheet(null);
    setNotice("");
  };
  const patchTask = (id: string, change: Partial<Responsibility>) =>
    setState((v) => ({
      ...v,
      tasks: v.tasks.map((t) => (t.id === id ? { ...t, ...change } : t)),
    }));
  const toggleTask = (id: string) =>
    setState((v) => ({ ...v, tasks: complete(v.tasks, id) }));
  const openTask = (t: Responsibility) => {
    setTask({ ...t });
    setFormError("");
    setSheet("task");
  };
  const capture = (text = "") => {
    const parsed = parseDraft(text);
    setTask({
      ...newTask(),
      title: parsed.title,
      day: parsed.day,
      owner: actor,
    });
    setFormError("");
    setSheet("task");
  };
  const visibleEssentials = state.essentials.filter(
    (e) => e.shared || (e.owner || "You") === actor,
  );
  const pending = state.tasks.filter((t) => t.pending),
    ownRequests = pending.filter((t) => t.pending === actor);
  const todays = state.tasks.filter((t) => t.day === day),
    done = todays.filter((t) => t.done).length;
  const visible = todays
    .filter(
      (t) =>
        (filter === "All" ||
          (filter === "Mine" ? t.owner === actor : t.owner !== actor)) &&
        t.title.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const eligible = state.tasks.filter(
    (t) =>
      t.day === supportDay &&
      !t.done &&
      t.owner === actor &&
      t.backup &&
      !t.pending,
  );
  const request = (t: Responsibility) => {
    patchTask(t.id, { pending: t.backup });
    setSheet(null);
    setNotice(
      `Demo request for ${t.backup} is pending. Ownership is unchanged.`,
    );
  };
  const sendChat = () => {
    const text = chatText.trim();
    if (!text || thinking) return;
    setChatText("");
    setThinking(true);
    const id = Date.now();
    let reply = "";
    const lower = text.toLowerCase();
    if (
      /today|due|what.*attention/.test(lower) &&
      !/remind|add|need to/.test(lower)
    ) {
      const list = state.tasks.filter(
        (t) => t.day === dayKey() && !t.done && t.owner === actor,
      );
      reply = list.length
        ? `Here’s what’s on your plate today:\n\n${list.map((t) => `${t.time}  ${t.title}`).join("\n")}\n\nOne thing at a time.`
        : "You have no open responsibilities today. A little room to breathe.";
    } else if (/handover|cover|support/.test(lower)) {
      reply = `There are ${pending.length} pending handovers. Open Support to choose what needs covering and review who sees the details.`;
    } else {
      reply =
        "Let’s give that a place. Tap “Create from this” below to review the title, date, owner and reminder time before saving.";
    }
    setState((v) => ({
      ...v,
      messages: [
        ...v.messages,
        { id: String(id), role: "user", text },
        { id: String(id + 1), role: "assistant", text: reply },
      ],
    }));
    setThinking(false);
  };
  const taskRow = (t: Responsibility) => (
    <View
      key={t.id}
      style={[s.taskRow, { paddingVertical: state.compact ? 9 : 15 }]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Complete ${t.title}`}
        aria-checked={t.done}
        accessibilityState={{ checked: t.done }}
        onPress={() => toggleTask(t.id)}
        style={s.checkTarget}
      >
        <View style={[s.check, t.done && s.checkDone]}>
          {t.done && <Icon name="check" size={13} color={C.white} />}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${t.title}`}
        onPress={() => openTask(t)}
        style={{ flex: 1 }}
      >
        <Text
          style={[
            s.taskTitle,
            t.done && { textDecorationLine: "line-through", color: C.muted },
          ]}
        >
          {t.title}
        </Text>
        <View style={[s.row, { gap: 6, marginTop: 6 }]}>
          <View
            style={[
              s.tinyDot,
              {
                backgroundColor: t.done
                  ? "#A7B9B2"
                  : t.area === "Family"
                    ? "#A89DDF"
                    : C.jade,
              },
            ]}
          />
          <Text style={s.small}>
            {t.area} · {t.pending ? `Awaiting ${t.pending}` : t.owner}
          </Text>
          {t.repeat && t.repeat !== "Never" && (
            <Icon name="repeat" size={12} color={C.muted} />
          )}
        </View>
      </Pressable>
      <Text style={s.small}>{t.time}</Text>
    </View>
  );
  const empty = (title: string, body: string) => (
    <Glass style={{ alignItems: "center", paddingVertical: 30 }}>
      <Icon name="leaf" size={29} color={C.jade} />
      <T style={{ fontFamily: F.bold, marginTop: 13 }}>{title}</T>
      <T style={{ color: C.muted, textAlign: "center", marginTop: 7 }}>
        {body}
      </T>
    </Glass>
  );
  const settingsRow = (
    label: string,
    description: string,
    value: boolean,
    onChange: (b: boolean) => void,
  ) => (
    <View style={s.settingRow}>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: F.bold }}>{label}</T>
        <Text style={[s.small, { marginTop: 4 }]}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D9E3E7", true: "#89C7B7" }}
        thumbColor={C.white}
      />
    </View>
  );
  return (
    <Motion.Provider value={motion}>
      <View style={s.stage}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={["#F8FAFF", "#EDF5F3", "#F2F0FA"]}
          style={[
            s.app,
            { paddingTop: insets.top, maxWidth: width > 600 ? 460 : undefined },
          ]}
        >
          <View style={s.header}>
            <Tap
              onPress={() => nav("Today")}
              label="LifeOS home"
              style={s.brand}
            >
              <View style={s.brandMark}>
                <Orb size={27} />
              </View>
              <Text style={s.wordmark}>
                lifeos<Text style={{ color: "#67A393" }}>.</Text>
              </Text>
            </Tap>
            <View style={[s.row, { gap: 9 }]}>
              <Tap
                label="Open inbox"
                onPress={() => nav("Inbox")}
                style={s.iconButton}
              >
                <Icon name="bell" size={19} />
                {pending.length > 0 && <View style={s.badge} />}
              </Tap>
              <Tap
                label="Open profile and settings"
                onPress={() => nav("Settings")}
              >
                <Avatar name={state.name} />
              </Tap>
            </View>
          </View>
          <ScrollView
            ref={scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            <Enter id={page}>
              {page === "Today" && (
                <>
                  <View style={s.greeting}>
                    <Text style={s.eyebrow}>YOUR LIFE, A LITTLE LIGHTER</Text>
                    <View style={s.livePill}>
                      <View style={s.liveDot} />
                      <Text style={s.liveText}>Personal space</Text>
                    </View>
                  </View>
                  <Text style={s.heroTitle}>
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "morning"
                      : new Date().getHours() < 18
                        ? "afternoon"
                        : "evening"}
                    ,
                    <Text style={{ color: C.jade }}>
                      {"\n"}
                      {state.name || "there"}.
                    </Text>
                  </Text>
                  <T style={{ color: C.muted, marginTop: 9 }}>
                    A fresh moment. A little room to breathe.
                  </T>
                  <View style={s.week}>
                    {Array.from({ length: 7 }, (_, i) => {
                      const k = dayKey(i - 2),
                        d = new Date(k + "T12:00:00");
                      return (
                        <Pressable
                          key={k}
                          accessibilityRole="button"
                          accessibilityLabel={d.toLocaleDateString("en", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                          aria-selected={day === k}
                          onPress={() => setDay(k)}
                          style={[s.day, day === k && s.activeDay]}
                        >
                          <Text
                            style={[
                              s.dayName,
                              day === k && { color: "#D5EFE6" },
                            ]}
                          >
                            {d
                              .toLocaleDateString("en", { weekday: "short" })
                              .slice(0, 1)}
                          </Text>
                          <Text
                            style={[
                              s.dayNumber,
                              day === k && { color: C.white },
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                          <View
                            style={[
                              s.dateDot,
                              {
                                backgroundColor: state.tasks.some(
                                  (t) => t.day === k && !t.done,
                                )
                                  ? day === k
                                    ? "#DDF7AF"
                                    : C.jade
                                  : "transparent",
                              },
                            ]}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  <Tap
                    label="Open LifeOS assistant"
                    onPress={() => nav("Chat")}
                  >
                    <LinearGradient
                      colors={["#173F42", "#176658", "#298F79"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.heroCard}
                    >
                      <View style={s.heroGloss} />
                      <View style={{ flex: 1, zIndex: 1 }}>
                        <View style={s.aiPill}>
                          <Icon name="spark" size={11} color="#DFF6C4" />
                          <Text style={s.aiPillText}>
                            YOUR EVERYDAY COMPANION
                          </Text>
                        </View>
                        <Text style={s.captureTitle}>
                          A little less{"\n"}on your mind.
                        </Text>
                        <Text style={s.heroSubtitle}>
                          Tell me what needs a place.
                        </Text>
                        <View style={s.heroCTA}>
                          <Text style={s.heroCTAText}>Let’s talk</Text>
                          <Icon name="arrow" size={15} color={C.white} />
                        </View>
                      </View>
                      <View style={s.orbPosition}>
                        <Orb size={width < 360 ? 82 : 115} animate />
                      </View>
                    </LinearGradient>
                  </Tap>
                  <View style={s.progressStrip}>
                    <View
                      style={{
                        width: 43,
                        height: 43,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Svg
                        width={43}
                        height={43}
                        style={StyleSheet.absoluteFill}
                      >
                        <Circle
                          cx={21.5}
                          cy={21.5}
                          r={18}
                          fill="none"
                          stroke="#DBE9E4"
                          strokeWidth={4}
                        />
                        <Circle
                          cx={21.5}
                          cy={21.5}
                          r={18}
                          fill="none"
                          stroke={C.jade}
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeDasharray={`${113 * (todays.length ? done / todays.length : 0)} 113`}
                          rotation={-90}
                          origin="21.5,21.5"
                        />
                      </Svg>
                      <Text style={s.progressCount}>
                        {done}/{todays.length}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: F.bold, fontSize: 12 }}>
                        {done === todays.length && todays.length
                          ? "Look at you. All taken care of."
                          : "Small steps. More breathing room."}
                      </T>
                      <Text style={s.small}>
                        {todays.length - done} responsibilities left for this
                        day
                      </Text>
                    </View>
                  </View>
                  <Section
                    title="Your daily rhythm"
                    action={searchOpen ? "Close search" : "Search"}
                    onPress={() => {
                      setSearchOpen(!searchOpen);
                      setSearch("");
                    }}
                  />
                  {searchOpen && (
                    <TextInput
                      accessibilityLabel="Search responsibilities"
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Find something in your day…"
                      style={[u.input, { marginBottom: 12 }]}
                    />
                  )}
                  <View style={s.chips}>
                    {["All", "Mine", "Shared"].map((f) => (
                      <Chip
                        key={f}
                        label={f}
                        active={filter === f}
                        onPress={() => setFilter(f)}
                      />
                    ))}
                  </View>
                  <Glass
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 3,
                      marginTop: 13,
                    }}
                  >
                    {visible.length ? (
                      visible.map(taskRow)
                    ) : (
                      <View style={{ padding: 20 }}>
                        <T>No responsibilities here.</T>
                        <T style={{ color: C.muted }}>
                          Add something when you’re ready.
                        </T>
                      </View>
                    )}
                  </Glass>
                  <Tap onPress={() => nav("Circle")} style={s.circleLink}>
                    <View style={s.avatarPair}>
                      <Avatar name={state.name} size={32} />
                      <View style={{ marginLeft: -8 }}>
                        <Avatar name="Alex" size={32} color={C.apricot} />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontSize: 12, fontFamily: F.bold }}>
                        Better, together.
                      </T>
                      <Text style={s.small}>
                        See what your circle is holding.
                      </Text>
                    </View>
                    <Icon name="arrow" size={18} />
                  </Tap>
                </>
              )}
              {page === "My Life" && (
                <>
                  <Text style={s.eyebrow}>THE BIGGER PICTURE</Text>
                  <Heading
                    title={"All the parts\nof your life."}
                    caption="Everything that matters. A place for each part."
                  />
                  <View style={s.areaGrid}>
                    {(Object.keys(areaColors) as Area[]).map((a) => (
                      <View key={a} style={{ width: "48%", flexGrow: 1 }}>
                        <Tap
                          label={`Show ${a} responsibilities`}
                          onPress={() => setArea(area === a ? null : a)}
                        >
                          <LinearGradient
                            colors={["#FFFFFF", areaColors[a]]}
                            style={[
                              s.areaCard,
                              area === a && { borderColor: C.jade },
                            ]}
                          >
                            <View
                              style={[
                                s.areaIcon,
                                { backgroundColor: areaColors[a] },
                              ]}
                            >
                              <Icon
                                name={areaIcons[a]}
                                color={C.jade}
                                size={25}
                              />
                            </View>
                            <Text style={s.areaTitle}>{a}</Text>
                            <Text style={s.small}>
                              {
                                state.tasks.filter(
                                  (t) => t.area === a && !t.done,
                                ).length
                              }{" "}
                              open responsibilities
                            </Text>
                            <View
                              style={{ alignSelf: "flex-end", marginTop: 20 }}
                            >
                              <Icon name="arrow" size={18} />
                            </View>
                          </LinearGradient>
                        </Tap>
                      </View>
                    ))}
                  </View>
                  <Section
                    title={area || "All responsibilities"}
                    action="Add new"
                    onPress={() => {
                      capture();
                      if (area) setTask((v) => ({ ...v, area }));
                    }}
                  />
                  <Glass style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
                    {state.tasks
                      .filter((t) => !area || t.area === area)
                      .map(taskRow)}
                  </Glass>
                  <Tap
                    onPress={() => nav("Essentials")}
                    style={s.essentialsLink}
                  >
                    <View style={s.areaIcon}>
                      <Icon name="shield" color={C.jade} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: F.bold }}>The essentials</T>
                      <Text style={s.small}>
                        Important details, close when it counts.
                      </Text>
                    </View>
                    <Icon name="chevron" size={17} />
                  </Tap>
                </>
              )}
              {page === "Circle" && (
                <>
                  <Text style={s.eyebrow}>YOUR PEOPLE</Text>
                  <Heading
                    title={"You don’t have\nto hold it all."}
                    caption="A shared view. A little more understanding."
                  />
                  <Glass style={{ padding: 15 }}>
                    <Text style={s.small}>Preview as a household member</Text>
                    <View style={[s.chips, { marginTop: 10 }]}>
                      {state.members.map((m) => (
                        <Chip
                          key={m.name}
                          label={m.name}
                          active={actor === m.name}
                          onPress={() => setActor(m.name)}
                        />
                      ))}
                    </View>
                  </Glass>
                  <Section
                    title="Your circle"
                    action="Add person"
                    onPress={() => {
                      setMemberName("");
                      setMemberEmail("");
                      setMemberRelation("Family");
                      setMemberError("");
                      setSheet("member");
                    }}
                  />
                  {state.members.map((m, i) => (
                    <Glass key={m.name} style={{ marginBottom: 14 }}>
                      <View style={[s.row, { gap: 12 }]}>
                        <Avatar
                          name={m.name === "You" ? state.name : m.name}
                          size={47}
                          color={i % 2 ? C.apricot : C.mint}
                        />
                        <View style={{ flex: 1 }}>
                          <T style={{ fontFamily: F.bold, fontSize: 15 }}>
                            {m.name}
                          </T>
                          <Text style={s.small}>{m.relation}</Text>
                        </View>
                        <Text style={s.memberCount}>
                          {
                            state.tasks.filter(
                              (t) => t.owner === m.name && !t.done,
                            ).length
                          }
                        </Text>
                      </View>
                      {state.tasks
                        .filter((t) => t.owner === m.name && !t.done)
                        .map(taskRow)}
                      {!state.tasks.some(
                        (t) => t.owner === m.name && !t.done,
                      ) && (
                        <Text style={[s.small, { marginTop: 16 }]}>
                          A little room to help.
                        </Text>
                      )}
                    </Glass>
                  ))}
                  <Section title="Handover requests" />
                  {pending.length
                    ? pending.map((t) => (
                        <Glass key={t.id} style={{ marginBottom: 13 }}>
                          <T style={{ fontFamily: F.bold }}>{t.title}</T>
                          <Text style={[s.small, { marginTop: 8 }]}>
                            {t.owner} → {t.pending} · awaiting a response
                          </Text>
                          <T style={{ color: C.muted, marginTop: 10 }}>
                            {t.notes || "No extra instructions."}
                          </T>
                          {actor === t.pending ? (
                            <>
                              <Button
                                label="Accept responsibility"
                                onPress={() => {
                                  patchTask(t.id, {
                                    owner: actor,
                                    backup: t.owner,
                                    pending: undefined,
                                  });
                                  setNotice(
                                    "Demo handover accepted. Ownership updated.",
                                  );
                                }}
                              />
                              <Button
                                secondary
                                label="Decline request"
                                onPress={() => {
                                  patchTask(t.id, { pending: undefined });
                                  setNotice(
                                    "Request declined. Original owner remains responsible.",
                                  );
                                }}
                              />
                            </>
                          ) : (
                            <Button
                              secondary
                              label="Cancel request"
                              onPress={() =>
                                patchTask(t.id, { pending: undefined })
                              }
                            />
                          )}
                        </Glass>
                      ))
                    : empty(
                        "Everyone is up to date.",
                        "No handovers are waiting for a response.",
                      )}
                  <Text style={s.demoNote}>
                    Local household simulation. No invitations or messages are
                    sent.
                  </Text>
                </>
              )}
              {page === "Support" && (
                <>
                  <Text style={s.eyebrow}>WHEN LIFE CHANGES</Text>
                  <Heading
                    title={"A softer landing,\nwhen you need it."}
                    caption="Make a little space. Let your circle help."
                  />
                  <Glass style={{ alignItems: "center", paddingVertical: 26 }}>
                    <Orb size={125} animate />
                    <T
                      style={{
                        fontFamily: F.bold,
                        fontSize: 21,
                        marginTop: 14,
                        textAlign: "center",
                      }}
                    >
                      {state.support
                        ? "Your support plan is active."
                        : "It’s okay to need a hand."}
                    </T>
                    <T
                      style={{
                        color: C.muted,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      Choose what needs covering. Share only what helps.
                    </T>
                  </Glass>
                  {state.support ? (
                    <>
                      <Glass style={{ marginTop: 17 }}>
                        <Text style={s.eyebrow}>YOUR PLAN</Text>
                        <T style={{ fontFamily: F.bold, marginTop: 10 }}>
                          {state.supportReason}
                        </T>
                        <T style={{ color: C.muted, marginTop: 8 }}>
                          {pending.length} pending requests. Accepted handovers
                          stay with their new owner.
                        </T>
                        <Button
                          label="Review handovers"
                          onPress={() => nav("Circle")}
                        />
                        <Button
                          secondary
                          label="End support mode"
                          onPress={() => {
                            setState((v) => ({
                              ...v,
                              support: false,
                              tasks: v.tasks.map((t) => ({
                                ...t,
                                pending: undefined,
                              })),
                            }));
                            setSupportStep(0);
                            setNotice(
                              "Support mode ended. Pending requests cleared.",
                            );
                          }}
                        />
                      </Glass>
                    </>
                  ) : supportStep === 0 ? (
                    <Button
                      label="Prepare a support plan"
                      onPress={() => {
                        setSupportDay(dayKey());
                        setSupportStep(1);
                      }}
                    />
                  ) : supportStep === 1 ? (
                    <>
                      <Section title="What would help right now?" />
                      <View style={s.chips}>
                        {[
                          "I’m unwell",
                          "I’m away",
                          "A little breathing room",
                        ].map((r) => (
                          <Chip
                            key={r}
                            label={r}
                            active={state.supportReason === r}
                            onPress={() => update({ supportReason: r })}
                          />
                        ))}
                      </View>
                      <Section title="When do you need cover?" />
                      <View style={s.chips}>
                        {[0, 1].map((n) => (
                          <Chip
                            key={n}
                            label={n ? "Tomorrow" : "Today"}
                            active={supportDay === dayKey(n)}
                            onPress={() => setSupportDay(dayKey(n))}
                          />
                        ))}
                      </View>
                      <Button
                        label="Choose responsibilities"
                        onPress={() => {
                          setSupportIds(eligible.map((t) => t.id));
                          setShareIds([]);
                          setSupportStep(2);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Section
                        title="Review your handover"
                        action="Back"
                        onPress={() => setSupportStep(1)}
                      />
                      {eligible.length
                        ? eligible.map((t) => (
                            <Pressable
                              accessibilityRole="checkbox"
                              accessibilityLabel={`Cover ${t.title}`}
                              aria-checked={supportIds.includes(t.id)}
                              key={t.id}
                              onPress={() =>
                                setSupportIds((v) =>
                                  v.includes(t.id)
                                    ? v.filter((id) => id !== t.id)
                                    : [...v, t.id],
                                )
                              }
                              style={s.selectRow}
                            >
                              <View
                                style={[
                                  s.check,
                                  supportIds.includes(t.id) && s.checkDone,
                                ]}
                              >
                                {supportIds.includes(t.id) && (
                                  <Icon
                                    name="check"
                                    size={13}
                                    color={C.white}
                                  />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <T style={{ fontFamily: F.bold }}>{t.title}</T>
                                <Text style={s.small}>
                                  Backup: {t.backup} · {t.time}
                                </Text>
                              </View>
                            </Pressable>
                          ))
                        : empty(
                            "No cover needed here.",
                            "Add a backup to an open responsibility for this day.",
                          )}
                      <Section title="Essential notes to share" />
                      {visibleEssentials.map((e) => (
                        <Pressable
                          accessibilityRole="checkbox"
                          aria-checked={shareIds.includes(e.id)}
                          accessibilityLabel={`Share ${e.title}`}
                          key={e.id}
                          onPress={() =>
                            setShareIds((v) =>
                              v.includes(e.id)
                                ? v.filter((id) => id !== e.id)
                                : [...v, e.id],
                            )
                          }
                          style={s.selectRow}
                        >
                          <View
                            style={[
                              s.check,
                              shareIds.includes(e.id) && s.checkDone,
                            ]}
                          >
                            {shareIds.includes(e.id) && (
                              <Icon name="check" size={13} color={C.white} />
                            )}
                          </View>
                          <T style={{ flex: 1 }}>{e.title}</T>
                        </Pressable>
                      ))}
                      <T style={{ color: C.muted, marginTop: 15 }}>
                        Selected task details go to their backup. Selected
                        essential notes become visible to your whole demo
                        household.
                      </T>
                      <Button
                        label={`Activate demo plan (${supportIds.length})`}
                        disabled={!supportIds.length}
                        onPress={() => {
                          setState((v) => ({
                            ...v,
                            support: true,
                            tasks: v.tasks.map((t) =>
                              supportIds.includes(t.id)
                                ? { ...t, pending: t.backup }
                                : t,
                            ),
                            essentials: v.essentials.map((e) =>
                              shareIds.includes(e.id)
                                ? { ...e, shared: true }
                                : e,
                            ),
                          }));
                          setNotice(
                            "Demo support plan active. No messages sent.",
                          );
                        }}
                      />
                    </>
                  )}
                  <Button
                    secondary
                    label="Open essential information"
                    icon="shield"
                    onPress={() => nav("Essentials")}
                  />
                  <Text style={s.demoNote}>
                    Local demo. LifeOS does not contact emergency services.
                  </Text>
                </>
              )}
              {page === "Chat" && (
                <>
                  <View style={s.chatHeading}>
                    <Orb size={62} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: F.bold, fontSize: 23 }}>
                        A little less to carry.
                      </T>
                      <Text style={s.small}>Your LifeOS companion</Text>
                    </View>
                  </View>
                  <View style={s.chatNotice}>
                    <Icon name="spark" size={14} color={C.jade} />
                    <Text style={[s.small, { flex: 1 }]}>
                      Interactive command preview · AI is not connected
                    </Text>
                  </View>
                  {state.messages.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        s.bubble,
                        m.role === "user" ? s.userBubble : s.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          s.message,
                          m.role === "user" && { color: C.white },
                        ]}
                      >
                        {m.text}
                      </Text>
                      {m.role === "user" &&
                        /remind|add|need to/i.test(m.text) && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => capture(m.text)}
                            style={s.chatAction}
                          >
                            <Text
                              style={{
                                color: "#E0F4BA",
                                fontFamily: F.bold,
                                fontSize: 12,
                              }}
                            >
                              Create from this →
                            </Text>
                          </Pressable>
                        )}
                    </View>
                  ))}
                  <View style={s.chips}>
                    {[
                      "What’s on today?",
                      "Help me with a handover",
                      "Remind me to plan the week tomorrow",
                    ].map((text) => (
                      <Chip
                        key={text}
                        label={text}
                        active={false}
                        onPress={() => setChatText(text)}
                      />
                    ))}
                  </View>
                  <Glass style={{ marginTop: 20, padding: 12 }}>
                    <TextInput
                      accessibilityLabel="Message LifeOS"
                      value={chatText}
                      onChangeText={setChatText}
                      placeholder="Let a thought go…"
                      placeholderTextColor={C.muted}
                      multiline
                      style={s.chatInput}
                    />
                    <View style={[s.row, { justifyContent: "space-between" }]}>
                      <Tap
                        label="Try sample voice capture"
                        onPress={() => setVoiceDemo(!voiceDemo)}
                        style={s.voiceButton}
                      >
                        <Icon name="mic" color={C.jade} />
                        <Text style={s.small}>
                          {voiceDemo
                            ? "Listening to sample…"
                            : "Try voice demo"}
                        </Text>
                      </Tap>
                      <Tap
                        label="Send message"
                        disabled={!chatText.trim() || thinking}
                        onPress={sendChat}
                        style={s.sendButton}
                      >
                        <Icon name="arrow" color={C.white} />
                      </Tap>
                    </View>
                  </Glass>
                  {voiceDemo && (
                    <View style={{ alignItems: "center", padding: 15 }}>
                      <Orb size={65} animate />
                      <Text style={s.small}>
                        Sample voice animation · no audio is recorded
                      </Text>
                    </View>
                  )}
                  <Button
                    secondary
                    label="Create a responsibility"
                    icon="plus"
                    onPress={() => capture()}
                  />
                </>
              )}
              {page === "Essentials" && (
                <>
                  <Text style={s.eyebrow}>CLOSE WHEN IT COUNTS</Text>
                  <Heading
                    title={"The important\nlittle details."}
                    caption="The information that makes helping easier."
                  />
                  <View style={s.chips}>
                    {["All", "Contacts", "Home", "Documents"].map((f) => (
                      <Chip
                        key={f}
                        label={f}
                        active={essentialFilter === f}
                        onPress={() => setEssentialFilter(f)}
                      />
                    ))}
                  </View>
                  <Button
                    label="Add an essential"
                    icon="plus"
                    onPress={() => {
                      setEssential({
                        id: "",
                        title: "",
                        category: "Contacts",
                        detail: "",
                        shared: false,
                        owner: actor,
                      });
                      setFormError("");
                      setSheet("essential");
                    }}
                  />
                  {visibleEssentials
                    .filter(
                      (e) =>
                        essentialFilter === "All" ||
                        e.category === essentialFilter,
                    )
                    .map((e) => (
                      <Tap
                        key={e.id}
                        label={`Edit ${e.title}`}
                        onPress={() => {
                          setEssential({ ...e });
                          setFormError("");
                          setSheet("essential");
                        }}
                      >
                        <Glass style={{ marginTop: 15 }}>
                          <View style={[s.row, { gap: 12 }]}>
                            <View style={s.areaIcon}>
                              <Icon
                                name={
                                  e.category === "Contacts"
                                    ? "phone"
                                    : e.category === "Home"
                                      ? "home"
                                      : "file"
                                }
                                color={C.jade}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <T style={{ fontFamily: F.bold }}>{e.title}</T>
                              <Text style={s.small}>
                                {e.category} ·{" "}
                                {e.shared ? "Shared with circle" : "Only you"}
                              </Text>
                            </View>
                            <Icon name="chevron" size={16} />
                          </View>
                          <T style={{ color: C.muted, marginTop: 15 }}>
                            {e.detail}
                          </T>
                        </Glass>
                      </Tap>
                    ))}
                  {!visibleEssentials.filter(
                    (e) =>
                      essentialFilter === "All" ||
                      e.category === essentialFilter,
                  ).length && (
                    <View style={{ marginTop: 20 }}>
                      {empty(
                        "Nothing added yet.",
                        "Start with a contact or a helpful note.",
                      )}
                    </View>
                  )}
                  <Text style={s.demoNote}>
                    Unencrypted local preview storage. Use sample information
                    only.
                  </Text>
                </>
              )}
              {page === "Inbox" && (
                <>
                  <Text style={s.eyebrow}>A GENTLE HEADS-UP</Text>
                  <Heading
                    title="Your updates."
                    caption="What’s waiting, without the noise."
                  />
                  <Section title={`Requests for ${actor}`} />
                  {ownRequests.length
                    ? ownRequests.map((t) => (
                        <Glass key={t.id} style={{ marginBottom: 12 }}>
                          <T style={{ fontFamily: F.bold }}>
                            {t.owner} could use a hand.
                          </T>
                          <T style={{ color: C.muted, marginTop: 8 }}>
                            {t.title}
                          </T>
                          <Button
                            label="Review in your circle"
                            onPress={() => nav("Circle")}
                          />
                        </Glass>
                      ))
                    : empty(
                        "Nothing waiting for you.",
                        "New demo handover requests will appear here.",
                      )}
                  <Section title="Today’s reminders" />
                  {state.reminders ? (
                    <Glass style={{ paddingVertical: 3 }}>
                      {state.tasks
                        .filter(
                          (t) =>
                            t.day === dayKey() && !t.done && t.owner === actor,
                        )
                        .map(taskRow)}
                      {!state.tasks.some(
                        (t) =>
                          t.day === dayKey() && !t.done && t.owner === actor,
                      ) && (
                        <T style={{ paddingVertical: 18 }}>
                          You’re all caught up.
                        </T>
                      )}
                    </Glass>
                  ) : (
                    <Glass>
                      <T>In-app reminders are paused.</T>
                      <Button
                        secondary
                        label="Turn reminders on"
                        onPress={() => update({ reminders: true })}
                      />
                    </Glass>
                  )}
                  <Text style={s.demoNote}>
                    In-app preview only. Device push notifications are not
                    scheduled.
                  </Text>
                </>
              )}
              {page === "Settings" && (
                <>
                  <Heading
                    title="Your own rhythm."
                    caption="Make LifeOS feel a little more like you."
                  />
                  <Glass>
                    <View style={[s.row, { gap: 14 }]}>
                      <Avatar name={state.name} size={59} />
                      <View>
                        <T style={{ fontFamily: F.bold, fontSize: 19 }}>
                          {state.name || "Your space"}
                        </T>
                        <Text style={s.small}>
                          Personal demo space · LifeOS 0.2
                        </Text>
                      </View>
                    </View>
                    <Field
                      label="Your name"
                      value={state.name}
                      onChange={(name) => update({ name })}
                    />
                  </Glass>
                  <Section title="Feel & feedback" />
                  <Glass style={{ paddingVertical: 3 }}>
                    {settingsRow(
                      "Reduce motion",
                      "Keep transitions still and comfortable.",
                      state.reduced,
                      (b) => update({ reduced: b }),
                    )}
                    {settingsRow(
                      "Haptic feedback",
                      "A gentle touch response on native devices.",
                      state.haptics,
                      (b) => update({ haptics: b }),
                    )}
                    {settingsRow(
                      "Compact task rows",
                      "Fit a little more into your day.",
                      state.compact,
                      (b) => update({ compact: b }),
                    )}
                    {settingsRow(
                      "In-app reminders",
                      "Show your due tasks in the inbox.",
                      state.reminders,
                      (b) => update({ reminders: b }),
                    )}
                  </Glass>
                  <Section title="Explore your space" />
                  <Button
                    secondary
                    label="Meet LifeOS"
                    icon="spark"
                    onPress={() => {
                      setOnboardStep(0);
                      setSheet("onboarding");
                    }}
                  />
                  <Button
                    secondary
                    label="Essential information"
                    icon="shield"
                    onPress={() => nav("Essentials")}
                  />
                  <Button
                    secondary
                    label="Reset demo space"
                    icon="repeat"
                    onPress={() => setSheet("reset")}
                  />
                  <Text style={s.demoNote}>
                    All changes stay on this device. Real accounts, cloud sync,
                    voice transcription and notifications are not connected.
                  </Text>
                </>
              )}
            </Enter>
          </ScrollView>
          <View
            style={[s.navWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
          >
            <BlurView intensity={65} tint="light" style={s.nav}>
              {(
                ["Today", "My Life", "Chat", "Circle", "Support"] as Page[]
              ).map((p, i) => (
                <Pressable
                  key={p}
                  accessibilityRole="tab"
                  accessibilityLabel={p}
                  aria-selected={page === p}
                  onPress={() => nav(p)}
                  style={[s.navItem, p === "Chat" && s.centerNav]}
                >
                  {p === "Chat" ? (
                    <LinearGradient
                      colors={["#5BA58F", "#176B5D"]}
                      style={s.navOrb}
                    >
                      <Icon name="spark" size={24} color={C.white} />
                    </LinearGradient>
                  ) : (
                    <>
                      <Icon
                        name={
                          (
                            [
                              "sun",
                              "grid",
                              "chat",
                              "people",
                              "heart",
                            ] as IconName[]
                          )[i]
                        }
                        size={21}
                        color={page === p ? C.jade : C.muted}
                      />
                      <Text
                        style={[
                          s.navLabel,
                          page === p && { color: C.jade, fontFamily: F.bold },
                        ]}
                      >
                        {p}
                      </Text>
                      <View
                        style={[
                          s.navDot,
                          {
                            backgroundColor:
                              page === p ? C.jade : "transparent",
                          },
                        ]}
                      />
                    </>
                  )}
                </Pressable>
              ))}
            </BlurView>
          </View>
          {page === "Today" && (
            <View style={s.quickAdd}>
              <Tap
                label="Add a responsibility"
                onPress={() => capture()}
                style={s.quickAddButton}
              >
                <Icon name="plus" size={22} color={C.white} />
              </Tap>
            </View>
          )}
          {!!notice && !sheet && (
            <View
              accessibilityRole="alert"
              style={[s.toast, { bottom: 103 + insets.bottom }]}
            >
              <Text style={s.toastText}>{notice}</Text>
            </View>
          )}
          <Modal
            visible={sheet !== null}
            transparent
            animationType={motion.reduced ? "none" : "slide"}
            onRequestClose={() => setSheet(null)}
          >
            <KeyboardAvoidingView
              style={s.modal}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <LinearGradient
                colors={["#F7FAFD", "#EFF5F2"]}
                style={[
                  s.sheet,
                  { paddingBottom: Math.max(insets.bottom, 25) },
                ]}
              >
                <View style={s.sheetHandle} />
                <View style={s.sheetHeader}>
                  <Text style={s.eyebrow}>
                    {sheet === "task"
                      ? "RESPONSIBILITY"
                      : sheet === "essential"
                        ? "ESSENTIAL INFORMATION"
                        : "YOUR LIFEOS"}
                  </Text>
                  <Tap
                    label="Close panel"
                    onPress={() => setSheet(null)}
                    style={s.iconButton}
                  >
                    <Icon name="close" size={20} />
                  </Tap>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {!!notice && (
                    <Text
                      accessibilityRole="alert"
                      style={[s.small, { color: C.jade, marginBottom: 12 }]}
                    >
                      {notice}
                    </Text>
                  )}
                  {sheet === "task" && (
                    <>
                      <Heading
                        title={
                          task.id ? "The little details." : "Give it a place."
                        }
                        caption={
                          task.id
                            ? "A clear next step. A little less to remember."
                            : "Capture a thought. Review it before saving."
                        }
                      />
                      <Field
                        label="Responsibility title"
                        value={task.title}
                        onChange={(title) => setTask((v) => ({ ...v, title }))}
                        placeholder="What needs taking care of?"
                      />
                      <View style={s.formColumns}>
                        <View style={{ flex: 1 }}>
                          <Field
                            label="Date (YYYY-MM-DD)"
                            value={task.day}
                            onChange={(day) => setTask((v) => ({ ...v, day }))}
                          />
                        </View>
                        <View style={{ width: 105 }}>
                          <Field
                            label="Time (24-hour)"
                            value={task.time}
                            onChange={(time) =>
                              setTask((v) => ({ ...v, time }))
                            }
                          />
                        </View>
                      </View>
                      <View style={[s.chips, { marginTop: 12 }]}>
                        {[0, 1, 2].map((n) => (
                          <Chip
                            key={n}
                            label={["Today", "Tomorrow", "In 2 days"][n]}
                            active={task.day === dayKey(n)}
                            onPress={() =>
                              setTask((v) => ({ ...v, day: dayKey(n) }))
                            }
                          />
                        ))}
                      </View>
                      <Text style={s.formLabel}>Life area</Text>
                      <View style={s.chips}>
                        {(Object.keys(areaColors) as Area[]).map((a) => (
                          <Chip
                            key={a}
                            label={a}
                            active={task.area === a}
                            onPress={() => setTask((v) => ({ ...v, area: a }))}
                          />
                        ))}
                      </View>
                      <Text style={s.formLabel}>Owner</Text>
                      <View style={s.chips}>
                        {state.members.map((m) => (
                          <Chip
                            key={m.name}
                            label={m.name}
                            active={task.owner === m.name}
                            onPress={() =>
                              setTask((v) => ({
                                ...v,
                                owner: m.name,
                                backup: v.backup === m.name ? "" : v.backup,
                                pending: undefined,
                              }))
                            }
                          />
                        ))}
                      </View>
                      <Text style={s.formLabel}>Backup</Text>
                      <View style={s.chips}>
                        {[
                          "None",
                          ...state.members
                            .filter((m) => m.name !== task.owner)
                            .map((m) => m.name),
                        ].map((m) => (
                          <Chip
                            key={m}
                            label={m}
                            active={(task.backup || "None") === m}
                            onPress={() =>
                              setTask((v) => ({
                                ...v,
                                backup: m === "None" ? "" : m,
                                pending: undefined,
                              }))
                            }
                          />
                        ))}
                      </View>
                      <Text style={s.formLabel}>Repeat</Text>
                      <View style={s.chips}>
                        {(["Never", "Daily", "Weekly"] as const).map((r) => (
                          <Chip
                            key={r}
                            label={r}
                            active={(task.repeat || "Never") === r}
                            onPress={() =>
                              setTask((v) => ({ ...v, repeat: r }))
                            }
                          />
                        ))}
                      </View>
                      <Field
                        label="Helpful instructions"
                        value={task.notes}
                        onChange={(notes) => setTask((v) => ({ ...v, notes }))}
                        multiline
                        placeholder="What would a backup person need to know?"
                      />
                      {!!formError && (
                        <Text accessibilityRole="alert" style={s.error}>
                          {formError}
                        </Text>
                      )}
                      <Button
                        label={task.id ? "Save changes" : "Save responsibility"}
                        disabled={!task.title.trim()}
                        onPress={() => {
                          if (
                            !validDay(task.day) ||
                            !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.time)
                          ) {
                            setFormError(
                              "Use a valid date and a 24-hour time, such as 14:30.",
                            );
                            return;
                          }
                          const saved = {
                            ...task,
                            id: task.id || Date.now().toString(),
                            title: task.title.trim(),
                          };
                          setState((v) => ({
                            ...v,
                            tasks: task.id
                              ? v.tasks.map((t) =>
                                  t.id === task.id ? saved : t,
                                )
                              : [...v.tasks, saved],
                          }));
                          setSheet(null);
                          setDay(task.day);
                          setNotice("Saved. A little less on your mind.");
                        }}
                      />
                      {task.id && (
                        <>
                          <Button
                            secondary
                            label={
                              task.done
                                ? "Reopen responsibility"
                                : "Mark complete"
                            }
                            icon="check"
                            onPress={() => {
                              toggleTask(task.id);
                              setSheet(null);
                            }}
                          />
                          {!task.done && task.backup && !task.pending && (
                            <Button
                              secondary
                              label={`Request cover from ${task.backup}`}
                              icon="people"
                              onPress={() => {
                                patchTask(task.id, task);
                                request(task);
                              }}
                            />
                          )}
                          <Button
                            secondary
                            label="Delete responsibility"
                            icon="trash"
                            onPress={() => setSheet("delete")}
                          />
                        </>
                      )}
                    </>
                  )}
                  {sheet === "essential" && (
                    <>
                      <Heading
                        title={
                          essential.id
                            ? "Keep the details close."
                            : "Something worth keeping."
                        }
                      />
                      <Field
                        label="Essential title"
                        value={essential.title}
                        onChange={(title) =>
                          setEssential((v) => ({ ...v, title }))
                        }
                      />
                      <Text style={s.formLabel}>Category</Text>
                      <View style={s.chips}>
                        {(["Contacts", "Home", "Documents"] as const).map(
                          (c) => (
                            <Chip
                              key={c}
                              label={c}
                              active={essential.category === c}
                              onPress={() =>
                                setEssential((v) => ({ ...v, category: c }))
                              }
                            />
                          ),
                        )}
                      </View>
                      <Field
                        label="Details"
                        value={essential.detail}
                        onChange={(detail) =>
                          setEssential((v) => ({ ...v, detail }))
                        }
                        multiline
                      />
                      {settingsRow(
                        "Share with circle",
                        "Visible to all members of this demo household.",
                        essential.shared,
                        (b) => setEssential((v) => ({ ...v, shared: b })),
                      )}
                      <Text style={s.small}>
                        Use sample information only. This preview is not secure
                        document storage.
                      </Text>
                      <Button
                        label="Save essential"
                        disabled={
                          !essential.title.trim() || !essential.detail.trim()
                        }
                        onPress={() => {
                          setState((v) => ({
                            ...v,
                            essentials: essential.id
                              ? v.essentials.map((e) =>
                                  e.id === essential.id
                                    ? {
                                        ...essential,
                                        title: essential.title.trim(),
                                      }
                                    : e,
                                )
                              : [
                                  ...v.essentials,
                                  {
                                    ...essential,
                                    title: essential.title.trim(),
                                    id: Date.now().toString(),
                                  },
                                ],
                          }));
                          setSheet(null);
                          setNotice("Essential saved.");
                        }}
                      />
                      {essential.id && (
                        <Button
                          secondary
                          label="Delete essential"
                          icon="trash"
                          onPress={() => {
                            setState((v) => ({
                              ...v,
                              essentials: v.essentials.filter(
                                (e) => e.id !== essential.id,
                              ),
                            }));
                            setSheet(null);
                            setNotice("Essential removed.");
                          }}
                        />
                      )}
                    </>
                  )}
                  {sheet === "member" && (
                    <>
                      <Heading
                        title="A little more support."
                        caption="Add a person to explore sharing in this demo."
                      />
                      <Field
                        label="Name"
                        value={memberName}
                        onChange={setMemberName}
                      />
                      <Field
                        label="Relationship"
                        value={memberRelation}
                        onChange={setMemberRelation}
                      />
                      <Field
                        label="Email (optional)"
                        value={memberEmail}
                        onChange={setMemberEmail}
                        keyboardType="email-address"
                      />
                      {!!memberError && (
                        <Text accessibilityRole="alert" style={s.error}>
                          {memberError}
                        </Text>
                      )}
                      <Button
                        label="Add demo member"
                        disabled={!memberName.trim()}
                        onPress={() => {
                          const name = memberName.trim();
                          if (
                            state.members.some(
                              (m) =>
                                m.name.toLowerCase() === name.toLowerCase(),
                            )
                          ) {
                            setMemberError(
                              "That name is already in your circle. Use a distinct name.",
                            );
                            return;
                          }
                          if (
                            memberEmail &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)
                          ) {
                            setMemberError(
                              "Enter a valid email or leave it blank.",
                            );
                            return;
                          }
                          setState((v) => ({
                            ...v,
                            members: [
                              ...v.members,
                              {
                                name,
                                relation: memberRelation,
                                email: memberEmail,
                              },
                            ],
                          }));
                          setSheet(null);
                          setNotice(
                            "Demo member added. No invitation was sent.",
                          );
                        }}
                      />
                      <Text style={s.demoNote}>
                        Invitations will be connected when accounts and sharing
                        are built.
                      </Text>
                    </>
                  )}
                  {sheet === "onboarding" && (
                    <>
                      <View style={{ alignItems: "center", padding: 15 }}>
                        <Orb size={145} animate />
                      </View>
                      <Heading
                        title={
                          [
                            "A little more\nroom to live.",
                            "Your life,\nwith a little help.",
                            "Ready for your\nown rhythm?",
                          ][onboardStep]
                        }
                        caption={
                          [
                            "One home for your thoughts, responsibilities and the people who help you carry them.",
                            "Capture a thought, give it an owner, and choose someone who can step in.",
                            "Start with one responsibility. Invite your circle when it feels right.",
                          ][onboardStep]
                        }
                      />
                      <View
                        style={[
                          s.row,
                          {
                            justifyContent: "center",
                            gap: 8,
                            marginVertical: 15,
                          },
                        ]}
                      >
                        {[0, 1, 2].map((n) => (
                          <View
                            key={n}
                            style={{
                              width: n === onboardStep ? 24 : 7,
                              height: 7,
                              borderRadius: 4,
                              backgroundColor:
                                n === onboardStep ? C.jade : C.line,
                            }}
                          />
                        ))}
                      </View>
                      <Button
                        label={
                          onboardStep === 2 ? "Find my rhythm" : "Continue"
                        }
                        onPress={() => {
                          if (onboardStep < 2) setOnboardStep(onboardStep + 1);
                          else {
                            update({ onboarded: true });
                            nav("Today");
                          }
                        }}
                      />
                    </>
                  )}
                  {sheet === "delete" && (
                    <>
                      <Heading
                        title="Let this one go?"
                        caption={`“${task.title}” will be removed from this device.`}
                      />
                      <Button
                        label="Delete responsibility"
                        icon="trash"
                        onPress={() => {
                          setState((v) => ({
                            ...v,
                            tasks: v.tasks.filter((t) => t.id !== task.id),
                          }));
                          setSheet(null);
                          setNotice("Responsibility removed.");
                        }}
                      />
                      <Button
                        secondary
                        label="Keep it"
                        onPress={() => setSheet("task")}
                      />
                    </>
                  )}
                  {sheet === "reset" && (
                    <>
                      <Heading
                        title="A fresh demo space?"
                        caption="This removes your local edits, messages, members and notes, then restores sample data."
                      />
                      <Button
                        label="Reset everything"
                        icon="repeat"
                        onPress={() => {
                          setState(initialState());
                          setActor("You");
                          setDay(dayKey());
                          setFilter("All");
                          setSupportStep(0);
                          nav("Today");
                          setNotice("Your demo space is fresh.");
                        }}
                      />
                      <Button
                        secondary
                        label="Keep my space"
                        onPress={() => setSheet(null)}
                      />
                    </>
                  )}
                </ScrollView>
              </LinearGradient>
            </KeyboardAvoidingView>
          </Modal>
        </LinearGradient>
      </View>
    </Motion.Provider>
  );
}
const s = StyleSheet.create({
  stage: { flex: 1, backgroundColor: "#E4EBEC", alignItems: "center" },
  app: { flex: 1, width: "100%" },
  header: {
    paddingHorizontal: 23,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#FFFFFFA8",
    borderWidth: 1,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: F.bold,
    fontSize: 25,
    color: C.ink,
    letterSpacing: -1.4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#FFFFFFB8",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 8,
    top: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D99E66",
  },
  content: { paddingHorizontal: 23, paddingTop: 10, paddingBottom: 25 },
  greeting: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    color: C.muted,
    marginBottom: 8,
  },
  livePill: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFFB0",
    borderWidth: 1,
    borderColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#529D85" },
  liveText: { fontFamily: F.medium, fontSize: 9, color: C.jade },
  heroTitle: {
    fontFamily: F.bold,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1.7,
    color: C.ink,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 18,
  },
  day: {
    width: 38,
    borderRadius: 19,
    paddingTop: 10,
    paddingBottom: 7,
    alignItems: "center",
    gap: 8,
  },
  activeDay: {
    backgroundColor: C.ink,
    shadowColor: "#193E38",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dayName: { fontFamily: F.medium, fontSize: 10, color: C.muted },
  dayNumber: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  dateDot: { width: 3, height: 3, borderRadius: 2 },
  heroCard: {
    borderRadius: 27,
    padding: 22,
    minHeight: 188,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#7DB5A8",
    shadowColor: C.jade,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 9 },
  },
  heroGloss: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "#FFFFFF08",
    right: -30,
    top: -110,
    borderWidth: 1,
    borderColor: "#FFFFFF17",
  },
  aiPill: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiPillText: {
    fontFamily: F.bold,
    fontSize: 7,
    letterSpacing: 1.1,
    color: "#DFF6C4",
  },
  captureTitle: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.9,
    color: C.white,
    marginTop: 15,
  },
  heroSubtitle: {
    fontFamily: F.body,
    fontSize: 10,
    color: "#D7EDE6",
    marginTop: 10,
  },
  heroCTA: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    marginTop: 19,
  },
  heroCTAText: { fontFamily: F.bold, fontSize: 11, color: C.white },
  orbPosition: { position: "absolute", right: 8, top: 64, opacity: 0.94 },
  progressStrip: {
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 17,
    marginTop: 8,
  },
  progressCount: { fontFamily: F.bold, fontSize: 10, color: C.jade },
  small: { fontFamily: F.body, fontSize: 11, lineHeight: 18, color: C.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EDEF",
  },
  checkTarget: { width: 29, minHeight: 44, justifyContent: "center" },
  check: {
    width: 19,
    height: 19,
    borderRadius: 7,
    borderWidth: 1.4,
    borderColor: "#B5C9C7",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: C.jade, borderColor: C.jade },
  taskTitle: {
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 19,
    color: C.ink,
  },
  tinyDot: { width: 5, height: 5, borderRadius: 3 },
  circleLink: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 21,
  },
  avatarPair: { flexDirection: "row" },
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  areaCard: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: C.white,
    padding: 17,
    minHeight: 193,
  },
  areaIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F1ED",
  },
  areaTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.ink,
    marginTop: 18,
    marginBottom: 6,
    letterSpacing: -0.7,
  },
  essentialsLink: {
    padding: 18,
    marginTop: 19,
    borderRadius: 22,
    backgroundColor: "#FFFFFFB0",
    borderWidth: 1,
    borderColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberCount: { fontFamily: F.bold, fontSize: 27, color: C.jade },
  demoNote: {
    fontFamily: F.body,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    color: C.muted,
    marginTop: 23,
  },
  selectRow: {
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  chatHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 19,
  },
  chatNotice: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#E1EEE9",
    borderRadius: 14,
    marginBottom: 19,
  },
  bubble: { padding: 17, borderRadius: 21, marginBottom: 13, maxWidth: "94%" },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: C.jade,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFFD8",
    borderWidth: 1,
    borderColor: C.white,
    borderBottomLeftRadius: 6,
  },
  message: { fontFamily: F.body, fontSize: 13, lineHeight: 22, color: C.ink },
  chatAction: { paddingTop: 13 },
  chatInput: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.ink,
    minHeight: 64,
    padding: 9,
    textAlignVertical: "top",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
  },
  sendButton: {
    width: 41,
    height: 41,
    borderRadius: 15,
    backgroundColor: C.jade,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  navWrap: {
    paddingTop: 10,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  nav: {
    borderRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF99",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 49,
    minHeight: 48,
    gap: 5,
  },
  navLabel: { fontFamily: F.medium, fontSize: 9, color: C.muted },
  navDot: { width: 3, height: 3, borderRadius: 2 },
  centerNav: { minWidth: 52 },
  navOrb: {
    width: 49,
    height: 49,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B5DCCE",
  },
  quickAdd: { position: "absolute", right: 25, bottom: 104 },
  quickAddButton: {
    width: 45,
    height: 45,
    borderRadius: 17,
    backgroundColor: C.jade,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.jade,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.ink,
  },
  toastText: {
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 19,
    color: C.white,
  },
  modal: {
    flex: 1,
    backgroundColor: "#132D3B66",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "91%",
    paddingHorizontal: 24,
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  sheetHandle: {
    height: 4,
    width: 33,
    borderRadius: 3,
    backgroundColor: "#C4D1D6",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 9,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  formColumns: { flexDirection: "row", gap: 12 },
  formLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.muted,
    marginTop: 23,
    marginBottom: 10,
  },
  error: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.danger,
    marginTop: 14,
    lineHeight: 20,
  },
});
