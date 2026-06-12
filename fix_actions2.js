import fs from 'fs';

const fixTable = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Add more padding to the right for the last column (AÇÕES) to prevent cut off
  content = content.replace(/<th className="px-5 py-3 text-right">AÇÕES<\/th>/g, '<th className="px-5 py-3 pr-6 w-32 text-right">AÇÕES</th>');
  content = content.replace(/<th className="px-5 py-3 w-28 text-right">AÇÕES<\/th>/g, '<th className="px-5 py-3 pr-6 w-32 text-right">AÇÕES</th>');

  // Fix td padding
  content = content.replace(/<td className="px-5 py-3 text-right">/g, '<td className="px-5 py-3 pr-6 text-right">');

  fs.writeFileSync(file, content);
};

["src/pages/DriversPage.tsx", "src/pages/VehiclesPage.tsx", "src/pages/SchedulesPage.tsx", "src/pages/Dashboard.tsx"].forEach(fixTable);
