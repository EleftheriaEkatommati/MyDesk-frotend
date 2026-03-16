import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
export const Route = createFileRoute('/the-plan')({
  component: ThePlan,
})

const initialDesks = [
  // Cluster 1 (Top Left Open Space)
  { id: '101', x: 60, y: 80, isBooked: false, rotation: 180 },
  { id: '102', x: 140, y: 80, isBooked: true, rotation: 180 },
  { id: '103', x: 60, y: 140, isBooked: false, rotation: 0 },
  { id: '104', x: 140, y: 140, isBooked: false, rotation: 0 },

  // Cluster 2 (Center Open Space)
  { id: '201', x: 360, y: 250, isBooked: false, rotation: 180 },
  { id: '202', x: 440, y: 250, isBooked: false, rotation: 180 },
  { id: '203', x: 360, y: 310, isBooked: true, rotation: 0 },
  { id: '204', x: 440, y: 310, isBooked: false, rotation: 0 },

  // Private Office (Bottom Left)
  { id: '301', x: 80, y: 460, isBooked: false, rotation: 90 },
]

function ThePlan() {
  const [desks, setDesks] = useState(initialDesks)

  const handleBook = (id: string) => {
    setDesks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isBooked: !d.isBooked } : d)),
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-extrabold mb-8 text-slate-800 dark:text-white">
        Floor Plan
      </h1>

      {/* Blueprint Container */}
      <div
        className="relative w-[800px] h-[600px] bg-slate-50 dark:bg-slate-900 border-4 border-slate-800 dark:border-slate-400 rounded-lg shadow-2xl overflow-hidden
                      bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]
                      dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]
                      bg-[size:20px_20px]"
      >
        {/* Meeting Room (Top Right) */}
        <div className="absolute top-0 right-0 w-[300px] h-[250px] border-l-[6px] border-b-[6px] border-slate-800 dark:border-slate-400 bg-blue-100/40 dark:bg-blue-900/20 flex items-center justify-center">
          <span className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 font-bold tracking-widest text-xl">
            MEETING
          </span>
          <div className="w-48 h-20 border-4 border-slate-400 dark:border-slate-600 rounded-full flex items-center justify-center">
            <div className="flex gap-8">
              <div className="w-4 h-4 bg-slate-400 dark:bg-slate-600 rounded-full" />
              <div className="w-4 h-4 bg-slate-400 dark:bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Private Office (Bottom Left) */}
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] border-t-[6px] border-r-[6px] border-slate-800 dark:border-slate-400 bg-amber-100/40 dark:bg-amber-900/20 flex items-center justify-center">
          <span className="absolute bottom-4 left-4 text-slate-400 dark:text-slate-500 font-bold tracking-widest text-xl">
            OFFICE
          </span>
        </div>

        {/* Entrance Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest mb-1 text-sm">
            ENTRANCE
          </span>
          <div className="w-32 h-2 border-b-[6px] border-dashed border-emerald-500"></div>
        </div>

        {/* Bookable Desks */}
        {desks.map((desk) => (
          <div
            key={desk.id}
            className="absolute group"
            style={{
              left: desk.x,
              top: desk.y,
              transform: `rotate(${desk.rotation}deg)`,
            }}
          >
            <button
              onClick={() => handleBook(desk.id)}
              className={`flex flex-col items-center justify-center outline-none transition-transform duration-200 group-hover:scale-110
                ${desk.isBooked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-16 h-10 rounded shadow-md flex items-center justify-center text-sm font-bold border-2
                  ${
                    desk.isBooked
                      ? 'bg-red-200 border-red-400 text-red-800 dark:bg-red-900/60 dark:border-red-600 dark:text-red-200'
                      : 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-600 dark:text-emerald-200'
                  }`}
              >
                {desk.id}
              </div>
              {/* The Desk's Chair */}
              <div
                className={`w-8 h-3 rounded-b-full shadow-sm mt-[2px] ${desk.isBooked ? 'bg-red-400 dark:bg-red-700' : 'bg-emerald-400 dark:bg-emerald-600'}`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex gap-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-emerald-100 border-2 border-emerald-400 dark:bg-emerald-900/60 dark:border-emerald-600 rounded-sm" />
            <div className="w-4 h-2 bg-emerald-400 dark:bg-emerald-600 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Ελεύθερο
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-5 bg-red-200 border-2 border-red-400 dark:bg-red-900/60 dark:border-red-600 rounded-sm" />
            <div className="w-4 h-2 bg-red-400 dark:bg-red-700 rounded-b-full mt-[2px]" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Κλεισμένο
          </span>
        </div>
      </div>
    </div>
  )
}
