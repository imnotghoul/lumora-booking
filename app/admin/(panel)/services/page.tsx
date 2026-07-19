"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Scissors, Sparkles, Trash2 } from "lucide-react";
import type { ServiceDto } from "@/lib/types";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
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
import { ServiceForm, type ServicePayload } from "@/components/admin/service-form";
import { AdminApiError, adminRequest, getErrorMessage } from "@/components/admin/api";
import { ServiceGlyph } from "@/components/public/service-card";

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<ServiceDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ServiceDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setServices(await adminRequest<ServiceDto[]>("/api/admin/services"));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    return services.filter((service) => {
      const matchesQuery = !query || `${service.name} ${service.description} ${service.category}`.toLocaleLowerCase("ru-RU").includes(query);
      const matchesVisibility = visibility === "all" || (visibility === "active" ? service.active : !service.active);
      return matchesQuery && matchesVisibility;
    });
  }, [search, services, visibility]);

  function openCreate() {
    setSelected(null);
    setServerErrors(undefined);
    setModal("create");
  }

  function openEdit(service: ServiceDto) {
    setSelected(service);
    setServerErrors(undefined);
    setModal("edit");
  }

  async function save(payload: ServicePayload) {
    setSaving(true);
    setServerErrors(undefined);
    try {
      if (modal === "edit" && selected) {
        await adminRequest<ServiceDto>(`/api/admin/services/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ tone: "success", title: "Услуга обновлена" });
      } else {
        await adminRequest<ServiceDto>("/api/admin/services", { method: "POST", body: JSON.stringify(payload) });
        toast({ tone: "success", title: "Услуга добавлена" });
      }
      setModal(null);
      await load();
    } catch (saveError) {
      if (saveError instanceof AdminApiError) setServerErrors(saveError.fieldErrors);
      toast({ tone: "error", title: "Не удалось сохранить услугу", description: getErrorMessage(saveError) });
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminRequest<ServiceDto>(`/api/admin/services/${deleteTarget.id}`, { method: "DELETE" });
      toast({ tone: "success", title: "Услуга деактивирована", description: "Она больше не доступна для новых записей." });
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      toast({ tone: "error", title: "Не удалось деактивировать услугу", description: getErrorMessage(deleteError) });
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !services.length) return <AdminPageSkeleton />;
  if (error && !services.length) return <AdminErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Каталог"
        title="Услуги"
        description="Управляйте ценами, продолжительностью и видимостью услуг для клиентов."
        icon={Scissors}
        action={<Button onClick={openCreate} className="w-full sm:w-auto"><Plus className="size-4" />Добавить услугу</Button>}
      />

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <label className="relative">
            <span className="sr-only">Найти услугу</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название, описание или категория" className="pl-10" />
          </label>
          <Select value={visibility} onChange={(event) => setVisibility(event.target.value)} aria-label="Фильтр видимости">
            <option value="all">Все услуги</option>
            <option value="active">Только активные</option>
            <option value="inactive">Только неактивные</option>
          </Select>
        </CardContent>
      </Card>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}

      {filtered.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Список услуг">
          {filtered.map((service) => (
            <Card key={service.id} className={cn("group overflow-hidden", !service.active && "bg-slate-50 opacity-75")}>
              <CardContent className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-50 text-accent-700"><ServiceGlyph icon={service.icon || "Sparkles"} /></span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {service.featured ? <Badge tone="accent"><Sparkles className="mr-1 size-3" />Популярная</Badge> : null}
                    <Badge tone={service.active ? "success" : "neutral"}>{service.active ? "Активна" : "Неактивна"}</Badge>
                  </div>
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-600">{service.category}</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{service.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{service.description}</p>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <div><p className="font-bold text-ink">{formatPrice(service.price)}</p><p className="mt-0.5 text-xs text-muted">{formatDuration(service.duration)}</p></div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(service)} aria-label={`Изменить услугу ${service.name}`}><Edit3 className="size-4" /></Button>
                    {service.active ? <Button size="icon" variant="ghost" className="hover:bg-red-50 hover:text-danger" onClick={() => setDeleteTarget(service)} aria-label={`Деактивировать услугу ${service.name}`}><Trash2 className="size-4" /></Button> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title={services.length ? "Услуги не найдены" : "Добавьте первую услугу"}
          description={services.length ? "Попробуйте изменить запрос или фильтр видимости." : "Укажите стоимость и продолжительность, чтобы клиенты могли записаться."}
          icon={Scissors}
          action={!services.length ? <Button onClick={openCreate}><Plus className="size-4" />Добавить услугу</Button> : undefined}
        />
      )}

      <AdminModal open={modal !== null} onClose={() => !saving && setModal(null)} title={modal === "edit" ? "Изменить услугу" : "Новая услуга"} description="Информация сразу используется в каталоге и онлайн-записи." size="lg">
        {modal ? <ServiceForm key={`${modal}-${selected?.id || "new"}`} service={selected} loading={saving} serverErrors={serverErrors} onSubmit={(payload) => void save(payload)} onCancel={() => setModal(null)} /> : null}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Деактивировать услугу?"
        description={deleteTarget ? `«${deleteTarget.name}» исчезнет из клиентского каталога и станет недоступна для новых записей. Существующие записи сохранятся.` : ""}
        confirmLabel="Деактивировать"
        danger
        loading={deleting}
        onConfirm={() => void deactivate()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
