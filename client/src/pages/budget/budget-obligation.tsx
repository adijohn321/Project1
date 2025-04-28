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
import { BudgetItem, BudgetObligation as BudgetObligationType, insertBudgetObligationSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function BudgetObligationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(currentYear);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch budget items for the fiscal year
  const {
    data: budgetItems,
    isLoading: isLoadingBudgetItems,
  } = useQuery<BudgetItem[]>({
    queryKey: [`/api/budget/items?fiscalYear=${selectedFiscalYear}`],
  });

  // Filter budget items by search query
  const filteredBudgetItems = searchQuery && budgetItems
    ? budgetItems.filter(
        (item) =>
          item.accountCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : budgetItems;

  // Fetch obligations for the selected budget item
  const {
    data: budgetObligations,
    isLoading: isLoadingObligations,
    error: obligationsError,
  } = useQuery<BudgetObligationType[]>({
    queryKey: [`/api/budget/obligations?budgetItemId=${selectedBudgetItem}`],
    enabled: !!selectedBudgetItem,
  });

  // Get selected budget item
  const selectedItem = selectedBudgetItem && budgetItems 
    ? budgetItems.find(item => item.id === selectedBudgetItem) 
    : null;

  // Budget Obligation Creation Form
  const obligationForm = useForm<z.infer<typeof insertBudgetObligationSchema>>({
    resolver: zodResolver(insertBudgetObligationSchema),
    defaultValues: {
      budgetItemId: selectedBudgetItem || 0,
      obligationNumber: "",
      payee: "",
      description: "",
      amount: "0",
      obligationDate: new Date().toISOString(),
      status: "pending",
      createdBy: user?.id || 0,
    },
  });

  // Update form values when selected budget item changes
  React.useEffect(() => {
    if (selectedBudgetItem) {
      obligationForm.setValue("budgetItemId", selectedBudgetItem);
    }
  }, [selectedBudgetItem, obligationForm]);

  // Mutation for creating a new budget obligation
  const createObligationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBudgetObligationSchema>) => {
      const res = await apiRequest("POST", "/api/budget/obligation", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Obligation Created",
        description: "The budget obligation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/obligations?budgetItemId=${selectedBudgetItem}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/items?fiscalYear=${selectedFiscalYear}`] });
      obligationForm.reset({
        budgetItemId: selectedBudgetItem || 0,
        obligationNumber: "",
        payee: "",
        description: "",
        amount: "0",
        obligationDate: new Date().toISOString(),
        status: "pending",
        createdBy: user?.id || 0,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create obligation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle obligation form submission
  const onSubmitObligation = (data: z.infer<typeof insertBudgetObligationSchema>) => {
    // Format the date properly
    const formattedData = {
      ...data,
      obligationDate: new Date(data.obligationDate).toISOString(),
    };
    createObligationMutation.mutate(formattedData);
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Budget Obligation</h2>
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
          {/* Budget Item Selection */}
          <div className="col-span-1 md:col-span-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Budget Items</h3>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search budget items..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoadingBudgetItems ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !filteredBudgetItems || filteredBudgetItems.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md">
                    <p className="text-neutral-500">No budget items found</p>
                    <p className="text-neutral-400 text-sm mt-1">Create budget items in the Budget Preparation module first</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredBudgetItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedBudgetItem === item.id
                            ? "border-primary bg-blue-50"
                            : "border-neutral-200 hover:border-primary"
                        }`}
                        onClick={() => setSelectedBudgetItem(item.id)}
                      >
                        <h4 className="font-medium">{item.accountCode}</h4>
                        <p className="text-sm text-neutral-500 truncate">{item.description}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-neutral-400">Total: ₱{Number(item.amount).toLocaleString()}</span>
                          <span className="text-xs text-neutral-400">Balance: ₱{Number(item.balance).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Obligations */}
          <div className="col-span-1 md:col-span-8">
            {!selectedBudgetItem ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed p-8 flex flex-col items-center justify-center h-full">
                <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600 mb-2">No Budget Item Selected</h3>
                <p className="text-neutral-500 text-center mb-4">
                  Select a budget item from the list to view or create obligations
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{selectedItem?.accountCode}</h3>
                      <p className="text-sm text-neutral-500">
                        Balance: ₱{Number(selectedItem?.balance).toLocaleString()} | Total: ₱{Number(selectedItem?.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">{selectedItem?.description}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
                          disabled={Number(selectedItem?.balance) <= 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Obligation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create Obligation</DialogTitle>
                        </DialogHeader>
                        <Form {...obligationForm}>
                          <form onSubmit={obligationForm.handleSubmit(onSubmitObligation)} className="space-y-4">
                            <FormField
                              control={obligationForm.control}
                              name="obligationNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Obligation Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter obligation number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={obligationForm.control}
                              name="payee"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payee</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter payee name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={obligationForm.control}
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
                              control={obligationForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount (₱)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={selectedItem?.balance?.toString() || "0"}
                                      step="0.01"
                                      placeholder="Enter amount"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-xs text-neutral-500">
                                    Available balance: ₱{Number(selectedItem?.balance).toLocaleString()}
                                  </p>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={obligationForm.control}
                              name="obligationDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Obligation Date</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '');
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
                                disabled={createObligationMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                {createObligationMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Create Obligation
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isLoadingObligations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : obligationsError ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500">Error loading obligations</p>
                    </div>
                  ) : !budgetObligations || budgetObligations.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-neutral-500">No obligations found for this budget item</p>
                      <p className="text-neutral-400 text-sm mt-1">Create an obligation to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-neutral-50 text-left">
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Obligation #
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Payee
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Date
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
                          {budgetObligations.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                                {item.obligationNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">{item.payee}</td>
                              <td className="px-4 py-3 text-sm text-neutral-500">
                                ₱{Number(item.amount).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">
                                {new Date(item.obligationDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.status === "approved"
                                      ? "bg-green-100 text-emerald-800"
                                      : item.status === "processed"
                                      ? "bg-blue-100 text-primary"
                                      : item.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
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
                                    {item.status === "pending" && (
                                      <>
                                        <DropdownMenuItem>Approve</DropdownMenuItem>
                                        <DropdownMenuItem>Cancel</DropdownMenuItem>
                                      </>
                                    )}
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
