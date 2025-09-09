import { 
  DashboardTabConfig, 
  ColumnConfig, 
  ActionConfig, 
  SearchConfig, 
  ExportConfig, 
  PaginationConfig,
  CrudOperationsConfig,
  DataLoaderConfig,
  NotificationConfig
} from './table-config.interface';
import { ContactSubmission, ContactStatus } from '../../../models/contact.model';

/**
 * Contact Management Dashboard Configuration
 * Defines table structure, actions, and data fetching for contact submissions
 */
export function createContactConfig(): DashboardTabConfig<ContactSubmission> {
  
  // Column definitions for Contact table
  const contactColumns: ColumnConfig[] = [
    {
      field: 'id',
      header: 'ID',
      type: 'number',
      width: '10rem',
      sortable: true,
      filterable: true,
      filterType: 'number',
      editable: false
    },
    {
      field: 'email',
      header: 'Email',
      type: 'text',
      width: '16rem',
      sortable: true,
      filterable: true,
      filterType: 'text',
      editable: false
    },
    {
      field: 'message',
      header: 'Message',
      type: 'text',
      width: '24rem',
      sortable: false,
      filterable: true,
      filterType: 'text',
      editable: false,
      displayFormat: 'truncate:100' // Truncate long messages in table view
    },
    {
      field: 'status',
      header: 'Status',
      type: 'enum',
      width: '10rem',
      sortable: true,
      filterable: true,
      filterType: 'dropdown',
      editable: true,
      required: true,
      options: [
        { label: 'Sent', value: ContactStatus.SENT, color: 'info' },        // User sent submission
        { label: 'Pending', value: ContactStatus.PENDING, color: 'warning' }, // Admin reviewing
        { label: 'Done', value: ContactStatus.DONE, color: 'success' },      // Admin completed
        { label: 'Closed', value: ContactStatus.CLOSED, color: 'secondary' }  // User validated
      ],
      editComponent: 'dropdown-input'
    },
    {
      field: 'adminId',
      header: 'Assigned Admin',
      type: 'number',
      width: '14rem',
      sortable: true,
      filterable: true,
      filterType: 'number',
      editable: false,
      displayFormat: 'adminName' // Will show admin name instead of ID
    },
    {
      field: 'userId',
      header: 'User ID',
      type: 'number',
      width: '10rem',
      sortable: true,
      filterable: true,
      filterType: 'number',
      editable: false,
      displayFormat: 'userId' // Show 'Guest' for null user IDs
    },
    {
      field: 'adminNotes',
      header: 'Admin Notes',
      type: 'text',
      width: '12rem',
      sortable: false,
      filterable: false,
      editable: false,
      displayFormat: 'adminNotesCount' // Show count of admin notes
    },
    {
      field: 'createdAt',
      header: 'Submitted',
      type: 'date',
      width: '12rem',
      sortable: true,
      filterable: true,
      filterType: 'daterange',
      editable: false,
      displayFormat: 'datetime'
    },
    {
      field: 'updatedAt',
      header: 'Last Updated',
      type: 'date',
      width: '12rem',
      sortable: true,
      filterable: true,
      filterType: 'daterange',
      editable: false,
      displayFormat: 'datetime'
    }
  ];

  // Action configuration
  const contactActions: ActionConfig = {
    canAdd: false, // Contacts are created by users via contact form, not admin
    canEdit: true,
    canDelete: true,
    canBulkDelete: true,
    canExport: true,
    confirmDelete: true,
    actionsColumnWidth: '18rem', // Increased width for 4 custom actions
    customActions: [
      {
        label: 'Assign Admin',
        icon: 'pi pi-user-plus',
        action: 'assignAdmin',
        severity: 'success'
      },
      {
        label: 'Add Admin Note',
        icon: 'pi pi-comment',
        action: 'addAdminNote',
        severity: 'info'
      },
      {
        label: 'View Full Message',
        icon: 'pi pi-eye',
        action: 'viewFullMessage',
        severity: 'secondary'
      },
      {
        label: 'View Admin Notes',
        icon: 'pi pi-list',
        action: 'viewAdminNotes',
        severity: 'info'
      }
    ]
  };

  // Search configuration
  const contactSearch: SearchConfig = {
    enabled: true,
    fields: ['email', 'message'],
    placeholder: 'Search contacts by email or message...'
  };

  // Export configuration
  const contactExport: ExportConfig = {
    enabled: true,
    filename: 'contact_submissions',
    columns: ['id', 'email', 'message', 'status', 'adminId', 'userId', 'createdAt', 'updatedAt']
  };

  // Pagination configuration
  const contactPagination: PaginationConfig = {
    enabled: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} contact submissions',
    lazy: true // Enable server-side pagination
  };

  return {
    objectName: 'Contact',
    tabTitle: 'Contact Mails',
    tabIcon: 'pi pi-envelope',
    tabOrder: 5,
    columns: contactColumns,
    actions: contactActions,
    search: contactSearch,
    export: contactExport,
    pagination: contactPagination,
    dataKey: 'id',
    globalFilterFields: ['email', 'message']
    
    // Contacts don't have hierarchy structure
  };
}
