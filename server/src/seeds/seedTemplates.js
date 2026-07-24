import FlowTemplate from '../models/FlowTemplate.js';

const templates = [
  {
    name: 'Admin Login Flow',
    description: 'Security-hardened login flow for administrators including MFA and role validation.',
    category: 'admin',
    icon: 'shield',
    color: '#ef4444',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Start Login', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'auth_validate_token', label: 'Validate Token', position: { x: 250, y: 150 }, config: { tokenSource: 'cookie' } },
        { id: 'n3', type: 'auth_role_check', label: 'Check Admin Role', position: { x: 450, y: 150 }, config: { allowedRoles: ['super_admin', 'admin'] } },
        { id: 'n4', type: 'auth_mfa', label: 'Validate MFA', position: { x: 650, y: 150 }, config: { factors: ['otp'] } },
        { id: 'n5', type: 'end_success', label: 'Success', position: { x: 850, y: 150 }, config: { message: 'Admin login approved' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true }
      ],
      variables: [
        { name: 'role', type: 'string', defaultValue: 'admin', scope: 'session' }
      ]
    },
    metadata: { difficulty: 'intermediate', popularity: 95, tags: ['security', 'auth', 'admin'] },
    isBuiltIn: true
  },
  {
    name: 'Student Login Flow',
    description: 'Standard login flow for students with session setup and dashboard redirect.',
    category: 'student',
    icon: 'user',
    color: '#3b82f6',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Start Login', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'auth_login', label: 'Authenticate', position: { x: 250, y: 150 }, config: { method: 'credentials', redirectOnSuccess: '/dashboard' } },
        { id: 'n3', type: 'page', label: 'Load Student Dashboard', position: { x: 450, y: 150 }, config: { page: 'dashboard' } },
        { id: 'n4', type: 'end_success', label: 'Success', position: { x: 650, y: 150 }, config: { message: 'Student dashboard loaded' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'beginner', popularity: 88, tags: ['auth', 'student', 'session'] },
    isBuiltIn: true
  },
  {
    name: 'Teacher Login Flow',
    description: 'Login workflow for educators with timetable data pre-fetching.',
    category: 'teacher',
    icon: 'user-check',
    color: '#10b981',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Start Login', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'auth_login', label: 'Authenticate', position: { x: 250, y: 150 }, config: { method: 'credentials' } },
        { id: 'n3', type: 'data_fetch', label: 'Pre-fetch Timetable', position: { x: 450, y: 150 }, config: { collection: 'timetable' } },
        { id: 'n4', type: 'page', label: 'Load Teacher Dashboard', position: { x: 650, y: 150 }, config: { page: 'timetable' } },
        { id: 'n5', type: 'end_success', label: 'Success', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'intermediate', popularity: 75, tags: ['auth', 'teacher', 'data'] },
    isBuiltIn: true
  },
  {
    name: 'Parent Login Flow',
    description: 'Secure entry point for parents, mapping access to linked student records.',
    category: 'parent',
    icon: 'users',
    color: '#8b5cf6',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Start Login', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'auth_login', label: 'Authenticate', position: { x: 250, y: 150 }, config: {} },
        { id: 'n3', type: 'data_fetch', label: 'Fetch Linked Students', position: { x: 450, y: 150 }, config: { collection: 'students' } },
        { id: 'n4', type: 'page', label: 'Load Parent Portal', position: { x: 650, y: 150 }, config: { page: 'dashboard' } },
        { id: 'n5', type: 'end_success', label: 'Success', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'intermediate', popularity: 60, tags: ['auth', 'parent', 'linking'] },
    isBuiltIn: true
  },
  {
    name: 'Admission Workflow',
    description: 'Document submission, review, and verification pipeline for new admissions.',
    category: 'admission',
    icon: 'file-text',
    color: '#f59e0b',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Application Submitted', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'form_upload', label: 'Upload Transcripts', position: { x: 250, y: 150 }, config: { fieldName: 'transcripts', accept: '.pdf' } },
        { id: 'n3', type: 'decision', label: 'GPA > 3.0?', position: { x: 450, y: 150 }, config: { condition: 'input.gpa >= 3.0' } },
        { id: 'n4', type: 'notification_email', label: 'Send Offer Letter', position: { x: 650, y: 50 }, config: { subject: 'Admission Approved' } },
        { id: 'n5', type: 'notification_email', label: 'Send Rejection Email', position: { x: 650, y: 250 }, config: { subject: 'Admission Status Update' } },
        { id: 'n6', type: 'end_success', label: 'Approved', position: { x: 850, y: 50 }, config: {} },
        { id: 'n7', type: 'end_cancel', label: 'Rejected', position: { x: 850, y: 250 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'yes', animated: true },
        { id: 'e4', source: 'n3', target: 'n5', sourceHandle: 'no', animated: true },
        { id: 'e5', source: 'n4', target: 'n6', animated: true },
        { id: 'e6', source: 'n5', target: 'n7', animated: true }
      ],
      variables: [
        { name: 'gpa', type: 'number', defaultValue: 3.5, scope: 'input' }
      ]
    },
    metadata: { difficulty: 'advanced', popularity: 82, tags: ['forms', 'admission', 'approval'] },
    isBuiltIn: true
  },
  {
    name: 'Leave Approval Workflow',
    description: 'Multi-level approval process for teacher and student leave applications.',
    category: 'leave',
    icon: 'calendar',
    color: '#06b6d4',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Leave Request Received', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'decision', label: 'Teacher Request?', position: { x: 250, y: 150 }, config: { condition: "input.role == 'teacher'" } },
        { id: 'n3', type: 'open_modal', label: 'Principal Approval Dialog', position: { x: 450, y: 50 }, config: { modalId: 'principal_approval' } },
        { id: 'n4', type: 'open_modal', label: 'Teacher Approval Dialog', position: { x: 450, y: 250 }, config: { modalId: 'teacher_approval' } },
        { id: 'n5', type: 'data_update', label: 'Approve Request', position: { x: 650, y: 150 }, config: { collection: 'leaves', data: { status: 'approved' } } },
        { id: 'n6', type: 'end_success', label: 'Completed', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'yes', animated: true },
        { id: 'e3', source: 'n2', target: 'n4', sourceHandle: 'no', animated: true },
        { id: 'e4', source: 'n3', target: 'n5', animated: true },
        { id: 'e5', source: 'n4', target: 'n5', animated: true },
        { id: 'e6', source: 'n5', target: 'n6', animated: true }
      ],
      variables: [
        { name: 'role', type: 'string', defaultValue: 'student', scope: 'input' }
      ]
    },
    metadata: { difficulty: 'intermediate', popularity: 78, tags: ['leaves', 'approval', 'routing'] },
    isBuiltIn: true
  },
  {
    name: 'Fee Collection Workflow',
    description: 'Automated invoice generation, payment capture, and receipt printing flow.',
    category: 'fee',
    icon: 'credit-card',
    color: '#10b981',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Payment Initialized', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'api', label: 'Process Card Payment', position: { x: 250, y: 150 }, config: { apiEndpoint: '/api/payments/process', apiMethod: 'POST' } },
        { id: 'n3', type: 'data_create', label: 'Create Fee Record', position: { x: 450, y: 150 }, config: { collection: 'fees' } },
        { id: 'n4', type: 'data_generate_pdf', label: 'Generate Invoice Receipt', position: { x: 650, y: 150 }, config: { template: 'fee_receipt' } },
        { id: 'n5', type: 'notification_email', label: 'Send Receipt Confirmation', position: { x: 850, y: 150 }, config: { subject: 'Fee Receipt' } },
        { id: 'n6', type: 'end_success', label: 'Success', position: { x: 1050, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true },
        { id: 'e5', source: 'n5', target: 'n6', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'advanced', popularity: 89, tags: ['billing', 'invoice', 'payments'] },
    isBuiltIn: true
  },
  {
    name: 'Attendance Verification',
    description: 'Checks student attendance records and triggers warnings for high absence levels.',
    category: 'attendance',
    icon: 'check-square',
    color: '#06b6d4',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Daily Trigger', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'data_fetch', label: 'Fetch Absence Count', position: { x: 250, y: 150 }, config: { collection: 'attendance' } },
        { id: 'n3', type: 'decision', label: 'Absences > 5?', position: { x: 450, y: 150 }, config: { condition: 'temporary.fetch_absence_count.count > 5' } },
        { id: 'n4', type: 'notification_email', label: 'Email Parent Alert', position: { x: 650, y: 50 }, config: { subject: 'Attendance Warning' } },
        { id: 'n5', type: 'end_success', label: 'No Action Required', position: { x: 650, y: 250 }, config: {} },
        { id: 'n6', type: 'end_success', label: 'Alert Sent', position: { x: 850, y: 50 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'yes', animated: true },
        { id: 'e4', source: 'n3', target: 'n5', sourceHandle: 'no', animated: true },
        { id: 'e5', source: 'n4', target: 'n6', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'intermediate', popularity: 71, tags: ['attendance', 'alerts', 'notifications'] },
    isBuiltIn: true
  },
  {
    name: 'Report Card Generation',
    description: 'Prepares grade cards in background, compiling results and saving them directly to storage.',
    category: 'report',
    icon: 'printer',
    color: '#8b5cf6',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Manual Trigger', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'data_fetch', label: 'Fetch Grades', position: { x: 250, y: 150 }, config: { collection: 'results' } },
        { id: 'n3', type: 'data_generate_pdf', label: 'Generate PDF Card', position: { x: 450, y: 150 }, config: { template: 'grade_card' } },
        { id: 'n4', type: 'integration_storage', label: 'Upload to Cloud', position: { x: 650, y: 150 }, config: { provider: 'cloudinary', operation: 'upload' } },
        { id: 'n5', type: 'end_success', label: 'Report Generated', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'intermediate', popularity: 66, tags: ['reports', 'pdf', 'storage'] },
    isBuiltIn: true
  },
  {
    name: 'Announcement Broadcast',
    description: 'Send multi-channel notifications (toast, email, push) for school announcements.',
    category: 'notification',
    icon: 'bell',
    color: '#ec4899',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Broadcast Form Submitted', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'notification', label: 'Show Broadcast Toast', position: { x: 250, y: 50 }, config: { notificationType: 'toast' } },
        { id: 'n3', type: 'notification_push', label: 'Send Push Notification', position: { x: 250, y: 250 }, config: { title: 'Announcement' } },
        { id: 'n4', type: 'notification_email', label: 'Send Announcement Email', position: { x: 450, y: 150 }, config: {} },
        { id: 'n5', type: 'end_success', label: 'Broadcast Complete', position: { x: 650, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n1', target: 'n3', animated: true },
        { id: 'e3', source: 'n2', target: 'n4', animated: true },
        { id: 'e4', source: 'n3', target: 'n4', animated: true },
        { id: 'e5', source: 'n4', target: 'n5', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'beginner', popularity: 79, tags: ['announcements', 'broadcast', 'communication'] },
    isBuiltIn: true
  },
  {
    name: 'Multi-Step Purchase Approval',
    description: 'Routing for high-value financial requests requiring sequential manager/director reviews.',
    category: 'approval',
    icon: 'check-square',
    color: '#10b981',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'Purchase Request Submitted', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'decision', label: 'Amount > $5000?', position: { x: 250, y: 150 }, config: { condition: 'input.amount > 5000' } },
        { id: 'n3', type: 'open_modal', label: 'Director Review', position: { x: 450, y: 50 }, config: { modalId: 'director_approval' } },
        { id: 'n4', type: 'open_modal', label: 'Manager Review', position: { x: 450, y: 250 }, config: { modalId: 'manager_approval' } },
        { id: 'n5', type: 'data_update', label: 'Approve Payment', position: { x: 650, y: 150 }, config: { collection: 'payments', data: { status: 'approved' } } },
        { id: 'n6', type: 'end_success', label: 'Completed', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'yes', animated: true },
        { id: 'e3', source: 'n2', target: 'n4', sourceHandle: 'no', animated: true },
        { id: 'e4', source: 'n3', target: 'n5', animated: true },
        { id: 'e5', source: 'n4', target: 'n5', animated: true },
        { id: 'e6', source: 'n5', target: 'n6', animated: true }
      ],
      variables: [
        { name: 'amount', type: 'number', defaultValue: 1500, scope: 'input' }
      ]
    },
    metadata: { difficulty: 'advanced', popularity: 84, tags: ['financial', 'approvals', 'director'] },
    isBuiltIn: true
  },
  {
    name: 'New User Onboarding',
    description: 'Triggered when a user accounts is created. Sets profile, grants roles, sends welcome pack.',
    category: 'onboarding',
    icon: 'user-check',
    color: '#06b6d4',
    snapshot: {
      nodes: [
        { id: 'n1', type: 'start', label: 'User Created', position: { x: 50, y: 150 }, config: {} },
        { id: 'n2', type: 'data_create', label: 'Create User Profile', position: { x: 250, y: 150 }, config: { collection: 'users' } },
        { id: 'n3', type: 'integration_internal_api', label: 'Assign Default Roles', position: { x: 450, y: 150 }, config: { service: 'auth', endpoint: '/roles/assign' } },
        { id: 'n4', type: 'notification_email', label: 'Send Welcome Email', position: { x: 650, y: 150 }, config: { subject: 'Welcome to Root Desk!' } },
        { id: 'n5', type: 'end_success', label: 'Onboarded', position: { x: 850, y: 150 }, config: {} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true }
      ],
      variables: []
    },
    metadata: { difficulty: 'intermediate', popularity: 91, tags: ['onboarding', 'users', 'email'] },
    isBuiltIn: true
  }
];

export const seedFlowTemplates = async () => {
  try {
    const count = await FlowTemplate.countDocuments({ isBuiltIn: true });
    if (count === 0) {
      await FlowTemplate.insertMany(templates);
      console.log('Seeded 12 built-in flow templates successfully.');
    }
  } catch (error) {
    console.error('Error seeding flow templates:', error.message);
  }
};
