import { Task, dayKey, seedTasks } from "./model";
export type Responsibility = Task & { repeat?: "Never" | "Daily" | "Weekly" };
export type Essential = {
  id: string;
  title: string;
  category: "Contacts" | "Home" | "Documents";
  detail: string;
  shared: boolean;
  owner?: string;
};
export type Member = { name: string; relation: string; email: string };
export type Message = { id: string; role: "user" | "assistant"; text: string };
export type State = {
  tasks: Responsibility[];
  essentials: Essential[];
  members: Member[];
  messages: Message[];
  name: string;
  reduced: boolean;
  haptics: boolean;
  compact: boolean;
  reminders: boolean;
  support: boolean;
  supportReason: string;
  onboarded: boolean;
};
export function initialState(): State {
  return {
    tasks: seedTasks(),
    essentials: [
      {
        id: "e1",
        title: "Home handover notes",
        category: "Home",
        detail:
          "Spare keys are in the hallway drawer. Recycling is collected on Thursday.",
        shared: true,
      },
      {
        id: "e2",
        title: "Document checklist",
        category: "Documents",
        detail:
          "Keep track of where the original documents are stored. Add locations here, not passwords.",
        shared: false,
      },
    ],
    members: [
      { name: "You", relation: "Your space", email: "" },
      {
        name: "Alex",
        relation: "Partner · demo member",
        email: "alex@example.com",
      },
    ],
    messages: [
      {
        id: "welcome",
        role: "assistant",
        text: "A little less to hold in your head. Ask what’s on today, or tell me something you need to do.",
      },
    ],
    name: "Samuel",
    reduced: false,
    haptics: true,
    compact: false,
    reminders: true,
    support: false,
    supportReason: "A little breathing room",
    onboarded: false,
  };
}
export function validDay(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return (
    !isNaN(d.getTime()) &&
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
      s
  );
}
export function advanceDay(s: string, days: number) {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function complete(tasks: Responsibility[], id: string) {
  const t = tasks.find((t) => t.id === id);
  if (!t) return tasks;
  const next = tasks.map((x) =>
    x.id === id
      ? { ...x, done: !x.done, pending: !x.done ? undefined : x.pending }
      : x,
  );
  if (!t.done && t.repeat && t.repeat !== "Never") {
    const nextId = `${id}-next`;
    if (!next.some((x) => x.id === nextId))
      next.push({
        ...t,
        id: nextId,
        day: advanceDay(t.day, t.repeat === "Daily" ? 1 : 7),
        done: false,
        pending: undefined,
      });
  }
  return next;
}
export function parseDraft(text: string) {
  return {
    title:
      text
        .replace(
          /^(please\s+)?(remind me to|add a task to|add a task|add|i need to)\s+/i,
          "",
        )
        .replace(/\s+(today|tomorrow)\b/gi, "")
        .trim() || text,
    day: dayKey(/\btomorrow\b/i.test(text) ? 1 : 0),
  };
}
