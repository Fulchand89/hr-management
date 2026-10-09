const { Op } = require('sequelize');
const {
  CompanyPolicy,
  PolicyAcknowledgment,
  User,
  Department,
  Notification,
  ActivityLog
} = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

/**
 * Official Gupta Tech Web - Human Resource Policies & Procedures
 * 410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010
 * Leadership: Nikita Gupta, CEO
 */
const DEFAULT_POLICIES = [
  {
    policyCode: 'POL-GTW-00',
    title: 'Company Overview, Vision, Mission & Policy Objectives',
    category: 'general',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Official corporate overview, CEO welcome address, vision, mission statement, and governance framework of Gupta Tech Web.',
    content: `### Welcome to Gupta Tech Web
*"At Gupta Tech Web, our mission is to deliver transformative digital solutions that empower businesses and enrich communities. Guided by Innovation, Technology, and Relationships, we aim to build a future-focused organization rooted in trust, integrity, and growth."*
— **Nikita Gupta, CEO**

---

### Corporate Vision
To be recognized as a leading innovator in the technology marketplace by delivering high-quality software products and nurturing long-term relationships.

---

### Corporate Mission
Build Technology, Shape Personalities, and Strengthen Connections.

---

### Policy Objective
To establish clear and professional guidelines that help create a productive, disciplined, and supportive work environment for all employees.

---

### About Gupta Tech Web
Gupta Tech Web is a team of web and mobile application development professionals dedicated to delivering solutions aligned with our clients' long-term business goals. Our HR Policies are designed to ensure sustainable growth, employee satisfaction, discipline, and a productive work environment.

**Registered Office:**
410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010 (M.P) India
- **Phone:** 7400554294
- **Email:** info@guptatechweb.com
- **Website:** guptatechweb.com`
  },
  {
    policyCode: 'POL-GTW-01',
    title: 'Office Timings, Work Hours & Saturday Schedule',
    category: 'attendance_shifts',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Work hours 10:00 am to 7:00 pm, 8 hours minimum, 1-hour lunch break, 1st & 3rd Saturday OFF, late compensation, and strict No WFH policy.',
    content: `### 1. Office Timings & Working Hours
- **Work Hours:** **10:00 am to 7:00 pm**
- **Minimum Working Hours:** **8 hours** (excluding 1-hour break)
- **Lunch / Break Time:** Must **not exceed 1 hour**
- **Adjustment:** Late arrivals / early departures must be adjusted
- **Half-Day Requirement:** Half-day requires a minimum of **4 working hours**
- **Habitual Lateness:** Habitual lateness or insufficient work hours may lead to salary deduction or disciplinary action. Repeated late coming or early going may lead to disciplinary action.
- **Holiday Work:** Working on holidays requires prior approval from Team Lead & HR.

---

### 2. Late Working Hours Compensation
- **Work till 10:00 pm – 12:00 am:** Allowed to report by **11:00 am** the next day.
- **Work till 12:00 am – 2:00 am:** Allowed to report by **12:00 pm** the next day.

---

### 3. Saturday Working Rule
- **1st and 3rd Saturdays:** **OFF (Holiday)**
- **All other Saturdays:** **Working days**

---

### 4. Work From Home (WFH) Policy
- **Strictly No WFH:** No Work From Home (WFH) is allowed under any circumstances unless officially declared by management.`
  },
  {
    policyCode: 'POL-GTW-02',
    title: 'Leave Policy, Sandwich Rule & Unapproved Absence Penalty',
    category: 'leave_holidays',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: '12 Casual Leaves/year, 3-day advance notice, emergency call before 10 AM, 1+1 salary deduction for unapproved absence, sandwich rule, marriage & paternity leaves.',
    content: `### 1. General Leave Rules
- **Casual Leave (CL):** **1 paid casual leave per month** (**12 CL per year**).
- **Probation Restriction:** **No Casual Leave during the first 3 months** (probation period).
- **Advance Request:** Leaves must be requested at least **3 days in advance**.
- **Official Communication:** Leave request must be sent through **email to HR** with **CC to Director, PM, and TL**. WhatsApp or SMS is **not considered official leave communication**.
- **Emergency Leave:** In emergency cases, inform HR **before 10:00 am** via phone call or email. WhatsApp/text is not accepted.
- **Accessibility During Leave:** Employees on leave must remain reachable via **Phone call, Email, or Skype** (unless located in a remote or no-network area).
- **Long Holidays / Special Occasions:** For long holidays or pre-planned/special occasion leaves, employees must inform at least **15 days in advance**.

---

### 2. Leave Carry Forward & Encashment
- Unused CL can be carried forward until **December 31** (leaves expire on 31 December).
- After December 31, unused leave can be **encashed at 80%**.

---

### 3. Marriage & Paternity Leave
- **Marriage Leave:** **5 days of paid leave** (conditions apply; credited after 2 months of resuming work).
- **Paternity Leave:** **1 day of paid leave**.

---

### 4. Sandwich Rule
- **Sandwich Rule:** Leave on both sides of a holiday makes the holiday **unpaid** (holiday before/after leave will be counted as unpaid).

---

### 5. Leave Not Approved Policy (1 + 1 Salary Deduction)
- If leave is **not approved** and the employee still remains absent, it will be marked as **ABSENT**.
- A **1 + 1 salary deduction** rule will be applied:
  - **1 day salary** for the absence
  - **1 day penalty deduction**`
  },
  {
    policyCode: 'POL-GTW-03',
    title: 'Salary Credit, Attendance Threshold & Appraisal Cycles',
    category: 'salary_appraisal',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Salary credited on the 8th of every month, proportional payout for <20 days, strict salary confidentiality, and 11-month / annual appraisals.',
    content: `### 1. Salary Credit Date & Mode
- **Salary Credit Date:** Salary is credited monthly through **direct deposit on the 8th of every month**.
- **Working Days Threshold:** Employees working **less than 20 days in a month** will be paid proportionally.

---

### 2. Salary Confidentiality
- **Confidentiality:** Salary is strictly confidential and **should not be discussed among employees**. Breach of salary confidentiality constitutes disciplinary misconduct.

---

### 3. Appraisal Policy & Cycles
- Appraisals are conducted every 9–12 months, based on consistent performance.
- **Appraisal Cycles by Compensation Grade:**
  - **Employees earning below ₹15,000:** Appraisal **every 11 months**.
  - **Employees earning ₹15,000 or above:** **Annual appraisal** (every 12 months).`
  },
  {
    policyCode: 'POL-GTW-04',
    title: 'Notice Period, Exit Process, FNF & Termination Policy',
    category: 'exit_notice_period',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: '2-month mandatory written notice, no leaves during notice period, FNF in 45 days, and termination consequences.',
    content: `### 1. Resignation & Notice Period
- **Notice Period:** Resignation requires a mandatory **2-month written notice**, submitted to HR.
- **Leave Prohibition:** **No leave is allowed during the notice period**. If leave is taken, the notice period will be extended accordingly.
- **Release of Dues & Letters:** Salary, relieving letter, and experience letter will be issued **only after**:
  1. Completion of the full notice period
  2. Returning all company assets, hardware, and access cards
  3. Clearing all pending dues and client handover responsibilities

---

### 2. Full & Final Settlement (FNF)
- Full and Final Settlement (FNF) will be processed **45 days after the last working day**.

---

### 3. Termination Policy
In case of termination due to performance, behavior, or policy violation:
- Salary for the ongoing month **will not be issued**
- Experience / relieving letter **will not be given**
- Employee **will not be eligible for FNF**
- Company assets must be returned immediately.`
  },
  {
    policyCode: 'POL-GTW-05',
    title: 'Required Documents at the Time of Joining',
    category: 'joining_documents',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Mandatory submission checklist: 10th original mark sheet, 12th/UG/PG xerox, Aadhaar, PAN, 3 months salary slips, experience letter, UAN, and 2 photos.',
    content: `### Required Documents Checklist
Before joining Gupta Tech Web, all employees must submit the following official documentation:
1. **Original 10th-grade mark sheet**
2. **Xerox copies of 12th-grade and UG/PG mark sheets**
3. **Aadhaar Card & PAN Card** (Xerox copies)
4. **Last 3 months' salary slips** from previous employer (if applicable)
5. **Relieving and Experience Letter** from previous company
6. **UAN number** (if any)
7. **Appointment, appraisal, experience & relieving letters** from previous employer
8. **2 passport-size photographs**`
  },
  {
    policyCode: 'POL-GTW-06',
    title: 'Code of Conduct, Moonlighting & Office Etiquette',
    category: 'code_of_conduct',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Strict prohibition on freelancing/moonlighting, mandatory I-card, workstation cleanliness, knock before entering, and data protection.',
    content: `### 1. Moonlighting Restriction
- **Zero Moonlighting:** Freelancing, side projects, or handling any external work without prior written permission is **strictly prohibited**.

---

### 2. Code of Conduct & Workplace Etiquette
- Maintain professionalism and respectful behavior at all times.
- Strictly no discrimination or harassment of any kind.
- **Grievance Protocol:** Any grievance must first be reported directly to HR.
- **Cabin Courtesy:** Always knock before entering cabins.
- **Workstation Decorum:** Keep your workstation clean and organized.
- **Company Identity Card:** Wearing the company **I-card inside the office is mandatory**.
- **Social Media Restriction:** Social media access on office computer systems is strictly restricted.
- Behave professionally and maintain office decorum. Respect company policies, clients, and co-workers.

---

### 3. Data Protection & Confidentiality
- Protect all confidential company data, client repositories, and intellectual property.
- Unauthorized copying or sharing of company data is strictly prohibited.
- Office internet must be used **only for official office work**.`
  },
  {
    policyCode: 'POL-GTW-07',
    title: 'Project Management, PMT Tools & Employee Referral Bonus',
    category: 'project_management',
    currentVersion: '1.0',
    isMandatory: true,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Daily Trello/PMT task updates, timely delivery, file backups, and referral bonuses (₹1,500 - ₹3,000) after 3 months.',
    content: `### 1. Project Management Policy
- **Daily PMT Updates:** All tasks must be updated daily in **Trello / PMT tools**.
- **Deadlines:** Deadlines are mutually agreed upon with team leads and must be strictly met.
- **Overtime for Delays:** Delays in delivery may require extra working hours or weekend work to fulfill client commitments.
- **Data Backups:** Maintain proper data backup of all project files, repositories, and documentation.
- **Communication:** Check and reply to emails regularly. Sensitive company information must not be shared outside.

---

### 2. Employee Referral Bonus Policy
Gupta Tech Web rewards employees for successful candidate referrals:
- **Candidates with 1–3 years experience:** **₹1,500** referral bonus
- **Candidates with 3–5 years experience:** **₹3,000** referral bonus
- **Eligibility:** Referral bonus is awarded **only after the referred employee successfully completes 3 months** with the organization.

---

### 3. Appreciation Certificates & Rewards
Performance and dedication will be recognized quarterly / every 2–3 months based on:
- **Dedication**
- **Timely delivery**
- **Punctuality**
- **Quality of work**
- **Discipline**
*Rewards may include official appreciation certificates and monetary benefits.*`
  },
  {
    policyCode: 'POL-GTW-08',
    title: 'Refreshments, Fun Friday Activities & Saturday Recreation',
    category: 'recreation_fun',
    currentVersion: '1.0',
    isMandatory: false,
    effectiveDate: '2026-01-01',
    status: 'published',
    summary: 'Monthly games on 2nd or 4th Saturday, annual outings and dinners, and mandatory Fun Friday envelope team engagement.',
    content: `### 1. Recreation & Refreshments
- **Monthly Games & Activities:** Held on the **2nd or 4th Saturday**.
- **Annual Outings:** Annual corporate outings, team dinners, or movies are organized to foster teamwork and rejuvenation.

---

### 2. Fun Friday Activities
- **Envelope Activity:** The designated envelope activity must be completed as instructed.
- **Mandatory Participation:** Participation in Fun Friday activities is **mandatory for team engagement** and workplace bonding.

---

### Welcome Note from Leadership
*"Welcome to Gupta Tech Web — Let's Build the Future Together! Enjoy working with Gupta Tech Web!"*
— **Nikita Gupta, CEO**
*410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010*`
  }
];

