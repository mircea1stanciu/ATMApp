# 🏢 Office Management - Quick Start Guide

## 🚀 Getting Started

Your Office Management system is now **LIVE and READY TO USE**! Here's how to access and use it:

---

## 👨‍💼 For Organization Admins

### Step 1: Access Office Management
1. **Login** to UnifiedWork as an organization admin
2. Click on **Admin Dashboard** (top right)
3. Look for the **🏢 Office Management** tab in the sidebar
4. Click to open the Office Management interface

### Step 2: Set Up Resources

#### Add Office Desks
```
1. Click the "Desks" tab
2. Click [+ Add Desk] button
3. Fill in the form:
   - Name: e.g., "Desk A1", "Desk B2"
   - Floor: e.g., "1", "2", "Ground"
   - Section: e.g., "North Wing", "East Side"
   - Equipment:
     ☑ Has Monitor
     ☑ Has Docking Station
     ☑ Standing Desk
4. Click "Add Desk"
```

**Example Desks to Create**:
```
Desk A1 - Floor 1 - North Wing - Monitor + Docking
Desk A2 - Floor 1 - North Wing - Monitor + Standing
Desk B1 - Floor 2 - East Side - All equipment
Desk C1 - Floor 2 - West Side - Monitor only
```

#### Add Parking Spaces
```
1. Click the "Parking" tab
2. Click [+ Add Parking] button
3. Fill in the form:
   - Name: e.g., "P1", "P2", "Spot A"
   - Location: e.g., "Ground Floor - North", "Level -1 - South"
   - Features:
     ☑ Covered Parking
     ☑ EV Charging Station
     ☑ Handicap Accessible
4. Click "Add Parking"
```

**Example Parking to Create**:
```
P1 - Ground Floor North - Covered + EV Charging
P2 - Ground Floor North - Covered
P3 - Ground Floor South - Handicap + Covered
P4 - Level -1 - EV Charging
```

### Step 3: Configure Booking Rules
```
1. Click the "Settings" tab
2. Adjust booking rules:
   - Max Advance Booking Days: 7 (how far ahead users can book)
   - Cancellation Deadline Hours: 24 (minimum hours before booking)
   - ☑ Allow Same Day Booking (let users book today)
   - ☐ Require Admin Approval (auto-approve or manual)
3. Click "Save Settings"
```

**Recommended Settings**:
```
✓ Max Advance Booking: 7 days (one week ahead)
✓ Cancellation Deadline: 24 hours (can't cancel day-of)
✓ Allow Same Day Booking: YES (flexibility for users)
✓ Require Approval: NO (automatic confirmation)
```

### Step 4: Monitor Bookings
```
1. Click the "Bookings" tab
2. View all organization bookings:
   - Who booked what
   - Which dates
   - Booking status
3. Export or analyze booking data
```

---

## 👤 For Regular Users

### Step 1: Access Office Management
1. **Login** to UnifiedWork
2. Go to your **Dashboard** (home page)
3. Scroll down to find the **"Office Management"** widget
4. You'll see two main buttons:
   - 📚 **Book a Desk**
   - 🚗 **Book Parking**

### Step 2: Book a Desk

```
1. Click [Book a Desk] button
2. Select your date:
   - Pick tomorrow or any future date (within allowed booking window)
   - Calendar shows min/max dates based on org settings
3. View available desks:
   - See desk name, floor, section
   - Equipment icons: 🖥️ Monitor, 🔌 Docking, 📊 Standing
4. Click on your preferred desk
5. Click "Confirm Booking"
6. ✅ Booking confirmed!
```

**Example Flow**:
```
Date: January 19, 2026
Available Desks:
  → Desk A1 - Floor 1, North • Monitor • Docking     [SELECT]
    Desk A2 - Floor 1, North • Monitor • Standing
    Desk B1 - Floor 2, East • All Equipment
    
[Confirm Booking] [Cancel]
```

### Step 3: Book Parking

```
1. Click [Book Parking] button
2. Select your date (same as desk booking)
3. View available parking:
   - See parking name and location
   - Feature icons: 🏠 Covered, ⚡ EV Charging, ♿ Handicap
4. Click on your preferred parking spot
5. Click "Confirm Booking"
6. ✅ Booking confirmed!
```

**Example Flow**:
```
Date: January 19, 2026
Available Parking:
  → P1 - Ground Floor North • Covered • EV Charging  [SELECT]
    P2 - Ground Floor North • Covered
    P3 - Ground Floor South • Handicap • Covered
    
[Confirm Booking] [Cancel]
```

### Step 4: Manage Your Bookings

Your bookings appear in the **"My Bookings"** section:

```
┌─────────────────────────────────────────────┐
│  My Bookings                                │
├─────────────────────────────────────────────┤
│  🖥️ Desk A1 - Floor 1, North              │
│     Jan 19, 2026 • confirmed    [Cancel]   │
│                                             │
│  🚗 P1 - Ground Floor North                │
│     Jan 19, 2026 • confirmed    [Cancel]   │
└─────────────────────────────────────────────┘
```

**To Cancel a Booking**:
1. Find the booking in "My Bookings"
2. Click the [Cancel] button
3. Confirm cancellation
4. ✅ Booking cancelled (if within deadline)

⚠️ **Note**: You can only cancel if the booking is more than 24 hours away (or whatever your org admin set as the deadline)

---

## 🎯 Common Scenarios

### Scenario 1: Weekly Office Visit
**"I want to book a desk and parking for my weekly office day"**

