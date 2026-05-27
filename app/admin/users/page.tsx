"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Shield,
  ShieldOff,
  UserPlus,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

const roles = [
  "super_admin",
  "finance_admin",
  "collection_team",
  "delivery_team",
  "surveyor",
  "courier",
] as const;

const PERM_DESC: Record<string, string> = {
  super_admin: "Full access",
  finance_admin: "Approval, finance, warehouse",
  collection_team: "Collection",
  delivery_team: "Delivery, warehouse",
  surveyor: "Field validation, fraud review",
  courier: "Mobile delivery app",
};

export default function UsersPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [target, setTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "password123",
    role: "collection_team" as (typeof roles)[number],
  });

  const refresh = async () => {
    setLoading(true);
    const res = await admin.users();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
    else toast.danger("Gagal memuat", res.error);
  };
  useEffect(() => {
    refresh();
  }, []);

  const addUser = async () => {
    const res = await admin.createUser(form);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("User dibuat", `${form.name} sebagai ${form.role}`);
    setAddOpen(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "password123",
      role: "collection_team",
    });
    refresh();
  };

  const toggleStatus = async (u: any) => {
    const res = await admin.updateUser({
      userId: u.id,
      status: u.status === "active" ? "suspended" : "active",
    });
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.info(
      u.status === "active" ? "User di-suspend" : "User diaktifkan",
      u.name
    );
    refresh();
  };

  const updateRole = async (role: (typeof roles)[number]) => {
    if (!target) return;
    const res = await admin.updateUser({ userId: target.id, role });
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Role diperbarui");
    setTarget(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Users & Roles</h1>
          <p className="text-ink-muted mt-1">
            Kelola admin, finance, collection, delivery, surveyor & courier.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" /> Tambah User
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <Card key={r} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                <Shield className="h-4 w-4" />
              </div>
              <p className="font-semibold text-ink text-sm">
                {r.replace("_", " ").toUpperCase()}
              </p>
            </div>
            <p className="text-xs text-ink-muted">{PERM_DESC[r]}</p>
            <p className="text-xs text-ink mt-2 font-semibold">
              {items.filter((u) => u.role === r).length} user
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6">
          <CardTitle>Team Members</CardTitle>
        </div>
        {loading ? <div className="skeleton h-40 m-6" /> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-muted">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last Login</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted">
                    Belum ada team member
                  </td>
                </tr>
              ) : null}
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary text-white grid place-items-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{u.name}</p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge tone="primary">{u.role}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge tone={u.status === "active" ? "success" : "danger"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-ink-muted text-xs">
                    {u.lastLoginAt
                      ? formatDate(new Date(u.lastLoginAt))
                      : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTarget(u)}
                      >
                        Edit Role
                      </Button>
                      <Button
                        variant={u.status === "active" ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === "active" ? (
                          <>
                            <ShieldOff className="h-4 w-4" /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Aktifkan
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Team Member"
        description="Buat akun admin baru dengan role tertentu."
      >
        <div className="space-y-3">
          <div>
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Password (sementara)</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={cn(
                    "h-11 rounded-2xl border text-sm font-semibold transition",
                    form.role === r
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-border text-ink-muted hover:bg-slate-50"
                  )}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAddOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={addUser}
            disabled={
              !form.name || !form.email || !form.phone || !form.password
            }
          >
            <Plus className="h-4 w-4" /> Buat User
          </Button>
        </div>
      </Modal>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Ubah Role"
        description={`Pilih role baru untuk ${target?.name}`}
      >
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => updateRole(r)}
              className={cn(
                "w-full p-3 text-left rounded-2xl border transition",
                target?.role === r
                  ? "border-primary bg-primary-50/50"
                  : "border-border hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{r}</span>
                {target?.role === r ? (
                  <Badge tone="primary">Saat ini</Badge>
                ) : null}
              </div>
              <p className="text-xs text-ink-muted mt-1">{PERM_DESC[r]}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
