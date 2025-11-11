import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CancellationReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, category: string) => void;
  itemName?: string;
}

const CANCELLATION_CATEGORIES = [
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "customer_request", label: "Customer Request" },
  { value: "wrong_order", label: "Wrong Order" },
  { value: "preparation_issue", label: "Preparation Issue" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "duplicate_order", label: "Duplicate Order" },
  { value: "other", label: "Other" },
];

export function CancellationReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
}: CancellationReasonDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!category) {
      return;
    }
    const fullReason = reason.trim() 
      ? `${CANCELLATION_CATEGORIES.find(c => c.value === category)?.label}: ${reason}`
      : CANCELLATION_CATEGORIES.find(c => c.value === category)?.label || "";
    
    onConfirm(fullReason, category);
    setCategory("");
    setReason("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCategory("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            {itemName && `Please provide a reason for cancelling "${itemName}"`}
            {!itemName && "Please provide a reason for this cancellation"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Cancellation Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Additional Details (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter any additional details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Keep Order
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!category}
          >
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
