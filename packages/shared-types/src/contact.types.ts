export type ContactIssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type ContactIssuePriority = "low" | "medium" | "high" | "urgent";
export type ContactIssueCategory = 
  | "order_issue" 
  | "payment_issue" 
  | "return_exchange" 
  | "product_sizing" 
  | "shipping_delay" 
  | "other";

export interface IContactIssueNote {
  text: string;
  author: string;
  createdAt: Date | string;
}

export interface IContactIssue {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  orderId?: string;
  userId?: string;
  category: ContactIssueCategory;
  subject: string;
  message: string;
  status: ContactIssueStatus;
  priority: ContactIssuePriority;
  assignedTo?: string;
  notes?: IContactIssueNote[];
  resolvedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IContactIssueStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}
