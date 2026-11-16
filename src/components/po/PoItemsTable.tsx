import React from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import type { PoItem } from '../../types/po.ts';

interface PoItemsTableProps {
  items: PoItem[];
  onChange: (items: PoItem[]) => void;
  currency?: string;
}

export const PoItemsTable: React.FC<PoItemsTableProps> = ({
  items,
  onChange,
}) => {
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  const getDisplayDescription = (item: PoItem) => {
    const name = (item.itemName || '').trim();
    const spec = (item.itemSpec || '').trim();
    if (spec && name && !name.toLowerCase().includes(spec.toLowerCase())) {
      return `${name} ${spec}`;
    }
    return item.itemName ?? '';
  };

  const handleItemChange = (index: number, field: keyof PoItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'itemName') {
      item.itemSpec = '';
    }

    // Auto calculate totalPrice if qty or unitPrice changed
    if (field === 'qty' || field === 'unitPrice') {
      const q = field === 'qty' ? parseFloat(value) || 0 : item.qty || 0;
      const p = field === 'unitPrice' ? parseFloat(value) || 0 : item.unitPrice || 0;
      item.totalPrice = Math.round(q * p);
    }

    updated[index] = item;
    onChange(updated);
  };

  const handleAddItem = () => {
    const nextNo = items.length + 1;
    const newItem: PoItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemNo: nextNo,
      itemCode: '',
      itemName: '',
      itemSpec: '',
      qty: 1,
      satuan: 'unit',
      unitPrice: 0,
      totalPrice: 0,
    };
    onChange([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({
        ...item,
        itemNo: idx + 1,
      }));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">
            Rincian Barang &amp; Jasa ({items.length} Item)
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs md:text-sm font-medium transition active:scale-95 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Item</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-500 text-xs md:text-sm">Belum ada item barang/jasa dalam PO ini.</p>
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            + Tambah Baris Baru
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="w-full border-collapse border border-slate-900 text-xs md:text-sm text-slate-900">
            <thead>
              <tr className="bg-white text-slate-950 font-bold">
                <th className="border border-slate-900 py-2.5 px-2 text-center w-11">No.</th>
                <th className="border border-slate-900 py-2.5 px-3 text-left min-w-[230px]">
                  Uraian Pekerjaan / Keterangan
                </th>
                <th className="border border-slate-900 py-2.5 px-2 text-center w-16">Qty</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center w-24">Satuan</th>
                <th className="border border-slate-900 py-2.5 px-3 text-right w-32">Harga Satuan</th>
                <th className="border border-slate-900 py-2.5 px-3 text-right w-36">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const rowTotal = item.totalPrice || (item.qty || 0) * (item.unitPrice || 0);
                return (
                  <tr key={item.id || index} className="hover:bg-blue-50/30 transition group">
                    {/* No. */}
                    <td className="border border-slate-900 py-2 px-2 text-center font-bold align-middle">
                      {item.itemNo || index + 1}
                    </td>

                    {/* Uraian Pekerjaan / Keterangan */}
                    <td className="border border-slate-900 py-1.5 px-2.5 align-middle">
                      <input
                        type="text"
                        value={getDisplayDescription(item)}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        placeholder="Uraian pekerjaan atau barang..."
                        className="w-full px-1.5 py-1 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500 rounded text-xs md:text-sm font-normal text-slate-900 focus:outline-none"
                      />
                    </td>

                    {/* Qty */}
                    <td className="border border-slate-900 py-1.5 px-1.5 text-center align-middle">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.qty ?? 1}
                        onChange={(e) =>
                          handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-1 py-1 text-center bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500 rounded text-xs md:text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </td>

                    {/* Satuan */}
                    <td className="border border-slate-900 py-1.5 px-1.5 text-center align-middle">
                      <input
                        type="text"
                        list={`satuan-list-${index}`}
                        value={item.satuan || 'unit'}
                        onChange={(e) => handleItemChange(index, 'satuan', e.target.value)}
                        placeholder="unit"
                        className="w-full px-1 py-1 text-center bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500 rounded text-xs md:text-sm font-normal text-slate-900 focus:outline-none"
                      />
                      <datalist id={`satuan-list-${index}`}>
                        <option value="Meter" />
                        <option value="unit" />
                        <option value="Lot" />
                        <option value="Pcs" />
                        <option value="Set" />
                        <option value="Box" />
                        <option value="Roll" />
                        <option value="Kg" />
                        <option value="Titik" />
                        <option value="Paket" />
                      </datalist>
                    </td>

                    {/* Harga Satuan */}
                    <td className="border border-slate-900 py-1.5 px-2 text-right align-middle">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.unitPrice || 0}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-1.5 py-1 text-right bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500 rounded text-xs md:text-sm font-mono text-slate-900 focus:outline-none"
                      />
                    </td>

                    {/* Jumlah (Rp) + compact row delete trigger */}
                    <td className="border border-slate-900 py-1.5 px-2.5 text-right font-bold font-mono text-slate-950 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{formatNumber(rowTotal)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition shrink-0"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
