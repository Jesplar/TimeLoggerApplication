import axios from 'axios';
import type {
  Customer,
  Project,
  TimeEntry,
  TimeCode,
  WeeklySummary,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateTimeCodeDto,
  UpdateTimeCodeDto,
  MonthlyCustomerReport,
  MonthlyProjectReport,
  InvoiceReport,
  WeeklyTimesheetReport,
  CustomerActivityReport,
  ProjectStatusReport,
  YearToDateSummary,
  MonthlyComparison,
  Settings,
  UpdateSettingsDto,
  InvoiceExportProject,
} from './types';

const API_BASE_URL = (window as any).API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Customers
export const getCustomers = async (includeInactive = false): Promise<Customer[]> => {
  const response = await api.get<Customer[]>('/customers', {
    params: { includeInactive },
  });
  return response.data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await api.get<Customer>(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  const response = await api.post<Customer>('/customers', data);
  return response.data;
};

export const updateCustomer = async (id: number, data: UpdateCustomerDto): Promise<void> => {
  await api.put(`/customers/${id}`, data);
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

// Projects
export const getProjects = async (customerId?: number, includeInactive = false): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects', {
    params: { customerId, includeInactive },
  });
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: CreateProjectDto): Promise<Project> => {
  const response = await api.post<Project>('/projects', data);
  return response.data;
};

export const updateProject = async (id: number, data: UpdateProjectDto): Promise<void> => {
  await api.put(`/projects/${id}`, data);
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// Time Entries
export const getTimeEntries = async (params?: {
  startDate?: string;
  endDate?: string;
  projectId?: number;
  customerId?: number;
}): Promise<TimeEntry[]> => {
  const response = await api.get<TimeEntry[]>('/timeentries', { params });
  return response.data;
};

export const getWeeklySummary = async (
  date: string,
  customerId?: number,
  projectId?: number
): Promise<WeeklySummary> => {
  const response = await api.get<WeeklySummary>('/timeentries/weekly', {
    params: { date, customerId, projectId },
  });
  return response.data;
};

export const getTimeEntry = async (id: number): Promise<TimeEntry> => {
  const response = await api.get<TimeEntry>(`/timeentries/${id}`);
  return response.data;
};

export const createTimeEntry = async (data: CreateTimeEntryDto): Promise<TimeEntry> => {
  const response = await api.post<TimeEntry>('/timeentries', data);
  return response.data;
};

export const updateTimeEntry = async (id: number, data: UpdateTimeEntryDto): Promise<void> => {
  await api.put(`/timeentries/${id}`, data);
};

export const deleteTimeEntry = async (id: number): Promise<void> => {
  await api.delete(`/timeentries/${id}`);
};

// Reports
export const getMonthlyCustomerReport = async (year: number, month: number): Promise<MonthlyCustomerReport[]> => {
  const response = await api.get<MonthlyCustomerReport[]>('/reports/monthly-customer', {
    params: { year, month },
  });
  return response.data;
};

export const getMonthlyProjectReport = async (
  year: number,
  month: number,
  customerId?: number
): Promise<MonthlyProjectReport[]> => {
  const response = await api.get<MonthlyProjectReport[]>('/reports/monthly-project', {
    params: { year, month, customerId },
  });
  return response.data;
};

export const getInvoiceReport = async (
  startDate: string,
  endDate: string,
  customerId?: number
): Promise<InvoiceReport[]> => {
  const response = await api.get<InvoiceReport[]>('/reports/invoice', {
    params: { startDate, endDate, customerId },
  });
  return response.data;
};

export const getWeeklyTimesheetReport = async (weekStartDate: string): Promise<WeeklyTimesheetReport[]> => {
  const response = await api.get<WeeklyTimesheetReport[]>('/reports/weekly-timesheet', {
    params: { weekStartDate },
  });
  return response.data;
};

export const getCustomerActivityReport = async (
  startDate: string,
  endDate: string
): Promise<CustomerActivityReport[]> => {
  const response = await api.get<CustomerActivityReport[]>('/reports/customer-activity', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getProjectStatusReport = async (): Promise<ProjectStatusReport[]> => {
  const response = await api.get<ProjectStatusReport[]>('/reports/project-status');
  return response.data;
};

export const getYearToDateSummary = async (year: number): Promise<YearToDateSummary> => {
  const response = await api.get<YearToDateSummary>('/reports/ytd-summary', {
    params: { year },
  });
  return response.data;
};

export const getMonthlyComparison = async (year: number, monthsBack: number = 6): Promise<MonthlyComparison[]> => {
  const response = await api.get<MonthlyComparison[]>('/reports/monthly-comparison', {
    params: { year, monthsBack },
  });
  return response.data;
};


export const exportTimeEntries = async (startDate?: string, endDate?: string): Promise<Blob> => {
  const response = await api.get('/timeentries/export', {
    params: { startDate, endDate },
    responseType: 'blob',
  });
  return response.data;
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const response = await api.get<Settings>('/settings');
  return response.data;
};

export const updateSettings = async (data: UpdateSettingsDto): Promise<Settings> => {
  const response = await api.put<Settings>('/settings', data);
  return response.data;
};

// Time Codes
export const getTimeCodes = async (): Promise<TimeCode[]> => {
  const response = await api.get<TimeCode[]>('/timecodes');
  return response.data;
};

export const getTimeCode = async (id: number): Promise<TimeCode> => {
  const response = await api.get<TimeCode>(`/timecodes/${id}`);
  return response.data;
};

export const createTimeCode = async (data: CreateTimeCodeDto): Promise<TimeCode> => {
  const response = await api.post<TimeCode>('/timecodes', data);
  return response.data;
};

export const updateTimeCode = async (id: number, data: UpdateTimeCodeDto): Promise<void> => {
  await api.put(`/timecodes/${id}`, data);
};

export const deleteTimeCode = async (id: number): Promise<void> => {
  await api.delete(`/timecodes/${id}`);
};

// Invoice Export
export const getInvoiceExportData = async(
  startDate: string,
  endDate: string,
  customerId?: number
): Promise<InvoiceExportProject[]> => {
  const response = await api.get<InvoiceExportProject[]>('/reports/invoice-export', {
    params: { startDate, endDate, customerId },
  });
  return response.data;
};

