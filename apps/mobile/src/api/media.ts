import { request } from './client';

/**
 * Uploads a local photo (file:// from the camera/library, or a data: URI) and
 * returns its stored reference, a relative `/media/...` path. Use `mediaUrl()`
 * from ./client to display it.
 */
export async function uploadPhoto(uri: string, mimeType = 'image/jpeg'): Promise<string> {
  if (uri.startsWith('/media/')) return uri; // already uploaded

  if (uri.startsWith('data:')) {
    // AI results arrive as data: URIs; RN can't reliably turn those into a
    // multipart file, so send them as JSON instead.
    const res = await request<{ url: string }>('/media/data-url', {
      method: 'POST',
      body: { data_url: uri },
    });
    return res.url;
  }

  const form = new FormData();
  const ext = mimeType.split('/')[1] ?? 'jpg';
  // React Native's FormData accepts a { uri, name, type } file descriptor.
  form.append('file', { uri, name: `photo.${ext}`, type: mimeType } as unknown as Blob);
  const res = await request<{ url: string }>('/media', { method: 'POST', form });
  return res.url;
}
