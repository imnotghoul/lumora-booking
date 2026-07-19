import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  Card,
  ErrorBanner,
  InfoRow,
  InputField,
  PageHeader,
  Screen,
  SkeletonList,
  StateMessage,
  StatusBadge,
} from "@/components/ui-kit";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { apiRequest, toQuery } from "@/lib/api";
import { loadSavedContact, saveContact } from "@/lib/contact-storage";
import { formatAppointmentDate, formatDuration, formatPrice } from "@/lib/date";
import type { AppointmentDto, ClientContact } from "@/lib/types";

function validate(phone: string, email: string) {
  if (!/^[+\d\s()\-]{7,30}$/.test(phone.trim())) return "Введите корректный телефон";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Введите корректный email";
  return "";
}

export default function AppointmentsScreen() {
  const [contact, setContact] = useState<ClientContact>({ name: "", phone: "", email: "" });
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [searched, setSearched] = useState(false);
  const [editing, setEditing] = useState(true);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");

  const searchContact = useCallback(async (source: ClientContact) => {
    const validationError = validate(source.phone, source.email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<AppointmentDto[]>(
        `/api/appointments/mine?${toQuery({
          phone: source.phone.trim(),
          email: source.email.trim().toLowerCase(),
        })}`,
      );
      setAppointments(data);
      setSearched(true);
      setEditing(false);
      const enriched = {
        ...source,
        name: source.name || data[0]?.client.name || "",
      };
      setContact(enriched);
      await saveContact(enriched);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Не удалось найти записи");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const saved = await loadSavedContact();
      if (!active) return;
      if (saved) {
        setContact(saved);
        await searchContact(saved);
      }
      if (active) setInitializing(false);
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [searchContact]);

  const cancelAppointment = (appointment: AppointmentDto) => {
    Alert.alert(
      "Отменить запись?",
      `${appointment.service.name}, ${formatAppointmentDate(appointment.startsAt)}. Время снова станет доступно другим клиентам.`,
      [
        { text: "Не отменять", style: "cancel" },
        {
          text: "Отменить запись",
          style: "destructive",
          onPress: async () => {
            setCancellingId(appointment.id);
            setError("");
            try {
              const updated = await apiRequest<AppointmentDto>(
                `/api/appointments/${appointment.id}/cancel`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    phone: contact.phone.trim(),
                    email: contact.email.trim().toLowerCase(),
                  }),
                },
              );
              setAppointments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
              );
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (cancelError) {
              setError(cancelError instanceof Error ? cancelError.message : "Не удалось отменить запись");
            } finally {
              setCancellingId("");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen keyboard>
      <PageHeader
        eyebrow="Личный раздел"
        title="Мои записи"
        description="Найдите визиты по телефону и email, указанным при бронировании."
        action={searched && !editing ? (
          <AppButton title="Изменить" onPress={() => setEditing(true)} variant="ghost" />
        ) : undefined}
      />

      {editing ? (
        <Card style={styles.searchCard}>
          <View style={styles.searchHeader}>
            <View style={styles.searchIcon}>
              <Ionicons name="search-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.searchTitle}>Найти записи</Text>
              <Text style={styles.searchDescription}>Оба контакта должны совпадать.</Text>
            </View>
          </View>
          <InputField
            label="Телефон"
            value={contact.phone}
            onChangeText={(phone) => setContact((current) => ({ ...current, phone }))}
            placeholder="+7 999 000-00-00"
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <InputField
            label="Email"
            value={contact.email}
            onChangeText={(email) => setContact((current) => ({ ...current, email }))}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <AppButton
            title="Показать записи"
            icon="search-outline"
            onPress={() => void searchContact(contact)}
            loading={loading}
            fullWidth
          />
        </Card>
      ) : (
        <View style={styles.contactSummary}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={styles.contactSummaryText}>{contact.phone} · {contact.email}</Text>
          <AppButton title="Обновить" onPress={() => void searchContact(contact)} variant="ghost" />
        </View>
      )}

      {error ? <ErrorBanner message={error} /> : null}
      {initializing || loading ? <SkeletonList count={2} /> : null}

      {!initializing && !loading && !searched ? (
        <StateMessage
          icon="calendar-outline"
          title="Все визиты в одном месте"
          description="Введите контакты, чтобы увидеть будущие и прошлые записи и при необходимости отменить визит."
        />
      ) : null}

      {!initializing && !loading && searched && !appointments.length ? (
        <StateMessage
          icon="file-tray-outline"
          title="Записей не найдено"
          description="Проверьте телефон и email или создайте новую запись во вкладке «Записаться»."
          actionTitle="Изменить контакты"
          onAction={() => setEditing(true)}
        />
      ) : null}

      <View style={styles.list}>
        {appointments.map((appointment) => {
          const cancellable =
            (appointment.status === "NEW" || appointment.status === "CONFIRMED") &&
            new Date(appointment.startsAt) > new Date();
          return (
            <Card key={appointment.id}>
              <View style={styles.appointmentTop}>
                <View>
                  <Text style={styles.numberLabel}>№ {appointment.bookingNumber}</Text>
                  <Text style={styles.appointmentTitle}>{appointment.service.name}</Text>
                </View>
                <StatusBadge status={appointment.status} />
              </View>
              <InfoRow
                icon="calendar-outline"
                label="Дата и время"
                value={formatAppointmentDate(appointment.startsAt)}
              />
              <InfoRow
                icon="person-outline"
                label="Специалист"
                value={`${appointment.specialist.name} · ${appointment.specialist.title}`}
              />
              <InfoRow
                icon="time-outline"
                label="Услуга"
                value={`${formatDuration(appointment.service.duration)} · ${formatPrice(appointment.service.price)}`}
              />
              {appointment.notes ? (
                <View style={styles.notes}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.muted} />
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              ) : null}
              {cancellable ? (
                <View style={styles.cancelAction}>
                  <AppButton
                    title="Отменить запись"
                    icon="close-circle-outline"
                    variant="ghost"
                    onPress={() => cancelAppointment(appointment)}
                    loading={cancellingId === appointment.id}
                    fullWidth
                  />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchCard: { marginBottom: spacing.lg },
  searchHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  searchIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  searchTitle: { color: colors.ink, fontSize: typography.h3, fontWeight: "900" },
  searchDescription: { color: colors.muted, fontSize: typography.small, marginTop: 2 },
  contactSummary: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.successSoft, borderRadius: radius.md, paddingLeft: spacing.md, marginBottom: spacing.lg },
  contactSummaryText: { flex: 1, color: colors.success, fontSize: typography.caption, fontWeight: "700" },
  list: { gap: spacing.md },
  appointmentTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.sm },
  numberLabel: { color: colors.accentDark, fontSize: typography.caption, fontWeight: "800", marginBottom: 4 },
  appointmentTitle: { color: colors.ink, fontSize: typography.h3, fontWeight: "900" },
  notes: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, marginTop: spacing.md },
  notesText: { flex: 1, color: colors.muted, fontSize: typography.small, lineHeight: 19 },
  cancelAction: { marginTop: spacing.lg },
});
