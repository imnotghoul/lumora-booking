import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { ServiceCard, SpecialistCard } from "@/components/catalog-cards";
import {
  AppButton,
  ErrorBanner,
  Screen,
  SectionHeader,
  SkeletonList,
} from "@/components/ui-kit";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import type { ServiceDto, SpecialistDto } from "@/lib/types";

export default function HomeScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [serviceData, specialistData] = await Promise.all([
        apiRequest<ServiceDto[]>("/api/services"),
        apiRequest<SpecialistDto[]>("/api/specialists"),
      ]);
      setServices(serviceData);
      setSpecialists(specialistData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.brandRow}>
        <Image source={require("../../assets/images/lumora-icon.png")} style={styles.logo} />
        <View>
          <Text style={styles.brand}>Lumora</Text>
          <Text style={styles.brandSub}>онлайн-запись</Text>
        </View>
        <View style={styles.openPill}>
          <View style={styles.onlineDot} />
          <Text style={styles.openText}>Открыто</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={15} color={colors.accentDark} />
          <Text style={styles.heroBadgeText}>Забота начинается здесь</Text>
        </View>
        <Text style={styles.heroTitle}>Время для себя — без звонков и ожидания</Text>
        <Text style={styles.heroDescription}>
          Выберите услугу, любимого специалиста и удобное время за пару минут.
        </Text>
        <AppButton
          title="Записаться онлайн"
          icon="calendar-outline"
          onPress={() => router.push("/book")}
          fullWidth
        />
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.success} />
            <Text style={styles.trustText}>Безопасно</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="time-outline" size={17} color={colors.success} />
            <Text style={styles.trustText}>24/7</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="flash-outline" size={17} color={colors.success} />
            <Text style={styles.trustText}>2 минуты</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>рейтинг</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{specialists.length || "4"}</Text>
          <Text style={styles.statLabel}>специалиста</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{services.length || "6"}</Text>
          <Text style={styles.statLabel}>услуг</Text>
        </View>
      </View>

      {error ? <ErrorBanner message={error} /> : null}
      {error ? (
        <AppButton title="Повторить" onPress={() => void load()} variant="secondary" fullWidth />
      ) : null}

      {loading ? (
        <>
          <SectionHeader title="Популярные услуги" />
          <SkeletonList count={2} />
        </>
      ) : (
        <>
          <SectionHeader
            title="Популярные услуги"
            action={
              <AppButton title="Все" onPress={() => router.push("/services")} variant="ghost" />
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {services.filter((item) => item.featured).slice(0, 4).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                compact
                onBook={() =>
                  router.push({ pathname: "/book", params: { serviceId: service.id } })
                }
              />
            ))}
          </ScrollView>

          <SectionHeader
            title="Наши специалисты"
            action={
              <AppButton title="Все" onPress={() => router.push("/specialists")} variant="ghost" />
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {specialists.slice(0, 4).map((specialist) => (
              <SpecialistCard
                key={specialist.id}
                specialist={specialist}
                compact
                onBook={() =>
                  router.push({ pathname: "/book", params: { specialistId: specialist.id } })
                }
              />
            ))}
          </ScrollView>
        </>
      )}

      <SectionHeader title="Как это работает" />
      <View style={styles.steps}>
        {[
          ["1", "Выберите услугу", "Посмотрите стоимость и продолжительность"],
          ["2", "Найдите время", "Выберите специалиста, дату и свободный слот"],
          ["3", "Готово", "Получите номер записи и управляйте визитом"],
        ].map(([number, title, description]) => (
          <View key={number} style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
            <View style={styles.flex}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  flex: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  logo: { width: 44, height: 44, borderRadius: radius.md, marginRight: spacing.md },
  brand: { color: colors.ink, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  brandSub: { color: colors.muted, fontSize: typography.caption },
  openPill: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.successSoft },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  openText: { color: colors.success, fontSize: typography.caption, fontWeight: "800" },
  hero: { position: "relative", overflow: "hidden", borderRadius: radius.xl, backgroundColor: colors.accentSoft, padding: spacing.xxl, borderWidth: 1, borderColor: colors.accentMid },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#D8D9FF", top: -90, right: -70, opacity: 0.8 },
  heroBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.white, marginBottom: spacing.lg },
  heroBadgeText: { color: colors.accentDark, fontSize: typography.caption, fontWeight: "800" },
  heroTitle: { color: colors.ink, fontSize: typography.hero, lineHeight: 39, fontWeight: "900", letterSpacing: -1.2, marginBottom: spacing.md },
  heroDescription: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginBottom: spacing.xl },
  trustRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.surface, borderRadius: radius.lg, marginVertical: spacing.xl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.line },
  stat: { alignItems: "center", flex: 1 },
  statValue: { color: colors.ink, fontSize: typography.h2, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: typography.caption, marginTop: 2 },
  statDivider: { width: 1, height: 34, backgroundColor: colors.line },
  horizontalList: { gap: spacing.md, paddingRight: spacing.lg, paddingBottom: spacing.sm },
  steps: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg },
  stepItem: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepNumber: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  stepNumberText: { color: colors.accentDark, fontWeight: "900" },
  stepTitle: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  stepDescription: { color: colors.muted, fontSize: typography.small, lineHeight: 18, marginTop: 2 },
});
