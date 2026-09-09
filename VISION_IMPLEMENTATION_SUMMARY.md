# OpenRouter Vision & Image Explanation Implementation

## Overview
Complete multimodal image processing system for e-Mate AI, enabling users to upload and explain images using OpenRouter vision-capable models.

---

## Files Created

### 1. API Endpoint: `/api/explain-image/route.ts`
**Purpose:** Handle multimodal image explanation requests  
**Model:** `google/gemini-2.5-flash` (vision-capable)  
**Key Features:**
- Accepts base64 data URIs or HTTPS image URLs
- Formats content as multimodal array: `[{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url } }]`
- Authentication required (authenticated users only)
- Comprehensive error handling with status codes
- Edge runtime compatible

**Payload Structure:**
```typescript
POST /api/explain-image
{
  imageDataUrl: "data:image/png;base64,iVBORw0KGgo...",
  prompt: "What does this diagram show?"
}
```

**Response:**
```typescript
{
  explanation: "This is a diagram showing..."
}
```

---

### 2. Utility Functions: `/lib/imageUtils.ts`
**Exports:**
- `fileToBase64DataUri(file)` — Convert File objects to base64 data URIs
- `isValidImageFile(file)` — Validate JPEG, PNG, GIF, WebP formats
- `formatFileSize(bytes)` — Human-readable file size formatting

---

### 3. Vision Integration Layer: `/lib/visionIntegration.ts`
**Exports:**
- `formatMultimodalMessage(textContent, imageDataUri)` — Create multimodal content arrays
- `VISION_MODELS` — Array of vision-capable model IDs
- `isVisionModel(modelId)` — Check if model supports vision
- `getRecommendedVisionModel()` — Get default vision model (Gemini 2.5 Flash)

---

### 4. Custom Hook: `/lib/hooks/useImageExplanation.ts`
**Purpose:** Encapsulate image explanation logic for React components

**API:**
```typescript
const { explanation, loading, error, explainImage } = useImageExplanation();

// Call the hook
await explainImage(imageDataUrl, prompt);
```

**State:**
- `explanation: string` — Generated explanation text
- `loading: boolean` — Request in progress
- `error: string | null` — Error message if failed

---

### 5. UI Component: `/components/ImageExplanationCard.tsx`
**Features:**
- Drag-and-drop image upload
- Real-time preview
- Custom prompt input
- Loading states with spinner
- Error/success feedback
- File validation (size, format)
- Clear/reset functionality

**Usage:**
```typescript
<ImageExplanationCard 
  onExplanationReady={(explanation) => {
    // Handle explanation text
  }}
  onClose={() => {
    // Handle close
  }}
/>
```

---

## Architecture: Multimodal Message Formatting

OpenRouter requires a specific content structure for vision requests:

### Before (Incorrect — 400 Bad Request)
```typescript
{
  model: "google/gemini-2.5-flash",
  messages: [
    {
      role: "user",
      content: "Explain this image"  // ❌ String only, no image
    }
  ]
}
```

### After (Correct — Multimodal Array)
```typescript
{
  model: "google/gemini-2.5-flash",
  messages: [
    {
      role: "user",
      content: [  // ✅ Array of content blocks
        {
          type: "text",
          text: "Explain this image"
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/png;base64,iVBORw0KGgo..."  // Base64 or HTTPS URL
          }
        }
      ]
    }
  ]
}
```

---

## Vision-Capable Models on OpenRouter

All models below support multimodal (text + image) input:

1. **google/gemini-2.5-flash** ⭐ (Recommended)
   - Ultra-fast TTFT (~100-200ms)
   - Best for real-time image analysis
   - Excellent accuracy

2. **google/gemini-2.5-pro**
   - Higher reasoning capability
   - Slower than Flash
   - For complex analysis

3. **google/gemini-2.0-flash**
   - Previous-gen but still fast
   - Fallback option

4. **anthropic/claude-3.5-sonnet**
   - Premium accuracy
   - Slower response time

5. **openai/gpt-4o-mini**
   - Good balance
   - OpenAI ecosystem

---

## Key Requirements Met

✅ **Vision-Capable Model Routing**  
- Hardcoded to `google/gemini-2.5-flash` in `/api/explain-image`
- `isVisionModel()` utility prevents routing to non-vision models

✅ **Multimodal Payload Structuring**  
- `formatMultimodalMessage()` creates proper content arrays
- Both `/api/explain-image` and `/api/chat` support multimodal content blocks

✅ **Data URI & Base64 Validation**  
- `fileToBase64DataUri()` ensures proper `data:image/...;base64,` prefix
- ImageExplanationCard validates file format and size before upload
- API endpoint validates data URI format on request

✅ **Error Handling**  
- OpenRouter error mapping via `getOpenRouterErrorMessage(status)`
- Detailed client-side error toast notifications
- Raw error logging for debugging

---

## Integration Points

### Existing Files Modified
None — implementation is purely additive and backward-compatible.

### Ready to Integrate
1. **ChatMainArea.tsx** — Add ImageExplanationCard modal
2. **PromptInput.tsx** — Add `/image-explain` slash command
3. **Chat routes** — Already support multimodal content arrays

---

## Build & Deployment Status

✅ **TypeScript Compilation:** Passes (no errors)  
✅ **Next.js Build:** Success (33.3s)  
✅ **Edge Runtime:** Compatible  
✅ **Route Added:** `/api/explain-image` (156 B)

---

## Testing Checklist

- [ ] Upload JPEG image → Generate explanation
- [ ] Upload PNG image with diagram → Verify accuracy
- [ ] Try oversized image (>5MB) → Check error handling
- [ ] Invalid format (PDF, DOCX) → Check validation
- [ ] Guest user → Check auth requirement (403)
- [ ] No OpenRouter key → Check error message
- [ ] Empty prompt → Check validation
- [ ] Network error → Check retry/fallback

---

## Security Notes

1. **Authentication:** Image explanation requires valid OpenRouter API key
2. **File Validation:** MIME type + extension checks
3. **Size Limits:** 5 MB max to prevent payload bloat
4. **Data Privacy:** Images are sent to OpenRouter servers (as per terms)
5. **Cookie Handling:** User key extracted from secure HTTP-only cookie

---

## Future Enhancements

- Batch image processing (multiple images in one request)
- Image description caching to reduce redundant API calls
- Integration with notebook system to attach explanations to notes
- Image analysis within quiz/flashcard generation
- Handwriting recognition for uploaded diagrams
