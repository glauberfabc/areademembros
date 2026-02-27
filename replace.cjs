const fs = require('fs');

const coursesModules = [
    { id: 'M01', title: 'Comece por aqui', image: '/images/m01.png', classes: 2, duration: '20min', progress: 100, locked: false },
    { id: 'M02', title: 'Técnicas Infalíveis', image: '/images/m02.png', classes: 8, duration: '1h 45min', progress: 16, locked: false },
    { id: 'M03', title: 'Modelando a Casca', image: '/images/m03.png', classes: 10, duration: '2h 10min', progress: 0, locked: true },
    { id: 'M04', title: 'Recheios', image: '/images/m04.png', classes: 12, duration: '1h 50min', progress: 0, locked: true },
    { id: 'M05', title: 'Ovos de Colher', image: '/images/m05.png', classes: 7, duration: '1h 05min', progress: 0, locked: true },
    { id: 'M06', title: 'Ovos Especiais', image: '/images/m06.png', classes: 5, duration: '50min', progress: 0, locked: true },
    { id: 'M07', title: 'Ovo Coloridos', image: '/images/m07.png', classes: 6, duration: '1h 15min', progress: 0, locked: true },
    { id: 'M08', title: 'Ovos Infantis', image: '/images/m08.png', classes: 4, duration: '40min', progress: 0, locked: true },
    { id: 'M09', title: 'Embalagens - Técnicas e tipos', image: '/images/m09.png', classes: 5, duration: '45min', progress: 0, locked: true },
    { id: 'M10', title: 'Bônus Exclusivos', image: '/images/m10.png', classes: 8, duration: '2h 00min', progress: 0, locked: true }
];

const replacementCode = `          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coursesModules.map((modulo, index) => {
              const completedClasses = Math.floor(modulo.classes * (modulo.progress / 100));
              return (
                <Link
                  key={modulo.id}
                  to={modulo.locked ? "#" : "/lesson"}
                  className={\`group module-card relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white/5 shadow-xl shadow-black/5 hover:-translate-y-2 transition-all duration-300 \${modulo.locked ? 'opacity-90 grayscale-[0.3] hover:grayscale-0 cursor-not-allowed' : ''}\`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: \`url('\${modulo.image}')\` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-[10px] font-bold text-white uppercase tracking-wider">
                      Módulo {String(index + 1).padStart(2, '0')}
                    </div>
                    {modulo.locked ? (
                      <div className="absolute top-3 right-3 text-white/50 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">lock</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined fill-1">play_arrow</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                      {modulo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-6 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>{modulo.classes} aulas • {modulo.duration}
                    </p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          {completedClasses}/{modulo.classes} aulas concluídas
                        </span>
                        <span className={\`text-[11px] font-bold italic \${modulo.progress > 0 ? 'text-primary' : 'text-slate-400'}\`}>
                          {modulo.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={\`h-full transition-all \${modulo.progress > 0 ? 'bg-primary progress-bar-fill' : 'bg-slate-200 dark:bg-white/5 progress-bar-fill'}\`}
                          style={{ width: \`\${modulo.progress}%\` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>`;

let file = fs.readFileSync('src/pages/MemberArea.tsx', 'utf8');

// Insert the coursesModules array directly before the component function
const arrayCode = \`
const coursesModules = \${JSON.stringify(coursesModules, null, 2)};
\`;

if (!file.includes('const coursesModules')) {
  file = file.replace('export default function MemberArea() {', arrayCode + '\nexport default function MemberArea() {');
}

const startString = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">';
const startIndex = file.indexOf(startString);

// find the closing </div> of the grid container by counting divs
let count = 0;
let endIndex = -1;
let i = startIndex;
while (i < file.length) {
    if (file.substr(i, 4) === '<div') {
        count++;
    } else if (file.substr(i, 5) === '</div') {
        count--;
        if (count === 0) {
            endIndex = i + 6; // include the >
            break;
        }
    }
    i++;
}

if (startIndex !== -1 && endIndex !== -1) {
  file = file.substring(0, startIndex) + replacementCode + file.substring(endIndex);
  fs.writeFileSync('src/pages/MemberArea.tsx', file, 'utf8');
  console.log("Success!");
} else {
  console.error("Could not find start or end index.");
}
