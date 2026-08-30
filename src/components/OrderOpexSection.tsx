'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderOpexSection({
  orderId, 
  opex: initialOpex,
  onUpdate, 
  allowAdd = false,
  allowApprove = false,
}: {
  orderId?: string
  opex: any[]
  onUpdate?: (newOpex: any[]) => void
  allowAdd?: boolean
  allowApprove?: boolean
}) {
  const router = useRouter()
  const [opex, setOpex] = useState(initialOpex)
  
  // Add state
  const [isAdding, setIsAdding] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    setOpex(initialOpex)
  }, [initialOpex])

  const peso = (n: number) =>
    '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  async function pushUpdate(newOpex: any[]) {
    setOpex(newOpex)
    onUpdate?.(newOpex)

    if (orderId) {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opex: newOpex })
        })
        if (res.ok) {
          router.refresh() 
        }
      } catch (e) {
        console.error("Failed to update OPEX", e)
      }
    }
  }

  function handleAdd() {
    if (!desc || !amount || isNaN(Number(amount))) return
    const newExpense = {
      description: desc,
      amount: Number(amount),
      expenseDate: new Date(date).toISOString(),
      status: 'pending',
    }
    pushUpdate([...opex, newExpense])
    setIsAdding(false)
    setDesc('')
    setAmount('')
  }

  function handleStatusChange(index: number, newStatus: string) {
    const copy = [...opex]
    copy[index].status = newStatus
    pushUpdate(copy)
  }

  function handleDelete(index: number) {
    if (confirm('Are you sure you want to delete this expense record?')) {
      const copy = [...opex]
      copy.splice(index, 1)
      pushUpdate(copy)
    }
  }

  function startEdit(index: number, exp: any) {
    setEditingIndex(index)
    setEditDesc(exp.description)
    setEditAmount(String(exp.amount))
    setEditDate(new Date(exp.expenseDate).toISOString().split('T')[0])
  }

  function saveEdit(index: number) {
    if (!editDesc || !editAmount || isNaN(Number(editAmount))) return
    const copy = [...opex]
    copy[index] = {
      ...copy[index],
      description: editDesc,
      amount: Number(editAmount),
      expenseDate: new Date(editDate).toISOString(),
    }
    pushUpdate(copy)
    setEditingIndex(null)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border border-amber-200',
    liquidated: 'bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
          Operating Expenses ({opex.length})
        </p>
        {/* Only Pipeline Users can request an expense */}
        {allowAdd && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-[9px] font-bold uppercase tracking-widest text-[#1877F2] hover:text-[#0A4FB0] px-3 py-1.5 border border-[#1877F2]/20 rounded transition-colors"
          >
            + Request OPEX
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4 flex flex-col md:flex-row gap-3 items-end">
          <div className="w-full md:flex-1">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Description</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Lalamove Delivery" className="w-full px-3 py-2 text-xs border rounded outline-none focus:border-[#1877F2]" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Amount (₱)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-xs border rounded outline-none focus:border-[#1877F2]" />
          </div>
          <div className="w-full md:w-40">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 text-xs border rounded outline-none focus:border-[#1877F2]" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-gray-500 hover:bg-gray-200 rounded transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 text-[10px] font-bold uppercase bg-[#050505] text-white hover:bg-[#1877F2] rounded transition-colors whitespace-nowrap">
              Submit Request
            </button>
          </div>
        </div>
      )}

      {opex.length === 0 && !isAdding && (
        <p className="text-[11px] text-gray-400 italic py-1">No OPEX recorded.</p>
      )}

      <div className="flex flex-col gap-2">
        {opex.map((exp, i) => {
          // STRICT ROLES: Pipeline users (allowAdd) can edit/delete, but ONLY if it is still pending. 
          const canEditOrDelete = allowAdd && exp.status === 'pending'
          
          // STRICT ROLES: Admin users (allowApprove) can approve/reject pending items.
          const canApproveOrReject = allowApprove && exp.status === 'pending'

          if (editingIndex === i) {
            return (
              <div key={i} className="bg-white border border-[#1877F2]/30 p-3 rounded shadow-[0_4px_12px_-4px_rgba(20,153,17,0.15)] flex flex-col md:flex-row gap-2.5 items-center">
                <div className="w-full md:flex-1">
                  <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border rounded outline-none focus:border-[#1877F2] bg-gray-50" />
                </div>
                <div className="w-full md:w-28">
                  <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border rounded outline-none focus:border-[#1877F2] bg-gray-50" />
                </div>
                <div className="w-full md:w-36">
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border rounded outline-none focus:border-[#1877F2] bg-gray-50" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 text-[9px] font-bold uppercase text-gray-500 hover:bg-gray-100 rounded transition-colors">Cancel</button>
                  <button onClick={() => saveEdit(i)} className="px-3 py-1.5 text-[9px] font-bold uppercase bg-[#1877F2] text-white hover:bg-[#0A4FB0] rounded transition-colors whitespace-nowrap">Save</button>
                </div>
              </div>
            )
          }

          return (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-gray-100 bg-white rounded shadow-sm hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded ${statusColors[exp.status || 'pending']}`}>
                  {exp.status || 'pending'}
                </span>
                <div>
                  <p className="text-xs font-bold text-[#050505]">{exp.description}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{new Date(exp.expenseDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <p className="font-mono text-xs font-bold text-[#050505]">{peso(Number(exp.amount))}</p>
                
                <div className="flex items-center gap-1.5 ml-2">
                  {/* Admin Only Controls */}
                  {canApproveOrReject && (
                    <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
                      <button onClick={() => handleStatusChange(i, 'liquidated')} className="text-[9px] font-bold uppercase text-[#1877F2] hover:underline">Approve</button>
                      <span className="text-gray-200">|</span>
                      <button onClick={() => handleStatusChange(i, 'rejected')} className="text-[9px] font-bold uppercase text-red-500 hover:underline">Reject</button>
                    </div>
                  )}

                  {/* Pipeline User Only Controls */}
                  {canEditOrDelete && (
                    <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3 ml-1">
                      <button 
                        onClick={() => startEdit(i, exp)} 
                        className="text-[9px] font-bold uppercase text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Expense"
                      >
                        Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button 
                        onClick={() => handleDelete(i)} 
                        className="text-[9px] font-bold uppercase text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Expense"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}