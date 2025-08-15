# Lunch with Gareth

## Overview

**Lunch with Gareth** is a mobile-first PWA for those of us with a friend who has a mysterious, chronic case of _wallet amnesia_. In my case, that’s Gareth. Whether it’s lunch, coffee, or “I’ll get you next time,” I’m usually the one picking up the tab.

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

## 🚀 Live Demo

**Production URL**: https://mattcrooks.github.io/lunchwithgareth/

## ✨ Features

- 📱 **Mobile-First PWA** - Native app experience on any device
- 🔐 **Secure Key Management** - Local encryption with biometric authentication
- 📸 **Receipt Scanning** - Camera capture with manual entry fallback
- 💰 **Real-time FX** - Live Bitcoin exchange rates from multiple sources
- 👥 **Smart Splitting** - Equal or custom split modes with contact management
- ⚡ **Nostr Integration** - NIP-57 zap requests with multi-relay publishing
- 🏪 **Privacy First** - No merchant data, location, or cloud dependencies
- 📊 **Payment Tracking** - Complete history with filters and search

---

## Screenshots

_(Add screenshots here when available)_

---

## Roadmap

- [ ] Nostr follows as in-app contacts
- [ ] Push notifications on payment confirmation
- [ ] Cloud OCR option
- [ ] Custom split amounts

---

### Local Setup

```sh
# Clone the repository
git clone https://github.com/mattcrooks/zap-receipt-split.git

# Navigate to project directory
cd zap-receipt-split

# Install dependencies (takes ~2 minutes)
npm install

# Start development server (starts in <1 second)
npm run dev

# Visit http://localhost:8080
```

### Build Commands

```sh
# Development build
npm run build:dev

# Production build
npm run build

# Preview built app
npm run preview

# Code quality
npm run lint
```

## 🚀 Deployment

### GitHub Pages (Automatic)

The app automatically deploys to GitHub Pages on every push to `main`:

1. **Enable GitHub Pages** in repository settings
2. **Select "GitHub Actions"** as source
3. **Push changes** to main branch
4. **App goes live** at: https://mattcrooks.github.io/zap-receipt-split/

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

### Manual Deployment

For other hosting providers:

```sh
# Build for production
npm run build

# Deploy the dist/ folder to your hosting service
```

## 📱 Usage

### First Time Setup

1. **Import/Generate Nostr Key** - Secure local storage
2. **Enable Biometric Auth** - Touch/Face ID protection
3. **Connect to Relays** - Automatic relay discovery
4. **Load Contacts** - Import follow list or add manually

### Creating Payment Requests

1. **📸 Scan Receipt** - Camera or upload
2. **💵 Enter Details** - Amount, meal type, date
3. **👥 Add Participants** - From contacts or manual entry
4. **⚖️ Configure Split** - Equal or custom shares
5. **⚡ Publish Request** - Multi-relay broadcast
6. **📊 Track Payments** - Real-time zap monitoring

## 🏗️ Architecture

### Core Services

- **FxManager** - Real-time Bitcoin exchange rates
- **StorageManager** - IndexedDB local persistence
- **EventManager** - Nostr event creation and publishing
- **ContactManager** - NIP-02 follow lists and manual contacts
- **RelayManager** - Multi-relay connection management
- **BillSplitService** - Complete workflow orchestration

### Security Features

- 🔐 **Device-Only Keys** - Private keys never leave device
- 🔒 **AES-256 Encryption** - Password-derived key encryption
- 👆 **Biometric Gates** - WebAuthn authentication
- 🕵️ **Privacy Protection** - No location/merchant data
- 📝 **Audit Trail** - Complete operation logging

## License

This project is licensed under the **Mozilla Public License 2.0** - see the [LICENSE](LICENSE) file.

---
