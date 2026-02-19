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

// Report Types
export interface MonthlyCustomerReport {
  customer: string;
  totalEntries: number;
  totalHours: number;
  period: string;
}

export interface MonthlyProjectReport {
  customer: string;
  projectNumber: string;
  projectName: string;
  entries: number;
  totalHours: number;
  period: string;
}

export interface InvoiceReport {
  date: string;
  customer: string;
  projectNumber: string;
  projectName: string;
  hours: number;
  startTime?: string;
  endTime?: string;
  description: string;
}

export interface WeeklyTimesheetReport {
  date: string;
  dayOfWeek: string;
  customer: string;
  projectNumber: string;
  project: string;
  hours: number;
  startTime?: string;
  endTime?: string;
  description: string;
}

export interface CustomerActivityReport {
  customer: string;
  activeProjects: number;
  totalEntries: number;
  totalHours: number;
  firstEntry: string;
  lastEntry: string;
}

export interface ProjectStatusReport {
  customer: string;
  projectNumber: string;
  projectName: string;
  active: boolean;
  totalEntries: number;
  totalHours: number;
  lastActivity?: string;
  daysSinceLastEntry?: number;
}

export interface YearToDateSummary {
  year: number;
  daysWorked: number;
  projectsWorked: number;
  customersServed: number;
  totalEntries: number;
  totalHours: number;
  avgHoursPerEntry: number;
}

export interface MonthlyComparison {
  yearMonth: string;
  entries: number;
  totalHours: number;
  projectsActive: number;
  customersActive: number;
}
