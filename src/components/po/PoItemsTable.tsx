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
  currency = 'IDR',
}) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleItemChange = (index: number, field: keyof PoItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

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
      satuan: 'UNIT',
      unitPrice: 0,
      totalPrice: 0,
    };
    onChange([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((item, idx) => ({
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
            Rincian Barang & Jasa ({items.length} Item)
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
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs bg-white">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b border-gray-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2 text-center w-10">No</th>
                <th className="py-2.5 px-2 w-24">Kode</th>
                <th className="py-2.5 px-3 min-w-[200px]">Nama Barang / Jasa</th>
                <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                <th className="py-2.5 px-2 w-24 text-center">Satuan</th>
                <th className="py-2.5 px-3 w-32 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 w-32 text-right">Total Harga</th>
                <th className="py-2.5 px-2 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-blue-50/40 transition">
                  {/* No */}
                  <td className="py-2 px-2 text-center font-medium text-gray-500">
                    {item.itemNo || index + 1}
                  </td>

                  {/* Kode Barang */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.itemCode || ''}
                      onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                      placeholder="Kode"
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                  </td>

                  {/* Nama & Spesifikasi */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.itemName || ''}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      placeholder="Nama Barang atau Jasa"
                      className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded text-xs md:text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-1"
                    />
                    <input
                      type="text"
                      value={item.itemSpec || ''}
                      onChange={(e) => handleItemChange(index, 'itemSpec', e.target.value)}
                      placeholder="Spesifikasi / detail tambahan (opsional)"
                      className="w-full px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Qty */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.qty ?? 1}
                      onChange={(e) =>
                        handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 text-center bg-white border border-gray-200 rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Satuan */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      list={`satuan-list-${index}`}
                      value={item.satuan || 'UNIT'}
                      onChange={(e) =>
                        handleItemChange(index, 'satuan', e.target.value.toUpperCase())
                      }
                      placeholder="PCS/UNIT"
                      className="w-full px-2 py-1 text-center bg-white border border-gray-200 rounded text-xs uppercase font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <datalist id={`satuan-list-${index}`}>
                      <option value="UNIT" />
                      <option value="PCS" />
                      <option value="SET" />
                      <option value="LOT" />
                      <option value="BOX" />
                      <option value="ROLL" />
                      <option value="MTR" />
                      <option value="KG" />
                      <option value="TITIK" />
                      <option value="PAKET" />
                    </datalist>
                  </td>

                  {/* Unit Price */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unitPrice || 0}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 text-right bg-white border border-gray-200 rounded text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Total Price */}
                  <td className="py-2 px-3 text-right font-semibold text-blue-700 whitespace-nowrap">
                    {formatRupiah(item.totalPrice || (item.qty || 0) * (item.unitPrice || 0))}
                  </td>

                  {/* Delete */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
