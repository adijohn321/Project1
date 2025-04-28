CREATE TABLE "aip_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"aip_id" integer NOT NULL,
	"project_name" text NOT NULL,
	"sector" text NOT NULL,
	"description" text,
	"location" text,
	"budget" numeric NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annual_investment_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"fiscal_year" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_budget" numeric NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"aip_item_id" integer,
	"fiscal_year" integer NOT NULL,
	"account_code" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"balance" numeric NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_obligations" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_item_id" integer NOT NULL,
	"obligation_number" text NOT NULL,
	"payee" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"obligation_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_by" integer,
	"processed_at" timestamp,
	CONSTRAINT "budget_obligations_obligation_number_unique" UNIQUE("obligation_number")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_number" text NOT NULL,
	"collection_date" timestamp NOT NULL,
	"payor" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"collection_type" text NOT NULL,
	"account_code" text NOT NULL,
	"status" text DEFAULT 'recorded' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "disbursements" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" integer NOT NULL,
	"check_number" text NOT NULL,
	"bank_account" text NOT NULL,
	"amount" numeric NOT NULL,
	"disbursement_date" timestamp NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"birth_date" timestamp NOT NULL,
	"gender" text NOT NULL,
	"address" text NOT NULL,
	"contact_number" text NOT NULL,
	"email" text NOT NULL,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"salary" numeric NOT NULL,
	"date_hired" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"obligation_id" integer,
	"entry_number" text NOT NULL,
	"entry_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"posted_by" integer,
	"posted_at" timestamp,
	CONSTRAINT "journal_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "journal_entry_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_code" text NOT NULL,
	"account_title" text NOT NULL,
	"debit" numeric DEFAULT '0',
	"credit" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"basic_pay" numeric NOT NULL,
	"allowances" numeric DEFAULT '0',
	"deductions" numeric DEFAULT '0',
	"net_pay" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_amount" numeric NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"module" text NOT NULL,
	"is_encoder" boolean DEFAULT false NOT NULL,
	"permissions" text[] NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role_id" integer NOT NULL,
	"department" text,
	"position" text,
	"active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"voucher_number" text NOT NULL,
	"payee" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"voucher_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	CONSTRAINT "vouchers_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
ALTER TABLE "aip_items" ADD CONSTRAINT "aip_items_aip_id_annual_investment_plans_id_fk" FOREIGN KEY ("aip_id") REFERENCES "public"."annual_investment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aip_items" ADD CONSTRAINT "aip_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_investment_plans" ADD CONSTRAINT "annual_investment_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_investment_plans" ADD CONSTRAINT "annual_investment_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_aip_item_id_aip_items_id_fk" FOREIGN KEY ("aip_item_id") REFERENCES "public"."aip_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_obligations" ADD CONSTRAINT "budget_obligations_budget_item_id_budget_items_id_fk" FOREIGN KEY ("budget_item_id") REFERENCES "public"."budget_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_obligations" ADD CONSTRAINT "budget_obligations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_obligations" ADD CONSTRAINT "budget_obligations_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_obligation_id_budget_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."budget_obligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;