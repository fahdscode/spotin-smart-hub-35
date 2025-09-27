import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Users } from 'lucide-react';

const CheckInTestHelper = () => {
  const testBarcodes = [
    { barcode: 'JK48F2', name: 'Norhan khalifa', status: 'checked_out' },
    { barcode: 'JANFPR', name: 'Bakr TresG', status: 'checked_out' },
    { barcode: '5EZ56N', name: 'zilteport zilte', status: 'checked_out' },
    { barcode: 'AH2025X', name: 'Ahmed Hassan', status: 'checked_in' },
    { barcode: 'AH2025', name: 'Ahmed Hassan', status: 'checked_in' },
    { barcode: 'ABC123', name: 'John Smith', status: 'checked_in' },
    { barcode: 'GHI789', name: 'Mike Wilson', status: 'checked_in' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Check-In System Test Helper
        </CardTitle>
        <CardDescription>
          Test barcodes from the database. Click to copy and paste into the scanner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {testBarcodes.map((client) => (
            <div key={client.barcode} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {client.status === 'checked_in' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Barcode: <code className="bg-muted px-1 rounded">{client.barcode}</code>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={client.status === 'checked_in' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {client.status === 'checked_in' ? 'CHECKED IN' : 'CHECKED OUT'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(client.barcode)}
                >
                  Copy
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Test Instructions:</strong>
            <br />1. Click "Copy" on any barcode above
            <br />2. Open the Check-In Scanner
            <br />3. Paste the barcode and press Enter
            <br />4. The system should toggle the client's check-in status
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckInTestHelper;