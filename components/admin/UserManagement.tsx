import React, { useState } from 'react';
import type { User, Branch } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  branches: Branch[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, branches }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openModalForNew = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (userData: Omit<User, 'id'> & { id?: string }) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...userData } : u));
    } else {
      const newUser: User = { 
        id: `user_${Date.now()}`,
        name: userData.name,
        pin: userData.pin,
        role: userData.role,
        accessibleBranchIds: userData.accessibleBranchIds || []
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if(userToDelete?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert("You cannot delete the last admin user.");
        return;
    }
    if(window.confirm('Are you sure you want to delete this user?')) {
        setUsers(users.filter(u => u.id !== userId));
    }
  };
  
  const getBranchNames = (accessibleIds: 'all' | string[]) => {
      if (accessibleIds === 'all') return 'All Branches';
      if (accessibleIds.length === 0) return 'No Access';
      return accessibleIds.map(id => branches.find(b => b.id === id)?.name || 'Unknown').join(', ');
  }

  return (
    <div>
        <div className="flex justify-end items-center mb-4">
            <button onClick={openModalForNew} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                Add User
            </button>
        </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Name</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Role</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Branch Access</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-surface-container-high transition-colors">
                <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{user.name}</td>
                <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant capitalize">{user.role}</td>
                <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{getBranchNames(user.accessibleBranchIds)}</td>
                <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModalForEdit(user)} className="text-primary hover:text-primary/80 mr-4"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(user.id)} className="text-error hover:text-error/80"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <UserFormModal 
            user={editingUser} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave}
            branches={branches} 
        />
      )}
    </div>
  );
};

const UserFormModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (data: Omit<User, 'id'> & { id?: string }) => void;
  branches: Branch[];
}> = ({ user, onClose, onSave, branches }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || 'barista',
    pin: '', // Always start empty for security
    accessibleBranchIds: user?.accessibleBranchIds || [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBranchSelect = (branchId: string) => {
      setFormData(prev => {
          const currentIds = prev.accessibleBranchIds === 'all' ? [] : prev.accessibleBranchIds;
          const newIds = currentIds.includes(branchId)
            ? currentIds.filter(id => id !== branchId)
            : [...currentIds, branchId];
          return { ...prev, accessibleBranchIds: newIds };
      })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin))) {
        alert("A new user's PIN must be exactly 4 digits.");
        return;
    }
    if (user && formData.pin && (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin))) {
        alert("If changing the PIN, it must be exactly 4 digits.");
        return;
    }
    const finalData = {
        ...formData,
        pin: formData.pin || (user ? user.pin : ''), // Keep old pin if field is empty on edit
        accessibleBranchIds: formData.role === 'admin' ? 'all' : formData.accessibleBranchIds
    };
    onSave(finalData);
  };
  
  return (
    <Modal title={user ? 'Edit User' : 'Add User'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field"/>
            </div>
            <div>
                <label htmlFor="pin" className="block text-sm font-medium text-on-surface-variant">PIN (4 digits)</label>
                <input type="password" name="pin" id="pin" value={formData.pin} onChange={handleChange} required={!user} maxLength={4} pattern="\d{4}" title="PIN must be 4 digits" className="input-field" />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-on-surface-variant">Role</label>
                <select name="role" id="role" value={formData.role} onChange={handleChange} className="input-field">
                    <option value="barista">Barista</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {formData.role === 'barista' && (
                <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Branch Access</label>
                    <div className="mt-2 p-3 bg-surface-container rounded-xl grid grid-cols-2 gap-2">
                        {branches.map(branch => (
                            <label key={branch.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.accessibleBranchIds !== 'all' && formData.accessibleBranchIds.includes(branch.id)}
                                    onChange={() => handleBranchSelect(branch.id)}
                                    className="h-4 w-4 rounded text-primary focus:ring-primary border-outline"
                                />
                                <span className="text-on-surface">{branch.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}


            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Save</button>
            </div>
        </form>
    </Modal>
  )
}

export default UserManagement;