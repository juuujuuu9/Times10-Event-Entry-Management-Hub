# Frequently Asked Questions

## For Attendees

**Q: I didn't get my QR code email. What should I do?**

Check your spam/promotions folder first. If it's not there, contact the event organizer — they can re-send your QR code from the admin panel using your name or email.

**Q: Can I show my QR code from my Apple Wallet or Google Pay?**

No, the system requires the actual QR code image. Save it to your Photos app for easiest access.

**Q: My phone screen is cracked. Will the QR code still work?**

It depends on how badly cracked. If the crack obscures part of the QR code, it may not scan. Try the full-screen mode (tap the QR), or ask staff to look you up manually with your name.

**Q: Can I forward my QR code email to a friend?**

No — each QR code is unique to the registered attendee. Your friend needs to register separately to get their own QR code.

**Q: I registered twice by mistake. Which QR code do I use?**

Either one will work, but use the most recent email. The system links both registrations to you, so you'll only be checked in once.

**Q: Can I print my QR code?**

You can, but phone screens work better. Printed codes can have scanning issues with certain lighting. We recommend showing it on your phone.

**Q: What if my phone dies at the event?**

Give your name to staff at check-in. They can look you up manually in the system.

---

## For Staff

**Q: The QR code won't scan. What now?**

1. Ask the attendee to maximize screen brightness
2. Try holding phones at different distances (4-6 inches is ideal)
3. Tilt either phone to avoid glare
4. If still not working, use Manual Lookup with their name/email

**Q: Someone already checked in but forgot and is trying again.**

The scanner will show "Already Checked In" in yellow, with their check-in time. Politely let them know they're already registered as arrived.

**Q: The scanner says "Invalid QR Code."**

This usually means:
- The QR is corrupted or cropped
- The attendee is showing a QR from a different event
- Their registration was deleted

Ask for their name and use Manual Lookup.

**Q: Can I use the scanner on my personal phone?**

Yes — the scanner is a web page that works on any modern smartphone with a camera.

**Q: Do I need to install an app?**

No. The scanner works in your web browser (Chrome, Safari, etc.).

**Q: What if I lose internet connection?**

The scanner works offline! Check-ins are saved locally and sync automatically when you reconnect. You'll see an "Offline Mode" indicator.

---

## For Administrators

**Q: How many attendees can I import at once?**

There's no hard limit, but we recommend batches of 1,000 or less for best performance. Larger imports may take a few minutes.

**Q: Can I edit an attendee's information after importing?**

Not directly through the interface. You can delete the attendee and re-add them with correct information, or modify the data directly in your database if you have access.

**Q: I sent the QR emails but some bounced.**

Check the bulk send results for failed addresses. Common causes:
- Invalid email format
- Mailbox full
- Resend domain not verified (free tier limitation)

**Q: Can I customize the email that gets sent?**

The email template is hardcoded. To customize it, you'll need to modify `src/lib/email.ts` in the codebase and redeploy.

**Q: Can I send QR codes in batches?**

Yes — the import process creates attendees. You can send emails immediately, or wait and send later. You can also send to individual attendees from their detail page.

**Q: What happens if I delete an event?**

All attendee data and check-ins for that event are deleted. QR codes for that event will no longer work.

**Q: Can I have multiple events running simultaneously?**

Yes. Each event has its own attendee list and QR codes. Staff need to select the correct event in the scanner.

**Q: How long do QR codes stay valid?**

QR codes are valid for 7 days by default (configurable). For multi-day events, the system handles this automatically.

**Q: Can attendees check themselves in?**

No — this is designed for staff-controlled check-in to prevent fraud and track actual attendance.

**Q: Is there a way to see who's currently at the event?**

Yes — the admin dashboard shows check-in status in real-time. You can see who has checked in and when.

**Q: Can I export the check-in data?**

Yes — select attendees and click Export, or export all. You get a CSV with names, check-in times, and status.

**Q: What if someone shows up who isn't on the list?**

You can add them manually through the RSVP form (if it's still open) or add them directly in the admin panel.

---

## Technical Issues

**Q: The scanner camera won't turn on.**

Check browser permissions:
- Safari: Settings → Safari → Camera (set to "Ask" or "Allow")
- Chrome: Tap the lock icon in address bar → Site Settings → Camera → Allow

**Q: Check-ins aren't showing up in the dashboard.**

If staff are in offline mode, check-ins queue locally and sync when they reconnect. Make sure staff have internet access, then refresh the dashboard.

**Q: The page loads but looks broken.**

Try a hard refresh:
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

Or clear browser cache for the site.

**Q: I get "Database connection error."**

This is a server-side issue. Check that your `DATABASE_URL` environment variable is set correctly, or contact whoever deployed the system.

---

## Privacy & Security

**Q: What data is collected about attendees?**

Name, email, phone, company, and dietary restrictions (if provided). Check-in time and device info are also logged.

**Q: Is the data shared with third parties?**

No. The only external service used is Resend for email delivery, which only receives the email address and message content.

**Q: Can someone fake a QR code?**

No — each QR contains a cryptographically random token that's verified against the database. Screenshots of valid QRs work, but generated fakes don't.

**Q: How long is attendee data kept?**

As long as the event exists in the system. You can delete events to purge data.

---

*Don't see your question? Check the [User Guide](./USER-GUIDE.md) or [Quick Start](./QUICK-START.md)*
