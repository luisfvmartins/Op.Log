import fs from 'fs';

const fixTable = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Change th AÇÕES
  content = content.replace(/<th className="px-4 py-3 text-right">AÇÕES<\/th>/g, '<th className="px-5 py-3 text-right">AÇÕES</th>');
  content = content.replace(/<th className="px-4 py-3 w-28 text-right">AÇÕES<\/th>/g, '<th className="px-5 py-3 w-28 text-right">AÇÕES</th>');

  // Dashboard fix
  content = content.replace(/<td className="px-4 py-3 text-right">/g, '<td className="px-5 py-3 text-right">');


  // For SchedulesPage
  content = content.replace(/<td className="px-4 py-3 text-right">\s*<button onClick=\{\(\) => handleOpenModal\(s\)\} className="p-1\.5 text-slate-400 hover:text-blue-600 transition" title="Editar">\s*<Edit2 className="w-4 h-4"\/>\s*<\/button>\s*\{!isEncerrado && \(\s*<button onClick=\{\(\) => handleComplete\(s\)\} className="p-1\.5 text-slate-400 hover:text-emerald-600 transition" title="Encerrar">\s*<CheckCircle className="w-4 h-4" \/>\s*<\/button>\s*\)\}\s*<button onClick=\{\(\) => setDeletingScheduleId\(s\.id\!\)\} className="p-1\.5 text-slate-400 hover:text-red-600 transition" title="Excluir">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>\s*<\/td>/g, 
  `<td className="px-5 py-3 text-right">
                                   <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => handleOpenModal(s)} className="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Editar">
                                         <Edit2 className="w-4 h-4"/>
                                      </button>
                                      {!isEncerrado && (
                                         <button onClick={() => handleComplete(s)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition" title="Encerrar">
                                            <CheckCircle className="w-4 h-4" />
                                         </button>
                                      )}
                                      <button onClick={() => setDeletingScheduleId(s.id!)} className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Excluir">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                </td>`);
                                
  // For DriversPage
  content = content.replace(/<td className="px-4 py-3 text-right">\s*<button onClick=\{\(\) => \{\s*setEditingDriver\(d\);\s*setIsDriverModalOpen\(true\);\s*\}\} className="p-1\.5 text-slate-400 hover:text-blue-600 transition" title="Editar">\s*<Edit2 className="w-4 h-4"\/>\s*<\/button>\s*<button onClick=\{\(\) => setDeletingDriverId\(d\.id\!\)\} className="p-1\.5 text-slate-400 hover:text-red-600 transition" title="Excluir">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>\s*<\/td>/g,
  `<td className="px-5 py-3 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setEditingDriver(d); setIsDriverModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Editar">
                                     <Edit2 className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => setDeletingDriverId(d.id!)} className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Excluir">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>`);
                            
  // For VehiclesPage
  content = content.replace(/<td className="px-4 py-3 text-right">\s*<button onClick=\{\(\) => \{\s*setEditingVehicle\(v\);\s*setIsVehicleModalOpen\(true\);\s*\}\} className="p-1\.5 text-slate-400 hover:text-blue-600 transition" title="Editar">\s*<Edit2 className="w-4 h-4"\/>\s*<\/button>\s*<button onClick=\{\(\) => setDeletingVehicleId\(v\.id\!\)\} className="p-1\.5 text-slate-400 hover:text-red-600 transition" title="Excluir">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>\s*<\/td>/g,
  `<td className="px-5 py-3 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setEditingVehicle(v); setIsVehicleModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Editar">
                                     <Edit2 className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => setDeletingVehicleId(v.id!)} className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Excluir">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>`);

  fs.writeFileSync(file, content);
};

["src/pages/DriversPage.tsx", "src/pages/VehiclesPage.tsx", "src/pages/SchedulesPage.tsx", "src/pages/Dashboard.tsx"].forEach(fixTable);