```
1. Login Monday morning
2. Book desk for Thursday (3 days ahead)
   - Select Desk A1 with monitor
3. Book parking for Thursday
   - Select P1 with EV charging
4. Receive confirmation
5. Get reminder day before (future feature)
```

### Scenario 2: Hybrid Team Schedule
**"Our team comes in on Tuesdays and Thursdays"**

```
Admin Setup:
- Create 10 desks for the team
- Create 10 parking spots
- Set max advance booking: 7 days
- Enable same-day booking

Team Members:
- Book every Tuesday & Thursday
- View teammate bookings (future feature)
- Coordinate desk neighbors
```

### Scenario 3: Last-Minute Change
**"I need to cancel my booking tomorrow"**

```
Current Booking: Desk A1 for Jan 19, 2026
Today: Jan 18, 2026 at 9:00 AM
Cancellation Deadline: 24 hours before

✅ CAN CANCEL - More than 24 hours away
1. Go to My Bookings
2. Click [Cancel] on Jan 19 booking
3. Confirm cancellation
4. Desk becomes available for others
```

**Too Late to Cancel**:
```
Current Booking: Desk A1 for Jan 19, 2026
Today: Jan 18, 2026 at 11:00 PM
Cancellation Deadline: 24 hours before (passed)

❌ CANNOT CANCEL - Less than 24 hours away
- Contact your org admin for manual cancellation
- Or use the booking as planned
```

---

## 🔐 Access Levels

| Feature | Super Admin | Org Admin | Community Lead | User |
|---------|------------|-----------|----------------|------|
| Add/Delete Desks | ❌ | ✅ | ❌ | ❌ |
| Add/Delete Parking | ❌ | ✅ | ❌ | ❌ |
| Configure Settings | ❌ | ✅ | ❌ | ❌ |
| View All Bookings | ❌ | ✅ | ❌ | ❌ |
| Book Desk | ❌ | ✅ | ✅ | ✅ |
| Book Parking | ❌ | ✅ | ✅ | ✅ |
| View Own Bookings | ❌ | ✅ | ✅ | ✅ |
| Cancel Own Bookings | ❌ | ✅ | ✅ | ✅ |

---

## ⚠️ Important Rules

### Booking Limitations
- ✅ **One desk per day** - You can only book one desk per day
- ✅ **One parking per day** - You can only book one parking spot per day
- ✅ **Future dates only** - Cannot book for past dates
- ✅ **Within booking window** - Must be within max advance days (default: 7)
- ✅ **Organization only** - Can only book within your organization

### Cancellation Rules
- ⏰ **Deadline enforcement** - Must cancel before deadline (default: 24 hours)
- 🔄 **Immediate availability** - Cancelled resources immediately become available
- 📧 **No penalty** - No penalty for cancelling before deadline (configurable)

### Resource Management (Admin)
- 🚫 **Cannot delete if booked** - Resources with future bookings cannot be deleted
- 🔧 **Maintenance mode** - Set resources to "maintenance" to prevent bookings
- 📊 **Status tracking** - Available, Occupied, Reserved, Maintenance

---

## 🐛 Troubleshooting

### "No available desks/parking for this date"
**Solution**: 
- Choose a different date
- Ask admin to add more resources
- Check if resources are in maintenance mode

### "Cannot cancel booking"
**Solution**:
- Check if you're past the cancellation deadline
- Contact your org admin for manual cancellation
- Note the deadline (default 24 hours before)

### "Cannot book - already have booking for this date"
**Solution**:
- You already have a desk/parking for that day
- Cancel existing booking first (if allowed)
- Choose a different date

### "Office Management tab not visible"
**Solution**:
- Ensure you're logged in as org admin (for admin features)
- Check if you're part of an organization
- Refresh the page

---

## 📊 Best Practices

### For Admins
1. **Start small** - Add 5-10 desks and parking spots to test
2. **Clear naming** - Use consistent naming (Desk A1, A2 vs random names)
3. **Accurate features** - Mark equipment/features correctly
4. **Monitor usage** - Check Bookings tab weekly to see utilization
5. **Adjust settings** - Fine-tune based on user feedback

### For Users
1. **Book early** - Book as soon as you know your schedule
2. **Cancel promptly** - Cancel unused bookings so others can use them
3. **Check equipment** - Make sure the desk has what you need (monitor, docking, etc.)
4. **Note location** - Remember floor/section for easy finding
5. **Plan ahead** - Use the full booking window (7 days by default)

---

## 🎉 Success Metrics

After using Office Management for a month, you should see:

✅ **For Admins**:
- Clear view of office utilization
- Reduced desk conflicts
- Better capacity planning
- Analytics on popular desks/parking

✅ **For Users**:
- No more "desk hunting" on office days
- Guaranteed parking spot
- Know exactly where to sit
- Better team coordination

---

## 📞 Need Help?

**Feature Questions**: Check `OFFICE_MANAGEMENT_FEATURE.md`  
**API Documentation**: Visit http://localhost:8002/docs  
**Technical Issues**: Check backend logs in terminal  

**Status**: ✅ **SYSTEM READY - START USING NOW!**

---

**Quick Start Checklist**:
- [ ] Admin: Login to Admin Dashboard
- [ ] Admin: Add 3-5 desks
- [ ] Admin: Add 3-5 parking spots
- [ ] Admin: Configure settings
- [ ] User: Login to Dashboard
- [ ] User: Book a desk for tomorrow
- [ ] User: Book parking for tomorrow
- [ ] User: View your bookings
- [ ] Test: Try to cancel a booking

**Enjoy your new Office Management system! 🎊**
