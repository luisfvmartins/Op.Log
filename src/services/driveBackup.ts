const BACKUP_FILE_NAME = 'roter-backup.json';

export async function createDriveBackup(data: any, accessToken: string): Promise<void> {
  const q = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!searchRes.ok) {
    const err = await searchRes.text();
    console.error('Search error:', err);
    throw new Error('Falha ao buscar backup existente na nuvem.');
  }
  
  const searchData = await searchRes.json();
  const fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const metadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(data, null, 2) +
    close_delim;

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const method = fileId ? 'PATCH' : 'POST';

  const uploadRes = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Drive API Upload Error:', errorText);
    throw new Error('Falha ao exportar backup para o Google Drive: ' + errorText);
  }
}

export async function restoreDriveBackup(accessToken: string): Promise<any> {
  const q = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!searchRes.ok) {
    throw new Error('Falha ao buscar backup na nuvem.');
  }

  const searchData = await searchRes.json();
  const fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

  if (!fileId) {
    throw new Error('Nenhum backup encontrado no Google Drive.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Falha ao baixar backup do Google Drive.');
  }

  const data = await res.json();
  return data;
}
