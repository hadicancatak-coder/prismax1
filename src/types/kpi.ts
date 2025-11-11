export type KPIType = 'annual' | 'quarterly';
export type KPIStatus = 'draft' | 'pending_approval' | 'active' | 'completed' | 'archived';
export type KPITargetType = 'channel' | 'custom' | 'team' | 'individual';

export interface KPITarget {
  id: string;
  kpi_id: string;
  target_type: KPITargetType;
  target_name: string;
  target_value: number;
  current_value: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface TeamKPI {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  type: KPIType;
  period: string;
  status: KPIStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  targets?: KPITarget[];
  assignments?: KPIAssignment[];
  linkedTasks?: string[];
}

export interface KPIAssignment {
  id: string;
  kpi_id: string;
  user_id: string | null;
  team_name: string | null;
  assigned_by: string;
  assigned_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
}

export interface KPITaskLink {
  id: string;
  kpi_id: string;
  task_id: string;
  linked_at: string;
  linked_by: string;
}
