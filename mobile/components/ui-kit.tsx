import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cardShadow, colors, radius, spacing, typography } from "@/constants/theme";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function Screen({
  children,
  scroll = true,
  keyboard = false,
  contentStyle,
}: PropsWithChildren<{
  scroll?: boolean;
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>) {
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.screenContent, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={12}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.flex}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={styles.pageTitle}>
          {title}
        </Text>
        {description ? <Text style={styles.pageDescription}>{description}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function Card({
  children,
  onPress,
  selected = false,
  style,
  accessibilityLabel,
}: PropsWithChildren<{
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>) {
  const cardStyle = [styles.card, selected && styles.cardSelected, style];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function AppButton({
  title,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}) {
  const isDisabled = disabled || loading;
  const foreground = variant === "primary" || variant === "danger" ? colors.white : colors.accentDark;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={foreground} /> : null}
          <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Tag({
  label,
  icon,
  selected = false,
  onPress,
}: {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.white : colors.muted} /> : null}
      <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text>
    </>
  );
  if (!onPress) return <View style={[styles.tag, selected && styles.tagSelected]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.tag, selected && styles.tagSelected, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function InputField({
  label,
  error,
  multiline,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#929BAD"
        selectionColor={colors.accent}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea, error && styles.inputError]}
        {...props}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function StateMessage({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: {
  icon: IconName;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return (
    <View style={styles.gap12} accessibilityLabel="Загрузка данных">
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonCircle} />
          <View style={styles.flex}>
            <View style={[styles.skeletonLine, { width: "64%" }]} />
            <View style={[styles.skeletonLine, { width: "88%" }]} />
            <View style={[styles.skeletonLine, { width: "42%" }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function StepIndicator({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <View accessibilityLabel={`Шаг ${current} из ${total}`} style={styles.stepRow}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.stepDot, index + 1 <= current && styles.stepDotActive]}
        />
      ))}
    </View>
  );
}

export function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const palette = {
    NEW: [colors.accentSoft, colors.accentDark],
    CONFIRMED: [colors.successSoft, colors.success],
    COMPLETED: [colors.surfaceMuted, colors.muted],
    CANCELLED: [colors.dangerSoft, colors.danger],
  } as const;
  return (
    <View style={[styles.statusBadge, { backgroundColor: palette[status][0] }]}>
      <Text style={[styles.statusText, { color: palette[status][1] }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 110 },
  pageHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.xxl },
  eyebrow: { color: colors.accentDark, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 },
  pageTitle: { color: colors.ink, fontSize: typography.h1, fontWeight: "800", letterSpacing: -0.6 },
  pageDescription: { color: colors.muted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: typography.h2, fontWeight: "800", letterSpacing: -0.3 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, ...cardShadow },
  cardSelected: { borderColor: colors.accent, borderWidth: 2, backgroundColor: "#FBFBFF" },
  pressed: { opacity: 0.82 },
  button: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 1 },
  button_primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  button_secondary: { backgroundColor: colors.accentSoft, borderColor: colors.accentMid },
  button_ghost: { backgroundColor: "transparent", borderColor: colors.line },
  button_danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  buttonText: { fontSize: typography.body, fontWeight: "800" },
  buttonPressed: { transform: [{ scale: 0.985 }] },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.48 },
  tag: { minHeight: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: 6 },
  tagSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  tagText: { color: colors.muted, fontSize: typography.small, fontWeight: "700" },
  tagTextSelected: { color: colors.white },
  fieldGroup: { gap: 6, marginBottom: spacing.lg },
  fieldLabel: { color: colors.ink, fontSize: typography.small, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.lg, fontSize: typography.body },
  textarea: { minHeight: 104, paddingTop: spacing.md, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: typography.caption },
  stateBox: { paddingVertical: 44, paddingHorizontal: spacing.xl, alignItems: "center", gap: spacing.md },
  stateIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  stateTitle: { color: colors.ink, fontSize: typography.h3, fontWeight: "800", textAlign: "center" },
  stateDescription: { color: colors.muted, fontSize: typography.body, lineHeight: 22, textAlign: "center", marginBottom: spacing.sm },
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.dangerSoft, marginBottom: spacing.lg },
  errorBannerText: { flex: 1, color: colors.danger, fontSize: typography.small, lineHeight: 19, fontWeight: "600" },
  gap12: { gap: spacing.md },
  skeletonCard: { minHeight: 126, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.lg },
  skeletonCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surfaceMuted },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceMuted, marginVertical: 5 },
  stepRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  stepDot: { height: 5, flex: 1, borderRadius: 3, backgroundColor: colors.line },
  stepDotActive: { backgroundColor: colors.accent },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  infoIcon: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  infoLabel: { color: colors.muted, fontSize: typography.caption, marginBottom: 2 },
  infoValue: { color: colors.ink, fontSize: typography.body, fontWeight: "700" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusText: { fontSize: typography.caption, fontWeight: "800" },
});
