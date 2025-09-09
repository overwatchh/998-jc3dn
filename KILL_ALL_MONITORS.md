# 🛑 HOW TO KILL ALL MONITORING TASKS

## Method 1: Kill All Node Processes (FASTEST)

### Windows Command Prompt:
```cmd
taskkill /f /im node.exe
```

### PowerShell:
```powershell
Get-Process node | Stop-Process -Force
```

## Method 2: Find and Kill Specific Processes

### 1. Find all Node processes:
```cmd
tasklist | findstr node.exe
```

### 2. Kill specific process by PID:
```cmd
taskkill /f /pid [PID_NUMBER]
```

## Method 3: Restart Computer (NUCLEAR OPTION)
- Restart your computer to kill ALL processes

## Method 4: Task Manager (GUI METHOD)
1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Go to "Processes" tab
3. Find all "Node.js JavaScript Runtime" processes
4. Right-click each one → "End task"

## ⚠️ IMPORTANT NOTES:
- Method 1 will kill ALL Node.js processes (including npm dev server)
- You may need to restart your development server after
- Make sure to save any work before killing processes

## After Killing All Processes:
1. Open ONE terminal
2. Navigate to your project
3. Run: `npm run attendance:monitor`
4. DO NOT start multiple monitors

## Verify No Processes Running:
```cmd
tasklist | findstr node.exe
```
Should show only your new single monitor process.