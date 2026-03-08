import codecs
import re

def extract(name, imports_list):
    with codecs.open("src/pages/TeacherDashboard.tsx", "r", "utf-8") as f:
        lines = f.readlines()

    start_idx = -1
    for i, line in enumerate(lines):
        if line.startswith(f"function {name}("):
            start_idx = i
            break
            
    if start_idx == -1: return False

    end_idx = start_idx
    brace_count = 0
    in_func = False
    for i in range(start_idx, len(lines)):
        brace_count += lines[i].count("{")
        brace_count -= lines[i].count("}")
        if lines[i].count("{") > 0: in_func = True
        if in_func and brace_count == 0:
            end_idx = i
            break
            
    component_lines = lines[start_idx:end_idx+1]
    new_main = lines[:start_idx] + [f"// Extracted: {name}\n"] + lines[end_idx+1:]
    
    # Fix the export
    component_lines[0] = component_lines[0].replace(f"function {name}(", f"export default function {name}(")
    
    # Build imports
    imports_str = "import { useState, useRef } from 'react'\n"
    imports_str += 'import { useQuery, useMutation, useAction } from "convex/react"\n'
    imports_str += 'import { api } from "../../convex/_generated/api"\n'
    imports_str += 'import { ' + ', '.join(imports_list) + " } from 'lucide-react'\n"
    imports_str += "import Papa from 'papaparse'\n"
    imports_str += "import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'\n"
    imports_str += "import { formatRutWithDV, cleanRut, calculateRutDV } from '../utils/rutUtils'\n"
    imports_str += "import { toast } from 'sonner'\n\n"
    
    with codecs.open(f"src/components/teacher/{name}.tsx", "w", "utf-8") as f:
        f.write(imports_str + "".join(component_lines))
        
    last_import = 0
    for i, line in enumerate(new_main):
        if line.startswith("import "):
            last_import = i
            
    new_main.insert(last_import + 1, f"import {name} from '../components/teacher/{name}'\n")
    
    with codecs.open("src/pages/TeacherDashboard.tsx", "w", "utf-8") as f:
        f.writelines(new_main)
    return True

components = {
    "RamosPanel": ["BookOpen", "Plus", "Loader2", "ChevronRight"],
    "CrearMisionPanel": ["Target", "Plus", "Loader2", "Trash2", "CheckCircle", "Flame", "Sparkles", "Eye", "EyeOff"],
    "CrearRecompensaPanel": ["Gift", "Plus", "Loader2", "Trash2", "Coins", "AlertTriangle"],
    "WhitelistPanel": ["FileSpreadsheet", "Upload", "Plus", "Trash2", "CheckCircle", "AlertTriangle", "Users", "AlertCircle"],
    "MaterialPanel": ["FileText", "Upload", "Trash2", "Loader2"],
    "AnaliticasPanel": ["BarChart3"],
    "RankingDocentePanel": ["Trophy"],
    "TraspasosPanel": ["ArrowRightLeft", "CheckCircle", "X"],
    "GruposPanel": ["Users", "Plus", "Trash2", "Loader2", "Sparkles"]
}

for name, icons in components.items():
    if extract(name, icons):
        print("Extracted", name)
