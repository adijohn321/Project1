import { pgTable, text, serial, integer, boolean, timestamp, numeric, foreignKey, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  module: text("module").notNull(), // 'planning', 'budget', 'accounting', 'treasury', 'hris', 'admin'
  isEncoder: boolean("is_encoder").notNull().default(false),
  permissions: text("permissions").array().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  roleId: integer("role_id").notNull().references(() => roles.id),
  department: text("department"),
  position: text("position"),
  active: boolean("active").notNull().default(true),
  lastLogin: timestamp("last_login"),
});

// Planning Module
export const annualInvestmentPlans = pgTable("annual_investment_plans", {
  id: serial("id").primaryKey(),
  fiscalYear: integer("fiscal_year").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  totalBudget: numeric("total_budget").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const aipItems = pgTable("aip_items", {
  id: serial("id").primaryKey(),
  aipId: integer("aip_id").notNull().references(() => annualInvestmentPlans.id),
  projectName: text("project_name").notNull(),
  sector: text("sector").notNull(), // infrastructure, health, education, etc.
  description: text("description"),
  location: text("location"),
  budget: numeric("budget").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("draft"), // draft, approved, in_progress, completed
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budget Module
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  aipItemId: integer("aip_item_id").references(() => aipItems.id),
  fiscalYear: integer("fiscal_year").notNull(),
  accountCode: text("account_code").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  balance: numeric("balance").notNull(),
  status: text("status").notNull().default("active"), // active, depleted, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetObligations = pgTable("budget_obligations", {
  id: serial("id").primaryKey(),
  budgetItemId: integer("budget_item_id").notNull().references(() => budgetItems.id),
  obligationNumber: text("obligation_number").notNull().unique(),
  payee: text("payee").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  obligationDate: timestamp("obligation_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, processed, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
});

// Accounting Module
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  obligationId: integer("obligation_id").references(() => budgetObligations.id),
  entryNumber: text("entry_number").notNull().unique(),
  entryDate: timestamp("entry_date").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"), // draft, posted, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  postedBy: integer("posted_by").references(() => users.id),
  postedAt: timestamp("posted_at"),
});

export const journalEntryItems = pgTable("journal_entry_items", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  accountCode: text("account_code").notNull(),
  accountTitle: text("account_title").notNull(),
  debit: numeric("debit").default("0"),
  credit: numeric("credit").default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  voucherNumber: text("voucher_number").notNull().unique(),
  payee: text("payee").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  voucherDate: timestamp("voucher_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, approved, paid, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// Treasury Module
export const disbursements = pgTable("disbursements", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull().references(() => vouchers.id),
  checkNumber: text("check_number").notNull(),
  bankAccount: text("bank_account").notNull(),
  amount: numeric("amount").notNull(),
  disbursementDate: timestamp("disbursement_date").notNull(),
  status: text("status").notNull().default("issued"), // issued, cleared, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  collectionDate: timestamp("collection_date").notNull(),
  payor: text("payor").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  collectionType: text("collection_type").notNull(), // tax, fee, fine, etc.
  accountCode: text("account_code").notNull(),
  status: text("status").notNull().default("recorded"), // recorded, deposited, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// HRIS Module
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  salary: numeric("salary").notNull(),
  dateHired: text("date_hired").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, on_leave
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  payrollPeriod: text("payroll_period").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").notNull().default("draft"), // draft, approved, processed, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const payrollItems = pgTable("payroll_items", {
  id: serial("id").primaryKey(),
  payrollId: integer("payroll_id").notNull().references(() => payrolls.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  basicPay: numeric("basic_pay").notNull(),
  allowances: numeric("allowances").default("0"),
  deductions: numeric("deductions").default("0"),
  netPay: numeric("net_pay").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true });
export const insertAIPSchema = createInsertSchema(annualInvestmentPlans).omit({ 
  id: true, createdAt: true, updatedAt: true, approvedAt: true 
});
export const insertAIPItemSchema = createInsertSchema(aipItems).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertBudgetObligationSchema = createInsertSchema(budgetObligations).omit({ 
  id: true, createdAt: true, updatedAt: true, processedAt: true 
});
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ 
  id: true, createdAt: true, updatedAt: true, postedAt: true 
});
export const insertJournalEntryItemSchema = createInsertSchema(journalEntryItems).omit({ 
  id: true, createdAt: true 
});
export const insertVoucherSchema = createInsertSchema(vouchers).omit({ 
  id: true, createdAt: true, updatedAt: true, approvedAt: true 
});
export const insertDisbursementSchema = createInsertSchema(disbursements).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertCollectionSchema = createInsertSchema(collections).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertEmployeeSchema = createInsertSchema(employees).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertPayrollSchema = createInsertSchema(payrolls).omit({ 
  id: true, createdAt: true, updatedAt: true, approvedAt: true 
});
export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({ 
  id: true, createdAt: true, updatedAt: true 
});

// Types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAIP = z.infer<typeof insertAIPSchema>;
export type InsertAIPItem = z.infer<typeof insertAIPItemSchema>;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type InsertBudgetObligation = z.infer<typeof insertBudgetObligationSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertJournalEntryItem = z.infer<typeof insertJournalEntryItemSchema>;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type InsertDisbursement = z.infer<typeof insertDisbursementSchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;

// Select Types
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type AnnualInvestmentPlan = typeof annualInvestmentPlans.$inferSelect;
export type AIPItem = typeof aipItems.$inferSelect;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type BudgetObligation = typeof budgetObligations.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalEntryItem = typeof journalEntryItems.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type Disbursement = typeof disbursements.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Payroll = typeof payrolls.$inferSelect;
export type PayrollItem = typeof payrollItems.$inferSelect;
