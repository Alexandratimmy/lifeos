import React, { createContext, useContext, useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  StyleSheet,
  TextInput,
  Platform,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors as C, fonts as F } from "./theme";
export const Motion = createContext({ reduced: false, haptics: true });
export type IconName =
  | "sun"
  | "grid"
  | "people"
  | "heart"
  | "plus"
  | "arrow"
  | "check"
  | "close"
  | "mic"
  | "chevron"
  | "shield"
  | "clock"
  | "home"
  | "spark"
  | "leaf"
  | "bell"
  | "search"
  | "settings"
  | "back"
  | "send"
  | "file"
  | "phone"
  | "calendar"
  | "repeat"
  | "trash"
  | "moon"
  | "chat"
  | "help"
  | "logout";
const paths: Record<IconName, string> = {
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  people:
    "M15 21v-2a5 5 0 0 0-10 0v2M14 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 10a3 3 0 0 0 0-6m0 10a4 4 0 0 1 4 4v3",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  plus: "M12 5v14M5 12h14",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8",
  chevron: "m9 5 7 7-7 7",
  shield: "M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7ZM8 12l3 3 5-6",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  home: "m3 10 9-7 9 7v11h-6v-8H9v8H3Z",
  spark: "m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z",
  leaf: "M20 3C4 1 1 10 6 16s16 3 14-13ZM5 20 16 8",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z",
  back: "m14 5-7 7 7 7",
  send: "m3 3 19 9-19 9 4-9ZM7 12h15",
  file: "M14 2H4v20h16V8ZM14 2v6h6M8 13h8M8 17h6",
  phone: "M6 2 3 3c-4 6 12 22 18 18l1-3-5-3-2 2c-4-2-6-4-8-8l2-2Z",
  calendar: "M4 5h16v17H4ZM8 2v6M16 2v6M4 11h16",
  repeat: "M3 8h17l-4-4m4 4-4 4M21 16H4l4 4m-4-4 4-4",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v8m4-8v8",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  chat: "M21 4H3v13h5l4 4 4-4h5ZM7 9h10M7 13h6",
  help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  logout: "M9 3H3v18h6M10 12h12m-4-4 4 4-4 4",
};
export function Icon({
  name,
  size = 21,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d={paths[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Orb({
  size = 100,
  animate = false,
}: {
  size?: number;
  animate?: boolean;
}) {
  const { reduced } = useContext(Motion),
    v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate || reduced) {
      v.setValue(0);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [animate, reduced]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -7],
            }),
          },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
        <Defs>
          <RadialGradient id="orb" cx="35%" cy="20%" r="80%">
            <Stop offset="0" stopColor="#E6FFF2" />
            <Stop offset=".28" stopColor="#A7E9CD" />
            <Stop offset=".64" stopColor="#3A9A88" />
            <Stop offset="1" stopColor="#104D54" />
          </RadialGradient>
          <RadialGradient id="shine" cx="40%" cy="15%" r="75%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="60" cy="59" r="43" fill="url(#orb)" />
        <Ellipse
          cx="60"
          cy="60"
          rx="55"
          ry="20"
          rotation="-38"
          origin="60,60"
          fill="none"
          stroke="#A5D5D2"
          strokeWidth="2.5"
        />
        <Ellipse
          cx="60"
          cy="60"
          rx="55"
          ry="20"
          rotation="42"
          origin="60,60"
          fill="none"
          stroke="#E3FFF6"
          strokeWidth="2"
        />
        <Ellipse cx="49" cy="38" rx="26" ry="17" fill="url(#shine)" />
      </Svg>
    </Animated.View>
  );
}
export function Tap({
  children,
  onPress,
  style,
  label,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const m = useContext(Motion);
  const spring = (to: number) => {
    if (!m.reduced)
      Animated.spring(scale, {
        toValue: to,
        useNativeDriver: true,
        speed: 35,
        bounciness: 3,
      }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={() => spring(0.97)}
        onPressOut={() => spring(1)}
        onPress={() => {
          if (m.haptics && Platform.OS !== "web")
            Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={[style, { opacity: disabled ? 0.4 : 1 }]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
export function Glass({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[u.glass, style]}>{children}</View>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon = "arrow",
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Tap
      label={label}
      disabled={disabled}
      onPress={onPress}
      style={[u.button, secondary && u.secondary]}
    >
      <Text style={[u.buttonText, secondary && { color: C.jade }]}>
        {label}
      </Text>
      <Icon name={icon} size={18} color={secondary ? C.jade : C.white} />
    </Tap>
  );
}
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      aria-selected={active}
      onPress={onPress}
      style={[u.chip, active && { backgroundColor: C.ink }]}
    >
      <Text style={[u.chipText, active && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}
export function T({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[u.text, style]}>{children}</Text>;
}
export function Heading({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={u.title}>{title}</Text>
      {caption && <Text style={u.caption}>{caption}</Text>}
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={{ marginTop: 17 }}>
      <Text style={u.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={[
          u.input,
          multiline && { minHeight: 100, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Avatar({
  name,
  size = 42,
  color = C.mint,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <LinearGradient
      colors={[C.white, color]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: F.bold, fontSize: size * 0.34, color: C.ink }}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={u.section}>
      <Text style={u.sectionTitle}>{title}</Text>
      {action && onPress && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ padding: 8 }}
        >
          <Text style={u.link}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Enter({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const v = useRef(new Animated.Value(1)).current;
  const { reduced } = useContext(Motion);
  useEffect(() => {
    if (reduced) return;
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [id, reduced]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
export const u = StyleSheet.create({
  glass: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#426A77",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.045,
    shadowRadius: 20,
    elevation: 2,
  },
  text: { fontFamily: F.body, fontSize: 13, lineHeight: 21, color: C.ink },
  title: {
    fontFamily: F.bold,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.35,
    color: C.ink,
  },
  caption: {
    fontFamily: F.body,
    fontSize: 13,
    lineHeight: 21,
    color: C.muted,
    marginTop: 10,
  },
  label: { fontFamily: F.bold, fontSize: 11, color: C.muted, marginBottom: 9 },
  input: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.ink,
    backgroundColor: "rgba(255,255,255,.8)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    padding: 15,
  },
  button: {
    padding: 17,
    backgroundColor: C.jade,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
  },
  secondary: { backgroundColor: "#E1F0EA" },
  buttonText: { fontFamily: F.bold, fontSize: 13, color: C.white },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.85)",
  },
  chipText: { fontFamily: F.medium, fontSize: 12, color: C.muted },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 13,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.ink,
    letterSpacing: -0.45,
  },
  link: { fontFamily: F.bold, fontSize: 11, color: C.jade },
});
