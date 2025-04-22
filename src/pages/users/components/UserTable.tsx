
import { User } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import DeleteUserButton from './DeleteUserButton';

interface UserTableProps {
  users: User[];
  isAdmin: boolean;
  onDeleteUser: (userId: string) => Promise<void>;
}

const UserTable = ({ users, isAdmin, onDeleteUser }: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.user_metadata?.full_name || '-'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.email_confirmed_at ? (
                <Badge className="bg-green-600 flex items-center gap-1 text-white">
                  <Check className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <X className="h-3 w-3" /> Unverified
                </Badge>
              )}
            </TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
            {isAdmin && (
              <TableCell>
                <DeleteUserButton userId={user.id} onDelete={onDeleteUser} />
              </TableCell>
            )}
          </TableRow>
        ))}
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-6 text-zinc-500">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;
