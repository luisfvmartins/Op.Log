import fs from 'fs';

const modifyTable = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, "utf-8");
  
  // replace <table className="...">
  content = content.replace(/<table className="[^"]*"/g, `<table className="w-full text-left text-sm whitespace-nowrap border-collapse"`);
  
  // replace <thead>
  content = content.replace(/<thead>/g, `<thead className="bg-slate-50 dark:bg-[#09090B]/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">`);
  content = content.replace(/<tr className="border-b border-slate-200 dark:border-white\/10 bg-slate-50\/50 dark:bg-white\/5">/g, `<tr>`);
  
  // replace font-bold in table body
  content = content.replace(/<td className="p-4 font-bold text-slate-900 dark:text-white">/g, `<td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">`);
  content = content.replace(/<td className="p-4 font-semibold text-slate-900 dark:text-white">/g, `<td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">`);

  // replace p-4 in th and td 
  content = content.replace(/<th className="p-4/g, `<th className="px-4 py-3`);
  content = content.replace(/<td className="p-4 /g, `<td className="px-4 py-3 `);
  content = content.replace(/<td className="p-4"/g, `<td className="px-4 py-3"`);
  
  // Remove duplicate definitions of text size in th
  content = content.replace(/text-xs font-bold text-slate-500 uppercase tracking-wider text-left/g, "text-left");
  content = content.replace(/text-xs font-bold text-slate-500 uppercase tracking-wider text-right/g, "text-right");

  fs.writeFileSync(file, content);
};

["src/pages/DriversPage.tsx", "src/pages/VehiclesPage.tsx", "src/pages/SchedulesPage.tsx", "src/pages/OperationalNotesPage.tsx"].forEach(modifyTable);
