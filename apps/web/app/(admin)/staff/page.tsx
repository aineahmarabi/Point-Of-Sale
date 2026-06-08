"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";

import { DataTable } from "@/components/admin/module/data-table";
import { getColumns } from "./columns";
import { StaffInviteModal, StaffEditModal } from "./form";

type Staff = Doc<"users"> & { role_name?: string | null };

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function StaffPage() {
  const { currentUser } = useData();
  const adminsResult = useQuery(api.user.users.list, {
    paginationOpts: { numItems: 100, cursor: null },
    isAdmin: true,
  });
  const cashiersResult = useQuery(api.user.users.list, {
    paginationOpts: { numItems: 100, cursor: null },
    isAdmin: false,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Staff | undefined>();

  const staff = useMemo(
    () =>
      [
        ...(adminsResult?.page ?? []),
        ...(cashiersResult?.page ?? []),
      ] as Staff[],
    [adminsResult, cashiersResult],
  );

  const loading =
    adminsResult === undefined || cashiersResult === undefined;

  const columns = useMemo(
    () =>
      getColumns({
        currentUserId: currentUser?._id,
        onEdit: (s) => {
          setSelected(s);
          setEditOpen(true);
        },
      }),
    [currentUser],
  );

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <p className="text-muted-foreground text-sm">
          Manage who can access the POS and admin.
        </p>
        <Button onClick={() => setInviteOpen(true)}>Invite Staff</Button>
      </div>
      <DataTable
        columns={columns}
        data={staff}
        page={1}
        pageSize={Math.max(staff.length, 10)}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalPages={1}
        totalCount={staff.length}
        isDone={true}
        isLoading={loading}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onRequestCount={() => {}}
        columnFilters={[]}
      />
      <StaffInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      <StaffEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        staff={selected}
      />
    </main>
  );
}
