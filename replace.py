import codecs
with codecs.open("src/pages/TeacherDashboard.tsx", "r", "utf-8") as f:
    c = f.read()

c = c.replace("import { BookOpen, Target, Trophy, Gift, Users, Upload, Plus, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, ChevronRight, Flame, Trash2, CheckCircle, Loader2, Sparkles, FileText, Eye, EyeOff, AlertTriangle, ArrowRightLeft, ArrowRight, Coins } from 'lucide-react'", "import { BookOpen, Target, Trophy, Gift, Users, Upload, Plus, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, ChevronRight, Flame, Trash2, CheckCircle, Loader2, Sparkles, FileText, Eye, EyeOff, AlertTriangle, ArrowRightLeft, ArrowRight, Coins } from 'lucide-react'\nimport { toast } from 'sonner'")
c = c.replace("alert(`Limpieza completada: ${res.deleted} registros corregidos/eliminados y ${res.fixed} RUTs formateados.`)", "toast.success(`Limpieza completada: ${res.deleted} registros corregidos/eliminados y ${res.fixed} RUTs formateados.`)")
c = c.replace("alert('Error al limpiar la lista: ' + err.message)", "toast.error('Error al limpiar la lista: ' + err.message)")
c = c.replace("alert('No se pudo eliminar la recompensa: ' + (err.message || String(err)));", "toast.error('No se pudo eliminar la recompensa: ' + (err.message || String(err)));")
c = c.replace("alert(err.message || 'Error al eliminar misión')", "toast.error(err.message || 'Error al eliminar misión')")
c = c.replace("alert(err.message || 'Error al eliminar quiz')", "toast.error(err.message || 'Error al eliminar quiz')")
c = c.replace("alert(err.message || 'Error al crear el ramo')", "toast.error(err.message || 'Error al crear el ramo')")
c = c.replace("alert(err.message || 'Error al crear la misión')", "toast.error(err.message || 'Error al crear la misión')")
c = c.replace("alert('Fallo al eliminar: ' + (err.message || String(err)))", "toast.error('Fallo al eliminar: ' + (err.message || String(err)))")
c = c.replace("alert('Selecciona un ramo primero.')", "toast.error('Selecciona un ramo primero.')")
c = c.replace("alert(err.message || 'Error al crear la recompensa')", "toast.error(err.message || 'Error al crear la recompensa')")
c = c.replace("alert(\"Error: \" + err.message)", "toast.error(\"Error: \" + err.message)")

with codecs.open("src/pages/TeacherDashboard.tsx", "w", "utf-8") as f:
    f.write(c)
