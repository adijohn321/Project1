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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth and users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  
  // Roles
  createRole(role: InsertRole): Promise<Role>;
  getRole(id: number): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  getRolesByModule(module: string): Promise<Role[]>;
  
  // Planning - AIP
  createAIP(aip: InsertAIP): Promise<AnnualInvestmentPlan>;
  getAIP(id: number): Promise<AnnualInvestmentPlan | undefined>;
  getAIPs(): Promise<AnnualInvestmentPlan[]>;
  getAIPsByFiscalYear(fiscalYear: number): Promise<AnnualInvestmentPlan[]>;
  updateAIP(id: number, aip: Partial<AnnualInvestmentPlan>): Promise<AnnualInvestmentPlan | undefined>;
  
  // Planning - AIP Items
  createAIPItem(aipItem: InsertAIPItem): Promise<AIPItem>;
  getAIPItem(id: number): Promise<AIPItem | undefined>;
  getAIPItemsByAIPId(aipId: number): Promise<AIPItem[]>;
  getAIPItems(): Promise<AIPItem[]>;
  updateAIPItem(id: number, aipItem: Partial<AIPItem>): Promise<AIPItem | undefined>;
  
  // Budget - Budget Items
  createBudgetItem(budgetItem: InsertBudgetItem): Promise<BudgetItem>;
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  getBudgetItems(): Promise<BudgetItem[]>;
  getBudgetItemsByFiscalYear(fiscalYear: number): Promise<BudgetItem[]>;
  getBudgetItemsByAIPItemId(aipItemId: number): Promise<BudgetItem[]>;
  updateBudgetItem(id: number, budgetItem: Partial<BudgetItem>): Promise<BudgetItem | undefined>;
  
  // Budget - Obligations
  createBudgetObligation(obligation: InsertBudgetObligation): Promise<BudgetObligation>;
  getBudgetObligation(id: number): Promise<BudgetObligation | undefined>;
  getBudgetObligations(): Promise<BudgetObligation[]>;
  getBudgetObligationsByBudgetItemId(budgetItemId: number): Promise<BudgetObligation[]>;
  getBudgetObligationsByStatus(status: string): Promise<BudgetObligation[]>;
  updateBudgetObligation(id: number, obligation: Partial<BudgetObligation>): Promise<BudgetObligation | undefined>;
  
  // Accounting - Journal Entries
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalEntriesByObligationId(obligationId: number): Promise<JournalEntry[]>;
  updateJournalEntry(id: number, entry: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  
  // Accounting - Journal Entry Items
  createJournalEntryItem(item: InsertJournalEntryItem): Promise<JournalEntryItem>;
  getJournalEntryItems(journalEntryId: number): Promise<JournalEntryItem[]>;
  
  // Accounting - Vouchers
  createVoucher(voucher: InsertVoucher): Promise<Voucher>;
  getVoucher(id: number): Promise<Voucher | undefined>;
  getVouchers(): Promise<Voucher[]>;
  getVouchersByJournalEntryId(journalEntryId: number): Promise<Voucher[]>;
  getVouchersByStatus(status: string): Promise<Voucher[]>;
  updateVoucher(id: number, voucher: Partial<Voucher>): Promise<Voucher | undefined>;
  
  // Treasury - Disbursements
  createDisbursement(disbursement: InsertDisbursement): Promise<Disbursement>;
  getDisbursement(id: number): Promise<Disbursement | undefined>;
  getDisbursements(): Promise<Disbursement[]>;
  getDisbursementsByVoucherId(voucherId: number): Promise<Disbursement[]>;
  updateDisbursement(id: number, disbursement: Partial<Disbursement>): Promise<Disbursement | undefined>;
  
  // Treasury - Collections
  createCollection(collection: InsertCollection): Promise<Collection>;
  getCollection(id: number): Promise<Collection | undefined>;
  getCollections(): Promise<Collection[]>;
  getCollectionsByType(collectionType: string): Promise<Collection[]>;
  updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined>;
  
  // HRIS - Employees
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(department: string): Promise<Employee[]>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  
  // HRIS - Payrolls
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrolls(): Promise<Payroll[]>;
  updatePayroll(id: number, payroll: Partial<Payroll>): Promise<Payroll | undefined>;
  
  // HRIS - Payroll Items
  createPayrollItem(payrollItem: InsertPayrollItem): Promise<PayrollItem>;
  getPayrollItems(payrollId: number): Promise<PayrollItem[]>;
  
  // Session store for auth
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private aips: Map<number, AnnualInvestmentPlan>;
  private aipItems: Map<number, AIPItem>;
  private budgetItems: Map<number, BudgetItem>;
  private budgetObligations: Map<number, BudgetObligation>;
  private journalEntries: Map<number, JournalEntry>;
  private journalEntryItems: Map<number, JournalEntryItem>;
  private vouchers: Map<number, Voucher>;
  private disbursements: Map<number, Disbursement>;
  private collections: Map<number, Collection>;
  private employees: Map<number, Employee>;
  private payrolls: Map<number, Payroll>;
  private payrollItems: Map<number, PayrollItem>;
  
  sessionStore: session.SessionStore;
  
  currentId: {
    users: number;
    roles: number;
    aips: number;
    aipItems: number;
    budgetItems: number;
    budgetObligations: number;
    journalEntries: number;
    journalEntryItems: number;
    vouchers: number;
    disbursements: number;
    collections: number;
    employees: number;
    payrolls: number;
    payrollItems: number;
  };

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.aips = new Map();
    this.aipItems = new Map();
    this.budgetItems = new Map();
    this.budgetObligations = new Map();
    this.journalEntries = new Map();
    this.journalEntryItems = new Map();
    this.vouchers = new Map();
    this.disbursements = new Map();
    this.collections = new Map();
    this.employees = new Map();
    this.payrolls = new Map();
    this.payrollItems = new Map();
    
    this.currentId = {
      users: 1,
      roles: 1,
      aips: 1,
      aipItems: 1,
      budgetItems: 1,
      budgetObligations: 1,
      journalEntries: 1,
      journalEntryItems: 1,
      vouchers: 1,
      disbursements: 1,
      collections: 1,
      employees: 1,
      payrolls: 1,
      payrollItems: 1,
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create default roles on initialization
    this.initializeRoles();
  }

  private async initializeRoles() {
    // Admin role
    await this.createRole({
      name: "Administrator",
      module: "admin",
      isEncoder: false,
      permissions: ["all"],
    });
    
    // Planning roles
    await this.createRole({
      name: "Planning Officer",
      module: "planning",
      isEncoder: false,
      permissions: ["read", "write", "approve"],
    });
    
    await this.createRole({
      name: "Planning Encoder",
      module: "planning",
      isEncoder: true,
      permissions: ["read", "write"],
    });
    
    // Budget roles
    await this.createRole({
      name: "Budget Officer",
      module: "budget",
      isEncoder: false,
      permissions: ["read", "write", "approve"],
    });
    
    await this.createRole({
      name: "Budget Encoder",
      module: "budget",
      isEncoder: true,
      permissions: ["read", "write"],
    });
    
    // Accounting roles
    await this.createRole({
      name: "Accounting Officer",
      module: "accounting",
      isEncoder: false,
      permissions: ["read", "write", "approve"],
    });
    
    await this.createRole({
      name: "Accounting Encoder",
      module: "accounting",
      isEncoder: true,
      permissions: ["read", "write"],
    });
    
    // Treasury roles
    await this.createRole({
      name: "Treasury Officer",
      module: "treasury",
      isEncoder: false,
      permissions: ["read", "write", "approve"],
    });
    
    await this.createRole({
      name: "Treasury Encoder",
      module: "treasury",
      isEncoder: true,
      permissions: ["read", "write"],
    });
    
    // HRIS roles
    await this.createRole({
      name: "HRIS Officer",
      module: "hris",
      isEncoder: false,
      permissions: ["read", "write", "approve"],
    });
    
    await this.createRole({
      name: "HRIS Encoder",
      module: "hris",
      isEncoder: true,
      permissions: ["read", "write"],
    });
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(roleId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.roleId === roleId,
    );
  }
  
  // Roles
  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.currentId.roles++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }
  
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  
  async getRolesByModule(module: string): Promise<Role[]> {
    return Array.from(this.roles.values()).filter(
      (role) => role.module === module,
    );
  }
  
  // Planning - AIP
  async createAIP(insertAIP: InsertAIP): Promise<AnnualInvestmentPlan> {
    const id = this.currentId.aips++;
    const now = new Date();
    const aip: AnnualInvestmentPlan = {
      ...insertAIP,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.aips.set(id, aip);
    return aip;
  }
  
  async getAIP(id: number): Promise<AnnualInvestmentPlan | undefined> {
    return this.aips.get(id);
  }
  
  async getAIPs(): Promise<AnnualInvestmentPlan[]> {
    return Array.from(this.aips.values());
  }
  
  async getAIPsByFiscalYear(fiscalYear: number): Promise<AnnualInvestmentPlan[]> {
    return Array.from(this.aips.values()).filter(
      (aip) => aip.fiscalYear === fiscalYear,
    );
  }
  
  async updateAIP(id: number, aipData: Partial<AnnualInvestmentPlan>): Promise<AnnualInvestmentPlan | undefined> {
    const aip = this.aips.get(id);
    if (!aip) return undefined;
    
    const updatedAIP = { 
      ...aip, 
      ...aipData,
      updatedAt: new Date()
    };
    this.aips.set(id, updatedAIP);
    return updatedAIP;
  }
  
  // Planning - AIP Items
  async createAIPItem(insertAIPItem: InsertAIPItem): Promise<AIPItem> {
    const id = this.currentId.aipItems++;
    const now = new Date();
    const aipItem: AIPItem = {
      ...insertAIPItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.aipItems.set(id, aipItem);
    return aipItem;
  }
  
  async getAIPItem(id: number): Promise<AIPItem | undefined> {
    return this.aipItems.get(id);
  }
  
  async getAIPItemsByAIPId(aipId: number): Promise<AIPItem[]> {
    return Array.from(this.aipItems.values()).filter(
      (item) => item.aipId === aipId,
    );
  }
  
  async getAIPItems(): Promise<AIPItem[]> {
    return Array.from(this.aipItems.values());
  }
  
  async updateAIPItem(id: number, aipItemData: Partial<AIPItem>): Promise<AIPItem | undefined> {
    const aipItem = this.aipItems.get(id);
    if (!aipItem) return undefined;
    
    const updatedAIPItem = {
      ...aipItem,
      ...aipItemData,
      updatedAt: new Date()
    };
    this.aipItems.set(id, updatedAIPItem);
    return updatedAIPItem;
  }
  
  // Budget - Budget Items
  async createBudgetItem(insertBudgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.currentId.budgetItems++;
    const now = new Date();
    const budgetItem: BudgetItem = {
      ...insertBudgetItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.budgetItems.set(id, budgetItem);
    return budgetItem;
  }
  
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    return this.budgetItems.get(id);
  }
  
  async getBudgetItems(): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values());
  }
  
  async getBudgetItemsByFiscalYear(fiscalYear: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values()).filter(
      (item) => item.fiscalYear === fiscalYear,
    );
  }
  
  async getBudgetItemsByAIPItemId(aipItemId: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values()).filter(
      (item) => item.aipItemId === aipItemId,
    );
  }
  
  async updateBudgetItem(id: number, budgetItemData: Partial<BudgetItem>): Promise<BudgetItem | undefined> {
    const budgetItem = this.budgetItems.get(id);
    if (!budgetItem) return undefined;
    
    const updatedBudgetItem = {
      ...budgetItem,
      ...budgetItemData,
      updatedAt: new Date()
    };
    this.budgetItems.set(id, updatedBudgetItem);
    return updatedBudgetItem;
  }
  
  // Budget - Obligations
  async createBudgetObligation(insertObligation: InsertBudgetObligation): Promise<BudgetObligation> {
    const id = this.currentId.budgetObligations++;
    const now = new Date();
    const obligation: BudgetObligation = {
      ...insertObligation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.budgetObligations.set(id, obligation);
    
    // Update budget item balance
    const budgetItem = await this.getBudgetItem(obligation.budgetItemId);
    if (budgetItem) {
      const newBalance = Number(budgetItem.balance) - Number(obligation.amount);
      await this.updateBudgetItem(budgetItem.id, {
        balance: newBalance.toString(),
      });
    }
    
    return obligation;
  }
  
  async getBudgetObligation(id: number): Promise<BudgetObligation | undefined> {
    return this.budgetObligations.get(id);
  }
  
  async getBudgetObligations(): Promise<BudgetObligation[]> {
    return Array.from(this.budgetObligations.values());
  }
  
  async getBudgetObligationsByBudgetItemId(budgetItemId: number): Promise<BudgetObligation[]> {
    return Array.from(this.budgetObligations.values()).filter(
      (obligation) => obligation.budgetItemId === budgetItemId,
    );
  }
  
  async getBudgetObligationsByStatus(status: string): Promise<BudgetObligation[]> {
    return Array.from(this.budgetObligations.values()).filter(
      (obligation) => obligation.status === status,
    );
  }
  
  async updateBudgetObligation(id: number, obligationData: Partial<BudgetObligation>): Promise<BudgetObligation | undefined> {
    const obligation = this.budgetObligations.get(id);
    if (!obligation) return undefined;
    
    const updatedObligation = {
      ...obligation,
      ...obligationData,
      updatedAt: new Date()
    };
    this.budgetObligations.set(id, updatedObligation);
    return updatedObligation;
  }
  
  // Accounting - Journal Entries
  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentId.journalEntries++;
    const now = new Date();
    const entry: JournalEntry = {
      ...insertEntry,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.journalEntries.set(id, entry);
    return entry;
  }
  
  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }
  
  async getJournalEntries(): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values());
  }
  
  async getJournalEntriesByObligationId(obligationId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).filter(
      (entry) => entry.obligationId === obligationId,
    );
  }
  
  async updateJournalEntry(id: number, entryData: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = {
      ...entry,
      ...entryData,
      updatedAt: new Date()
    };
    this.journalEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  // Accounting - Journal Entry Items
  async createJournalEntryItem(insertItem: InsertJournalEntryItem): Promise<JournalEntryItem> {
    const id = this.currentId.journalEntryItems++;
    const now = new Date();
    const item: JournalEntryItem = {
      ...insertItem,
      id,
      createdAt: now,
    };
    this.journalEntryItems.set(id, item);
    return item;
  }
  
  async getJournalEntryItems(journalEntryId: number): Promise<JournalEntryItem[]> {
    return Array.from(this.journalEntryItems.values()).filter(
      (item) => item.journalEntryId === journalEntryId,
    );
  }
  
  // Accounting - Vouchers
  async createVoucher(insertVoucher: InsertVoucher): Promise<Voucher> {
    const id = this.currentId.vouchers++;
    const now = new Date();
    const voucher: Voucher = {
      ...insertVoucher,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.vouchers.set(id, voucher);
    return voucher;
  }
  
  async getVoucher(id: number): Promise<Voucher | undefined> {
    return this.vouchers.get(id);
  }
  
  async getVouchers(): Promise<Voucher[]> {
    return Array.from(this.vouchers.values());
  }
  
  async getVouchersByJournalEntryId(journalEntryId: number): Promise<Voucher[]> {
    return Array.from(this.vouchers.values()).filter(
      (voucher) => voucher.journalEntryId === journalEntryId,
    );
  }
  
  async getVouchersByStatus(status: string): Promise<Voucher[]> {
    return Array.from(this.vouchers.values()).filter(
      (voucher) => voucher.status === status,
    );
  }
  
  async updateVoucher(id: number, voucherData: Partial<Voucher>): Promise<Voucher | undefined> {
    const voucher = this.vouchers.get(id);
    if (!voucher) return undefined;
    
    const updatedVoucher = {
      ...voucher,
      ...voucherData,
      updatedAt: new Date()
    };
    this.vouchers.set(id, updatedVoucher);
    return updatedVoucher;
  }
  
  // Treasury - Disbursements
  async createDisbursement(insertDisbursement: InsertDisbursement): Promise<Disbursement> {
    const id = this.currentId.disbursements++;
    const now = new Date();
    const disbursement: Disbursement = {
      ...insertDisbursement,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.disbursements.set(id, disbursement);
    
    // Update voucher status
    const voucher = await this.getVoucher(disbursement.voucherId);
    if (voucher) {
      await this.updateVoucher(voucher.id, {
        status: "paid",
      });
    }
    
    return disbursement;
  }
  
  async getDisbursement(id: number): Promise<Disbursement | undefined> {
    return this.disbursements.get(id);
  }
  
  async getDisbursements(): Promise<Disbursement[]> {
    return Array.from(this.disbursements.values());
  }
  
  async getDisbursementsByVoucherId(voucherId: number): Promise<Disbursement[]> {
    return Array.from(this.disbursements.values()).filter(
      (disbursement) => disbursement.voucherId === voucherId,
    );
  }
  
  async updateDisbursement(id: number, disbursementData: Partial<Disbursement>): Promise<Disbursement | undefined> {
    const disbursement = this.disbursements.get(id);
    if (!disbursement) return undefined;
    
    const updatedDisbursement = {
      ...disbursement,
      ...disbursementData,
      updatedAt: new Date()
    };
    this.disbursements.set(id, updatedDisbursement);
    return updatedDisbursement;
  }
  
  // Treasury - Collections
  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentId.collections++;
    const now = new Date();
    const collection: Collection = {
      ...insertCollection,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.collections.set(id, collection);
    return collection;
  }
  
  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }
  
  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }
  
  async getCollectionsByType(collectionType: string): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(
      (collection) => collection.collectionType === collectionType,
    );
  }
  
  async updateCollection(id: number, collectionData: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection = {
      ...collection,
      ...collectionData,
      updatedAt: new Date()
    };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }
  
  // HRIS - Employees
  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentId.employees++;
    const now = new Date();
    const employee: Employee = {
      ...insertEmployee,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.employees.set(id, employee);
    return employee;
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }
  
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      (employee) => employee.department === department,
    );
  }
  
  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = {
      ...employee,
      ...employeeData,
      updatedAt: new Date()
    };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  // HRIS - Payrolls
  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const id = this.currentId.payrolls++;
    const now = new Date();
    const payroll: Payroll = {
      ...insertPayroll,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.payrolls.set(id, payroll);
    return payroll;
  }
  
  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }
  
  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }
  
  async updatePayroll(id: number, payrollData: Partial<Payroll>): Promise<Payroll | undefined> {
    const payroll = this.payrolls.get(id);
    if (!payroll) return undefined;
    
    const updatedPayroll = {
      ...payroll,
      ...payrollData,
      updatedAt: new Date()
    };
    this.payrolls.set(id, updatedPayroll);
    return updatedPayroll;
  }
  
  // HRIS - Payroll Items
  async createPayrollItem(insertPayrollItem: InsertPayrollItem): Promise<PayrollItem> {
    const id = this.currentId.payrollItems++;
    const now = new Date();
    const payrollItem: PayrollItem = {
      ...insertPayrollItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.payrollItems.set(id, payrollItem);
    return payrollItem;
  }
  
  async getPayrollItems(payrollId: number): Promise<PayrollItem[]> {
    return Array.from(this.payrollItems.values()).filter(
      (item) => item.payrollId === payrollId,
    );
  }
}

import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
