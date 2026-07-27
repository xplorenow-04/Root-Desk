/**
 * Preset Database Templates in DBML-like syntax.
 * Provides starting templates for users of the Database Studio.
 */

export const DATABASE_TEMPLATES = [
  {
    id: 'school',
    name: 'School Management System',
    description: 'Models students, classes, enrollment details, grades, and faculty structures.',
    code: `Table students {
  id integer [pk, increment]
  first_name varchar [notnull]
  last_name varchar [notnull]
  email varchar [unique]
  date_of_birth date
  enrollment_date date
}

Table classes {
  id integer [pk, increment]
  class_name varchar [notnull]
  subject_code varchar
  teacher_id integer
  room_number varchar
}

Table teachers {
  id integer [pk, increment]
  first_name varchar [notnull]
  last_name varchar [notnull]
  email varchar [unique]
  department varchar
}

Table enrollments {
  id integer [pk, increment]
  student_id integer
  class_id integer
  grade varchar
  enrollment_date date
}

Ref: classes.teacher_id > teachers.id
Ref: enrollments.student_id > students.id
Ref: enrollments.class_id > classes.id
`,
  },
  {
    id: 'hospital',
    name: 'Hospital Management',
    description: 'Models patients, doctors, appointments, prescriptions, and wards.',
    code: `Table patients {
  id integer [pk, increment]
  first_name varchar [notnull]
  last_name varchar [notnull]
  email varchar
  phone varchar
  gender varchar
  blood_type varchar
}

Table doctors {
  id integer [pk, increment]
  first_name varchar [notnull]
  last_name varchar [notnull]
  specialty varchar [notnull]
  email varchar
  phone varchar
}

Table appointments {
  id integer [pk, increment]
  patient_id integer
  doctor_id integer
  appointment_date timestamp
  status varchar
  room_number varchar
}

Table prescriptions {
  id integer [pk, increment]
  appointment_id integer
  medication varchar
  dosage varchar
  instructions text
}

Ref: appointments.patient_id > patients.id
Ref: appointments.doctor_id > doctors.id
Ref: prescriptions.appointment_id > appointments.id
`,
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Platform',
    description: 'Models users, products, categories, orders, order items, and payment transactions.',
    code: `Table users {
  id integer [pk, increment]
  email varchar [unique, notnull]
  password_hash varchar [notnull]
  first_name varchar
  last_name varchar
  created_at timestamp
}

Table products {
  id integer [pk, increment]
  name varchar [notnull]
  description text
  price integer [notnull]
  stock_quantity integer
  category_id integer
}

Table categories {
  id integer [pk, increment]
  name varchar [notnull]
  parent_id integer
}

Table orders {
  id integer [pk, increment]
  user_id integer
  order_date timestamp
  status varchar
  total_amount integer
}

Table order_items {
  id integer [pk, increment]
  order_id integer
  product_id integer
  quantity integer
  price integer
}

Ref: products.category_id > categories.id
Ref: categories.parent_id > categories.id
Ref: orders.user_id > users.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id
`,
  },
  {
    id: 'crm',
    name: 'Customer Relationship Manager (CRM)',
    description: 'Models companies, contacts, sales pipeline deals, and activity tracking logs.',
    code: `Table companies {
  id integer [pk, increment]
  name varchar [notnull]
  industry varchar
  website varchar
  employee_count integer
}

Table contacts {
  id integer [pk, increment]
  company_id integer
  first_name varchar [notnull]
  last_name varchar [notnull]
  email varchar
  phone varchar
  job_title varchar
}

Table deals {
  id integer [pk, increment]
  company_id integer
  name varchar [notnull]
  stage varchar
  amount integer
  close_date date
}

Table activities {
  id integer [pk, increment]
  contact_id integer
  type varchar
  description text
  activity_date timestamp
}

Ref: contacts.company_id > companies.id
Ref: deals.company_id > companies.id
Ref: activities.contact_id > contacts.id
`,
  },
  {
    id: 'hrms',
    name: 'Human Resource Management System',
    description: 'Models employees, departments, job roles, salary contracts, and leave requests.',
    code: `Table departments {
  id integer [pk, increment]
  name varchar [notnull]
  manager_id integer
}

Table employees {
  id integer [pk, increment]
  first_name varchar [notnull]
  last_name varchar [notnull]
  email varchar [unique]
  hire_date date
  department_id integer
  job_title varchar
}

Table salaries {
  id integer [pk, increment]
  employee_id integer
  amount integer [notnull]
  from_date date
  to_date date
}

Table leaves {
  id integer [pk, increment]
  employee_id integer
  start_date date
  end_date date
  status varchar
}

Ref: departments.manager_id > employees.id
Ref: employees.department_id > departments.id
Ref: salaries.employee_id > employees.id
Ref: leaves.employee_id > employees.id
`,
  },
];
export default DATABASE_TEMPLATES;
