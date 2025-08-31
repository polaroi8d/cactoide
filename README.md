# Cactoide(ae) 🌵

Events that thrive anywhere.

Like the cactus, great events bloom under any condition when managed with care. Cactoide(ae) helps you streamline RSVPs, simplify coordination, and keep every detail efficient—so your gatherings are resilient, vibrant, and unforgettable.

<p align="center">
  <a href="https://cactoide.dalev.hu/" target="blank">
    <picture>
      <img alt="actoide" src="https://github.com/user-attachments/assets/30b87181-1e3b-49d0-869e-bef6dcf7f777" width="840">
    </picture>
  </a>
</p>

#### What is it?

A mobile-first event RSVP platform that lets you create events, share unique URLs, and collect RSVPs without any registration required.

### ✨ Features

- **🎯 Instant Event Creation** - Create events in seconds with our streamlined form. No accounts, no waiting, just pure efficiency.
- **🔗 One-Click Sharing** - Each event gets a unique, memorable URL. Share instantly via any platform or messaging app.
- **🔍 All-in-One Clarity** - No more scrolling through endless chats and reactions. See everyone's availability and responses neatly in one place.
- **👤 No Hassle, No Sign-Ups** - Skip registrations and endless forms. Unlike other event platforms, you create and share instantly — no accounts, no barriers.
- **🛡️ Smart Limits** - Choose between unlimited RSVPs or set a limited capacity. Perfect for any event size.
- **✨ Effortless Simplicity** - Designed to be instantly clear and easy. No learning curve — just open, create, and go.

### Quick Start

Requirements: git, docker, docker-compose
Uses the [`docker-compose.yml`](docker-compose.yml) file to setup the application with the database. You can define all ENV variables in the [`.env`](.env.example) file from the `.env.example`.

```bash
git clone https://github.com/polaroi8d/cactoide/
cd cactoide
cp env.example .env
docker compose up -d
```

### Development

Requirements: git, docker, docker-compose, node at least suggested 20.19.0

```bash
git clone https://github.com/polaroi8d/cactoide/
cd cactoide
cp env.example .env
make db-only
npm run dev -- --open
```

Your app will be available at `http://localhost:5173`. You can use the Makefile commands to run the application or the database, eg.: `make db-only`.

### License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

**Made with ❤️ by @polaroi8d**
