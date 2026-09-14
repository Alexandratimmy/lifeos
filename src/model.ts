export type Area = "Home" | "Personal" | "Family" | "Wellbeing";
export type Task = {
  id: string;
  title: string;
  day: string;
  time: string;
  area: Area;
  owner: string;
  backup: string;
  notes: string;
  done: boolean;
  pending?: string;
};
export const dayKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const seedTasks = (): Task[] => [
  {
    id: "1",
    title: "A little time for yourself",
    day: dayKey(),
    time: "08:00",
    area: "Wellbeing",
    owner: "You",
    backup: "",
    notes: "A slow morning. A short walk. Whatever feels good today.",
    done: true,
  },
  {
    id: "2",
    title: "Pick up the weekly groceries",
    day: dayKey(),
    time: "11:00",
    area: "Home",
    owner: "You",
    backup: "Alex",
    notes:
      "Oat milk, fresh fruit, eggs, bread and something for Sunday dinner.",
    done: false,
  },
  {
    id: "3",
    title: "Book Mum’s appointment",
    day: dayKey(),
    time: "14:00",
    area: "Family",
    owner: "You",
    backup: "Alex",
    notes:
      "Call to check availability. Confirm the time with Mum before booking.",
    done: false,
  },
  {
    id: "4",
    title: "Electricity bill",
    day: dayKey(),
    time: "17:00",
    area: "Home",
    owner: "Alex",
    backup: "You",
    notes: "Check this month’s statement before paying.",
    done: false,
  },
  {
    id: "5",
    title: "Plan the week together",
    day: dayKey(1),
    time: "18:00",
    area: "Family",
    owner: "You",
    backup: "Alex",
    notes: "Ten minutes to check what is coming up and share the load.",
    done: false,
  },
];
