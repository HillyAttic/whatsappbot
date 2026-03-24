# WhatsApp Document Retrieval Bot

A WhatsApp-based document retrieval system that allows registered users to verify their identity via phone number and retrieve personal documents through a conversational chat interface.

## Features

- **WhatsApp Bot**: Automated message handling for document retrieval
- **Admin Panel**: Web interface for managing clients and documents
- **Firebase Integration**: Firestore for data storage, Firebase Storage for file management
- **Secure Access**: Signed URLs with 5-minute expiration for document downloads
- **Webhook Validation**: HMAC-SHA256 signature verification for WhatsApp webhooks

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Firebase Admin SDK
- WhatsApp Cloud API
- Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - `WHATSAPP_TOKEN`: Your WhatsApp Cloud API access token
   - `PHONE_NUMBER_ID`: Your WhatsApp phone number ID
   - `WEBHOOK_VERIFY_TOKEN`: A secret token for webhook verification
   - `APP_SECRET`: Your Meta app secret for signature validation
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: Your Firebase service account JSON

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to access the admin panel.

## Usage

### Admin Panel

1. Navigate to `/admin/clients` to manage clients
2. Add clients with name and phone number
3. Click "Documents" to manage documents for each client
4. Upload files and assign titles to documents

### WhatsApp Bot

Users can interact with the bot via WhatsApp:

1. Send "Hi" to see available documents
2. Reply with a number (1-5) to receive a document link
3. Links expire after 5 minutes for security

## API Routes

### Webhook
- `GET /api/webhook` - WhatsApp verification challenge
- `POST /api/webhook` - Incoming message handler

### Admin API
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create client
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Delete client (cascades to documents)
- `GET /api/admin/clients/[id]/documents` - List documents for client
- `POST /api/admin/clients/[id]/documents` - Create document with file upload
- `PUT /api/admin/clients/[id]/documents/[docId]` - Update document
- `DELETE /api/admin/clients/[id]/documents/[docId]` - Delete document

## Testing

Run tests with:
```bash
npm test
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to configure all environment variables in your Vercel project settings.

## Security

- Webhook requests are validated using HMAC-SHA256 signatures
- Document URLs expire after 5 minutes
- Files are stored securely in Firebase Storage
- Phone numbers are normalized for consistent lookups
- Input is sanitized to prevent injection attacks