/**
 * Auto-Seed / Upsert Default Policies
 */
const ensureDefaultPolicies = async () => {
  try {
    for (const p of DEFAULT_POLICIES) {
      const existing = await CompanyPolicy.findOne({ where: { policyCode: p.policyCode } });
      if (existing) {
        await existing.update(p);
      } else {
        await CompanyPolicy.create(p);
      }
    }
  } catch (err) {
    console.error('Error auto-seeding company policies:', err.message);
  }
};

/**
 * List all policies with user acknowledgment flag
 */
const getPolicies = async ({ category, status, search, user }) => {
  await ensureDefaultPolicies();

  const where = {};

  // Status filtering: Regular employee only sees 'published'
  const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.HR;
  if (!isPrivileged) {
    where.status = 'published';
  } else if (status && status !== 'all') {
    where.status = status;
  }

  if (category && category !== 'all') {
    where.category = category;
  }

  if (search && search.trim()) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search.trim()}%` } },
      { policyCode: { [Op.like]: `%${search.trim()}%` } },
      { summary: { [Op.like]: `%${search.trim()}%` } }
    ];
  }

  const policies = await CompanyPolicy.findAll({
    where,
    order: [
      ['isMandatory', 'DESC'],
      ['effectiveDate', 'DESC'],
      ['createdAt', 'DESC']
    ],
    include: [
      {
        model: Department,
        as: 'targetDepartment',
        attributes: ['id', 'name']
      },
      {
        model: PolicyAcknowledgment,
        as: 'acknowledgments',
        where: { userId: user.id },
        required: false,
        attributes: ['id', 'acknowledgedAt', 'versionAcknowledged']
      }
    ]
  });

  // Transform output to format user's acknowledgment state
  return policies.map((p) => {
    const raw = p.toJSON();
    const ack = raw.acknowledgments && raw.acknowledgments.length > 0 ? raw.acknowledgments[0] : null;
    raw.isAcknowledged = !!ack;
    raw.acknowledgedAt = ack ? ack.acknowledgedAt : null;
    raw.acknowledgedVersion = ack ? ack.versionAcknowledged : null;
    delete raw.acknowledgments;
    return raw;
  });
};

/**
 * Get single policy by ID
 */
const getPolicyById = async (id, user) => {
  await ensureDefaultPolicies();

  const policy = await CompanyPolicy.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'targetDepartment',
        attributes: ['id', 'name']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
      },
      {
        model: PolicyAcknowledgment,
        as: 'acknowledgments',
        where: { userId: user.id },
        required: false,
        attributes: ['id', 'acknowledgedAt', 'versionAcknowledged']
      }
    ]
  });

  if (!policy) throw new NotFoundError('Policy not found');

  const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.HR;
  if (!isPrivileged && policy.status !== 'published') {
    throw new ForbiddenError('You are not authorized to view unpublished policies');
  }

  const raw = policy.toJSON();
  const ack = raw.acknowledgments && raw.acknowledgments.length > 0 ? raw.acknowledgments[0] : null;
  raw.isAcknowledged = !!ack;
  raw.acknowledgedAt = ack ? ack.acknowledgedAt : null;
  raw.acknowledgedVersion = ack ? ack.versionAcknowledged : null;
  delete raw.acknowledgments;

  return raw;
};

/**
 * Create a new policy (HR / Admin)
 */
const createPolicy = async (payload, file, user) => {
  let attachmentUrl = null;
  if (file) {
    attachmentUrl = `/uploads/${file.filename}`;
  }

  let code = payload.policyCode;
  if (!code) {
    const count = await CompanyPolicy.count();
    code = `POL-${String(count + 1).padStart(3, '0')}`;
  }

  const existing = await CompanyPolicy.findOne({ where: { policyCode: code } });
  if (existing) {
    throw new BadRequestError(`Policy code '${code}' already exists`);
  }

  const policy = await CompanyPolicy.create({
    policyCode: code,
    title: payload.title,
    category: payload.category || 'general',
    summary: payload.summary || payload.title,
    content: payload.content || '',
    currentVersion: payload.currentVersion || '1.0',
    attachmentUrl,
    isMandatory: payload.isMandatory === true || payload.isMandatory === 'true',
    targetAudience: payload.targetAudience || 'all',
    targetDepartmentId: payload.targetDepartmentId || null,
    effectiveDate: payload.effectiveDate || new Date().toISOString().split('T')[0],
    status: payload.status || 'published',
    createdBy: user.id,
    updatedBy: user.id
  });

  // Log in ActivityLog
  try {
    await ActivityLog.create({
      userId: user.id,
      action: 'CREATE_POLICY',
      module: 'POLICIES',
      details: `Created policy ${policy.policyCode} - ${policy.title}`
    });
  } catch {}

  return policy;
};

/**
 * Update an existing policy
 */
const updatePolicy = async (id, payload, file, user) => {
  const policy = await CompanyPolicy.findByPk(id);
  if (!policy) throw new NotFoundError('Policy not found');

  const updateData = {};
  if (payload.title) updateData.title = payload.title;
  if (payload.category) updateData.category = payload.category;
  if (payload.summary) updateData.summary = payload.summary;
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.currentVersion) updateData.currentVersion = payload.currentVersion;
  if (payload.effectiveDate) updateData.effectiveDate = payload.effectiveDate;
  if (payload.status) updateData.status = payload.status;
  if (payload.targetAudience) updateData.targetAudience = payload.targetAudience;
  if (payload.targetDepartmentId !== undefined) updateData.targetDepartmentId = payload.targetDepartmentId || null;
  if (payload.isMandatory !== undefined) {
    updateData.isMandatory = payload.isMandatory === true || payload.isMandatory === 'true';
  }

  if (file) {
    updateData.attachmentUrl = `/uploads/${file.filename}`;
  }

  updateData.updatedBy = user.id;

  await policy.update(updateData);
  return policy;
};

/**
 * Change status (Publish, Draft, Archive)
 */
const setPolicyStatus = async (id, status, user) => {
  const policy = await CompanyPolicy.findByPk(id);
  if (!policy) throw new NotFoundError('Policy not found');

  if (!['draft', 'published', 'archived'].includes(status)) {
    throw new BadRequestError('Invalid policy status value');
  }

  await policy.update({ status, updatedBy: user.id });
  return policy;
};

/**
 * Delete a policy
 */
const deletePolicy = async (id, user) => {
  const policy = await CompanyPolicy.findByPk(id);
  if (!policy) throw new NotFoundError('Policy not found');

  await policy.destroy();
  return { message: 'Policy deleted successfully' };
};

/**
 * Employee Acknowledgment ("I Agree" action)
 */
const acknowledgePolicy = async (id, user, reqMeta = {}) => {
  const policy = await CompanyPolicy.findByPk(id);
  if (!policy) throw new NotFoundError('Policy not found');

  if (policy.status !== 'published') {
    throw new BadRequestError('Cannot acknowledge an unpublished policy');
  }

  // Check if already acknowledged for current version
  const existing = await PolicyAcknowledgment.findOne({
    where: {
      policyId: id,
      userId: user.id,
      versionAcknowledged: policy.currentVersion
    }
  });

  if (existing) {
    return {
      message: 'Policy already acknowledged for this version',
      data: existing
    };
  }

  const acknowledgment = await PolicyAcknowledgment.create({
    policyId: id,
    userId: user.id,
    versionAcknowledged: policy.currentVersion,
    ipAddress: reqMeta.ip || null,
    userAgent: reqMeta.userAgent || null,
    acknowledgedAt: new Date()
  });

  return {
    message: 'Policy acknowledged successfully',
    data: acknowledgment
  };
};

/**
 * Get Policy Compliance Report for HR
 */
const getPolicyCompliance = async (id) => {
  const policy = await CompanyPolicy.findByPk(id);
  if (!policy) throw new NotFoundError('Policy not found');

  // Find all active employees
  const employees = await User.findAll({
    where: { status: 'active' },
    attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'department', 'designation', 'avatar'],
    include: [
      {
        model: PolicyAcknowledgment,
        as: 'policyAcknowledgments',
        where: { policyId: id },
        required: false,
        attributes: ['id', 'acknowledgedAt', 'versionAcknowledged', 'ipAddress']
      }
    ]
  });

  const totalEmployees = employees.length;
  let acknowledgedCount = 0;

  const records = employees.map((emp) => {
    const raw = emp.toJSON();
    const ack = raw.policyAcknowledgments && raw.policyAcknowledgments.length > 0
      ? raw.policyAcknowledgments[0]
      : null;

    const isSigned = !!ack;
    if (isSigned) acknowledgedCount++;

    return {
      id: raw.id,
      employeeCode: raw.employeeCode || '--',
      name: `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.email,
      email: raw.email,
      department: raw.department || 'Operations',
      designation: raw.designation || 'Staff',
      avatar: raw.avatar,
      isAcknowledged: isSigned,
      acknowledgedAt: ack ? ack.acknowledgedAt : null,
      versionAcknowledged: ack ? ack.versionAcknowledged : null,
      ipAddress: ack ? ack.ipAddress : null
    };
  });

  const pendingCount = totalEmployees - acknowledgedCount;
  const compliancePercentage = totalEmployees > 0
    ? Math.round((acknowledgedCount / totalEmployees) * 100)
    : 100;

  return {
    policy: {
      id: policy.id,
      policyCode: policy.policyCode,
      title: policy.title,
      currentVersion: policy.currentVersion,
      isMandatory: policy.isMandatory
    },
    summary: {
      totalEmployees,
      acknowledgedCount,
      pendingCount,
      compliancePercentage
    },
    records
  };
};

/**
 * Send Reminders to all pending employees
 */
const sendPolicyReminders = async (id, adminUser) => {
  const compliance = await getPolicyCompliance(id);
  const pendingRecords = compliance.records.filter((r) => !r.isAcknowledged);

  let sentCount = 0;
  for (const emp of pendingRecords) {
    try {
      await Notification.create({
        userId: emp.id,
        title: 'Action Required: Acknowledge Corporate Policy',
        message: `Please review and acknowledge "${compliance.policy.title}" (${compliance.policy.policyCode}) as required by company compliance regulations.`,
        type: 'warning',
        isRead: false
      });
      sentCount++;
    } catch {}
  }

  return {
    message: `Sent reminder notifications to ${sentCount} employee(s)`,
    sentCount
  };
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  setPolicyStatus,
  deletePolicy,
  acknowledgePolicy,
  getPolicyCompliance,
  sendPolicyReminders,
  ensureDefaultPolicies,
  DEFAULT_POLICIES
};
