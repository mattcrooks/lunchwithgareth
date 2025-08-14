# Lunch with Gareth

## Overview

**Lunch with Gareth** is a mobile-first PWA for those of us with a friend who has a mysterious, chronic case of *wallet amnesia*. In my case, that’s Gareth. Whether it’s lunch, coffee, or “I’ll get you next time,” I’m usually the one picking up the tab.

This app lets me snap a photo of the receipt, OCR the details, and - because we live in the future - send a Nostr event asking Gareth (or anyone else) for their share in sats. It keeps a local history of all events, so I can track the endless parade of “I owe you” moments.

You can:
- Split the bill equally between participants
- Shout the entire bill yourself
- Mark that the other person picked up the bill

The goal is simple: a minimal, fun way to settle up and poke fun at the friend who never seems to reach for their card.

---

## How it Works

1. **Scan the Receipt**  
   Open the app and snap a photo of the receipt. The app uses OCR to pull key details like merchant, date, and total.

2. **Review & Confirm**  
   Correct OCR data if needed. Optionally add tip or adjust total.

3. **Select Participants**  
   Pick from Nostr contacts or paste pubkeys.

4. **Pick the Payment Mode**  
   - **Split**  
   - **I Pay All**  
   - **They Pay All**

5. **Send the Request**  
   The app creates and signs a Nostr event. Optionally attach receipt image or hash. Publish to your relays.

6. **Track Payments**  
   Use History to see paid vs unpaid.

---

## Features

- **Receipt Scanning** with OCR
- **Local Storage** of receipts and events
- **Optional Cloud Backup**
- **Nostr Integration** for payment requests
- **History View**
- **Flexible Payment Modes**

---

## Screenshots

*(Add screenshots here when available)*

---

## Roadmap

- [ ] Nostr follows as in-app contacts
- [ ] Push notifications on payment confirmation
- [ ] Cloud OCR option
- [ ] Custom split amounts

---

## Build & Run

*(To be added later)*

---

## License

This project is licensed under the **Mozilla Public License 2.0** - see the [LICENSE](LICENSE) file.

---
