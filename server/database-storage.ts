import {
  users, roles, annualInvestmentPlans, aipItems, budgetItems, budgetObligations,
  journalEntries, journalEntryItems, vouchers, disbursements, collections,
  employees, payrolls, payrollItems,
  type User, type Role, type AnnualInvestmentPlan, type AIPItem, type BudgetItem,
  type BudgetObligation, type JournalEntry, type JournalEntryItem, type Voucher,
  type Disbursement, type Collection, type Employee, type Payroll, type PayrollItem,
  type InsertUser, type InsertRole, type InsertAIP, type InsertAIPItem,
  type InsertBudgetItem, type InsertBudgetObligation, type InsertJournalEntry,
  type InsertJournalEntryItem, type InsertVoucher, type InsertDisbursement,
  type InsertCollection, type InsertEmployee, type InsertPayroll, type InsertPayrollItem
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, SQL, sql } from "drizzle-orm";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.roleId, roleId));
  }
  
  // Roles
  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }
  
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  async getRolesByModule(module: string): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.module, module));
  }
  
  // Planning - AIP
  async createAIP(insertAIP: InsertAIP): Promise<AnnualInvestmentPlan> {
    const [aip] = await db.insert(annualInvestmentPlans).values(insertAIP).returning();
    return aip;
  }
  
  async getAIP(id: number): Promise<AnnualInvestmentPlan | undefined> {
    const [aip] = await db.select().from(annualInvestmentPlans).where(eq(annualInvestmentPlans.id, id));
    return aip;
  }
  
  async getAIPs(): Promise<AnnualInvestmentPlan[]> {
    return await db.select().from(annualInvestmentPlans);
  }
  
  async getAIPsByFiscalYear(fiscalYear: number): Promise<AnnualInvestmentPlan[]> {
    return await db.select().from(annualInvestmentPlans).where(eq(annualInvestmentPlans.fiscalYear, fiscalYear));
  }
  
  async updateAIP(id: number, aipData: Partial<AnnualInvestmentPlan>): Promise<AnnualInvestmentPlan | undefined> {
    const [updatedAIP] = await db
      .update(annualInvestmentPlans)
      .set(aipData)
      .where(eq(annualInvestmentPlans.id, id))
      .returning();
    
    return updatedAIP;
  }
  
  // Planning - AIP Items
  async createAIPItem(insertAIPItem: InsertAIPItem): Promise<AIPItem> {
    const [aipItem] = await db.insert(aipItems).values(insertAIPItem).returning();
    return aipItem;
  }
  
  async getAIPItem(id: number): Promise<AIPItem | undefined> {
    const [aipItem] = await db.select().from(aipItems).where(eq(aipItems.id, id));
    return aipItem;
  }
  
  async getAIPItemsByAIPId(aipId: number): Promise<AIPItem[]> {
    return await db.select().from(aipItems).where(eq(aipItems.aipId, aipId));
  }
  
  async getAIPItems(): Promise<AIPItem[]> {
    return await db.select().from(aipItems);
  }
  
  async updateAIPItem(id: number, aipItemData: Partial<AIPItem>): Promise<AIPItem | undefined> {
    const [updatedAIPItem] = await db
      .update(aipItems)
      .set(aipItemData)
      .where(eq(aipItems.id, id))
      .returning();
    
    return updatedAIPItem;
  }
  
  // Budget - Budget Items
  async createBudgetItem(insertBudgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const [budgetItem] = await db.insert(budgetItems).values(insertBudgetItem).returning();
    return budgetItem;
  }
  
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    const [budgetItem] = await db.select().from(budgetItems).where(eq(budgetItems.id, id));
    return budgetItem;
  }
  
  async getBudgetItems(): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems);
  }
  
  async getBudgetItemsByFiscalYear(fiscalYear: number): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems).where(eq(budgetItems.fiscalYear, fiscalYear));
  }
  
  async getBudgetItemsByAIPItemId(aipItemId: number): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems).where(eq(budgetItems.aipItemId, aipItemId));
  }
  
  async updateBudgetItem(id: number, budgetItemData: Partial<BudgetItem>): Promise<BudgetItem | undefined> {
    const [updatedBudgetItem] = await db
      .update(budgetItems)
      .set(budgetItemData)
      .where(eq(budgetItems.id, id))
      .returning();
    
    return updatedBudgetItem;
  }
  
  // Budget - Obligations
  async createBudgetObligation(insertObligation: InsertBudgetObligation): Promise<BudgetObligation> {
    // Start a transaction to update budget item balance
    const [obligation] = await db.transaction(async (tx) => {
      const [newObligation] = await tx
        .insert(budgetObligations)
        .values(insertObligation)
        .returning();
      
      // Update budget item balance
      const [budgetItem] = await tx
        .select()
        .from(budgetItems)
        .where(eq(budgetItems.id, newObligation.budgetItemId));
      
      if (budgetItem) {
        const newBalance = Number(budgetItem.balance) - Number(newObligation.amount);
        await tx
          .update(budgetItems)
          .set({ balance: newBalance.toString() })
          .where(eq(budgetItems.id, budgetItem.id));
      }
      
      return [newObligation];
    });
    
    return obligation;
  }
  
  async getBudgetObligation(id: number): Promise<BudgetObligation | undefined> {
    const [obligation] = await db.select().from(budgetObligations).where(eq(budgetObligations.id, id));
    return obligation;
  }
  
  async getBudgetObligations(): Promise<BudgetObligation[]> {
    return await db.select().from(budgetObligations);
  }
  
  async getBudgetObligationsByBudgetItemId(budgetItemId: number): Promise<BudgetObligation[]> {
    return await db
      .select()
      .from(budgetObligations)
      .where(eq(budgetObligations.budgetItemId, budgetItemId));
  }
  
  async getBudgetObligationsByStatus(status: string): Promise<BudgetObligation[]> {
    return await db
      .select()
      .from(budgetObligations)
      .where(eq(budgetObligations.status, status));
  }
  
  async updateBudgetObligation(id: number, obligationData: Partial<BudgetObligation>): Promise<BudgetObligation | undefined> {
    const [updatedObligation] = await db
      .update(budgetObligations)
      .set(obligationData)
      .where(eq(budgetObligations.id, id))
      .returning();
    
    return updatedObligation;
  }
  
  // Accounting - Journal Entries
  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [journalEntry] = await db.insert(journalEntries).values(insertEntry).returning();
    return journalEntry;
  }
  
  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [journalEntry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return journalEntry;
  }
  
  async getJournalEntries(): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries);
  }
  
  async getJournalEntriesByObligationId(obligationId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.obligationId, obligationId));
  }
  
  async updateJournalEntry(id: number, entryData: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [updatedEntry] = await db
      .update(journalEntries)
      .set(entryData)
      .where(eq(journalEntries.id, id))
      .returning();
    
    return updatedEntry;
  }
  
  // Accounting - Journal Entry Items
  async createJournalEntryItem(insertItem: InsertJournalEntryItem): Promise<JournalEntryItem> {
    const [journalEntryItem] = await db.insert(journalEntryItems).values(insertItem).returning();
    return journalEntryItem;
  }
  
  async getJournalEntryItems(journalEntryId: number): Promise<JournalEntryItem[]> {
    return await db
      .select()
      .from(journalEntryItems)
      .where(eq(journalEntryItems.journalEntryId, journalEntryId));
  }
  
  // Accounting - Vouchers
  async createVoucher(insertVoucher: InsertVoucher): Promise<Voucher> {
    const [voucher] = await db.insert(vouchers).values(insertVoucher).returning();
    return voucher;
  }
  
  async getVoucher(id: number): Promise<Voucher | undefined> {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher;
  }
  
  async getVouchers(): Promise<Voucher[]> {
    return await db.select().from(vouchers);
  }
  
  async getVouchersByJournalEntryId(journalEntryId: number): Promise<Voucher[]> {
    return await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.journalEntryId, journalEntryId));
  }
  
  async getVouchersByStatus(status: string): Promise<Voucher[]> {
    return await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.status, status));
  }
  
  async updateVoucher(id: number, voucherData: Partial<Voucher>): Promise<Voucher | undefined> {
    const [updatedVoucher] = await db
      .update(vouchers)
      .set(voucherData)
      .where(eq(vouchers.id, id))
      .returning();
    
    return updatedVoucher;
  }
  
  // Treasury - Disbursements
  async createDisbursement(insertDisbursement: InsertDisbursement): Promise<Disbursement> {
    const [disbursement] = await db.insert(disbursements).values(insertDisbursement).returning();
    return disbursement;
  }
  
  async getDisbursement(id: number): Promise<Disbursement | undefined> {
    const [disbursement] = await db.select().from(disbursements).where(eq(disbursements.id, id));
    return disbursement;
  }
  
  async getDisbursements(): Promise<Disbursement[]> {
    return await db.select().from(disbursements);
  }
  
  async getDisbursementsByVoucherId(voucherId: number): Promise<Disbursement[]> {
    return await db
      .select()
      .from(disbursements)
      .where(eq(disbursements.voucherId, voucherId));
  }
  
  async updateDisbursement(id: number, disbursementData: Partial<Disbursement>): Promise<Disbursement | undefined> {
    const [updatedDisbursement] = await db
      .update(disbursements)
      .set(disbursementData)
      .where(eq(disbursements.id, id))
      .returning();
    
    return updatedDisbursement;
  }
  
  // Treasury - Collections
  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db.insert(collections).values(insertCollection).returning();
    return collection;
  }
  
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }
  
  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections);
  }
  
  async getCollectionsByType(collectionType: string): Promise<Collection[]> {
    return await db
      .select()
      .from(collections)
      .where(eq(collections.collectionType, collectionType));
  }
  
  async updateCollection(id: number, collectionData: Partial<Collection>): Promise<Collection | undefined> {
    const [updatedCollection] = await db
      .update(collections)
      .set(collectionData)
      .where(eq(collections.id, id))
      .returning();
    
    return updatedCollection;
  }
  
  // HRIS - Employees
  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }
  
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }
  
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.department, department));
  }
  
  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employeeData)
      .where(eq(employees.id, id))
      .returning();
    
    return updatedEmployee;
  }
  
  // HRIS - Payrolls
  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const [payroll] = await db.insert(payrolls).values(insertPayroll).returning();
    return payroll;
  }
  
  async getPayroll(id: number): Promise<Payroll | undefined> {
    const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return payroll;
  }
  
  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls);
  }
  
  async updatePayroll(id: number, payrollData: Partial<Payroll>): Promise<Payroll | undefined> {
    const [updatedPayroll] = await db
      .update(payrolls)
      .set(payrollData)
      .where(eq(payrolls.id, id))
      .returning();
    
    return updatedPayroll;
  }
  
  // HRIS - Payroll Items
  async createPayrollItem(insertPayrollItem: InsertPayrollItem): Promise<PayrollItem> {
    const [payrollItem] = await db.insert(payrollItems).values(insertPayrollItem).returning();
    return payrollItem;
  }
  
  async getPayrollItems(payrollId: number): Promise<PayrollItem[]> {
    return await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, payrollId));
  }
}