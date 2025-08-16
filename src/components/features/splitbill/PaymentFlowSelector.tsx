import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap } from "lucide-react";

type PaymentFlow = "split" | "i-pay-all" | "they-pay-all";

interface PaymentFlowSelectorProps {
  paymentFlow: PaymentFlow;
  onPaymentFlowChange: (flow: PaymentFlow) => void;
}

export const PaymentFlowSelector = ({
  paymentFlow,
  onPaymentFlowChange,
}: PaymentFlowSelectorProps) => {
  const flowOptions = [
    { id: "split", label: "Everyone pays their share", icon: Users },
    { id: "i-pay-all", label: "I pay everything", icon: Zap },
    { id: "they-pay-all", label: "Others pay everything", icon: Users },
  ] as const;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Payment Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {flowOptions.map((flow) => {
            const Icon = flow.icon;
            return (
              <Button
                key={flow.id}
                variant={paymentFlow === flow.id ? "gradient" : "outline"}
                className="justify-start h-auto p-3"
                onClick={() => onPaymentFlowChange(flow.id as PaymentFlow)}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span className="text-sm">{flow.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
