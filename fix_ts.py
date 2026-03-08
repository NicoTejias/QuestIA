import codecs
import re

def patch(file, replacements):
    with codecs.open(file, "r", "utf-8") as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with codecs.open(file, "w", "utf-8") as f:
        f.write(content)

# 1. Fix RamosPanel
patch("src/components/teacher/RamosPanel.tsx", [
    ("import { BookOpen, Plus, Loader2, ChevronRight } from 'lucide-react'", "import { BookOpen, Plus, Loader2, ChevronRight, CheckCircle } from 'lucide-react'\nimport CourseDetail from './CourseDetail'"),
])

# 2. Fix TeacherDashboard.tsx unused imports
patch("src/pages/TeacherDashboard.tsx", [
    ("import CourseDetail from '../components/teacher/CourseDetail'\n", ""),
    ("import Papa from 'papaparse'\n", ""),
    ("import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'\n", ""),
    ("import { calculateRutDV, formatRutWithDV, cleanRut } from '../utils/rutUtils'\n", "")
])

# 3. Fix StudentDashboard.tsx unused imports
patch("src/pages/StudentDashboard.tsx", [
    ("Star, Loader2, Sparkles, ArrowRightLeft, Bell, ArrowRight,", "Star, Loader2, ArrowRightLeft, Bell,"),
    ("CheckCircle2, AlertCircle, PlayCircle", "AlertCircle, PlayCircle")
])

# 4. Fix TS typing string indexing and spread in AnaliticasPanel and GruposPanel
patch("src/components/teacher/AnaliticasPanel.tsx", [
    ("const maxBelbin = Math.max(...Object.values(stats.belbinDistribution), 1)", "const maxBelbin = Math.max(...(Object.values(stats.belbinDistribution) as number[]), 1)"),
    ("(stats.belbinDistribution[role]", "((stats.belbinDistribution as any)[role]")
])

patch("src/components/teacher/GruposPanel.tsx", [
    ("acc[role] = (acc[role] || 0) + 1", "acc[role] = ((acc as any)[role] || 0) + 1")
])

# 5. Fix TeacherDashboard.tsx type error in belbin distribution
patch("src/pages/TeacherDashboard.tsx", [
    ("const maxBelbin = Math.max(...Object.values(stats.belbinDistribution), 1)", "const maxBelbin = Math.max(...(Object.values(stats.belbinDistribution) as number[]), 1)")
])

# 6. Any other issues? Let's check TeacherDashboard.tsx unused.
patch("src/pages/TeacherDashboard.tsx", [
    ("BookOpen, Target, Trophy, Gift, Users, Upload, Plus, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, ChevronRight, Flame, Trash2, CheckCircle, Loader2, Sparkles, FileText, Eye, EyeOff, AlertTriangle, ArrowRightLeft, ArrowRight, Coins", "BookOpen, Target, Trophy, Gift, Users, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, ArrowRightLeft, Sparkles, Loader2, FileText")
])
