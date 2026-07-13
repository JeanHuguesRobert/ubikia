# YouTube platform notes — July 2026

## Status

These notes capture current platform behavior for implementation and onboarding. They are dated because YouTube policies, fields, and interfaces may change.

Primary references:

- https://support.google.com/youtube/answer/12751636
- https://support.google.com/youtube/answer/14328491
- https://support.google.com/youtube/answer/4603579

A connector or onboarding agent must verify current requirements at execution time.

## Podcast model

YouTube currently models a podcast show as a playlist and each episode as a video in that playlist.

Consequences for Ubikia:

- an MP3 alone is not a YouTube podcast episode;
- the static-artwork MP4 is a necessary target-specific appearance;
- a playlist may initially be created normally and later designated as a podcast;
- full episodes belong in the podcast playlist;
- clips and Shorts should remain separate;
- podcast episodes may be available for audio-only playback;
- a square podcast thumbnail is distinct from the landscape episode artwork.

YouTube currently recommends a 1280×1280 square podcast thumbnail. The initial Ubikia video command produces a 1920×1080 episode video, so the two image products should remain separate.

## Encoding

The initial Ubikia YouTube asset uses:

```text
container: MP4
video: H.264
sound: AAC, 192 kbit/s
frame: 1920×1080, square pixels
```

This is consistent with YouTube's documented MPEG-4 preference for H.264 video and AAC audio.

## Synthetic voice and platform AI-use field

Ubikia separates two different declarations:

1. an editorial disclosure in the description that a synthetic custom voice is used;
2. the YouTube `AI use` field during upload.

As of July 2026, YouTube's help explicitly lists cloning one's own voice for voice-overs or dubs among examples that do not require the platform AI-use disclosure. This does not prevent an author from making a voluntary textual disclosure.

Therefore:

```text
syntheticVoiceDisclosure
  default: present in the prepared description

alteredOrSyntheticContent
  default: null, requiring a current policy decision before upload
```

Other uses of a synthetic voice may require a different decision, especially when content makes a real person appear to say something they did not say or when the voice is used without authorization.

## Initial release procedure

For the first episodes:

1. prepare the package in Ubikia;
2. upload the MP4 manually as private;
3. inspect the current upload fields;
4. decide the AI-use field based on the actual content and current policy;
5. review the complete uploaded episode;
6. add it to the intended playlist or podcast;
7. publish only through a distinct human decision;
8. record the resulting identifier, URL, metadata, and visibility.
