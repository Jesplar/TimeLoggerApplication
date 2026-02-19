export interface Customer {
  id: number;
  name: string;
  isActive: boolean;
  createdDate: string;
}

export interface Project {
  id: number;
  customerId: number;
  customerName: string;
  projectNumber: string;
  name: string;
  isActive: boolean;
  createdDate: string;
}

export interface TimeEntry {
  id: number;
  projectId: number;
  projectName: string;
  projectNumber: string;
  customerName: string;
  date: string;
  hours?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  createdDate: string;
  modifiedDate?: string;
}

export interface CreateTimeEntryDto {
  projectId: number;
  date: string;
  hours?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export interface UpdateTimeEntryDto extends CreateTimeEntryDto {}

export interface DailySummary {
  date: string;
  entries: TimeEntry[];
  dailyTotal: number;
}

export interface ProjectTotal {
  projectId: number;
  projectName: string;
  projectNumber: string;
  customerName: string;
  totalHours: number;
}

export interface WeeklySummary {
  weekStartDate: string;
  days: DailySummary[];
  projectTotals: ProjectTotal[];
  totalHours: number;
}

export interface CreateCustomerDto {
  name: string;
}

export interface UpdateCustomerDto {
  name: string;
  isActive: boolean;
}

export interface CreateProjectDto {
  customerId: number;
  projectNumber: string;
  name: string;
}

export interface UpdateProjectDto {
  customerId: number;
  projectNumber: string;
  name: string;
  isActive: boolean;
}
