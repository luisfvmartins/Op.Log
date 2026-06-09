const BACKUP_FILE_NAME = 'roter-backup.json';

export async function createDriveBackup(data: any, accessToken: string): Promise<void> {
  // 1. Search for existing file
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();
  const fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

  const fileMetadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
  };

  const fileContent = JSON.stringify(data, null, 2);
  const blob = new Blob([fileContent], { type: 'application/json' });

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
  form.append('file', blob);

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  
  const method = fileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error('Falha ao exportar backup para o Google Drive.');
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
