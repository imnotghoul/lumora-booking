import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ServiceCard } from "@/components/catalog-cards";
import {
  AppButton,
  ErrorBanner,
  PageHeader,
  Screen,
  SkeletonList,
  StateMessage,
  Tag,
} from "@/components/ui-kit";
import { colors, spacing, typography } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import type { ServiceDto } from "@/lib/types";

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [category, setCategory] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => ["Все", ...Array.from(new Set(services.map((service) => service.category)))],
    [services],
  );
  const filtered = category === "Все"
    ? services
    : services.filter((service) => service.category === category);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setServices(await apiRequest<ServiceDto[]>("/api/services"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen>
      <PageHeader
        eyebrow="Каталог"
        title="Услуги"
        description="Прозрачные цены, понятная продолжительность и запись без звонка."
      />

      {services.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map((item) => (
            <Tag
              key={item}
              label={item}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </ScrollView>
      ) : null}

      <Text style={styles.resultCount}>
        {loading ? "Загружаем услуги…" : `${filtered.length} ${filtered.length === 1 ? "услуга" : "услуг"}`}
      </Text>

      {error ? <ErrorBanner message={error} /> : null}
      {error ? <AppButton title="Повторить" onPress={() => void load()} variant="secondary" fullWidth /> : null}
      {loading ? <SkeletonList count={4} /> : null}
      {!loading && !error && !filtered.length ? (
        <StateMessage
          icon="search-outline"
          title="Услуги не найдены"
          description="В этой категории пока нет доступных услуг."
          actionTitle="Показать все"
          onAction={() => setCategory("Все")}
        />
      ) : null}

      <View style={styles.list}>
        {filtered.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onBook={() => router.push({ pathname: "/book", params: { serviceId: service.id } })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.sm },
  resultCount: { color: colors.muted, fontSize: typography.small, marginVertical: spacing.lg },
  list: { gap: spacing.md },
});
