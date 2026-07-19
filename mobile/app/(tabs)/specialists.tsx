import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { SpecialistCard } from "@/components/catalog-cards";
import {
  AppButton,
  ErrorBanner,
  PageHeader,
  Screen,
  SkeletonList,
  StateMessage,
} from "@/components/ui-kit";
import { spacing } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import type { SpecialistDto } from "@/lib/types";

export default function SpecialistsScreen() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setSpecialists(await apiRequest<SpecialistDto[]>("/api/specialists"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить специалистов");
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
        eyebrow="Команда"
        title="Специалисты"
        description="Проверенные мастера с опытом, рейтингом и индивидуальным подходом."
      />

      {error ? <ErrorBanner message={error} /> : null}
      {error ? <AppButton title="Повторить" onPress={() => void load()} variant="secondary" fullWidth /> : null}
      {loading ? <SkeletonList count={4} /> : null}
      {!loading && !error && !specialists.length ? (
        <StateMessage
          icon="people-outline"
          title="Специалистов пока нет"
          description="Попробуйте обновить данные немного позже."
          actionTitle="Обновить"
          onAction={() => void load()}
        />
      ) : null}

      <View style={styles.list}>
        {specialists.map((specialist) => (
          <SpecialistCard
            key={specialist.id}
            specialist={specialist}
            onBook={() =>
              router.push({ pathname: "/book", params: { specialistId: specialist.id } })
            }
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md } });
