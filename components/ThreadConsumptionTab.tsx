
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Calculator, Database, FilePlus, ChevronRight, ChevronLeft, CheckCircle, Shirt, ListChecks, FileText, Calendar, Edit, BarChart, PieChart, Search, Layout as LayoutIcon, Table as TableIcon, Printer as PrinterIcon, X as XIcon } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { ThreadConsumption, ThreadConsumptionRow, SystemConfig } from '../types';
import { apiService } from '../services/apiService';
import SearchableSelect from './SearchableSelect';

const ThreadConsumptionTab: React.FC = () => {
  const [view, setView] = useState<'ENTRY' | 'DATABASE'>('ENTRY');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [calcType, setCalcType] = useState<'SHORT' | 'PROCESS'>('SHORT');
  const [savedRecords, setSavedRecords] = useState<ThreadConsumption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ buyers: [], productCategories: [], threadRatios: [], threadCounts: [], coneSizes: [], wastageData: [], sdlWastage: [] } as any);
  const [isManagingCounts, setIsManagingCounts] = useState(false);
  const [isManagingSizes, setIsManagingSizes] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sewingCostings, setSewingCostings] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<Partial<ThreadConsumption>>(() => {
    const saved = localStorage.getItem('thread_consumption_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved draft:", e);
      }
    }
    return {
      type: 'SHORT',
      styleNumber: '',
      styleCode: '',
      buyer: '',
      productCategory: '',
      productType: '',
      color: '',
      date: new Date().toISOString().split('T')[0],
      allowancePercent: 15,
      orderQuantity: 0,
      coneSizeMeters: 4000,
      threadSpecs: [{ count: '', shade: '', coneSize: '' }],
      operations: [],
    };
  });

  // Persist draft to localStorage
  useEffect(() => {
    localStorage.setItem('thread_consumption_draft', JSON.stringify(formData));
  }, [formData]);

  const getDemoRows = (): ThreadConsumptionRow[] => {
    const commonRows: Omit<ThreadConsumptionRow, 'id' | 'threadMeters'>[] = [
      { operation: 'Back Pocket Join', stitchType: 'Lock stitch', count: '20/2', shade: 'S-101', pos1Name: 'Needle', pos1Factor: 1.6, pos2Name: 'Bobbin', pos2Factor: 1.3, seamLengthCm: 45 },
      { operation: 'Side Seam', stitchType: '5T Overlock', count: '40/2', shade: 'S-102', pos1Name: '1 Chain Needle', pos1Factor: 2.24, pos2Name: '1 Chain Looper', pos2Factor: 3.94, seamLengthCm: 110 },
      { operation: 'Waistband', stitchType: 'Chain Stitch', count: '20/2', shade: 'S-101', pos1Name: 'Needle', pos1Factor: 2.8, pos2Name: 'Looper', pos2Factor: 3.45, seamLengthCm: 90 },
    ];

    return commonRows.map(r => ({
      ...r,
      id: Math.random().toString(36).substring(7),
      threadMeters: (r.seamLengthCm * (r.pos1Factor + r.pos2Factor)) / 100
    }));
  };

  const styleOptions = useMemo(() => {
    if (!formData.buyer) return [];
    
    // Filter costings by buyer and get unique style numbers
    const filtered = sewingCostings.filter(c => c.buyer === formData.buyer);
    const uniqueStyles = Array.from(new Set(filtered.map(c => c.styleNumber)));
    
    return uniqueStyles.map(s => ({ id: s, name: s }));
  }, [formData.buyer, sewingCostings]);

  const buyerOptions = useMemo(() => 
    (systemConfig.buyers || []).map(b => ({ id: b, name: b })), 
    [systemConfig.buyers]
  );

  const productTypeOptions = useMemo(() => 
    (systemConfig.productCategories || []).map(p => ({ id: p, name: p })), 
    [systemConfig.productCategories]
  );

  const stitchTypeOptions = useMemo(() => {
    const types = Array.from(new Set(systemConfig.threadRatios?.map(tr => tr.stitchType) || []));
    return types.map(t => ({ id: t, name: t }));
  }, [systemConfig.threadRatios]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [config, records, costings] = await Promise.all([
          apiService.getRemoteConfig(),
          apiService.getThreadConsumption(),
          apiService.getSewingCosting()
        ]);
        setSystemConfig(config);
        setSavedRecords(records);
        setSewingCostings(costings);
      } catch (error) {
        console.error("Failed to load thread consumption data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [view]);

  // Update allowance based on sewing wastage when buyer changes
  useEffect(() => {
    if (formData.buyer && systemConfig.wastageData) {
      const sewingWastage = systemConfig.wastageData.find(w => w.name === 'Sewing')?.value || 15;
      setFormData(prev => ({ ...prev, allowancePercent: sewingWastage }));
    }
  }, [formData.buyer, systemConfig.wastageData]);

  // Update allowance based on SDL Wastage when order quantity changes
  useEffect(() => {
    if (formData.orderQuantity && systemConfig.sdlWastage) {
      const qty = formData.orderQuantity;
      const sdlMatch = systemConfig.sdlWastage.find(w => qty >= w.minQty && qty <= w.maxQty);
      if (sdlMatch) {
        setFormData(prev => ({ ...prev, allowancePercent: sdlMatch.allowance }));
      }
    }
  }, [formData.orderQuantity, systemConfig.sdlWastage]);

  // Auto-sync with Sewing Costing for Process Calculation
  useEffect(() => {
    if (calcType === 'PROCESS' && formData.buyer && formData.styleNumber) {
      const costing = sewingCostings.find(c => c.buyer === formData.buyer && c.styleNumber === formData.styleNumber);
      if (costing && costing.operations && costing.operations.length > 0) {
        // Only auto-load if operations are empty or we explicitly want to sync
        if (formData.operations?.length === 0) {
          const newOperations: ThreadConsumptionRow[] = costing.operations.map((op: any) => {
            const row: ThreadConsumptionRow = {
              id: Math.random().toString(36).substr(2, 9),
              operation: op.name,
              stitchType: op.machineType || '',
              count: formData.threadSpecs?.[0]?.count || '',
              shade: formData.threadSpecs?.[0]?.shade || '',
              pos1Name: '',
              pos1Factor: 0,
              pos2Name: '',
              pos2Factor: 0,
              seamLengthCm: 0,
              threadMeters: 0
            };

            // Auto-fetch ratios
            const currentBuyer = (formData.buyer || '').toLowerCase();
            const currentStitchType = (row.stitchType || '').toLowerCase();
            
            let ratioObj = systemConfig.threadRatios?.find(tr => 
              (tr.buyer || '').toLowerCase() === currentBuyer && 
              (tr.stitchType || '').toLowerCase() === currentStitchType
            );
            
            if (!ratioObj) {
              ratioObj = systemConfig.threadRatios?.find(tr => 
                (!tr.buyer || tr.buyer === '') && 
                (tr.stitchType || '').toLowerCase() === currentStitchType
              );
            }
            
            if (ratioObj) {
              row.pos1Name = ratioObj.pos1Name;
              row.pos1Factor = ratioObj.pos1Ratio;
              row.pos2Name = ratioObj.pos2Name;
              row.pos2Factor = ratioObj.pos2Ratio;
            }

            return row;
          });
          setFormData(prev => ({ ...prev, operations: newOperations }));
          setMessage("Operations synchronized from Sewing Costing.");
          setTimeout(() => setMessage(null), 3000);
        }
      }
    }
  }, [calcType, formData.buyer, formData.styleNumber, systemConfig.threadRatios, sewingCostings]);

  const addThreadSpec = () => {
    setFormData(prev => ({
      ...prev,
      threadSpecs: [...(prev.threadSpecs || []), { count: '', shade: '', coneSize: '' }]
    }));
  };

  const handleAddOption = async (type: 'COUNT' | 'SIZE') => {
    if (!newOptionValue.trim()) return;
    
    const currentOptions = type === 'COUNT' ? [...(systemConfig.threadCounts || [])] : [...(systemConfig.coneSizes || [])];
    
    if (editingOptionIndex !== null) {
      currentOptions[editingOptionIndex] = newOptionValue.trim();
    } else {
      if (currentOptions.includes(newOptionValue.trim())) {
        alert("Option already exists");
        return;
      }
      currentOptions.push(newOptionValue.trim());
    }
    
    const updatedConfig = { ...systemConfig };
    if (type === 'COUNT') {
      updatedConfig.threadCounts = currentOptions;
    } else {
      updatedConfig.coneSizes = currentOptions;
    }
    
    try {
      await apiService.saveRemoteConfig(updatedConfig);
      setSystemConfig(updatedConfig);
      setNewOptionValue('');
      setEditingOptionIndex(null);
    } catch (error) {
      alert("Failed to update config");
    }
  };

  const handleDeleteOption = async (type: 'COUNT' | 'SIZE', index: number) => {
    const currentOptions = type === 'COUNT' ? [...(systemConfig.threadCounts || [])] : [...(systemConfig.coneSizes || [])];
    currentOptions.splice(index, 1);
    
    const updatedConfig = { ...systemConfig };
    if (type === 'COUNT') {
      updatedConfig.threadCounts = currentOptions;
    } else {
      updatedConfig.coneSizes = currentOptions;
    }
    
    try {
      await apiService.saveRemoteConfig(updatedConfig);
      setSystemConfig(updatedConfig);
    } catch (error) {
      alert("Failed to update config");
    }
  };

  const removeThreadSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      threadSpecs: prev.threadSpecs?.filter((_, i) => i !== index)
    }));
  };

  const updateThreadSpec = (index: number, updates: Partial<{ count: string; shade: string; coneSize: string }>) => {
    setFormData(prev => {
      const newSpecs = prev.threadSpecs?.map((spec, i) => i === index ? { ...spec, ...updates } : spec) || [];
      
      // If updating the first entry, auto-populate others if they are empty
      if (index === 0) {
        const firstSpec = newSpecs[0];
        return {
          ...prev,
          threadSpecs: newSpecs.map((spec, i) => {
            if (i > 0) {
              return {
                ...spec,
                count: spec.count === '' ? firstSpec.count : spec.count,
                shade: spec.shade === '' ? firstSpec.shade : spec.shade,
                coneSize: spec.coneSize === '' ? firstSpec.coneSize : spec.coneSize,
              };
            }
            return spec;
          })
        };
      }
      
      return {
        ...prev,
        threadSpecs: newSpecs
      };
    });
  };

  const addRow = () => {
    const newRow: ThreadConsumptionRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      operation: '',
      stitchType: '',
      count: formData.threadSpecs?.[0]?.count || '',
      shade: formData.threadSpecs?.[0]?.shade || '',
      pos1Name: '',
      pos1Factor: 0,
      pos2Name: '',
      pos2Factor: 0,
      seamLengthCm: 0,
      threadMeters: 0
    };
    setFormData(prev => ({
      ...prev,
      operations: [...(prev.operations || []), newRow]
    }));
  };

  const removeRow = (id: string) => {
    setFormData(prev => ({
      ...prev,
      operations: prev.operations?.filter(r => r.id !== id)
    }));
  };

  const updateRow = (id: string, updates: Partial<ThreadConsumptionRow>) => {
    setFormData(prev => ({
      ...prev,
      operations: prev.operations?.map(r => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          
          // If stitchType changed, update factors from systemConfig based on buyer
          if (updates.stitchType && systemConfig.threadRatios) {
            const currentBuyer = (formData.buyer || '').toLowerCase();
            const currentStitchType = (updated.stitchType || '').toLowerCase();

            // Try to find buyer-specific ratio first
            let ratioObj = systemConfig.threadRatios.find(tr => 
              (tr.buyer || '').toLowerCase() === currentBuyer && 
              (tr.stitchType || '').toLowerCase() === currentStitchType
            );

            // Fallback to stitch type-wise data if buyer match not found
            if (!ratioObj) {
              ratioObj = systemConfig.threadRatios.find(tr => 
                (!tr.buyer || tr.buyer === '') && 
                (tr.stitchType || '').toLowerCase() === currentStitchType
              );
            }

            if (ratioObj) {
              updated.pos1Name = ratioObj.pos1Name || '';
              updated.pos1Factor = Number(ratioObj.pos1Ratio) || 0;
              updated.pos2Name = ratioObj.pos2Name || '';
              updated.pos2Factor = Number(ratioObj.pos2Ratio) || 0;
            } else {
              updated.pos1Name = '';
              updated.pos1Factor = 0;
              updated.pos2Name = '';
              updated.pos2Factor = 0;
            }
          }

          updated.threadMeters = ((Number(updated.seamLengthCm) || 0) * ((Number(updated.pos1Factor) || 0) + (Number(updated.pos2Factor) || 0))) / 100;
          return updated;
        }
        return r;
      })
    }));
  };

  const [showRationMatrix, setShowRationMatrix] = useState(false);

  const loadFromLayout = async () => {
    if (!formData.styleNumber) {
      setMessage("Please select a style number first.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    try {
      const layouts = await apiService.request('/ie/layout-master'); 
      const layout = layouts.find((l: any) => l.style === formData.styleNumber);
      
      if (!layout) {
        setMessage("No layout found for this style. Please create a layout in IE Lab first.");
        setTimeout(() => setMessage(null), 3000);
        return;
      }

    // Mapping machine types to stitch types if possible
    const machineToStitch: Record<string, string> = {
      'SNLS': 'Lock stitch',
      'DNLS': 'Lock stitch',
      'OL-4T': 'Overlock 4 thread',
      'OL-5T': 'Overlock 5 thread',
      'FOA': 'Chain stitch',
      'KANS': 'Chain stitch',
      'FLS': 'Flat lock',
      'BT': 'Lock stitch',
      'BH': 'Lock stitch'
    };

    const newRows: ThreadConsumptionRow[] = layout.operations.map(op => {
      const stitchType = machineToStitch[op.mcType] || op.mcType;
      const row: ThreadConsumptionRow = {
        id: Math.random().toString(36).substr(2, 9),
        operation: op.operationName,
        stitchType: stitchType,
        count: formData.threadSpecs?.[0]?.count || '',
        shade: formData.threadSpecs?.[0]?.shade || '',
        pos1Name: '',
        pos1Factor: 0,
        pos2Name: '',
        pos2Factor: 0,
        seamLengthCm: 0,
        threadMeters: 0
      };

      // Auto-fetch ratios
      const currentBuyer = (formData.buyer || '').toLowerCase();
      const currentStitchType = stitchType.toLowerCase();
      
      let ratioObj = systemConfig.threadRatios?.find(tr => 
        (tr.buyer || '').toLowerCase() === currentBuyer && 
        (tr.stitchType || '').toLowerCase() === currentStitchType
      );
      
      if (!ratioObj) {
        ratioObj = systemConfig.threadRatios?.find(tr => 
          (!tr.buyer || tr.buyer === '') && 
          (tr.stitchType || '').toLowerCase() === currentStitchType
        );
      }
      
      if (ratioObj) {
        row.pos1Name = ratioObj.pos1Name;
        row.pos1Factor = ratioObj.pos1Ratio;
        row.pos2Name = ratioObj.pos2Name;
        row.pos2Factor = ratioObj.pos2Ratio;
      }

      return row;
    });

    setFormData(prev => ({ ...prev, rows: newRows }));
    setMessage("Operations loaded from layout with matching ratios.");
    setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Failed to load layout:", error);
      setMessage("Error connecting to server.");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalThreadMeters = (formData.operations || []).reduce((sum, r) => sum + (Number(r.threadMeters) || 0), 0);
    
    const summary: Record<string, { count: string; shade: string; net: number }> = {};
    formData.operations?.forEach(row => {
      const key = `${row.count}-${row.shade}`;
      if (!summary[key]) {
        summary[key] = { count: row.count || 'N/A', shade: row.shade || 'N/A', net: 0 };
      }
      summary[key].net += row.threadMeters;
    });
    
    const summaryBySpec = Object.values(summary).map(item => {
      const withWastage = item.net * (1 + (formData.allowancePercent || 0) / 100);
      const totalCones = formData.coneSizeMeters ? withWastage / formData.coneSizeMeters : 0;
      return { 
        ...item, 
        consumptionPerGarment: item.net,
        totalRequiredMeters: withWastage,
        totalCones: totalCones.toFixed(2)
      };
    });

    const summaryHtml = `
      <html>
        <head>
          <title>Sewing Thread Consumption Report - ${formData.styleNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .info-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
            .label { font-size: 10px; font-weight: bold; color: #888; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f9f9f9; text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 10px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; }
            .total-row { background: #f0fdf4; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 10px; color: #aaa; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Thread Consumption Report</h1>
          <div class="grid">
            <div class="info-box">
              <div class="label">Style Number</div>
              <div class="value">${formData.styleNumber}</div>
              <div class="label">Buyer</div>
              <div class="value">${formData.buyer}</div>
            </div>
            <div class="info-box">
              <div class="label">Order Qty</div>
              <div class="value">${formData.orderQuantity || 0}</div>
              <div class="label">Total Thread (Meters)</div>
              <div class="value">${totalThreadMeters.toFixed(2)}</div>
            </div>
          </div>
          <h3>Detailed Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Operation</th>
                <th>Stitch Type</th>
                <th>Count/Shade</th>
                <th>Seam (cm)</th>
                <th>Thread (m)</th>
              </tr>
            </thead>
            <tbody>
              ${formData.operations?.map(row => `
                <tr>
                  <td>${row.operation || 'N/A'}</td>
                  <td>${row.stitchType}</td>
                  <td>${row.count} - ${row.shade}</td>
                  <td>${row.seamLengthCm}</td>
                  <td>${row.threadMeters.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>Summary by Thread Specification</h3>
          <table>
            <thead>
              <tr>
                <th>Count</th>
                <th>Shade</th>
                <th>Consumption/Garment</th>
                <th>Total Required (M)</th>
                <th>Total Cones</th>
              </tr>
            </thead>
            <tbody>
              ${summaryBySpec.map(s => `
                <tr>
                  <td>${s.count}</td>
                  <td>${s.shade}</td>
                  <td>${s.consumptionPerGarment.toFixed(2)} m</td>
                  <td>${s.totalRequiredMeters.toFixed(2)} m</td>
                  <td>${s.totalCones}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">GRAND TOTAL</td>
                <td>${totalThreadMeters.toFixed(2)} m</td>
                <td>${summaryBySpec.reduce((acc, s) => acc + Number(s.totalCones), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Generated on ${new Date().toLocaleString()} | ProTrack ERP System
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(summaryHtml);
    printWindow.document.close();
  };

  const resetToDemo = () => {

    if (calcType === 'PROCESS') {
      const demoRows = getDemoRows();
      setFormData(prev => ({ ...prev, rows: demoRows }));
    } else {
      setFormData(prev => ({ ...prev, rows: [] }));
    }
  };

  const summaryByCountAndShade = useMemo(() => {
    if (!formData.operations || !formData.threadSpecs) return [];
    
    const summary: { [key: string]: { count: string; shade: string; totalMeters: number; withWastage: number; coneSize: number; cones: number } } = {};
    
    formData.operations.forEach(row => {
      const key = `${row.count}-${row.shade}`;
      if (!summary[key]) {
        // Find cone size for this count and shade from threadSpecs
        const spec = formData.threadSpecs?.find(s => s.count === row.count && s.shade === row.shade);
        const coneSizeStr = spec?.coneSize || '0';
        const coneSize = parseFloat(coneSizeStr.replace(/[^0-9.]/g, '')) || 0;

        summary[key] = {
          count: row.count || '',
          shade: row.shade || '',
          totalMeters: 0,
          withWastage: 0,
          coneSize: coneSize,
          cones: 0
        };
      }
      summary[key].totalMeters += Number(row.threadMeters) || 0;
    });

    return Object.values(summary).map(s => {
      const withWastage = s.totalMeters * (1 + (Number(formData.allowancePercent) || 0) / 100);
      const cones = s.coneSize > 0 ? Math.ceil(withWastage / s.coneSize) : 0;
      return { ...s, withWastage, cones };
    });
  }, [formData.operations, formData.threadSpecs, formData.allowancePercent]);

  const totals = useMemo(() => {
    const totalThreadMeters = (formData.operations || []).reduce((sum, r) => sum + (Number(r.threadMeters) || 0), 0);
    const finalThreadMeters = summaryByCountAndShade.reduce((sum, s) => sum + s.withWastage, 0);
    const totalCones = summaryByCountAndShade.reduce((sum, s) => sum + s.cones, 0);

    return { 
      totalThreadMeters: isNaN(totalThreadMeters) ? 0 : totalThreadMeters, 
      finalThreadMeters: isNaN(finalThreadMeters) ? 0 : finalThreadMeters, 
      totalCones: isFinite(totalCones) ? totalCones : 0 
    };
  }, [formData.operations, summaryByCountAndShade]);

  const chartData = useMemo(() => {
    if (!formData.operations) return [];
    
    // Group by stitch type for Short Consumption
    const groupedByStitch = formData.operations.reduce((acc: any, row) => {
      const key = row.stitchType || 'Unknown';
      if (!acc[key]) acc[key] = 0;
      acc[key] += (Number(row.threadMeters) || 0);
      return acc;
    }, {});

    return Object.entries(groupedByStitch)
      .map(([name, value]) => ({
        name,
        value: parseFloat((Number(value) || 0).toFixed(2))
      }))
      .filter(item => !isNaN(item.value) && isFinite(item.value) && item.value > 0);
  }, [formData.operations]);

  const processChartData = useMemo(() => {
    if (!formData.operations || calcType !== 'PROCESS') return [];
    
    // Group by operation for Process Consumption
    const groupedByOp = formData.operations.reduce((acc: any, row) => {
      const key = row.operation || 'Unknown';
      if (!acc[key]) acc[key] = 0;
      acc[key] += (Number(row.threadMeters) || 0);
      return acc;
    }, {});

    return Object.entries(groupedByOp)
      .map(([name, value]) => ({
        name,
        value: parseFloat((Number(value) || 0).toFixed(2))
      }))
      .filter(item => !isNaN(item.value) && isFinite(item.value) && item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [formData.operations, calcType]);

  const handleSave = async () => {
    if (!formData.styleNumber || !formData.buyer) {
      alert("Please fill in Style Number and Buyer");
      setStep(1);
      return;
    }

    const newRecord: ThreadConsumption = {
      ...formData as ThreadConsumption,
      id: formData.id || `TC-${Date.now()}`,
      type: calcType,
      totalThreadMeters: totals.totalThreadMeters,
      finalThreadMeters: totals.finalThreadMeters,
      totalCones: totals.totalCones,
      user: 'Admin'
    };

    try {
      await apiService.saveThreadConsumption(newRecord);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Reset form
      setFormData({
        type: calcType,
        styleNumber: '',
        styleCode: '',
        buyer: '',
        productCategory: '',
        date: new Date().toISOString().split('T')[0],
        allowancePercent: 15,
        orderQuantity: 0,
        coneSizeMeters: 4000,
        threadSpecs: [{ count: '', shade: '', coneSize: '' }],
        operations: [],
      });
      setStep(1);
      const updatedRecords = await apiService.getThreadConsumption();
      setSavedRecords(updatedRecords);
    } catch (error) {
      alert("Failed to save thread consumption");
    }
  };

  const handleTypeSwitch = (type: 'SHORT' | 'PROCESS') => {
    setCalcType(type);
    setFormData(prev => ({ 
      ...prev, 
      type, 
      operations: type === 'PROCESS' ? getDemoRows() : [], 
      orderQuantity: 0 
    }));
  };

  const handleEdit = (record: ThreadConsumption) => {
    setFormData({ ...record });
    setCalcType(record.type);
    setView('ENTRY');
    setStep(1);
  };

  const filteredRecords = useMemo(() => {
    return (savedRecords || []).filter(r => 
      (r.styleNumber || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r.buyer || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r.productType && r.productType.toLowerCase().includes((searchTerm || '').toLowerCase()))
    );
  }, [savedRecords, searchTerm]);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-10">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
              step === s ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 
              step > s ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle size={20} /> : s}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${step === s ? 'text-primary' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Style Info' : s === 2 ? 'Calculation' : 'Summary'}
            </span>
          </div>
          {s < 3 && <div className={`w-20 h-0.5 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-muted'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground uppercase">Sewing Thread Consumption</h2>
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setView('ENTRY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'ENTRY' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FilePlus size={14} /> Entry
          </button>
          <button
            onClick={() => setView('DATABASE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DATABASE' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Database size={14} /> Database
          </button>
        </div>
      </div>

      {view === 'ENTRY' ? (
        <div className="space-y-8 animate-in fade-in">
          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">Success!</p>
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Thread consumption record has been saved to database.</p>
              </div>
            </div>
          )}
          {renderStepIndicator()}

          {/* Step 1: Style Information */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex bg-muted p-1 rounded-xl w-fit">
                <button
                  onClick={() => handleTypeSwitch('SHORT')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${calcType === 'SHORT' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Short Consumption
                </button>
                <button
                  onClick={() => handleTypeSwitch('PROCESS')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${calcType === 'PROCESS' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Process Consumption
                </button>
              </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-card p-10 rounded-[3rem] border border-border shadow-sm">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Buyer</label>
                    <div className="relative h-[48px]">
                      <SearchableSelect 
                        value={formData.buyer || ''}
                        options={buyerOptions}
                        onChange={val => setFormData({ ...formData, buyer: val, styleNumber: '' })}
                        placeholder="Select Buyer..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Style Number</label>
                    <div className="relative h-[48px]">
                      <SearchableSelect 
                        value={formData.styleNumber || ''}
                        options={styleOptions}
                        onChange={val => {
                          const costing = sewingCostings.find(c => c.styleNumber === val && c.buyer === formData.buyer);
                          setFormData({ 
                            ...formData, 
                            styleNumber: val,
                            productType: costing?.productCategory || formData.productType 
                          });
                        }}
                        placeholder="Select Style..."
                        disabled={!formData.buyer}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Product Type</label>
                    <div className="relative h-[48px]">
                      <SearchableSelect 
                        value={formData.productType || ''}
                        options={productTypeOptions}
                        onChange={val => setFormData({ ...formData, productType: val })}
                        placeholder="Select Type..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Color</label>
                    <input 
                      type="text"
                      className="w-full bg-muted border-2 border-transparent focus:border-primary focus:bg-card rounded-2xl px-6 py-3 text-sm font-bold outline-none transition-all text-foreground"
                      placeholder="Enter color..."
                      value={formData.color || ''}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Order Quantity</label>
                    <input 
                      type="number"
                      className="w-full bg-muted border-2 border-transparent focus:border-primary focus:bg-card rounded-2xl px-6 py-3 text-sm font-bold outline-none transition-all text-foreground"
                      placeholder="Enter quantity..."
                      value={formData.orderQuantity || ''}
                      onChange={e => setFormData({ ...formData, orderQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Allowance (%)</label>
                  <input 
                    type="number"
                    className="w-full bg-muted border-2 border-transparent focus:border-primary focus:bg-card rounded-2xl px-6 py-3 text-sm font-bold outline-none transition-all text-foreground"
                    value={formData.allowancePercent}
                    onChange={e => setFormData({ ...formData, allowancePercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Thread Specs Section */}
              <div className="bg-card p-10 rounded-[3rem] border border-border shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl"><ListChecks size={24} /></div>
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Thread Count & Shade Registry</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Define thread specifications for this style</p>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-2xl overflow-hidden shadow-inner bg-muted/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[10px] font-black text-slate-200 uppercase tracking-widest h-12">
                        <th className="px-6 w-16">SL</th>
                        <th className="px-6">Thread Count</th>
                        <th className="px-6">Shade</th>
                        <th className="px-6">Cone Size</th>
                        <th className="px-6 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.threadSpecs?.map((spec, idx) => (
                        <tr key={idx} className="h-14 hover:bg-card transition-colors group">
                          <td className="px-6 text-xs font-black text-muted-foreground">{idx + 1}</td>
                          <td className="px-6">
                            <div className="flex items-center gap-2">
                              <select 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold outline-none text-foreground"
                                value={spec.count}
                                onChange={e => updateThreadSpec(idx, { count: e.target.value })}
                              >
                                <option value="">Select Count</option>
                                {systemConfig.threadCounts?.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <button 
                                onClick={() => setIsManagingCounts(true)}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                title="Manage Counts"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6">
                            <input 
                              type="text"
                              className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold outline-none placeholder:text-muted-foreground/30 text-foreground"
                              placeholder="e.g. S-101, Black"
                              value={spec.shade}
                              onChange={e => updateThreadSpec(idx, { shade: e.target.value })}
                            />
                          </td>
                          <td className="px-6">
                            <div className="flex items-center gap-2">
                              <select 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold outline-none text-foreground"
                                value={spec.coneSize}
                                onChange={e => updateThreadSpec(idx, { coneSize: e.target.value })}
                              >
                                <option value="">Select Size</option>
                                {systemConfig.coneSizes?.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button 
                                onClick={() => setIsManagingSizes(true)}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                title="Manage Sizes"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 text-right">
                            <button 
                              onClick={() => removeThreadSpec(idx)}
                              className="p-2 text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                              disabled={formData.threadSpecs?.length === 1}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button 
                    onClick={addThreadSpec}
                    className="w-full py-4 bg-muted/50 hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all flex items-center justify-center gap-2 border-t border-border group"
                  >
                    <Plus size={14} className="group-hover:scale-125 transition-transform" /> Add Thread Specification
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl active:scale-95"
                >
                  Next: Calculation <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Calculation Body */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card p-10 rounded-[3rem] border border-border shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg"><Calculator size={24} /></div>
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                        {calcType === 'SHORT' ? 'Short Consumption Chart' : 'Process Calculation Chart'}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detailed Thread Breakdown</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={loadFromLayout}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg"
                    >
                      <LayoutIcon size={14} /> Load from Layout
                    </button>
                    <button 
                      onClick={() => setShowRationMatrix(true)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg"
                    >
                      <TableIcon size={14} /> View Ration Matrix
                    </button>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, rows: getDemoRows() }))}
                      className="flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
                    >
                      Reset to Demo
                    </button>
                  </div>
                </div>

                <div className="border border-border rounded-[2rem] overflow-hidden shadow-inner bg-muted/30 max-h-[700px] overflow-y-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-900 text-slate-200 text-[10px] font-black uppercase tracking-widest h-14 border-b border-white/10">
                          <th className="px-6 w-16">SL</th>
                          {calcType === 'PROCESS' && <th className="px-6">Operation</th>}
                          <th className="px-6 w-48">Stitch Type</th>
                          <th className="px-6 w-48">Count & Shade</th>
                          <th className="px-6 w-32">Pos 1</th>
                          <th className="px-6 w-24">Factor 1</th>
                          <th className="px-6 w-32">Pos 2</th>
                          <th className="px-6 w-24">Factor 2</th>
                          <th className="px-6 w-32 text-right">Seam (cm)</th>
                          <th className="px-6 w-32 text-right">Thread (m)</th>
                          <th className="px-6 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {formData.operations?.map((row, idx) => {
                          return (
                            <tr key={row.id} className="h-16 hover:bg-card transition-colors group">
                              <td className="px-6 text-xs font-black text-muted-foreground">{String(idx + 1).padStart(2, '0')}</td>
                              {calcType === 'PROCESS' && (
                                <td className="px-6">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-black uppercase p-0 text-foreground"
                                    placeholder="Operation name"
                                    value={row.operation || ''}
                                    onChange={e => updateRow(row.id, { operation: e.target.value })}
                                  />
                                </td>
                              )}
                              <td className="px-6">
                                <SearchableSelect 
                                  value={row.stitchType}
                                  options={stitchTypeOptions}
                                  onChange={(val) => updateRow(row.id, { stitchType: val })}
                                  placeholder="Select Type..."
                                />
                              </td>
                              <td className="px-6">
                                <select 
                                  className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase p-0 text-foreground outline-none cursor-pointer"
                                  value={`${row.count || ''}|${row.shade || ''}`}
                                  onChange={e => {
                                    const [count, shade] = e.target.value.split('|');
                                    updateRow(row.id, { count, shade });
                                  }}
                                >
                                  <option value="|">Select Count & Shade</option>
                                  {formData.threadSpecs?.map((spec, i) => (
                                    <option key={i} value={`${spec.count}|${spec.shade}`}>
                                      {spec.count} - {spec.shade}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{row.pos1Name || '-'}</span>
                              </td>
                              <td className="px-6">
                                <input 
                                  type="number"
                                  step="0.01"
                                  className="w-full bg-transparent border-none focus:ring-0 text-xs font-black p-0 text-primary outline-none"
                                  value={row.pos1Factor}
                                  onChange={e => updateRow(row.id, { pos1Factor: parseFloat(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-6">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{row.pos2Name || '-'}</span>
                              </td>
                              <td className="px-6">
                                <input 
                                  type="number"
                                  step="0.01"
                                  className="w-full bg-transparent border-none focus:ring-0 text-xs font-black p-0 text-primary outline-none"
                                  value={row.pos2Factor}
                                  onChange={e => updateRow(row.id, { pos2Factor: parseFloat(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-6 bg-primary/10 border-x border-primary/5">
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none focus:ring-0 text-base font-[1000] p-0 text-primary text-right"
                                  placeholder="0"
                                  value={row.seamLengthCm || ''}
                                  onChange={e => updateRow(row.id, { seamLengthCm: parseFloat(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-6 text-right font-black text-emerald-600 tabular-nums">
                                {row.threadMeters.toFixed(2)}
                              </td>
                              <td className="px-6 text-right">
                                <button 
                                  onClick={() => removeRow(row.id)}
                                  className="text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(!formData.operations || formData.operations.length === 0) && (
                          <tr>
                            <td colSpan={calcType === 'PROCESS' ? 11 : 10} className="px-6 py-12 text-center text-muted-foreground italic text-xs uppercase tracking-widest">
                              No operations defined.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button 
                    onClick={addRow}
                    className="w-full py-4 bg-primary/5 hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary transition-all flex items-center justify-center gap-2 border-t border-border group"
                  >
                    <Plus size={14} className="group-hover:scale-125 transition-transform" /> Add Operation / Part
                  </button>
                </div>
              </div>

              {/* Charts Section - Moved outside the table container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Short Consumption Chart */}
                <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2">
                    <BarChart size={16} className="text-primary" />
                    Short Consumption Analysis
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--chart-tooltip-bg)',
                            borderColor: 'var(--chart-tooltip-border)',
                            color: 'var(--chart-tooltip-text)',
                            borderRadius: '12px', 
                            border: '1px solid var(--chart-tooltip-border)', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                          }}
                          itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                          cursor={{ fill: 'var(--chart-grid)', opacity: 0.1 }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Process Consumption Chart */}
                {calcType === 'PROCESS' && (
                  <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2">
                      <PieChart size={16} className="text-emerald-500" />
                      Process Distribution
                    </h3>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={processChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {processChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--chart-tooltip-bg)',
                              borderColor: 'var(--chart-tooltip-border)',
                              color: 'var(--chart-tooltip-text)',
                              borderRadius: '12px', 
                              border: '1px solid var(--chart-tooltip-border)', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                            }}
                            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                      </RePieChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 bg-muted text-muted-foreground px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl active:scale-95"
                >
                  Next: Summary <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Style Recap */}
                <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="p-2 bg-primary text-primary-foreground rounded-xl"><Shirt size={18}/></div>
                    <h3 className="text-xs font-black text-foreground uppercase">Style Profile</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Style</span>
                      <span className="text-xs font-black text-foreground uppercase">{formData.styleNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buyer</span>
                      <span className="text-xs font-black text-foreground uppercase">{formData.buyer}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product</span>
                      <span className="text-xs font-black text-foreground uppercase">{formData.productType || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Color</span>
                      <span className="text-xs font-black text-foreground uppercase">{formData.color || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Method</span>
                      <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-[9px] font-black uppercase">{calcType}</span>
                    </div>
                  </div>
                </div>

                {/* Consumption Metrics */}
                <div className="lg:col-span-2 bg-primary p-10 rounded-[3.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group">
                  <Calculator size={180} className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Net Consumption</p>
                      <p className="text-4xl font-[1000] tracking-tighter tabular-nums">{totals.totalThreadMeters.toFixed(2)} <span className="text-xs font-black opacity-60">M</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">With {formData.allowancePercent}% Wastage</p>
                      <p className="text-4xl font-[1000] tracking-tighter tabular-nums text-blue-200">{totals.finalThreadMeters.toFixed(2)} <span className="text-xs font-black opacity-60">M</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Cones / Garment</p>
                      <p className="text-4xl font-[1000] tracking-tighter tabular-nums text-emerald-300">{totals.totalCones.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-border pb-6">
                    <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg"><ListChecks size={24}/></div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Consumption Chart</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 900, fill: 'var(--chart-text)'}}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'var(--chart-text)'}} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--chart-tooltip-bg)',
                            borderColor: 'var(--chart-tooltip-border)',
                            color: 'var(--chart-tooltip-text)',
                            borderRadius: '16px', 
                            border: '1px solid var(--chart-tooltip-border)', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                          }}
                          itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                          cursor={{fill: 'var(--chart-grid)', opacity: 0.1}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669'][index % 5]} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-border pb-6">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><FileText size={24}/></div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Process Breakdown</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={calcType === 'PROCESS' ? processChartData : chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                        >
                          {(calcType === 'PROCESS' ? processChartData : chartData).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--chart-tooltip-bg)',
                            borderColor: 'var(--chart-tooltip-border)',
                            color: 'var(--chart-tooltip-text)',
                            borderRadius: '12px', 
                            border: '1px solid var(--chart-tooltip-border)', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                          }}
                          itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary by Count and Shade */}
              <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Database size={24}/></div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Summary by Count & Shade</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted text-[9px] font-black text-muted-foreground uppercase tracking-widest h-10">
                        <th className="px-6">Thread Count</th>
                        <th className="px-6">Shade</th>
                        <th className="px-6 text-right">Net Consumption (m)</th>
                        <th className="px-6 text-right">With Wastage (m)</th>
                        <th className="px-6 text-right">Cones Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {summaryByCountAndShade.map((item, idx) => (
                        <tr key={idx} className="h-12 hover:bg-muted/50 transition-colors">
                          <td className="px-6 text-xs font-black text-foreground">{item.count}</td>
                          <td className="px-6 text-xs font-black text-foreground">{item.shade}</td>
                          <td className="px-6 text-right text-xs font-black tabular-nums">{item.totalMeters.toFixed(2)}</td>
                          <td className="px-6 text-right text-xs font-black tabular-nums text-blue-600">{item.withWastage.toFixed(2)}</td>
                          <td className="px-6 text-right text-xs font-black tabular-nums text-emerald-600">{item.cones.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg"><ListChecks size={24}/></div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Final Consumption Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted text-[9px] font-black text-muted-foreground uppercase tracking-widest h-10">
                        <th className="px-6">Operation / Part</th>
                        <th className="px-6">Stitch Type</th>
                        <th className="px-6">Count</th>
                        <th className="px-6">Shade</th>
                        <th className="px-6">Pos 1 (F1)</th>
                        <th className="px-6">Pos 2 (F2)</th>
                        <th className="px-6 text-right">Seam (cm)</th>
                        <th className="px-6 text-right">Thread (m)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.operations?.map((row, idx) => (
                        <tr key={row.id} className="h-14 hover:bg-muted/50 transition-colors">
                          <td className="px-6">
                            <span className="text-xs font-black text-foreground uppercase">{row.operation || `Operation ${idx + 1}`}</span>
                          </td>
                          <td className="px-6">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{row.stitchType}</span>
                          </td>
                          <td className="px-6">
                            <span className="text-xs font-black text-foreground uppercase">{row.count}</span>
                          </td>
                          <td className="px-6">
                            <span className="text-xs font-black text-foreground uppercase">{row.shade}</span>
                          </td>
                          <td className="px-6">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">{row.pos1Name}</span>
                              <span className="text-xs font-black text-primary">{row.pos1Factor}</span>
                            </div>
                          </td>
                          <td className="px-6">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">{row.pos2Name}</span>
                              <span className="text-xs font-black text-primary">{row.pos2Factor}</span>
                            </div>
                          </td>
                          <td className="px-6 text-right text-xs font-black text-muted-foreground">{row.seamLengthCm}</td>
                          <td className="px-6 text-right text-xs font-black text-emerald-600">{row.threadMeters.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-muted text-muted-foreground px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
                >
                  <ChevronLeft size={16} /> Back to Calculation
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                  >
                    <PrinterIcon size={16} /> Print Report
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
                  >
                    Confirm & Save Record <CheckCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ration Matrix Modal */}
          {showRationMatrix && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><TableIcon size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">System Ration Matrix</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference Thread Ratios by Stitch Type</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRationMatrix(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon size={24} /></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest h-12 border-b border-slate-200">
                        <th className="px-6">Buyer</th>
                        <th className="px-6">Stitch Type</th>
                        <th className="px-6">Pos 1</th>
                        <th className="px-6">Ratio 1</th>
                        <th className="px-6">Pos 2</th>
                        <th className="px-6">Ratio 2</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-slate-100">
                      {systemConfig.threadRatios?.map((ratio, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-500">{ratio.buyer || 'GENERAL'}</td>
                          <td className="px-6 py-4 font-black">{ratio.stitchType}</td>
                          <td className="px-6 py-4 text-blue-600">{ratio.pos1Name}</td>
                          <td className="px-6 py-4 font-black">{ratio.pos1Ratio}</td>
                          <td className="px-6 py-4 text-indigo-600">{ratio.pos2Name}</td>
                          <td className="px-6 py-4 font-black">{ratio.pos2Ratio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button 
                    onClick={() => setShowRationMatrix(false)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Close Matrix
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Counts Modal */}
          {isManagingCounts && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight">Manage Thread Counts</h3>
                  <button onClick={() => { setIsManagingCounts(false); setEditingOptionIndex(null); setNewOptionValue(''); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><XIcon size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary transition-all"
                      placeholder="Enter count (e.g. 20/2)"
                      value={newOptionValue}
                      onChange={e => setNewOptionValue(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAddOption('COUNT')}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                    >
                      {editingOptionIndex !== null ? 'Update' : 'Add'}
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {systemConfig.threadCounts?.map((count, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <span className="text-xs font-bold">{count}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingOptionIndex(idx); setNewOptionValue(count); }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteOption('COUNT', idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manage Sizes Modal */}
          {isManagingSizes && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight">Manage Cone Sizes</h3>
                  <button onClick={() => { setIsManagingSizes(false); setEditingOptionIndex(null); setNewOptionValue(''); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><XIcon size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary transition-all"
                      placeholder="Enter size (e.g. 5000m)"
                      value={newOptionValue}
                      onChange={e => setNewOptionValue(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAddOption('SIZE')}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                    >
                      {editingOptionIndex !== null ? 'Update' : 'Add'}
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {systemConfig.coneSizes?.map((size, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <span className="text-xs font-bold">{size}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingOptionIndex(idx); setNewOptionValue(size); }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteOption('SIZE', idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                placeholder="Search style, buyer, or product..."
                className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-foreground"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 bg-card border border-border text-muted-foreground px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all shadow-sm active:scale-95"
              >
                <FileText size={14} /> Print Report
              </button>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredRecords.length} Entries Found</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">User</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Style</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buyer</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Remarks</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Thread (M)</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cones/Gmt</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-xs font-bold text-foreground">{record.date}</td>
                    <td className="p-4 text-xs font-bold text-foreground">{record.user || 'N/A'}</td>
                    <td className="p-4 text-xs font-bold text-foreground">{record.styleNumber}</td>
                    <td className="p-4 text-xs font-bold text-foreground">{record.buyer}</td>
                    <td className="p-4 text-xs font-bold text-foreground">{record.productCategory || 'N/A'}</td>
                    <td className="p-4 text-xs font-bold text-foreground">{record.remarks || '-'}</td>
                    <td className="p-4 text-xs font-bold text-foreground tabular-nums">{record.finalThreadMeters.toFixed(1)}</td>
                    <td className="p-4 text-xs font-bold text-foreground tabular-nums">{record.totalCones.toFixed(4)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(record)} className="p-2 text-muted-foreground hover:text-primary transition-colors"><Edit size={14}/></button>
                        <button 
                          onClick={async () => { 
                            if(confirm("Delete this record?")) { 
                              try {
                                await apiService.deleteThreadConsumption(record.id); 
                                setSavedRecords(prev => prev.filter(r => r.id !== record.id)); 
                              } catch (e) {
                                alert("Failed to delete");
                              }
                            } 
                          }} 
                          className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {savedRecords.length === 0 && (
              <div className="p-20 text-center text-muted-foreground">
                <Database size={48} className="mx-auto opacity-20 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No records found in registry.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadConsumptionTab;
