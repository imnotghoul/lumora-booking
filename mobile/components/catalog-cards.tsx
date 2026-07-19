import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppButton, Card, Tag } from "@/components/ui-kit";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { formatDuration, formatPrice } from "@/lib/date";
import type { ServiceDto, SpecialistDto } from "@/lib/types";

const serviceIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  scissors: "cut-outline",
  sparkle: "sparkles-outline",
  heart: "heart-outline",
  face: "happy-outline",
  nail: "color-palette-outline",
  massage: "body-outline",
};

export function ServiceCard({
  service,
  onBook,
  onSelect,
  selected = false,
  compact = false,
}: {
  service: ServiceDto;
  onBook?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  compact?: boolean;
}) {
  const icon = serviceIcons[service.icon] ?? "sparkles-outline";
  return (
    <Card
      selected={selected}
      onPress={onSelect}
      accessibilityLabel={`Услуга ${service.name}, ${formatPrice(service.price)}`}
      style={compact ? styles.compactCard : undefined}
    >
      <View style={styles.cardTop}>
        <View style={styles.serviceIcon}>
          <Ionicons name={icon} size={24} color={colors.accent} />
        </View>
        <Tag label={service.category} />
      </View>
      <Text style={styles.cardTitle}>{service.name}</Text>
      {!compact ? <Text style={styles.cardDescription}>{service.description}</Text> : null}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.muted} />
          <Text style={styles.metaText}>{formatDuration(service.duration)}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(service.price)}</Text>
      </View>
      {onBook ? (
        <View style={styles.actionTop}>
          <AppButton title="Записаться" icon="arrow-forward" onPress={onBook} fullWidth />
        </View>
      ) : null}
    </Card>
  );
}

export function SpecialistCard({
  specialist,
  onBook,
  onSelect,
  selected = false,
  compact = false,
}: {
  specialist: SpecialistDto;
  onBook?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <Card
      selected={selected}
      onPress={onSelect}
      accessibilityLabel={`Специалист ${specialist.name}, ${specialist.title}`}
      style={compact ? styles.compactCard : undefined}
    >
      <View style={styles.specialistTop}>
        <View style={[styles.avatar, { backgroundColor: specialist.color || colors.accentSoft }]}>
          <Text style={styles.avatarText}>{specialist.initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{specialist.name}</Text>
          <Text style={styles.specialistTitle}>{specialist.title}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color="#EAAE25" />
            <Text style={styles.ratingText}>{specialist.rating.toFixed(1)}</Text>
            <Text style={styles.experience}>• {specialist.experience} лет опыта</Text>
          </View>
        </View>
      </View>
      {!compact ? <Text style={styles.cardDescription}>{specialist.bio}</Text> : null}
      {onBook ? (
        <View style={styles.actionTop}>
          <AppButton title="Выбрать специалиста" onPress={onBook} variant="secondary" fullWidth />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  compactCard: { width: 290, minHeight: 175 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  serviceIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  cardTitle: { color: colors.ink, fontSize: typography.h3, fontWeight: "800", letterSpacing: -0.2 },
  cardDescription: { color: colors.muted, fontSize: typography.small, lineHeight: 20, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: colors.muted, fontSize: typography.small, fontWeight: "600" },
  price: { color: colors.ink, fontSize: typography.h3, fontWeight: "900" },
  actionTop: { marginTop: spacing.lg },
  specialistTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: typography.h3, fontWeight: "900" },
  specialistTitle: { color: colors.muted, fontSize: typography.small, marginTop: 3 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
  ratingText: { color: colors.ink, fontSize: typography.small, fontWeight: "800" },
  experience: { color: colors.muted, fontSize: typography.caption },
});
