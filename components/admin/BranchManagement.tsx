import React, { useState } from 'react';
import type { Branch } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface BranchManagementProps {
  branches: Branch[];
  onAddBranch: (name: string) => void;
  // onEditBranch: (id: string, name: string) => void;
  // onDeleteBranch: (id: string) => void;
}

const BranchManagement: React.FC<BranchManagementProps> = ({ branches, onAddBranch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const openModalForNew = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (branch: Branch) => {
    // setEditingBranch(branch);
    // setIsModalOpen(true);
    alert("Editing branch names is not yet supported.");
  };

  const handleSave = (name: string) => {
    if (editingBranch) {
      // onEditBranch(editingBranch.id, name);
    } else {
      onAddBranch(name);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (branchId: string) => {
     if(branches.length <= 1) {
        alert("Cannot delete the last branch.");
        return;
    }
    alert("Deleting branches is not yet supported. This feature is coming soon!");
    // if(window.confirm('Are you sure you want to delete this branch? This is permanent and will delete all associated data.')) {
    //     onDeleteBranch(branchId);
    // }
  };

  return (
    <div>
        <div className="flex justify-end items-center mb-4">
            <button onClick={openModalForNew} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                Add Branch
            </button>
        </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Branch Name</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Branch ID</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {branches.map(branch => (
              <tr key={branch.id} className="hover:bg-surface-container-high transition-colors">
                <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{branch.name}</td>
                <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant font-mono">{branch.id}</td>
                <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModalForEdit(branch)} className="text-primary hover:text-primary/80 mr-4 disabled:text-outline disabled:cursor-not-allowed" disabled><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(branch.id)} className="text-error hover:text-error/80 disabled:text-outline disabled:cursor-not-allowed" disabled><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <BranchFormModal 
            branch={editingBranch} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
        />
      )}
    </div>
  );
};

const BranchFormModal: React.FC<{
  branch: Branch | null;
  onClose: () => void;
  onSave: (name: string) => void;
}> = ({ branch, onClose, onSave }) => {
  const [name, setName] = useState(branch?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  
  return (
    <Modal title={branch ? 'Edit Branch' : 'Add New Branch'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">Branch Name</label>
                <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="input-field"/>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Save</button>
            </div>
        </form>
    </Modal>
  )
}

export default BranchManagement;
