import fs from 'fs';

const fixTableActions = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Regex to wrap inline buttons inside the last td in SchedulesPage.
  // We'll target the sequence of buttons.
  const regexSchedules = /<td className="px-5 py-3 pr-6 text-right">\s*(<button[\s\S]*?)<\/td>/g;
  
  content = content.replace(regexSchedules, (match, buttons) => {
     if (buttons.includes('<div className="flex')) {
         return match; // already wrapped
     }
     return `<td className="px-5 py-3 pr-6 text-right">
       <div className="flex items-center justify-end gap-1">
         ${buttons}
       </div>
     </td>`;
  });
  
  // also target cases with px-4 py-3 (if my prev regex failed)
  const regexOlder = /<td className="px-4 py-3 text-right">\s*(<button[\s\S]*?)<\/td>/g;
  content = content.replace(regexOlder, (match, buttons) => {
     if (buttons.includes('<div className="flex')) {
         return match; // already wrapped
     }
     return `<td className="px-5 py-3 pr-6 text-right">
       <div className="flex items-center justify-end gap-1">
         ${buttons}
       </div>
     </td>`;
  });

  fs.writeFileSync(file, content);
};

["src/pages/DriversPage.tsx", "src/pages/VehiclesPage.tsx", "src/pages/SchedulesPage.tsx"].forEach(fixTableActions);
