import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ExportCenter() {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [fileFormat, setFileFormat] = useState('csv');

  const reportTypes = [
    {
      value: 'recovery-payout',
      label: 'Recovery & Payout History',
      description: 'Master report for all financial reconciliation'
    },
    {
      value: 'fee-dispute',
      label: 'Fee Dispute History',
      description: 'Value recovered from fee overcharges'
    },
    {
      value: 'evidence-locker',
      label: 'Evidence Locker Log',
      description: 'Inventory of all uploaded documents'
    }
  ];

  const datePresets = [
    {
      label: 'Last 30 Days',
      value: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);
        return { from, to };
      }
    },
    {
      label: 'Last Quarter',
      value: () => {
        const to = new Date();
        const from = new Date();
        from.setMonth(from.getMonth() - 3);
        return { from, to };
      }
    },
    {
      label: 'Year-to-Date',
      value: () => {
        const to = new Date();
        const from = new Date(to.getFullYear(), 0, 1);
        return { from, to };
      }
    }
  ];

  const handlePresetSelect = (preset: any) => {
    setDateRange(preset.value());
  };

  const handleGenerate = () => {
    if (!reportType || !dateRange.from || !dateRange.to) {
      return;
    }
    
    // Mock file download logic
    console.log('Generating report:', {
      reportType,
      dateRange,
      fileFormat
    });
    
    // In a real implementation, this would trigger the actual download
    const filename = `${reportType}-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.${fileFormat}`;
    console.log('Download would start for:', filename);
  };

  const isFormValid = reportType && dateRange.from && dateRange.to && fileFormat;

  return (
    <PageLayout title="Export Your Clario Data">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Export Your Clario Data</h1>
          <p className="text-muted-foreground">
            This is your data. Export it in the format you need, whenever you need it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Follow the three simple steps below to export your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Step 1: Select Report Type */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Step 1: Select Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a report to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step 2: Select Date Range */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Step 2: Select Date Range</Label>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Step 3: Select File Format */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Step 3: Select File Format</Label>
              <RadioGroup value={fileFormat} onValueChange={setFileFormat}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="font-normal">
                    CSV - For use in Excel, Google Sheets, or other spreadsheet applications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="font-normal">
                    PDF - Clean, printable reports for sharing or record-keeping
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={handleGenerate}
                disabled={!isFormValid}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate & Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Details */}
        {reportType && (
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              {reportType === 'recovery-payout' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recovery & Payout History</h4>
                  <p className="text-sm text-muted-foreground">
                    This master report includes: Case ID, Status, Detection Date, Submission Date, 
                    Guarantee Date, Payout Date, Product SKU, Product Name, Discrepancy Type, 
                    Guaranteed Amount, Opside Fee, Net Payout Amount, and Amazon Case ID.
                  </p>
                </div>
              )}
              
              {reportType === 'fee-dispute' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Fee Dispute History</h4>
                  <p className="text-sm text-muted-foreground">
                    This report focuses on fee overcharge recoveries and includes: Dispute ID, 
                    Status, Detection Date, Product SKU, Dispute Type, and Amount Recovered.
                  </p>
                </div>
              )}
              
              {reportType === 'evidence-locker' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Evidence Locker Log</h4>
                  <p className="text-sm text-muted-foreground">
                    This document inventory includes: Document Name, File Type, Upload Date, 
                    Processing Status, and Linked SKUs Count.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}