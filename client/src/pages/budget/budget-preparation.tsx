import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Search,
  AlertCircle,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AnnualInvestmentPlan, AIPItem, BudgetItem, insertBudgetItemSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function BudgetPreparation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(currentYear);
  const [selectedAIPItem, setSelectedAIPItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch AIPs for the selected fiscal year
  const {
    data: aips,
    isLoading: isLoadingAIPs,
  } = useQuery<AnnualInvestmentPlan[]>({
    queryKey: [`/api/planning/aip?fiscalYear=${selectedFiscalYear}`],
  });

  // Create derived state for all AIP items from all AIPs
  const [allAIPItems, setAllAIPItems] = useState<AIPItem[]>([]);

  // Fetch all AIP items from all AIPs for the fiscal year
  const fetchAllAIPItems = async () => {
    if (!aips) return;

    let items: AIPItem[] = [];
    for (const aip of aips) {
      const { data } = await queryClient.fetchQuery({
        queryKey: [`/api/planning/aip/${aip.id}/items`],
      });
      if (data) {
        items = [...items, ...data];
      }
    }
    setAllAIPItems(items);
  };

  // Fetch AIP items when AIPs change
  React.useEffect(() => {
    fetchAllAIPItems();
  }, [aips]);

  // Filter AIP items by search query
  const filteredAIPItems = searchQuery
    ? allAIPItems.filter(
      (item) =>
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allAIPItems;

  // Fetch budget items for the selected AIP item
  const {
    data: budgetItems,
    isLoading: isLoadingBudgetItems,
    error: budgetItemsError,
  } = useQuery<BudgetItem[]>({
    queryKey: [`/api/budget/items?aipItemId=${selectedAIPItem}`],
    enabled: !!selectedAIPItem,
  });

  // Get selected AIP item
  const selectedItem = selectedAIPItem ? allAIPItems.find(item => item.id === selectedAIPItem) : null;

  // Budget Item Creation Form
  const budgetItemForm = useForm<z.infer<typeof insertBudgetItemSchema>>({
    resolver: zodResolver(insertBudgetItemSchema),
    defaultValues: {
      aipItemId: selectedAIPItem || 0,
      fiscalYear: selectedFiscalYear,
      accountCode: "",
      description: "",
      amount: "0",
      balance: "0",
      status: "active",
      createdBy: user?.id || 0,
    },
  });

  // Update form values when selected AIP item changes
  React.useEffect(() => {
    if (selectedAIPItem) {
      budgetItemForm.setValue("aipItemId", selectedAIPItem);
    }
  }, [selectedAIPItem, budgetItemForm]);

  // Mutation for creating a new budget item
  const createBudgetItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBudgetItemSchema>) => {
      const res = await apiRequest("POST", "/api/budget/item", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget Item Created",
        description: "The budget item has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/items?aipItemId=${selectedAIPItem}`] });
      budgetItemForm.reset({
        aipItemId: selectedAIPItem || 0,
        fiscalYear: selectedFiscalYear,
        accountCode: "",
        description: "",
        amount: "0",
        balance: "0",
        status: "active",
        createdBy: user?.id || 0,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create budget item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle budget item form submission
  const onSubmitBudgetItem = (data: z.infer<typeof insertBudgetItemSchema>) => {
    createBudgetItemMutation.mutate(data);
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Budget Preparation</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <select
                className="rounded-md border border-neutral-300 text-sm p-2 pr-8 bg-white"
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(parseInt(e.target.value))}
              >
                <option value={currentYear + 1}>Fiscal Year {currentYear + 1}</option>
                <option value={currentYear}>Fiscal Year {currentYear}</option>
                <option value={currentYear - 1}>Fiscal Year {currentYear - 1}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AIP Item Selection */}
          <div className="col-span-1 md:col-span-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">AIP Projects</h3>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoadingAIPs ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !filteredAIPItems || filteredAIPItems.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md">
                    <p className="text-neutral-500">No projects found</p>
                    <p className="text-neutral-400 text-sm mt-1">Create projects in the Planning module first</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredAIPItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-md cursor-pointer border ${selectedAIPItem === item.id
                            ? "border-primary bg-blue-50"
                            : "border-neutral-200 hover:border-primary"
                          }`}
                        onClick={() => setSelectedAIPItem(item.id)}
                      >
                        <h4 className="font-medium">{item.projectName}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-neutral-500">{item.sector}</span>
                          <span className="text-sm text-neutral-500">₱{Number(item.budget).toLocaleString()}</span>
                        </div>
                        {item.location && (
                          <p className="text-xs text-neutral-400 mt-1">Location: {item.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Budget Items */}
          <div className="col-span-1 md:col-span-8">
            {!selectedAIPItem ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed p-8 flex flex-col items-center justify-center h-full">
                <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600 mb-2">No Project Selected</h3>
                <p className="text-neutral-500 text-center mb-4">
                  Select a project from the list to view or create budget items
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{selectedItem?.projectName}</h3>
                      <p className="text-sm text-neutral-500">
                        Budget: ₱{Number(selectedItem?.budget).toLocaleString()} | Sector: {selectedItem?.sector}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Budget Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add Budget Item</DialogTitle>
                        </DialogHeader>
                        <Form {...budgetItemForm}>
                          <form onSubmit={budgetItemForm.handleSubmit(onSubmitBudgetItem)} className="space-y-4">
                            <FormField
                              control={budgetItemForm.control}
                              name="accountCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter account code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={budgetItemForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Enter description" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={budgetItemForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount (₱)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Enter amount"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        // Also update balance field to match amount
                                        budgetItemForm.setValue("balance", e.target.value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" type="button">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button
                                type="submit"
                                disabled={createBudgetItemMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                {createBudgetItemMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Create Budget Item
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isLoadingBudgetItems ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : budgetItemsError ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500">Error loading budget items</p>
                    </div>
                  ) : !budgetItems || budgetItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-neutral-500">No budget items found for this project</p>
                      <p className="text-neutral-400 text-sm mt-1">Add a budget item to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-neutral-50 text-left">
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Account Code
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {budgetItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                                {item.accountCode}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">{item.description}</td>
                              <td className="px-4 py-3 text-sm text-neutral-500">
                                ₱{Number(item.amount).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">
                                ₱{Number(item.balance).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "active"
                                      ? "bg-green-100 text-emerald-800"
                                      : item.status === "depleted"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Mark as Inactive</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
