# Floor Plan Save/Load - Quick Start Guide

## 🎯 Quick Actions

### Save Your Work
```
Click: [Save Floor X] (green button)
→ Saves to browser localStorage
→ Auto-loads on next visit
```

### Export for Backup
```
Click: [Export] (blue button)
→ Downloads: floor-MainBuilding-1.json
→ Use for backup or sharing

Click: [All] (blue button next to Export)
→ Downloads: all-floors-MainBuilding.json
→ Exports ALL floors at once
```

### Import Saved Work
```
Click: [Import] (purple button)
→ Select your .json file
→ Auto-detects single or multi-floor
```

## 🏢 Multi-Floor Management

### View All Floors
```
Click: [Manage Floors (N)]
→ Shows grid of all floors
→ Blue = current floor
→ Gray = other floors
```

### Switch Floors
```
1. Click [Manage Floors]
2. Click any floor number (1, 2, 3, etc.)
3. Current floor auto-saves before switching
4. Selected floor loads immediately
```

### Add New Floor
```
1. Click [Manage Floors]
2. Type floor number (e.g., "2", "B1", "Penthouse")
3. Click [+] button
4. New floor created with default layout
```

### Delete a Floor
```
1. Click [Manage Floors]
2. Click red [×] on any floor (except current)
3. Confirm deletion
4. Floor removed from storage
```

## 📊 UI Layout

```
┌────────────────────────────────┐
│  Floor Plan Settings           │
├────────────────────────────────┤
│  💾 [Save Floor 1]             │ ← Save current work
├────────────────────────────────┤
│  📥 [Export]  📚 [All]         │ ← Export options
├────────────────────────────────┤
│  📤 [Import]                   │ ← Import from file
├────────────────────────────────┤
│  🏢 [Manage Floors (3)]  ▼     │ ← Toggle floor manager
│  ┌──────────────────────────┐ │
│  │  [1] [2] [3]  ×  ×       │ │ ← Floor grid (click to switch)
│  │  [Floor #] [+]           │ │ ← Add new floor
│  └──────────────────────────┘ │
├────────────────────────────────┤
│  🏢 Main Building - Floor 1    │ ← Current location
└────────────────────────────────┘
```

## 💡 Tips & Tricks

### Workflow Recommendations

**Daily Use:**
1. Work on your floor plan
2. Click "Save Floor X" periodically
3. Don't worry - it auto-loads next time!

**Backup Strategy:**
1. At end of day: Click "All" to export all floors
2. Keep exported .json file in cloud storage
3. Can restore anytime by importing

**Multi-Floor Building:**
1. Start with Floor 1 (default)
2. Design and save it
3. Click "Manage Floors" → Add "2"
4. Design Floor 2
5. Switch between floors anytime
6. Export all when done

### Keyboard Shortcuts
- **Save**: Click the green Save button (no keyboard shortcut yet)
- **Quick Switch**: Use floor grid for fast switching

## 🔄 Data Persistence

### What Gets Saved?
- ✅ All regions (NW, NE, SW, SE) and their sizes
- ✅ All items (islands, meeting rooms)
- ✅ Elevators and their positions
- ✅ Staircases
- ✅ Elevator zone configuration
- ✅ Region entrances

### Where is Data Stored?
- **Primary**: Browser localStorage (automatic)
- **Backup**: Exported JSON files (manual)
- **Future**: Backend server API (coming soon)

### Will I Lose My Work?
**NO** - if you:
- ✅ Click "Save Floor X" button
- ✅ Export to JSON occasionally

**MAYBE** - if you:
- ❌ Clear browser data/cache
- ❌ Never click save
- ❌ Use private/incognito mode

## 🚀 Common Scenarios

### Scenario 1: Working on a 5-Floor Building
```
Day 1:
  - Design Floor 1 → Save
  - Add Floor 2 → Design → Save
  
Day 2:
  - Open app (Floor 1 loads automatically)
  - Switch to Floor 2 (click in grid)
  - Continue work → Save
  
Day 3:
  - Add Floors 3, 4, 5
  - Design each → Save each
  - Export All → Backup to cloud
```

### Scenario 2: Copying Between Browsers/Computers
```
Computer A:
  1. Design floors
  2. Click "All" to export
  3. Save file to USB/Cloud

Computer B:
  1. Click "Import"
  2. Select the exported file
  3. All floors load automatically
  4. Continue working
```

### Scenario 3: Sharing with Colleagues
```
Your Computer:
  1. Complete floor plan
  2. Export current floor or all floors
  3. Email/Share the .json file

Colleague's Computer:
  1. Receive .json file
  2. Click Import
  3. Select the file
  4. Can view and edit
```

## ⚠️ Important Notes

1. **Auto-save on Switch**: When switching floors, current floor saves automatically
2. **Can't Delete Current**: Can't delete the floor you're currently on
3. **Floor Numbers**: Can be numeric (1, 2, 3) or text (B1, Lobby, Penthouse)
4. **Sort Order**: Floors sorted numerically when possible
5. **Storage Limit**: localStorage ~5-10MB (thousands of floors possible)

## 🐛 Troubleshooting

**Floor won't save?**
- Check if browser allows localStorage
- Try exporting instead

**Lost my work?**
- Check if you clicked Save button
- Look for exported files in Downloads

**Import fails?**
- Ensure file is valid JSON
- Check file wasn't corrupted

**Can't see my floors?**
- Click "Manage Floors" to expand
- Check localStorage wasn't cleared

## 📞 Need Help?

All floor data is stored in:
- **localStorage key**: `floorPlans`
- **Format**: JSON object with floor numbers as keys

Can manually inspect in browser console:
```javascript
localStorage.getItem('floorPlans')
```

---

**Ready to build! 🏗️**
