const BACKUP_FILE_NAME = 'roter-backup.json';

export async function createDriveBackup(data: any, accessToken: string): Promise<void> {
  // 1. Search for existing file
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();
  let fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

  if (!fileId) {
    // Create the file first to get the ID
    const createRes = await fetch(`https://www.googleapis.com/drive/v3/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
      }),
    });
    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error('Drive API Create Error:', errorText);
      throw new Error('Falha ao criar arquivo de backup no Google Drive: ' + errorText);
    }
    const createData = await createRes.json();
    fileId = createData.id;
  }

  // Now upload the media
  const fileContent = JSON.stringify(data, null, 2);
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: fileContent,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Drive API Upload Error:', errorText);
    throw new Error('Falha ao exportar backup para o Google Drive: ' + errorText);
  }
}

export async function restoreDriveBackup(accessToken: string): Promise<any> {
  // 1. Search for existing file
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();
  const fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

  if (!fileId) {
    throw new Error('Nenhum backup encontrado no Google Drive.');
  }

  // 2. Download file content
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Falha ao baixar backup do Google Drive.');
  }

  const data = await res.json();
  return data;
}
