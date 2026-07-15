# Live integration artifacts

These files configure the external services used by Glow & Go's live voice-agent demo. They do not run in the Next.js app or ship in its browser bundle.

Apply them in this order:

1. Create a Google Sheet using `google-sheets/schema.md` and keep it limited to synthetic data.
2. Import `n8n/booking.workflow.json`, select the Google Sheets credential named in its nodes, replace `<GOOGLE_SHEET_ID>`, and activate the workflow.
3. Regenerate `knowledge-base.md` with `pnpm generate:kb`, then add it to the ElevenLabs agent's knowledge base.
4. Create the four ElevenLabs webhook tools from `elevenlabs/`, replacing `<N8N_HOST>` with the n8n host.

The mock API and `lib/booking/` remain the executable source of truth. Chunk 13 provides the detailed account-by-account wiring guide.
