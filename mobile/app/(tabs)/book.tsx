import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ServiceCard, SpecialistCard } from "@/components/catalog-cards";
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
  StepIndicator,
  Tag,
} from "@/components/ui-kit";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { ApiClientError, apiRequest, toQuery } from "@/lib/api";
import { loadSavedContact, saveContact } from "@/lib/contact-storage";
import { formatAppointmentDate, formatDuration, formatPrice, getBookingDates } from "@/lib/date";
import type {
  AppointmentDto,
  AvailabilityDto,
  AvailableSlot,
  ClientContact,
  ServiceDto,
  SpecialistDto,
} from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5;
type ContactErrors = Partial<Record<keyof ClientContact, string>>;

const STEP_TITLES: Record<Step, string> = {
  1: "Выберите услугу",
  2: "Выберите специалиста",
  3: "Дата и время",
  4: "Контактные данные",
  5: "Проверьте запись",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validateContact(contact: ClientContact): ContactErrors {
  const errors: ContactErrors = {};
  if (contact.name.trim().length < 2) errors.name = "Введите имя";
  if (!/^[+\d\s()\-]{7,30}$/.test(contact.phone.trim())) {
    errors.phone = "Введите корректный телефон";
  }
  if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) {
    errors.email = "Введите корректный email";
  }
  return errors;
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string | string[]; specialistId?: string | string[] }>();
  const requestedServiceId = firstParam(params.serviceId);
  const requestedSpecialistId = firstParam(params.specialistId);
  const dates = useMemo(() => getBookingDates(21), []);
  const requestSequence = useRef(0);

  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [contact, setContact] = useState<ClientContact>({ name: "", phone: "", email: "" });
  const [notes, setNotes] = useState("");
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find((item) => item.id === serviceId);
  const selectedSpecialist = specialists.find((item) => item.id === specialistId);
  const selectedDate = dates.find((item) => item.value === date);

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      setLoadingServices(true);
      setError("");
      try {
        const [serviceData, savedContact] = await Promise.all([
          apiRequest<ServiceDto[]>("/api/services"),
          loadSavedContact(),
        ]);
        if (!active) return;
        setServices(serviceData);
        if (savedContact) setContact(savedContact);
        if (requestedServiceId && serviceData.some((item) => item.id === requestedServiceId)) {
          setServiceId(requestedServiceId);
          setStep(2);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить услуги");
        }
      } finally {
        if (active) setLoadingServices(false);
      }
    };
    void loadInitial();
    return () => {
      active = false;
    };
  }, [requestedServiceId]);

  useEffect(() => {
    if (!serviceId) {
      setSpecialists([]);
      return;
    }
    let active = true;
    const loadSpecialists = async () => {
      setLoadingSpecialists(true);
      setError("");
      setSpecialistId("");
      setSlot(null);
      try {
        const data = await apiRequest<SpecialistDto[]>(
          `/api/specialists?${toQuery({ serviceId })}`,
        );
        if (!active) return;
        setSpecialists(data);
        if (requestedSpecialistId && data.some((item) => item.id === requestedSpecialistId)) {
          setSpecialistId(requestedSpecialistId);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить специалистов");
        }
      } finally {
        if (active) setLoadingSpecialists(false);
      }
    };
    void loadSpecialists();
    return () => {
      active = false;
    };
  }, [requestedSpecialistId, serviceId]);

  useEffect(() => {
    if (!serviceId || !specialistId || !date) {
      setSlots([]);
      return;
    }
    const sequence = ++requestSequence.current;
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError("");
      setSlot(null);
      try {
        const availability = await apiRequest<AvailabilityDto>(
          `/api/availability?${toQuery({ serviceId, specialistId, date })}`,
        );
        if (sequence === requestSequence.current) setSlots(availability.slots);
      } catch (loadError) {
        if (sequence === requestSequence.current) {
          setSlots([]);
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить время");
        }
      } finally {
        if (sequence === requestSequence.current) setLoadingSlots(false);
      }
    };
    void loadSlots();
  }, [date, serviceId, specialistId]);

  const chooseService = (id: string) => {
    setServiceId(id);
    setStep(2);
    void Haptics.selectionAsync();
  };

  const chooseSpecialist = (id: string) => {
    setSpecialistId(id);
    setStep(3);
    void Haptics.selectionAsync();
  };

  const goForward = () => {
    setError("");
    if (step === 1 && serviceId) setStep(2);
    if (step === 2 && specialistId) setStep(3);
    if (step === 3 && slot) setStep(4);
    if (step === 4) {
      const errors = validateContact(contact);
      setContactErrors(errors);
      if (!Object.keys(errors).length) setStep(5);
    }
  };

  const goBack = () => {
    setError("");
    if (step > 1) setStep((step - 1) as Step);
  };

  const reset = () => {
    setStep(1);
    setServiceId("");
    setSpecialistId("");
    setSlot(null);
    setSlots([]);
    setNotes("");
    setError("");
  };

  const confirm = async () => {
    if (!selectedService || !selectedSpecialist || !slot) return;
    const errors = validateContact(contact);
    setContactErrors(errors);
    if (Object.keys(errors).length) {
      setStep(4);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const appointment = await apiRequest<AppointmentDto>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId: selectedService.id,
          specialistId: selectedSpecialist.id,
          startsAt: slot.startsAt,
          client: {
            name: contact.name.trim(),
            phone: contact.phone.trim(),
            email: contact.email.trim().toLowerCase(),
          },
          notes: notes.trim() || null,
        }),
      });
      await saveContact(contact);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/booking-success",
        params: {
          bookingNumber: appointment.bookingNumber,
          startsAt: appointment.startsAt,
          service: appointment.service.name,
          specialist: appointment.specialist.name,
          price: String(appointment.service.price),
          duration: String(appointment.service.duration),
        },
      });
      reset();
    } catch (submitError) {
      if (submitError instanceof ApiClientError && submitError.fieldErrors) {
        setContactErrors({
          name: submitError.fieldErrors["client.name"]?.[0],
          phone: submitError.fieldErrors["client.phone"]?.[0],
          email: submitError.fieldErrors["client.email"]?.[0],
        });
      }
      setError(submitError instanceof Error ? submitError.message : "Не удалось создать запись");
      if (submitError instanceof ApiClientError && submitError.status === 409) {
        setStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      if (loadingServices) return <SkeletonList count={4} />;
      if (!services.length) {
        return (
          <StateMessage
            icon="sparkles-outline"
            title="Нет доступных услуг"
            description="Попробуйте открыть экран записи немного позже."
          />
        );
      }
      return (
        <View style={styles.list}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={service.id === serviceId}
              onSelect={() => chooseService(service.id)}
            />
          ))}
        </View>
      );
    }

    if (step === 2) {
      if (loadingSpecialists) return <SkeletonList count={3} />;
      if (!specialists.length) {
        return (
          <StateMessage
            icon="people-outline"
            title="Нет подходящих специалистов"
            description="Для выбранной услуги сейчас нет доступных специалистов."
            actionTitle="Выбрать другую услугу"
            onAction={() => setStep(1)}
          />
        );
      }
      return (
        <View style={styles.list}>
          {specialists.map((specialist) => (
            <SpecialistCard
              key={specialist.id}
              specialist={specialist}
              selected={specialist.id === specialistId}
              onSelect={() => chooseSpecialist(specialist.id)}
            />
          ))}
        </View>
      );
    }

    if (step === 3) {
      return (
        <View>
          <Text style={styles.groupLabel}>Выберите дату</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
          >
            {dates.map((item) => {
              const selected = item.value === date;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityLabel={item.fullLabel}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setDate(item.value);
                    void Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    styles.dateCard,
                    selected && styles.dateCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.dateWeekday, selected && styles.dateTextSelected]}>{item.weekday}</Text>
                  <Text style={[styles.dateDay, selected && styles.dateTextSelected]}>{item.day}</Text>
                  <Text style={[styles.dateMonth, selected && styles.dateTextSelected]}>{item.month}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.timeHeader}>
            <Text style={styles.groupLabel}>Свободное время</Text>
            <Tag label="Москва, UTC+3" icon="location-outline" />
          </View>
          {loadingSlots ? <SkeletonList count={2} /> : null}
          {!loadingSlots && slots.length ? (
            <View style={styles.timeGrid}>
              {slots.map((item) => (
                <Pressable
                  key={item.startsAt}
                  accessibilityRole="button"
                  accessibilityLabel={`Время ${item.time}`}
                  accessibilityState={{ selected: slot?.startsAt === item.startsAt }}
                  onPress={() => {
                    setSlot(item);
                    void Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    styles.timeButton,
                    slot?.startsAt === item.startsAt && styles.timeButtonSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[
                    styles.timeText,
                    slot?.startsAt === item.startsAt && styles.timeTextSelected,
                  ]}>{item.time}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {!loadingSlots && !slots.length && !error ? (
            <StateMessage
              icon="calendar-outline"
              title="Свободного времени нет"
              description="Выберите другую дату — отменённые слоты появляются здесь автоматически."
            />
          ) : null}
        </View>
      );
    }

    if (step === 4) {
      return (
        <View>
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.success} />
            <Text style={styles.privacyText}>Контакты нужны для поиска и управления вашей записью.</Text>
          </View>
          <InputField
            label="Имя"
            value={contact.name}
            onChangeText={(name) => setContact((current) => ({ ...current, name }))}
            placeholder="Как к вам обращаться"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            error={contactErrors.name}
          />
          <InputField
            label="Телефон"
            value={contact.phone}
            onChangeText={(phone) => setContact((current) => ({ ...current, phone }))}
            placeholder="+7 999 000-00-00"
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            error={contactErrors.phone}
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
            returnKeyType="next"
            error={contactErrors.email}
          />
          <InputField
            label="Комментарий (необязательно)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Пожелания или важная информация"
            multiline
            maxLength={500}
          />
          <Text style={styles.counter}>{notes.length}/500</Text>
        </View>
      );
    }

    return (
      <Card>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewIcon}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.reviewTitle}>Всё верно?</Text>
            <Text style={styles.reviewDescription}>После подтверждения мы закрепим выбранное время.</Text>
          </View>
        </View>
        <InfoRow icon="sparkles-outline" label="Услуга" value={selectedService?.name ?? "—"} />
        <InfoRow icon="person-outline" label="Специалист" value={selectedSpecialist?.name ?? "—"} />
        <InfoRow
          icon="calendar-outline"
          label="Дата и время"
          value={slot ? formatAppointmentDate(slot.startsAt) : selectedDate?.fullLabel ?? "—"}
        />
        <InfoRow
          icon="time-outline"
          label="Продолжительность"
          value={selectedService ? formatDuration(selectedService.duration) : "—"}
        />
        <InfoRow
          icon="wallet-outline"
          label="Стоимость"
          value={selectedService ? formatPrice(selectedService.price) : "—"}
        />
        <InfoRow icon="call-outline" label="Контакт" value={contact.phone} />
      </Card>
    );
  };

  const canContinue =
    (step === 1 && Boolean(serviceId)) ||
    (step === 2 && Boolean(specialistId)) ||
    (step === 3 && Boolean(slot)) ||
    step === 4;

  return (
    <Screen keyboard>
      <PageHeader
        eyebrow={`Шаг ${step} из 5`}
        title={STEP_TITLES[step]}
        description="Вы всегда можете вернуться назад — выбранные данные сохранятся."
        action={step > 1 ? <AppButton title="Сначала" onPress={reset} variant="ghost" /> : undefined}
      />
      <StepIndicator current={step} />
      {error ? <ErrorBanner message={error} /> : null}
      {renderStep()}

      <View style={styles.actions}>
        {step > 1 ? <AppButton title="Назад" onPress={goBack} variant="ghost" /> : null}
        {step < 5 ? (
          <View style={styles.actionPrimary}>
            <AppButton
              title={step === 4 ? "Проверить запись" : "Продолжить"}
              icon="arrow-forward"
              onPress={goForward}
              disabled={!canContinue}
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.actionPrimary}>
            <AppButton
              title="Подтвердить запись"
              icon="checkmark"
              onPress={() => void confirm()}
              loading={submitting}
              fullWidth
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  groupLabel: { color: colors.ink, fontSize: typography.h3, fontWeight: "800", marginBottom: spacing.md },
  dateList: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.lg },
  dateCard: { width: 68, minHeight: 92, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingVertical: spacing.sm },
  dateCardSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  dateWeekday: { color: colors.muted, fontSize: typography.caption, textTransform: "uppercase", fontWeight: "700" },
  dateDay: { color: colors.ink, fontSize: 24, fontWeight: "900", marginVertical: 2 },
  dateMonth: { color: colors.muted, fontSize: typography.caption },
  dateTextSelected: { color: colors.white },
  pressed: { opacity: 0.8 },
  timeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeButton: { width: "30.9%", minHeight: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  timeButtonSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  timeTextSelected: { color: colors.white },
  privacyNote: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  privacyText: { flex: 1, color: colors.success, fontSize: typography.small, lineHeight: 19, fontWeight: "600" },
  counter: { color: colors.muted, fontSize: typography.caption, textAlign: "right", marginTop: -spacing.md },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  reviewIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  reviewTitle: { color: colors.ink, fontSize: typography.h3, fontWeight: "900" },
  reviewDescription: { color: colors.muted, fontSize: typography.small, lineHeight: 18, marginTop: 3 },
  actions: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.xxl },
  actionPrimary: { flex: 1 },
});
