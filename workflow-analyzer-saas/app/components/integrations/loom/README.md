# Loom Integration

This integration allows users to import videos from Loom into the workflow analyzer.

## How it Works

Since Loom doesn't provide a public API for accessing user videos, our integration works as follows:

1. **URL Import**: Users paste their Loom share URL
2. **Validation**: The system validates the URL format
3. **Metadata Extraction**: We attempt to extract video metadata from the Loom page
4. **Video Preview**: Users can preview their video using Loom's embed player
5. **Manual Download**: Users must manually download the video from Loom and then upload it

## Components

### LoomImporter.tsx
The main component that handles the Loom URL input and validation.

### LoomVideoEmbed.tsx
Displays an embedded Loom video player for preview purposes.

### API Routes
- `/api/integrations/loom/import` - Validates Loom URLs and returns basic metadata
- `/api/integrations/loom/metadata` - Attempts to extract additional metadata from Loom pages

## Usage

```tsx
import { LoomImporter } from '@/app/components/integrations/loom/LoomImporter'

<LoomImporter
  onImportComplete={(videoUrl, metadata) => {
    // Handle import completion
  }}
  onError={(error) => {
    // Handle errors
  }}
/>
```

## Limitations

1. **No Direct API Access**: Loom doesn't provide a public API for downloading videos
2. **Manual Download Required**: Users must download videos manually from Loom
3. **Authentication**: Users must be signed into Loom to download their videos
4. **File Size**: Loom videos over 20GB cannot be downloaded
5. **Permissions**: Videos must have download permissions enabled

## Future Improvements

If Loom releases a public API in the future, we could:
- Implement OAuth authentication
- Directly list user's videos
- Download videos programmatically
- Access video analytics and metadata

## Alternative Approaches

1. **Browser Extension**: Create a browser extension that can capture Loom videos
2. **Loom SDK Integration**: Use Loom's SDK for recording directly within our app
3. **Screen Recording**: Implement our own screen recording functionality

## Resources

- [Loom Developer Portal](https://dev.loom.com/)
- [Loom SDK Documentation](https://dev.loom.com/docs/record-sdk/)
- [Loom Support - API Access](https://support.loom.com/hc/en-us/articles/360002228458)