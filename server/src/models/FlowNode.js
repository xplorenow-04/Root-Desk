import mongoose from 'mongoose';

const flowNodeSchema = new mongoose.Schema({
  flowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flow',
    required: [true, 'Flow ID is required'],
    index: true,
  },
  type: {
    type: String,
    required: [true, 'Node type is required'],
    enum: [
      // Triggers
      'start', 'trigger_schedule', 'trigger_webhook', 'trigger_event', 'trigger_deeplink', 'trigger_qrscan', 'trigger_module',
      // End states
      'end', 'end_success', 'end_failure', 'end_cancel', 'end_terminate',
      // Navigation
      'page', 'navigate', 'redirect', 'open_modal', 'open_drawer', 'open_tab', 'return_back',
      // Authentication
      'auth_login', 'auth_logout', 'auth_validate_token', 'auth_otp', 'auth_mfa', 'auth_role_check', 'auth_permission_check',
      // Conditions
      'decision', 'condition_switch', 'condition_expression', 'condition_role', 'condition_user_type', 'condition_status',
      // Loops
      'loop_foreach', 'loop_while', 'loop_repeat',
      // Data operations
      'action', 'data_create', 'data_update', 'data_delete', 'data_fetch', 'data_upload', 'data_download', 'data_generate_pdf', 'data_export_csv', 'data_print',
      // API
      'api',
      // Timing
      'delay',
      // Communication
      'notification', 'notification_email', 'notification_sms', 'notification_whatsapp', 'notification_push',
      // Forms
      'form_input', 'form_dropdown', 'form_checkbox', 'form_upload', 'form_date', 'form_signature',
      // Integrations
      'integration_internal_api', 'integration_database', 'integration_storage',
      // Utility
      'comment', 'sticky_note', 'group',
    ],
  },
  label: {
    type: String,
    required: [true, 'Node label is required'],
    trim: true,
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  config: {
    // Page node config
    page: { type: String },
    // Action node config
    action: { type: String },
    actionParams: { type: mongoose.Schema.Types.Mixed },
    // Decision node config
    condition: { type: String },
    conditionExpression: { type: String },
    // API node config
    apiEndpoint: { type: String },
    apiMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    apiHeaders: { type: Map, of: String },
    apiBody: { type: mongoose.Schema.Types.Mixed },
    // Delay node config
    delay: { type: Number },
    delayUnit: { type: String, enum: ['seconds', 'minutes', 'hours', 'days'], default: 'seconds' },
    // Notification node config
    notificationType: { type: String, enum: ['toast', 'alert', 'email', 'sms', 'push', 'whatsapp', 'browser'] },
    notificationTitle: { type: String },
    notificationMessage: { type: String },
    notificationRecipients: [String],
    // Navigation config
    url: { type: String },
    to: { type: String },
    openInNewTab: { type: Boolean, default: false },
    replace: { type: Boolean, default: true },
    modalId: { type: String },
    drawerId: { type: String },
    tabId: { type: String },
    fallbackUrl: { type: String },
    // Auth config
    method: { type: String },
    redirectOnSuccess: { type: String },
    redirectTo: { type: String },
    clearStorage: { type: Boolean },
    tokenSource: { type: String },
    length: { type: Number },
    expiry: { type: Number },
    factors: [String],
    allowedRoles: [String],
    denyRedirect: { type: String },
    permission: { type: String },
    resource: { type: String },
    // Switch config
    switchExpression: { type: String },
    cases: [{ label: String, value: String }],
    defaultCase: { type: Boolean },
    // Loop config
    collection: { type: String },
    itemVariable: { type: String },
    indexVariable: { type: String },
    maxIterations: { type: Number },
    count: { type: Number },
    counterVariable: { type: String },
    // Data operation config
    filter: { type: mongoose.Schema.Types.Mixed },
    data: { type: mongoose.Schema.Types.Mixed },
    limit: { type: Number },
    sort: { type: mongoose.Schema.Types.Mixed },
    destination: { type: String },
    maxSize: { type: String },
    allowedTypes: [String],
    fileUrl: { type: String },
    filename: { type: String },
    template: { type: String },
    columns: [String],
    target: { type: String },
    // Form config
    fieldName: { type: String },
    fieldType: { type: String },
    placeholder: { type: String },
    required: { type: Boolean },
    validation: { type: String },
    options: [mongoose.Schema.Types.Mixed],
    multiple: { type: Boolean },
    defaultChecked: { type: Boolean },
    accept: { type: String },
    format: { type: String },
    minDate: { type: String },
    maxDate: { type: String },
    // Integration config
    service: { type: String },
    endpoint: { type: String },
    operation: { type: String },
    query: { type: mongoose.Schema.Types.Mixed },
    provider: { type: String },
    // Trigger config
    cronExpression: { type: String },
    timezone: { type: String },
    path: { type: String },
    params: { type: mongoose.Schema.Types.Mixed },
    eventName: { type: String },
    eventSource: { type: String },
    expectedFormat: { type: String },
    moduleName: { type: String },
    // End state config
    message: { type: String },
    errorMessage: { type: String },
    errorCode: { type: String },
    reason: { type: String },
    // Utility config
    text: { type: String },
    color: { type: String },
    collapsed: { type: Boolean },
    size: { type: String },
    title: { type: String },
    body: { type: String },
    icon: { type: String },
    subject: { type: String },
    to_address: { type: String },
    // Generic
    retry: { type: Number, default: 0 },
    timeout: { type: Number, default: 30000 },
  },
  // ── New fields (additive) ──
  clientId: {
    type: String,
    default: null,
    index: true,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlowNode',
    default: null,
  },
  errorHandling: {
    retryCount: { type: Number, default: 0 },
    retryDelay: { type: Number, default: 1000 },
    fallbackNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlowNode' },
    timeout: { type: Number, default: 30000 },
  },
  executionRules: {
    runCondition: { type: String },
    skipCondition: { type: String },
  },
  variables: [{
    name: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
    type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'object', 'array', 'expression'] },
  }],
  metadata: {
    icon: { type: String },
    color: { type: String },
    description: { type: String },
  },
}, {
  timestamps: true,
});

const FlowNode = mongoose.model('FlowNode', flowNodeSchema);
export default FlowNode;
