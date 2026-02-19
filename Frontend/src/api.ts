import axios from 'axios';
import type {
  Customer,
  Project,
  TimeEntry,
  WeeklySummary,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateProjectDto,
  UpdateProjectDto,
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

export const exportTimeEntries = async (startDate?: string, endDate?: string): Promise<Blob> => {
  const response = await api.get('/timeentries/export', {
    params: { startDate, endDate },
    responseType: 'blob',
  });
  return response.data;
};
