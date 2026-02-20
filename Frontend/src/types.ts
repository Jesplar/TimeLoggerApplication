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

export interface TimeCode {
  id: number;
  code: number;
  description: string;
  isActive: boolean;
}

export interface CreateTimeCodeDto {
  code: number;
  description: string;
}

export interface UpdateTimeCodeDto {
  code: number;
  description: string;
  isActive: boolean;
}

export interface TimeEntry {
  id: number;
  projectId: number;
  projectName: string;
  projectNumber: string;
  customerId: number;
  customerName: string;
  timeCodeId: number;
  timeCode: number;
  timeCodeDescription: string;
  date: string;
  hours?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  isOnSite: boolean;
  travelHours?: number;
  travelKm?: number;
  createdDate: string;
  modifiedDate?: string;
}

export interface CreateTimeEntryDto {
  projectId: number;
  timeCodeId: number;
  date: string;
  hours?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  isOnSite: boolean;
  travelHours?: number;
  travelKm?: number;
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
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
  period: string;
}

export interface MonthlyProjectReport {
  customer: string;
  projectNumber: string;
  projectName: string;
  entries: number;
  totalHours: number;
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
  period: string;
}

export interface InvoiceReport {
  date: string;
  customer: string;
  projectNumber: string;
  projectName: string;
  timeCode: number;
  timeCodeDescription: string;
  hours: number;
  isOnSite: boolean;
  travelHours: number;
  travelKm: number;
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
  isOnSite: boolean;
  travelHours: number;
  travelKm: number;
  startTime?: string;
  endTime?: string;
  description: string;
}

export interface CustomerActivityReport {
  customer: string;
  activeProjects: number;
  totalEntries: number;
  totalHours: number;
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
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
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
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
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
  avgHoursPerEntry: number;
}

export interface MonthlyComparison {
  yearMonth: string;
  entries: number;
  totalHours: number;
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
  projectsActive: number;
  customersActive: number;
}

export interface Settings {
  id: number;
  sekToEurRate: number;
  hourlyRateEur: number;
  travelHourlyRateEur: number;
  kmCost: number;
  createdDate: string;
  modifiedDate?: string;
}

export interface UpdateSettingsDto {
  sekToEurRate: number;
  hourlyRateEur: number;
  travelHourlyRateEur: number;
  kmCost: number;
}

export interface TimeCodeHours {
  timeCode: number;
  timeCodeDescription: string;
  hours: number;
  cost: number;
}

export interface InvoiceExportProject {
  customer: string;
  projectNumber: string;
  projectName: string;
  period: string;
  
  regularHoursByTimeCode: TimeCodeHours[];
  onSiteHoursByTimeCode: TimeCodeHours[];
  
  regularHours: number;
  onSiteHours: number;
  travelHours: number;
  travelKm: number;
  
  hourlyRate: number;
  travelHourlyRate: number;
  kmCost: number;
  
  regularCost: number;
  onSiteCost: number;
  travelTimeCost: number;
  travelDistanceCost: number;
  receiptsCost: number;
  grandTotal: number;
  
  entries: InvoiceReport[];
  receipts: InvoiceReceipt[];
}

export interface InvoiceReceipt {
  date: string;
  fileName: string;
  cost: number;
  currency: string;
  costInEur: number;
}

export interface Receipt {
  id: number;
  projectId: number;
  projectName: string;
  projectNumber: string;
  customerName: string;
  receiptTypeId: number;
  receiptTypeName: string;
  date: string;
  fileName: string;
  cost: number;
  currency: string;
  createdDate: string;
  modifiedDate?: string;
}

export interface CreateReceiptDto {
  projectId: number;
  receiptTypeId: number;
  date: string;
  fileName: string;
  cost: number;
  currency: string;
}

export interface UpdateReceiptDto {
  projectId: number;
  receiptTypeId: number;
  date: string;
  fileName: string;
  cost: number;
  currency: string;
}

export interface ReceiptType {
  id: number;
  name: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
}

export interface CreateReceiptTypeDto {
  name: string;
}

export interface UpdateReceiptTypeDto {
  name: string;
  isActive: boolean;
}
