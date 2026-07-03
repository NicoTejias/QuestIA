import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Trash2, Package, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { InventarioPanolAPI } from '../../lib/api'

export default function PanolPanel() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string>('todas')
  const [showNuevo, setShowNuevo] = useState(false)
  const [nuevo, setNuevo] = useState({ descripcion: '', categoria: '', tipo: '', stock: 0, estado: 'completo', observacion: '' })

  const cargar = async () => {
    try {
      setLoading(true)
      setItems(await InventarioPanolAPI.getAll())
    } catch {
      toast.error('No se pudo cargar el inventario. ¿Aplicaste la migración de la tabla?')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { cargar() }, [])

  const categorias = useMemo(
    () => Array.from(new Set(items.map(i => i.categoria).filter(Boolean))).sort(),
    [items]
  )

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter(i => {
      if (categoria !== 'todas' && i.categoria !== categoria) return false
      if (!q) return true
      return `${i.descripcion} ${i.tipo} ${i.observacion}`.toLowerCase().includes(q)
    })
  }, [items, busqueda, categoria])

  const patch = async (id: string, updates: any) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)))
    try { await InventarioPanolAPI.updateItem(id, updates) }
    catch { toast.error('No se pudo guardar el cambio'); cargar() }
  }

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este material del inventario?')) return
    setItems(prev => prev.filter(i => i.id !== id))
    try { await InventarioPanolAPI.deleteItem(id) }
    catch { toast.error('No se pudo eliminar'); cargar() }
  }

  const crear = async () => {
    if (!nuevo.descripcion.trim()) { toast.error('Ingresa una descripción'); return }
    try {
      await InventarioPanolAPI.createItem(nuevo)
      toast.success('Material agregado')
      setShowNuevo(false)
      setNuevo({ descripcion: '', categoria: '', tipo: '', stock: 0, estado: 'completo', observacion: '' })
      cargar()
    } catch { toast.error('No se pudo agregar') }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" /> Inventario de Pañol
          </h2>
          <p className="text-slate-400 text-xs mt-1">{items.length} materiales. La IA los sugiere al planificar los ramos.</p>
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-all self-start"
        >
          <Plus className="w-4 h-4" /> Agregar material
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material, tipo u observación…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/70 text-slate-400 text-xs sticky top-0">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Material</th>
                  <th className="p-3 font-semibold">Categoría</th>
                  <th className="p-3 font-semibold w-24">Stock</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Observación</th>
                  <th className="p-3 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">Sin resultados.</td></tr>
                ) : filtrados.map(i => (
                  <tr key={i.id} className="border-t border-slate-800/60 hover:bg-slate-900/30">
                    <td className="p-3 text-slate-200">{i.descripcion}</td>
                    <td className="p-3 text-slate-500 text-xs">{i.categoria}{i.tipo ? ` · ${i.tipo}` : ''}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={i.stock ?? 0}
                        onChange={e => patch(i.id, { stock: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={i.estado || ''}
                        onChange={e => patch(i.id, { estado: e.target.value })}
                        className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="">—</option>
                        <option value="completo">completo</option>
                        <option value="incompleto">incompleto</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{i.observacion || '—'}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => eliminar(i.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal nuevo material */}
      {showNuevo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Nuevo material</h3>
              <button onClick={() => setShowNuevo(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input placeholder="Descripción del material *" value={nuevo.descripcion}
                onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Categoría" value={nuevo.categoria}
                  onChange={e => setNuevo({ ...nuevo, categoria: e.target.value })}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                <input placeholder="Tipo (medición/manual…)" value={nuevo.tipo}
                  onChange={e => setNuevo({ ...nuevo, tipo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                <input type="number" placeholder="Stock" value={nuevo.stock}
                  onChange={e => setNuevo({ ...nuevo, stock: parseInt(e.target.value) || 0 })}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                <select value={nuevo.estado} onChange={e => setNuevo({ ...nuevo, estado: e.target.value })}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="completo">completo</option>
                  <option value="incompleto">incompleto</option>
                </select>
              </div>
              <input placeholder="Observación" value={nuevo.observacion}
                onChange={e => setNuevo({ ...nuevo, observacion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <button onClick={() => setShowNuevo(false)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">Cancelar</button>
              <button onClick={crear} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
