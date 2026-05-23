"use client";
import { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Shield,
  ShieldOff,
  UserPlus,
  X,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  roleUsers as initial,
  rolePermissions,
  type RoleUser,
} from "@/lib/mock-data-extra";
import { formatDate, cn } from "@/lib/utils";

const roles: RoleUser["role"][] = [
  "Super Admin",
  "Finance Admin",
  "Collection Team",
  "Delivery Team",
  "Surveyor",
];

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<RoleUser[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [target, setTarget] = useState<RoleUser | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Collection Team" as RoleUser["role"],
  });

  const addUser = () => {
    if (!form.name || !form.email) return;
    const newUser: RoleUser = {
      id: `U-${String(users.length + 1).padStart(3, "0")}`,
      name: form.name,
      email: form.email,
      role: form.role,
      status: "active",
      lastLogin: new Date().toISOString(),
    };
    setUsers((s) => [newUser, ...s]);
    toast.success("User dibuat", `${form.name} sebagai ${form.role}`);
    setAddOpen(false);
    setForm({ name: "", email: "", role: "Collection Team" });
  };

  const toggleStatus = (id: string) => {
    setUsers((s) =>
      s.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    );
    const u = users.find((x) => x.id === id);
    toast.info(
      u?.status === "active" ? "User di-suspend" : "User diaktifkan",
      u?.name
    );
  };

  const updateRole = (role: RoleUser["role"]) => {
    if (!target) return;
    setUsers((s) =>
      s.map((u) => (u.id === target.id ? { ...u, role } : u))
    );
    toast.success("Role diperbarui", `${target.name} → ${role}`);
    setTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Users & Roles</h1>
          <p className="text-ink-muted mt-1">
            Kelola admin, finance, collection, delivery & surveyor team.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" /> Tambah User
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid lg:grid-cols-5 gap-4">
        {roles.map((r) => (
          <Card key={r} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                <Shield className="h-4 w-4" />
              </div>
              <p className="font-semibold text-ink text-sm">{r}</p>
            </div>
            <p className="text-xs text-ink-muted">
              Akses: {rolePermissions[r].join(", ")}
            </p>
            <p className="text-xs text-ink mt-2 font-semibold">
              {users.filter((u) => u.role === r).length} user aktif
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6">
          <CardTitle>Team Members</CardTitle>
        </div>
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
              {users.map((u) => (
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
                  <td className="px-6 py-3 text-ink-muted">
                    {formatDate(u.lastLogin)}
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
                        onClick={() => toggleStatus(u.id)}
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
                  {r}
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
            disabled={!form.name || !form.email}
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
              <p className="text-xs text-ink-muted mt-1">
                {rolePermissions[r].join(", ")}
              </p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
