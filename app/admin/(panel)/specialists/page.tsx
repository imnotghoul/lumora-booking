"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Edit3, Plus, Search, Star, Trash2, UsersRound } from "lucide-react";
import type { ServiceDto, SpecialistDto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { AdminModal } from "@/components/admin/admin-modal";
import { PageHeader } from "@/components/admin/page-header";
import { AdminErrorState, AdminPageSkeleton } from "@/components/admin/admin-states";
import { SpecialistForm, type SpecialistPayload } from "@/components/admin/specialist-form";
import { AdminApiError, adminRequest, getErrorMessage } from "@/components/admin/api";

export default function AdminSpecialistsPage() {
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<SpecialistDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SpecialistDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [specialistData, serviceData] = await Promise.all([
        adminRequest<SpecialistDto[]>("/api/admin/specialists"),
        adminRequest<ServiceDto[]>("/api/admin/services"),
      ]);
      setSpecialists(specialistData);
      setServices(serviceData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    return specialists.filter((specialist) => {
      const matchesQuery = !query || `${specialist.name} ${specialist.title} ${specialist.bio}`.toLocaleLowerCase("ru-RU").includes(query);
      const matchesVisibility = visibility === "all" || (visibility === "active" ? specialist.active : !specialist.active);
      return matchesQuery && matchesVisibility;
    });
  }, [search, specialists, visibility]);

  function openCreate() {
    setSelected(null);
    setServerErrors(undefined);
    setModal("create");
  }

  function openEdit(specialist: SpecialistDto) {
    setSelected(specialist);
    setServerErrors(undefined);
    setModal("edit");
  }

  async function save(payload: SpecialistPayload) {
    setSaving(true);
    setServerErrors(undefined);
    try {
      if (modal === "edit" && selected) {
        await adminRequest<SpecialistDto>(`/api/admin/specialists/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ tone: "success", title: "Профиль специалиста обновлён" });
      } else {
        await adminRequest<SpecialistDto>("/api/admin/specialists", { method: "POST", body: JSON.stringify(payload) });
        toast({ tone: "success", title: "Специалист добавлен" });
      }
      setModal(null);
      await load();
    } catch (saveError) {
      if (saveError instanceof AdminApiError) setServerErrors(saveError.fieldErrors);
      toast({ tone: "error", title: "Не удалось сохранить специалиста", description: getErrorMessage(saveError) });
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminRequest<SpecialistDto>(`/api/admin/specialists/${deleteTarget.id}`, { method: "DELETE" });
      toast({ tone: "success", title: "Специалист деактивирован", description: "Профиль скрыт от клиентов, история записей сохранена." });
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      toast({ tone: "error", title: "Не удалось деактивировать специалиста", description: getErrorMessage(deleteError) });
    } finally {
      setDeleting(false);
    }
  }

  const serviceName = (id: string) => services.find((service) => service.id === id)?.name;

  if (loading && !specialists.length) return <AdminPageSkeleton />;
  if (error && !specialists.length) return <AdminErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Команда"
        title="Специалисты"
        description="Настройте профили команды и назначьте услуги, которые выполняет каждый специалист."
        icon={UsersRound}
        action={<Button onClick={openCreate} className="w-full sm:w-auto"><Plus className="size-4" />Добавить специалиста</Button>}
      />

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="relative">
            <span className="sr-only">Найти специалиста</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя, должность или описание" className="pl-10" />
          </label>
          <Select value={visibility} onChange={(event) => setVisibility(event.target.value)} aria-label="Фильтр специалистов">
            <option value="all">Вся команда</option>
            <option value="active">Только активные</option>
            <option value="inactive">Только неактивные</option>
          </Select>
        </CardContent>
      </Card>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}

      {filtered.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Команда специалистов">
          {filtered.map((specialist) => (
            <Card key={specialist.id} className={cn("overflow-hidden", !specialist.active && "bg-slate-50 opacity-75")}>
              <div className="h-1.5" style={{ backgroundColor: specialist.color }} />
              <CardContent className="flex h-full flex-col pt-5">
                <div className="flex items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-base font-extrabold text-white shadow-sm" style={{ backgroundColor: specialist.color }}>{specialist.initials}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h2 className="font-bold text-ink">{specialist.name}</h2><p className="mt-0.5 text-sm text-muted">{specialist.title}</p></div>
                      <Badge tone={specialist.active ? "success" : "neutral"}>{specialist.active ? "Активен" : "Неактивен"}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1"><BriefcaseBusiness className="size-3.5" />{specialist.experience} {specialist.experience === 1 ? "год" : "лет"} опыта</span>
                      <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />{specialist.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{specialist.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {specialist.serviceIds.slice(0, 3).map((id) => serviceName(id) ? <Badge key={id}>{serviceName(id)}</Badge> : null)}
                  {specialist.serviceIds.length > 3 ? <Badge>+{specialist.serviceIds.length - 3}</Badge> : null}
                </div>
                <div className="mt-5 flex justify-end gap-1 border-t border-line pt-4">
                  <Button size="sm" variant="outline" onClick={() => openEdit(specialist)}><Edit3 className="size-4" />Изменить</Button>
                  {specialist.active ? <Button size="icon" variant="ghost" className="hover:bg-red-50 hover:text-danger" onClick={() => setDeleteTarget(specialist)} aria-label={`Деактивировать специалиста ${specialist.name}`}><Trash2 className="size-4" /></Button> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title={specialists.length ? "Специалисты не найдены" : "Добавьте первого специалиста"}
          description={specialists.length ? "Измените поисковый запрос или фильтр." : "Создайте профиль и назначьте услуги, чтобы открыть онлайн-запись."}
          icon={UsersRound}
          action={!specialists.length ? <Button onClick={openCreate}><Plus className="size-4" />Добавить специалиста</Button> : undefined}
        />
      )}

      <AdminModal open={modal !== null} onClose={() => !saving && setModal(null)} title={modal === "edit" ? "Изменить специалиста" : "Новый специалист"} description="Профиль и назначенные услуги будут видны клиентам." size="lg">
        {modal ? <SpecialistForm key={`${modal}-${selected?.id || "new"}`} specialist={selected} services={services} loading={saving} serverErrors={serverErrors} onSubmit={(payload) => void save(payload)} onCancel={() => setModal(null)} /> : null}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Деактивировать специалиста?"
        description={deleteTarget ? `${deleteTarget.name} исчезнет из списка доступных специалистов. Существующие записи и история сохранятся.` : ""}
        confirmLabel="Деактивировать"
        danger
        loading={deleting}
        onConfirm={() => void deactivate()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
