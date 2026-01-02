import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CalendarDays, Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const appointmentSchema = z.object({
  title: z.string().min(3, "Informe o título do compromisso"),
  client_name: z.string().min(3, "Informe o cliente"),
  date: z.string().min(1, "Selecione a data e horário"),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  notes: z.string().optional(),
});

const formatDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

type AppointmentFormValues = z.infer<typeof appointmentSchema>;
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

const Agenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      client_name: "",
      date: formatDateTimeLocal(new Date()),
      status: "scheduled",
      notes: "",
    },
  });

const {
  data: appointments = [],
  isLoading,
  isError,
} = useQuery({
  queryKey: ["appointments", user?.id],
  enabled: !!user,
  queryFn: async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Appointments query error:", error);
      throw error;
    }

    return data ?? [];
  },
  staleTime: 30_000,
});


  const invalidateAppointments = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments", user?.id] });
  };

  const createAppointment = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        title: values.title,
        client_name: values.client_name,
        date: new Date(values.date).toISOString(),
        status: values.status,
        notes: values.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAppointments();
      toast({ title: "Compromisso adicionado!" });
      form.reset({
        title: "",
        client_name: "",
        date: formatDateTimeLocal(selectedDate ?? new Date()),
        status: "scheduled",
        notes: "",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o compromisso.",
      });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async (payload: { id: string; values: AppointmentFormValues }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("appointments")
        .update({
          title: payload.values.title,
          client_name: payload.values.client_name,
          date: new Date(payload.values.date).toISOString(),
          status: payload.values.status,
          notes: payload.values.notes || null,
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAppointments();
      toast({ title: "Compromisso atualizado!" });
      setEditingAppointment(null);
      setDialogOpen(false);
      form.reset({
        title: "",
        client_name: "",
        date: formatDateTimeLocal(selectedDate ?? new Date()),
        status: "scheduled",
        notes: "",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o compromisso.",
      });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAppointments();
      toast({ title: "Compromisso removido" });
      setAppointmentToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o compromisso.",
      });
    },
  });

  const onSubmit = (values: AppointmentFormValues) => {
    if (editingAppointment) {
      updateAppointment.mutate({ id: editingAppointment.id, values });
    } else {
      createAppointment.mutate(values);
    }
  };

  const appointmentsForSelectedDay = useMemo(() => {
    if (!selectedDate) return appointments || [];
    return (appointments || []).filter((appointment) =>
      isSameDay(new Date(appointment.date), selectedDate),
    );
  }, [appointments, selectedDate]);

  const upcomingCount = useMemo(
    () =>
      (appointments || []).filter(
        (appointment) =>
          appointment.status === "scheduled" &&
          isAfter(new Date(appointment.date), new Date()),
      ).length,
    [appointments],
  );

  const completedCount = useMemo(
    () => (appointments || []).filter((appointment) => appointment.status === "completed").length,
    [appointments],
  );

  const openEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    form.reset({
      title: appointment.title,
      client_name: appointment.client_name,
      date: formatDateTimeLocal(new Date(appointment.date)),
      status: appointment.status,
      notes: appointment.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAppointment(null);
    form.reset({
      title: "",
      client_name: "",
      date: formatDateTimeLocal(selectedDate ?? new Date()),
      status: "scheduled",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm">Agenda</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Compromissos e calendário</h1>
            <p className="text-muted-foreground">
              Organize atendimentos, prazos e visitas de forma visual.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-soft">
                <Plus className="h-4 w-4" />
                Novo compromisso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAppointment ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Reunião com cliente"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Cliente</Label>
                  <Input
                    id="client_name"
                    placeholder="Nome do cliente"
                    {...form.register("client_name")}
                  />
                  {form.formState.errors.client_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.client_name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data e horário</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      {...form.register("date")}
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as AppointmentFormValues["status"])}
                  >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais"
                    rows={3}
                    {...form.register("notes")}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createAppointment.isLoading || updateAppointment.isLoading}>
                  {(createAppointment.isLoading || updateAppointment.isLoading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAppointment ? "Salvar alterações" : "Adicionar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje é</p>
                  <p className="text-lg font-semibold">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date ?? new Date())}
                  locale={ptBR}
                  className="w-full"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-border/80 bg-background/70 p-3">
                  <p className="text-muted-foreground">Próximos</p>
                  <p className="text-xl font-semibold text-foreground">{upcomingCount}</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/70 p-3">
                  <p className="text-muted-foreground">Concluídos</p>
                  <p className="text-xl font-semibold text-foreground">{completedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compromissos de</p>
                <h2 className="text-xl font-semibold text-foreground">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {appointmentsForSelectedDay.length} agendado(s)
              </Badge>
            </div>

            {appointmentsForSelectedDay.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center shadow-soft">
                <p className="text-muted-foreground">
                  Nenhum compromisso nesta data. Clique em "Novo compromisso" para agendar.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {appointmentsForSelectedDay.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-start justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-soft"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{appointment.title}</p>
                      <Badge variant="secondary" className="capitalize">
                        {appointment.status === "scheduled" && "Agendado"}
                        {appointment.status === "completed" && "Concluído"}
                        {appointment.status === "cancelled" && "Cancelado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Cliente: {appointment.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-foreground/80">{appointment.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => openEdit(appointment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => setAppointmentToDelete(appointment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => {
          if (!open) setAppointmentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover compromisso?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não poderá ser desfeita. O compromisso será removido definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (appointmentToDelete) deleteAppointment.mutate(appointmentToDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAppointment.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Agenda;
