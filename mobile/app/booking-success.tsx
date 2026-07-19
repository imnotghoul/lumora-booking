import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton, Card, InfoRow, Screen } from "@/components/ui-kit";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { formatAppointmentDate, formatDuration, formatPrice } from "@/lib/date";

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingNumber?: string | string[];
    startsAt?: string | string[];
    service?: string | string[];
    specialist?: string | string[];
    price?: string | string[];
    duration?: string | string[];
  }>();
  const bookingNumber = valueOf(params.bookingNumber);
  const startsAt = valueOf(params.startsAt);
  const service = valueOf(params.service);
  const specialist = valueOf(params.specialist);
  const price = Number(valueOf(params.price));
  const duration = Number(valueOf(params.duration));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.successMark}>
        <View style={styles.successRing}>
          <Ionicons name="checkmark" size={42} color={colors.white} />
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.title}>Вы записаны!</Text>
      <Text style={styles.description}>
        Время закреплено за вами. Номер записи пригодится при обращении к администратору.
      </Text>

      <View style={styles.numberBox}>
        <Text style={styles.numberLabel}>Номер записи</Text>
        <Text selectable style={styles.number}>{bookingNumber || "—"}</Text>
      </View>

      <Card style={styles.details}>
        <InfoRow icon="sparkles-outline" label="Услуга" value={service || "—"} />
        <InfoRow icon="person-outline" label="Специалист" value={specialist || "—"} />
        <InfoRow
          icon="calendar-outline"
          label="Дата и время"
          value={startsAt ? formatAppointmentDate(startsAt) : "—"}
        />
        <InfoRow
          icon="time-outline"
          label="Продолжительность"
          value={Number.isFinite(duration) ? formatDuration(duration) : "—"}
        />
        <InfoRow
          icon="wallet-outline"
          label="Стоимость"
          value={Number.isFinite(price) ? formatPrice(price) : "—"}
        />
      </Card>

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={21} color={colors.accentDark} />
        <Text style={styles.tipText}>
          Управлять визитом можно во вкладке «Записи». Контакты уже сохранены на этом устройстве.
        </Text>
      </View>

      <AppButton
        title="Мои записи"
        icon="calendar-outline"
        onPress={() => router.replace("/appointments")}
        fullWidth
      />
      <View style={styles.secondaryAction}>
        <AppButton
          title="На главную"
          onPress={() => router.replace("/")}
          variant="ghost"
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", paddingTop: spacing.xxl },
  successMark: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  successRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontSize: 31, fontWeight: "900", letterSpacing: -0.7, textAlign: "center" },
  description: { color: colors.muted, fontSize: typography.body, lineHeight: 23, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xl, maxWidth: 340 },
  numberBox: { width: "100%", alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  numberLabel: { color: colors.muted, fontSize: typography.caption, marginBottom: 5 },
  number: { color: colors.accentDark, fontSize: typography.h2, fontWeight: "900", letterSpacing: 0.6 },
  details: { width: "100%", marginBottom: spacing.md },
  tip: { width: "100%", flexDirection: "row", gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  tipText: { flex: 1, color: colors.accentDark, fontSize: typography.small, lineHeight: 19 },
  secondaryAction: { width: "100%", marginTop: spacing.sm },
});
