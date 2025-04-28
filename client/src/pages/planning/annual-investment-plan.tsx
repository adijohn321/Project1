import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, FileEdit, ChevronDown, X, Check, AlertCircle } from "lucide-react";
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
import { AnnualInvestmentPlan as AIPType, AIPItem, insertAIPSchema, insertAIPItemSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function AnnualInvestmentPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(new Date().getFullYear());
  const [selectedAIP, setSelectedAIP] = useState<number | null>(null);

  // Fetch AIPs for the selected fiscal year
  const {
    data: aips,
    isLoading: isLoadingAIPs,
    error: aipsError,
  } = useQuery<AIPType[]>({
    queryKey: [`/api/planning/aip?fiscalYear=${selectedFiscalYear}`],
  });

  // Fetch AIP items if an AIP is selected
  const {
    data: aipItems,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery<AIPItem[]>({
    queryKey: [`/api/planning/aip/${selectedAIP}/items`],
    enabled: !!selectedAIP,
  });

  // AIP Creation Form
  const aipForm = useForm<z.infer<typeof insertAIPSchema>>({
    resolver: zodResolver(insertAIPSchema),
    defaultValues: {
      fiscalYear: selectedFiscalYear,
      title: "",
      description: "",
      status: "draft",
      totalBudget: "0",
      createdBy: user?.id || 0,
    },
  });

  // AIP Item Creation Form
  const aipItemForm = useForm<z.infer<typeof insertAIPItemSchema>>({
    resolver: zodResolver(insertAIPItemSchema),
    defaultValues: {
      aipId: selectedAIP || 0,
      projectName: "",
      sector: "",
      description: "",
      location: "",
      budget: "0",
      status: "draft",
      createdBy: user?.id || 0,
    },
  });

  // Mutation for creating a new AIP
  const createAIPMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertAIPSchema>) => {
      const res = await apiRequest("POST", "/api/planning/aip", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "AIP Created",
        description: "The Annual Investment Plan has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/planning/aip?fiscalYear=${selectedFiscalYear}`] });
      aipForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create AIP: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a new AIP Item
  const createAIPItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertAIPItemSchema>) => {
      const res = await apiRequest("POST", "/api/planning/aip-item", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Added",
        description: "The project has been added to the AIP successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/planning/aip/${selectedAIP}/items`] });
      aipItemForm.reset({
        aipId: selectedAIP || 0,
        projectName: "",
        sector: "",
        description: "",
        location: "",
        budget: "0",
        status: "draft",
        createdBy: user?.id || 0,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle AIP form submission
  const onSubmitAIP = (data: z.infer<typeof insertAIPSchema>) => {
    createAIPMutation.mutate(data);
  };

  // Handle AIP Item form submission
  const onSubmitAIPItem = (data: z.infer<typeof insertAIPItemSchema>) => {
    createAIPItemMutation.mutate({
      ...data,
      aipId: selectedAIP || 0,
    });
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Annual Investment Plan</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <select
                className="rounded-md border border-neutral-300 text-sm p-2 pr-8 bg-white"
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(parseInt(e.target.value))}
              >
                <option value={new Date().getFullYear() + 1}>Fiscal Year {new Date().getFullYear() + 1}</option>
                <option value={new Date().getFullYear()}>Fiscal Year {new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>Fiscal Year {new Date().getFullYear() - 1}</option>
              </select>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  New AIP
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Annual Investment Plan</DialogTitle>
                </DialogHeader>
                <Form {...aipForm}>
                  <form onSubmit={aipForm.handleSubmit(onSubmitAIP)} className="space-y-4">
                    <FormField
                      control={aipForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter AIP title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aipForm.control}
                      name="fiscalYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            >
                              <option value={new Date().getFullYear() + 1}>
                                {new Date().getFullYear() + 1}
                              </option>
                              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                              <option value={new Date().getFullYear() - 1}>
                                {new Date().getFullYear() - 1}
                              </option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aipForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the AIP objectives" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aipForm.control}
                      name="totalBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Budget (₱)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter total budget"
                              {...field}
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
                        disabled={createAIPMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {createAIPMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create AIP
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AIP List and Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* AIP List */}
          <div className="col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">AIPs for FY {selectedFiscalYear}</h3>

                {isLoadingAIPs ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : aipsError ? (
                  <div className="p-4 text-center">
                    <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">Error loading AIPs</p>
                  </div>
                ) : !aips || aips.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md">
                    <p className="text-neutral-500">No AIPs found for this fiscal year</p>
                    <p className="text-neutral-400 text-sm mt-1">Create a new AIP to get started</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {aips.map((aip) => (
                      <li
                        key={aip.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedAIP === aip.id
                            ? "border-primary bg-blue-50"
                            : "border-neutral-200 hover:border-primary"
                        }`}
                        onClick={() => setSelectedAIP(aip.id)}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{aip.title}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              aip.status === "approved"
                                ? "bg-green-100 text-emerald-800"
                                : aip.status === "submitted"
                                ? "bg-blue-100 text-primary"
                                : aip.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {aip.status.charAt(0).toUpperCase() + aip.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">Budget: ₱{Number(aip.totalBudget).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AIP Details & Items */}
          <div className="col-span-1 md:col-span-3">
            {!selectedAIP ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed p-8 flex flex-col items-center justify-center h-full">
                <FileEdit className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600 mb-2">No AIP Selected</h3>
                <p className="text-neutral-500 text-center mb-4">Select an AIP from the list or create a new one</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Create New AIP
                    </Button>
                  </DialogTrigger>
                  {/* Dialog content same as the one above */}
                </Dialog>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium">AIP Projects</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add New Project</DialogTitle>
                        </DialogHeader>
                        <Form {...aipItemForm}>
                          <form onSubmit={aipItemForm.handleSubmit(onSubmitAIPItem)} className="space-y-4">
                            <FormField
                              control={aipItemForm.control}
                              name="projectName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter project name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={aipItemForm.control}
                              name="sector"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sector</FormLabel>
                                  <FormControl>
                                    <select
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      {...field}
                                    >
                                      <option value="">Select a sector</option>
                                      <option value="infrastructure">Infrastructure</option>
                                      <option value="health">Health</option>
                                      <option value="education">Education</option>
                                      <option value="agriculture">Agriculture</option>
                                      <option value="social_services">Social Services</option>
                                      <option value="environmental">Environmental</option>
                                      <option value="tourism">Tourism</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={aipItemForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter project location" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={aipItemForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Describe the project" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={aipItemForm.control}
                              name="budget"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Budget (₱)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Enter project budget"
                                      {...field}
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
                                disabled={createAIPItemMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                {createAIPItemMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Add Project
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isLoadingItems ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : itemsError ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500">Error loading projects</p>
                    </div>
                  ) : !aipItems || aipItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-neutral-500">No projects found for this AIP</p>
                      <p className="text-neutral-400 text-sm mt-1">Add a project to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-neutral-50 text-left">
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Project Name
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Sector
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              Budget
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
                          {aipItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-neutral-600">{item.projectName}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">{item.sector}</td>
                              <td className="px-4 py-3 text-sm text-neutral-500">{item.location}</td>
                              <td className="px-4 py-3 text-sm text-neutral-500">
                                ₱{Number(item.budget).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.status === "approved"
                                      ? "bg-green-100 text-emerald-800"
                                      : item.status === "in_progress"
                                      ? "bg-blue-100 text-primary"
                                      : item.status === "completed"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ")}
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
                                    <DropdownMenuItem>
                                      <FileEdit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
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
