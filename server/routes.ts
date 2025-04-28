import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertAIPSchema,
  insertAIPItemSchema,
  insertBudgetItemSchema,
  insertBudgetObligationSchema,
  insertJournalEntrySchema,
  insertJournalEntryItemSchema,
  insertVoucherSchema,
  insertDisbursementSchema,
  insertCollectionSchema,
  insertEmployeeSchema,
  insertPayrollSchema,
  insertPayrollItemSchema,
} from "@shared/schema";

// Helper function to check if user has access to a module
function checkModuleAccess(module: string) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ message: "Invalid user role" });
    }
    
    storage.getRole(req.user.roleId)
      .then((role) => {
        if (!role) {
          return res.status(403).json({ message: "Role not found" });
        }
        
        if (role.module === module || role.module === "admin") {
          next();
        } else {
          res.status(403).json({ message: "Access denied to this module" });
        }
      })
      .catch((err) => {
        res.status(500).json({ message: "Error checking permissions" });
      });
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // ROLES
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching roles" });
    }
  });

  // PLANNING - AIP Routes
  app.get("/api/planning/aip", checkModuleAccess("planning"), async (req, res) => {
    try {
      const fiscalYear = req.query.fiscalYear ? Number(req.query.fiscalYear) : undefined;
      const aips = fiscalYear 
        ? await storage.getAIPsByFiscalYear(fiscalYear)
        : await storage.getAIPs();
      res.json(aips);
    } catch (error) {
      res.status(500).json({ message: "Error fetching AIPs" });
    }
  });

  app.get("/api/planning/aip/:id", checkModuleAccess("planning"), async (req, res) => {
    try {
      const aip = await storage.getAIP(Number(req.params.id));
      if (!aip) {
        return res.status(404).json({ message: "AIP not found" });
      }
      res.json(aip);
    } catch (error) {
      res.status(500).json({ message: "Error fetching AIP" });
    }
  });

  app.post("/api/planning/aip", checkModuleAccess("planning"), async (req, res) => {
    try {
      const validatedData = insertAIPSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const aip = await storage.createAIP(validatedData);
      res.status(201).json(aip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid AIP data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating AIP" });
    }
  });

  app.put("/api/planning/aip/:id", checkModuleAccess("planning"), async (req, res) => {
    try {
      const aipId = Number(req.params.id);
      const existingAIP = await storage.getAIP(aipId);
      
      if (!existingAIP) {
        return res.status(404).json({ message: "AIP not found" });
      }
      
      const updatedAIP = await storage.updateAIP(aipId, {
        ...req.body,
      });
      
      res.json(updatedAIP);
    } catch (error) {
      res.status(500).json({ message: "Error updating AIP" });
    }
  });

  // PLANNING - AIP Items
  app.get("/api/planning/aip/:aipId/items", checkModuleAccess("planning"), async (req, res) => {
    try {
      const aipId = Number(req.params.aipId);
      const aipItems = await storage.getAIPItemsByAIPId(aipId);
      res.json(aipItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching AIP items" });
    }
  });

  app.post("/api/planning/aip-item", checkModuleAccess("planning"), async (req, res) => {
    try {
      const validatedData = insertAIPItemSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const aipItem = await storage.createAIPItem(validatedData);
      res.status(201).json(aipItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid AIP item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating AIP item" });
    }
  });

  app.get("/api/planning/aip-item/:id", checkModuleAccess("planning"), async (req, res) => {
    try {
      const aipItem = await storage.getAIPItem(Number(req.params.id));
      if (!aipItem) {
        return res.status(404).json({ message: "AIP item not found" });
      }
      res.json(aipItem);
    } catch (error) {
      res.status(500).json({ message: "Error fetching AIP item" });
    }
  });

  app.put("/api/planning/aip-item/:id", checkModuleAccess("planning"), async (req, res) => {
    try {
      const aipItemId = Number(req.params.id);
      const existingAIPItem = await storage.getAIPItem(aipItemId);
      
      if (!existingAIPItem) {
        return res.status(404).json({ message: "AIP item not found" });
      }
      
      const updatedAIPItem = await storage.updateAIPItem(aipItemId, {
        ...req.body,
      });
      
      res.json(updatedAIPItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating AIP item" });
    }
  });

  // BUDGET - Budget Items
  app.get("/api/budget/items", checkModuleAccess("budget"), async (req, res) => {
    try {
      const fiscalYear = req.query.fiscalYear ? Number(req.query.fiscalYear) : undefined;
      const aipItemId = req.query.aipItemId ? Number(req.query.aipItemId) : undefined;
      
      let budgetItems;
      if (fiscalYear) {
        budgetItems = await storage.getBudgetItemsByFiscalYear(fiscalYear);
      } else if (aipItemId) {
        budgetItems = await storage.getBudgetItemsByAIPItemId(aipItemId);
      } else {
        budgetItems = await storage.getBudgetItems();
      }
      
      res.json(budgetItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching budget items" });
    }
  });

  app.post("/api/budget/item", checkModuleAccess("budget"), async (req, res) => {
    try {
      const validatedData = insertBudgetItemSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      // Ensure the balance starts equal to the amount
      validatedData.balance = validatedData.amount;
      
      const budgetItem = await storage.createBudgetItem(validatedData);
      res.status(201).json(budgetItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating budget item" });
    }
  });

  app.get("/api/budget/item/:id", checkModuleAccess("budget"), async (req, res) => {
    try {
      const budgetItem = await storage.getBudgetItem(Number(req.params.id));
      if (!budgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      res.json(budgetItem);
    } catch (error) {
      res.status(500).json({ message: "Error fetching budget item" });
    }
  });

  // BUDGET - Obligations
  app.get("/api/budget/obligations", checkModuleAccess("budget"), async (req, res) => {
    try {
      const budgetItemId = req.query.budgetItemId ? Number(req.query.budgetItemId) : undefined;
      const status = req.query.status as string | undefined;
      
      let obligations;
      if (budgetItemId) {
        obligations = await storage.getBudgetObligationsByBudgetItemId(budgetItemId);
      } else if (status) {
        obligations = await storage.getBudgetObligationsByStatus(status);
      } else {
        obligations = await storage.getBudgetObligations();
      }
      
      res.json(obligations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching budget obligations" });
    }
  });

  app.post("/api/budget/obligation", checkModuleAccess("budget"), async (req, res) => {
    try {
      const validatedData = insertBudgetObligationSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      // Check if there's enough budget
      const budgetItem = await storage.getBudgetItem(validatedData.budgetItemId);
      if (!budgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      if (Number(budgetItem.balance) < Number(validatedData.amount)) {
        return res.status(400).json({ message: "Insufficient budget balance" });
      }
      
      const obligation = await storage.createBudgetObligation(validatedData);
      res.status(201).json(obligation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid obligation data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating budget obligation" });
    }
  });

  app.get("/api/budget/obligation/:id", checkModuleAccess("budget"), async (req, res) => {
    try {
      const obligation = await storage.getBudgetObligation(Number(req.params.id));
      if (!obligation) {
        return res.status(404).json({ message: "Obligation not found" });
      }
      res.json(obligation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching obligation" });
    }
  });

  app.put("/api/budget/obligation/:id", checkModuleAccess("budget"), async (req, res) => {
    try {
      const obligationId = Number(req.params.id);
      const existingObligation = await storage.getBudgetObligation(obligationId);
      
      if (!existingObligation) {
        return res.status(404).json({ message: "Obligation not found" });
      }
      
      const updatedObligation = await storage.updateBudgetObligation(obligationId, {
        ...req.body,
        processedBy: req.user!.id,
        processedAt: new Date(),
      });
      
      res.json(updatedObligation);
    } catch (error) {
      res.status(500).json({ message: "Error updating obligation" });
    }
  });

  // ACCOUNTING - Journal Entries
  app.get("/api/accounting/journal-entries", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const obligationId = req.query.obligationId ? Number(req.query.obligationId) : undefined;
      
      const entries = obligationId
        ? await storage.getJournalEntriesByObligationId(obligationId)
        : await storage.getJournalEntries();
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching journal entries" });
    }
  });

  app.post("/api/accounting/journal-entry", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const journalEntry = await storage.createJournalEntry(validatedData);
      res.status(201).json(journalEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating journal entry" });
    }
  });

  app.get("/api/accounting/journal-entry/:id", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const journalEntry = await storage.getJournalEntry(Number(req.params.id));
      if (!journalEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Also get the items for this journal entry
      const items = await storage.getJournalEntryItems(journalEntry.id);
      
      res.json({
        ...journalEntry,
        items,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching journal entry" });
    }
  });

  app.post("/api/accounting/journal-entry-item", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const validatedData = insertJournalEntryItemSchema.parse(req.body);
      
      const journalEntryItem = await storage.createJournalEntryItem(validatedData);
      res.status(201).json(journalEntryItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journal entry item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating journal entry item" });
    }
  });

  app.put("/api/accounting/journal-entry/:id", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const journalEntryId = Number(req.params.id);
      const existingJournalEntry = await storage.getJournalEntry(journalEntryId);
      
      if (!existingJournalEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // If posting the journal entry
      if (req.body.status === "posted" && existingJournalEntry.status !== "posted") {
        const updatedJournalEntry = await storage.updateJournalEntry(journalEntryId, {
          ...req.body,
          postedBy: req.user!.id,
          postedAt: new Date(),
        });
        
        // If there's an obligation, update its status
        if (existingJournalEntry.obligationId) {
          await storage.updateBudgetObligation(existingJournalEntry.obligationId, {
            status: "processed",
          });
        }
        
        return res.json(updatedJournalEntry);
      }
      
      const updatedJournalEntry = await storage.updateJournalEntry(journalEntryId, req.body);
      res.json(updatedJournalEntry);
    } catch (error) {
      res.status(500).json({ message: "Error updating journal entry" });
    }
  });

  // ACCOUNTING - Vouchers
  app.get("/api/accounting/vouchers", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const journalEntryId = req.query.journalEntryId ? Number(req.query.journalEntryId) : undefined;
      const status = req.query.status as string | undefined;
      
      let vouchers;
      if (journalEntryId) {
        vouchers = await storage.getVouchersByJournalEntryId(journalEntryId);
      } else if (status) {
        vouchers = await storage.getVouchersByStatus(status);
      } else {
        vouchers = await storage.getVouchers();
      }
      
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vouchers" });
    }
  });

  app.post("/api/accounting/voucher", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const validatedData = insertVoucherSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const voucher = await storage.createVoucher(validatedData);
      res.status(201).json(voucher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid voucher data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating voucher" });
    }
  });

  app.get("/api/accounting/voucher/:id", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const voucher = await storage.getVoucher(Number(req.params.id));
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      res.json(voucher);
    } catch (error) {
      res.status(500).json({ message: "Error fetching voucher" });
    }
  });

  app.put("/api/accounting/voucher/:id", checkModuleAccess("accounting"), async (req, res) => {
    try {
      const voucherId = Number(req.params.id);
      const existingVoucher = await storage.getVoucher(voucherId);
      
      if (!existingVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      
      // If approving the voucher
      if (req.body.status === "approved" && existingVoucher.status !== "approved") {
        const updatedVoucher = await storage.updateVoucher(voucherId, {
          ...req.body,
          approvedBy: req.user!.id,
          approvedAt: new Date(),
        });
        
        return res.json(updatedVoucher);
      }
      
      const updatedVoucher = await storage.updateVoucher(voucherId, req.body);
      res.json(updatedVoucher);
    } catch (error) {
      res.status(500).json({ message: "Error updating voucher" });
    }
  });

  // TREASURY - Disbursements
  app.get("/api/treasury/disbursements", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const voucherId = req.query.voucherId ? Number(req.query.voucherId) : undefined;
      
      const disbursements = voucherId
        ? await storage.getDisbursementsByVoucherId(voucherId)
        : await storage.getDisbursements();
      
      res.json(disbursements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching disbursements" });
    }
  });

  app.post("/api/treasury/disbursement", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const validatedData = insertDisbursementSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      // Make sure voucher exists and is approved
      const voucher = await storage.getVoucher(validatedData.voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      
      if (voucher.status !== "approved") {
        return res.status(400).json({ message: "Voucher must be approved before disbursement" });
      }
      
      const disbursement = await storage.createDisbursement(validatedData);
      res.status(201).json(disbursement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid disbursement data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating disbursement" });
    }
  });

  app.get("/api/treasury/disbursement/:id", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const disbursement = await storage.getDisbursement(Number(req.params.id));
      if (!disbursement) {
        return res.status(404).json({ message: "Disbursement not found" });
      }
      res.json(disbursement);
    } catch (error) {
      res.status(500).json({ message: "Error fetching disbursement" });
    }
  });

  // TREASURY - Collections
  app.get("/api/treasury/collections", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const collectionType = req.query.type as string | undefined;
      
      const collections = collectionType
        ? await storage.getCollectionsByType(collectionType)
        : await storage.getCollections();
      
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching collections" });
    }
  });

  app.post("/api/treasury/collection", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const collection = await storage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating collection" });
    }
  });

  app.get("/api/treasury/collection/:id", checkModuleAccess("treasury"), async (req, res) => {
    try {
      const collection = await storage.getCollection(Number(req.params.id));
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Error fetching collection" });
    }
  });

  // HRIS - Employees
  app.get("/api/hris/employees", checkModuleAccess("hris"), async (req, res) => {
    try {
      const department = req.query.department as string | undefined;
      
      const employees = department
        ? await storage.getEmployeesByDepartment(department)
        : await storage.getEmployees();
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employees" });
    }
  });

  app.post("/api/hris/employee", checkModuleAccess("hris"), async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating employee" });
    }
  });

  app.get("/api/hris/employee/:id", checkModuleAccess("hris"), async (req, res) => {
    try {
      const employee = await storage.getEmployee(Number(req.params.id));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  // HRIS - Payrolls
  app.get("/api/hris/payrolls", checkModuleAccess("hris"), async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payrolls" });
    }
  });

  app.post("/api/hris/payroll", checkModuleAccess("hris"), async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payroll" });
    }
  });

  app.get("/api/hris/payroll/:id", checkModuleAccess("hris"), async (req, res) => {
    try {
      const payroll = await storage.getPayroll(Number(req.params.id));
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      // Also get payroll items
      const items = await storage.getPayrollItems(payroll.id);
      
      res.json({
        ...payroll,
        items,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payroll" });
    }
  });

  app.post("/api/hris/payroll-item", checkModuleAccess("hris"), async (req, res) => {
    try {
      const validatedData = insertPayrollItemSchema.parse(req.body);
      
      const payrollItem = await storage.createPayrollItem(validatedData);
      res.status(201).json(payrollItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payroll item" });
    }
  });

  // Dashboard statistics API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const fiscalYear = req.query.fiscalYear ? Number(req.query.fiscalYear) : new Date().getFullYear();
      
      // Get AIPs for the fiscal year
      const aips = await storage.getAIPsByFiscalYear(fiscalYear);
      
      // Get all AIP items for these AIPs
      let allAIPItems: any[] = [];
      for (const aip of aips) {
        const aipItems = await storage.getAIPItemsByAIPId(aip.id);
        allAIPItems = [...allAIPItems, ...aipItems];
      }
      
      // Get all budget items for this fiscal year
      const budgetItems = await storage.getBudgetItemsByFiscalYear(fiscalYear);
      
      // Get pending vouchers
      const pendingVouchers = await storage.getVouchersByStatus("draft");
      
      const stats = {
        aipProgress: {
          implemented: allAIPItems.filter(item => item.status === "approved" || item.status === "in_progress" || item.status === "completed").length,
          total: allAIPItems.length,
          percentage: allAIPItems.length > 0 
            ? Math.round((allAIPItems.filter(item => item.status === "approved" || item.status === "in_progress" || item.status === "completed").length / allAIPItems.length) * 100) 
            : 0
        },
        budgetUtilization: {
          allocated: budgetItems.reduce((sum, item) => sum + Number(item.amount), 0),
          used: budgetItems.reduce((sum, item) => sum + (Number(item.amount) - Number(item.balance)), 0),
          percentage: budgetItems.reduce((sum, item) => sum + Number(item.amount), 0) > 0
            ? Math.round((budgetItems.reduce((sum, item) => sum + (Number(item.amount) - Number(item.balance)), 0) / budgetItems.reduce((sum, item) => sum + Number(item.amount), 0)) * 100)
            : 0
        },
        pendingVouchers: {
          count: pendingVouchers.length,
          highPriority: pendingVouchers.filter(v => Number(v.amount) > 100000).length
        }
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard statistics" });
    }
  });

  // Recent AIP items for dashboard
  app.get("/api/dashboard/recent-aip-items", async (req, res) => {
    try {
      const aipItems = await storage.getAIPItems();
      
      // Get most recent 5 items, sorted by creation date
      const recentItems = aipItems
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      res.json(recentItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent AIP items" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
