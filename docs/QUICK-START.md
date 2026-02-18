# QR Check-In — Quick Start Guide

## 30-Second Setup

### 1. Create Your Event
```
Admin Dashboard → New Event → Enter Name → Save
```

### 2. Add Attendees
```
Import CSV → Upload File → Confirm
```

Your CSV needs at minimum:
```csv
email,first_name,last_name
alice@example.com,Alice,Smith
```

### 3. Send QR Codes
```
After import → "Send QR Codes via Email" → Confirm
```

### 4. Check In Attendees
```
Staff: Open Scanner → Start Scanning → Point at QR codes
```

---

## Before the Event Checklist

**Week before:**
- [ ] Create event in admin panel
- [ ] Import attendee CSV
- [ ] Send QR code emails
- [ ] Test scan with your own phone

**Day before:**
- [ ] Export attendee list as backup
- [ ] Check scanner works on staff phones
- [ ] Brief staff on manual lookup (for QR failures)

**Day of:**
- [ ] Staff open scanner page
- [ ] Test one check-in before doors open
- [ ] Have admin dashboard open on laptop as backup

---

## The QR Code Journey

```
Attendee registers
       ↓
System generates unique QR code
       ↓
Email sent with QR code attached
       ↓
Attendee saves QR (email/screenshot)
       ↓
At event: Shows QR to staff
       ↓
Staff scans → Instant check-in
       ↓
Check-in recorded in database
```

---

## Common Mistakes to Avoid

❌ **Cropping the QR code image**  
✅ Keep the white border — it's part of the code

❌ **Sending QR emails before CSV is finalized**  
✅ Import is complete first, then send once

❌ **Multiple staff using same login**  
✅ Each staff member should use their own device

❌ **Forgetting about offline mode**  
✅ Check-ins sync automatically when WiFi returns

---

## Emergency Procedures

**Scanner completely broken:**
1. Use manual lookup by name
2. Check off paper list as last resort
3. Check people in via admin dashboard after the fact

**Wrong event data imported:**
1. Don't panic — you can delete individual attendees
2. Or delete the whole event and start over
3. QR codes for deleted attendees won't work

**Email blast sent to wrong list:**
1. There's no undo — emails were sent
2. Send a correction email if needed
3. Update your CSV import process for next time

---

## Stats to Watch

During your event, monitor:
- **Check-in rate** — How many have arrived
- **Duplicates** — Anyone trying to check in twice
- **Manual lookups** — How many QR scans are failing (should be <5%)

After your event, export data for:
- No-shows (registered but didn't check in)
- Walk-up registrations (added at door)
- Check-in times (when did the rush happen?)

---

## Pro Tips

🎯 **Test with your own phone first**  
Register yourself, send the email, scan your own QR.

🎯 **Have a backup plan**  
Always be ready to do manual name lookup.

🎯 **Brief your staff**  
Make sure they know about the 4-6 inch scanning distance.

🎯 **Watch the glare**  
Bright venue lights can cause scanning issues.

🎯 **Bring chargers**  
Staff phones will be scanning all day.

---

*Need more detail? See the full [User Guide](./USER-GUIDE.md)*
