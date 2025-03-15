const ENDPOINT = 'https://oauth.reddit.com/api/';
const FAKE_CLIENT =
  'redditWebClient=desktop2x&app=desktop2x-client-production&raw_json=1&gilding_detail=1';

export function getHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
  };
}

export async function removeThing(token: string, id: string) {
  const form = new URLSearchParams();
  form.set('id', id);

  const res = await fetch(`${ENDPOINT}del?${FAKE_CLIENT}`, {
    method: 'POST',
    body: form,
    headers: getHeaders(token),
  });

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 200) {
    throw new Error('Rate limited?');
  }
}

export async function editThing(token: string, id: string, text: string) {
  const form = new URLSearchParams();
  form.set('api_type', 'json');
  form.set('return_rtjson', 'true');
  form.set('thing_id', id);
  form.set('text', text);

  const res = await fetch(
    `${ENDPOINT}editusertext?emotes_as_images=true&rtj=only&${FAKE_CLIENT}`,
    {
      method: 'POST',
      body: form,
      headers: getHeaders(token),
    }
  );

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 200) {
    throw new Error('Rate limited?');
  }
}

export async function getUser(
  token: string
): Promise<{ id: string; name: string; icon_img?: string }> {
  const res = await fetch(`${ENDPOINT}v1/me?raw_json=1&gilding_detail=1`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 200) {
    throw new Error('Rate limited?');
  }

  const json = await res.json();
  return json;
}
