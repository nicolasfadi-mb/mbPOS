
import React from 'react';
import type { User, Branch } from '../types';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface BranchSelectionScreenProps {
  user: User;
  branches: Branch[];
  onSelect: (branchId: string) => void;
  onLogout: () => void;
}

const COMPANY_VIEW_ID = 'company_view_id';

const BranchSelectionScreen: React.FC<BranchSelectionScreenProps> = ({ user, branches, onSelect, onLogout }) => {
  
  const accessibleBranches = user.role === 'admin'
    ? branches
    : branches.filter(b => user.accessibleBranchIds.includes(b.id));

  return (
    <div className="bg-background min-h-screen w-full flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="absolute top-6 right-6">
        <button onClick={onLogout} className="font-medium text-sm text-primary hover:underline">
            Logout
        </button>
      </div>
      <div className="text-center mb-12">
        <CoffeeIcon className="w-20 h-20 mx-auto text-primary mb-4" />
        <h1 className="text-5xl font-bold text-on-background tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">Please select your scope to begin.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {user.role === 'admin' && (
            <div
                key="company-view"
                onClick={() => onSelect(COMPANY_VIEW_ID)}
                className="group bg-surface-container-low p-6 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center aspect-square w-56 h-56"
            >
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-surface-container group-hover:bg-primary-container transition-colors`}>
                    <GlobeIcon className={`w-16 h-16 text-on-surface-variant group-hover:text-on-primary-container transition-colors`} />
                </div>
                <p className="text-xl font-semibold text-on-surface">Whole Company</p>
            </div>
        )}
        {accessibleBranches.map(branch => (
        <div
            key={branch.id}
            onClick={() => onSelect(branch.id)}
            className="group bg-surface-container-low p-6 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center aspect-square w-56 h-56"
        >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-surface-container group-hover:bg-primary-container transition-colors`}>
                <BuildingOfficeIcon className={`w-16 h-16 text-on-surface-variant group-hover:text-on-primary-container transition-colors`} />
            </div>
            <p className="text-xl font-semibold text-on-surface">{branch.name}</p>
        </div>
        ))}
        {accessibleBranches.length === 0 && user.role !== 'admin' && (
            <div className="text-center p-8 bg-surface-container-low rounded-2xl">
                <h2 className="text-2xl font-semibold text-error">No Branches Assigned</h2>
                <p className="text-on-surface-variant mt-2">You do not have access to any branches. Please contact an administrator.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BranchSelectionScreen;
