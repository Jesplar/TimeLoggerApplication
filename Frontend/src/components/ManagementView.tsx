import React, { useState, useEffect } from 'react';
import { Customer, Project, CreateCustomerDto, CreateProjectDto, UpdateCustomerDto, UpdateProjectDto } from '../types';
import { getCustomers, getProjects, createCustomer, updateCustomer, deleteCustomer, createProject, updateProject, deleteProject } from '../api';

export const ManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'projects'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadCustomers();
    loadProjects();
  }, [includeInactive, activeTab]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(includeInactive);
      setCustomers(data);
    } catch (err) {
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects(undefined, includeInactive);
      setProjects(data);
    } catch (err) {
      alert('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Delete customer "${customer.name}"? This will fail if the customer has projects.`)) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      loadCustomers();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to delete customer');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"? This will fail if the project has time entries.`)) {
      return;
    }

    try {
      await deleteProject(project.id);
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to delete project');
    }
  };

  return (
    <div>
      <h2>Manage Customers & Projects</h2>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
      </div>

      <div className="toolbar">
        <button
          className="primary"
          onClick={() => {
            if (activeTab === 'customers') {
              setEditingCustomer(null);
              setIsCustomerDialogOpen(true);
            } else {
              setEditingProject(null);
              setIsProjectDialogOpen(true);
            }
          }}
        >
          + Add {activeTab === 'customers' ? 'Customer' : 'Project'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Show Inactive
        </label>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : activeTab === 'customers' ? (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>
                  <span style={{ color: customer.isActive ? '#4caf50' : '#888' }}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(customer.createdDate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditCustomer(customer)} style={{ marginRight: '0.5rem' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCustomer(customer)} className="danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Project Number</th>
              <th>Project Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.customerName}</td>
                <td>{project.projectNumber}</td>
                <td>{project.name}</td>
                <td>
                  <span style={{ color: project.isActive ? '#4caf50' : '#888' }}>
                    {project.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <span style={{ color: project.excludeFromInvoice ? '#f57c00' : '#888', fontSize: '0.85em' }}>
                    {project.excludeFromInvoice ? 'Internal' : 'Billable'}
                  </span>
                </td>
                <td>{new Date(project.createdDate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditProject(project)} style={{ marginRight: '0.5rem' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteProject(project)} className="danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CustomerDialog
        isOpen={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
        onSave={() => {
          loadCustomers();
          loadProjects();
          setIsCustomerDialogOpen(false);
        }}
        customer={editingCustomer}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSave={() => {
          loadProjects();
          setIsProjectDialogOpen(false);
        }}
        project={editingProject}
        customers={customers.filter((c) => c.isActive)}
      />
    </div>
  );
};

interface CustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customer: Customer | null;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ isOpen, onClose, onSave, customer }) => {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setIsActive(customer.isActive);
    } else {
      setName('');
      setIsActive(true);
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      if (customer) {
        const updateDto: UpdateCustomerDto = { name: name.trim(), isActive };
        await updateCustomer(customer.id, updateDto);
      } else {
        const createDto: CreateCustomerDto = { name: name.trim() };
        await createCustomer(createDto);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{customer ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {customer && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  project: Project | null;
  customers: Customer[];
}

const ProjectDialog: React.FC<ProjectDialogProps> = ({ isOpen, onClose, onSave, project, customers }) => {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [projectNumber, setProjectNumber] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [excludeFromInvoice, setExcludeFromInvoice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setCustomerId(project.customerId);
      setProjectNumber(project.projectNumber);
      setName(project.name);
      setIsActive(project.isActive);
      setExcludeFromInvoice(project.excludeFromInvoice);
    } else {
      setCustomerId(customers.length > 0 ? customers[0].id : null);
      setProjectNumber('');
      setName('');
      setIsActive(true);
      setExcludeFromInvoice(false);
    }
    setError('');
  }, [project, isOpen, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    if (!projectNumber.trim()) {
      setError('Project number is required');
      return;
    }

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    try {
      if (project) {
        const updateDto: UpdateProjectDto = {
          customerId,
          projectNumber: projectNumber.trim(),
          name: name.trim(),
          isActive,
          excludeFromInvoice,
        };
        await updateProject(project.id, updateDto);
      } else {
        const createDto: CreateProjectDto = {
          customerId,
          projectNumber: projectNumber.trim(),
          name: name.trim(),
        };
        await createProject(createDto);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectCustomer">Customer</label>
            <select
              id="projectCustomer"
              value={customerId || ''}
              onChange={(e) => setCustomerId(parseInt(e.target.value))}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="projectNumber">Project Number</label>
            <input
              type="text"
              id="projectNumber"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              type="text"
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {project && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={excludeFromInvoice}
                onChange={(e) => setExcludeFromInvoice(e.target.checked)}
              />
              Internal — Exclude from Invoice Reports
            </label>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
